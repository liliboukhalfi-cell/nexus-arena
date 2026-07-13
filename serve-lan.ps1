param([int]$Port = 5174, [switch]$NoFirewall)

$root = $PSScriptRoot

# ---- Pare-feu Windows : autorise le port en entree (une seule fois, demande admin) ----
$ruleName = "Zone Hostile $Port"
if (-not $NoFirewall) {
  $exists = $false
  try { if (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue) { $exists = $true } } catch {}
  if (-not $exists) {
    Write-Host "Configuration du pare-feu (une fenetre bleue va s'ouvrir : clique OUI)..." -ForegroundColor Yellow
    try {
      Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile', '-Command', `
        "New-NetFirewallRule -DisplayName '$ruleName' -Direction Inbound -LocalPort $Port -Protocol TCP -Action Allow -Profile Any | Out-Null"
    } catch {
      Write-Host "  (pare-feu non configure : si ton pote n'arrive pas a se connecter, autorise le port $Port a la main)" -ForegroundColor DarkGray
    }
  }
}

# ---- Adresse IPv4 du reseau local a partager ----
$ips = @()
try {
  $ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254' } |
    Select-Object -ExpandProperty IPAddress
} catch {}

Write-Host ""
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'application/javascript'; '.css' = 'text/css';
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon';
  '.glb' = 'model/gltf-binary'; '.vrm' = 'application/octet-stream'; '.json' = 'application/json'
}

# TcpListener sur 0.0.0.0 : accepte tout le reseau local SANS droits admin
# (contrairement a HttpListener + "+", qui exige une elevation a chaque lancement).
# Si le port est deja pris (autre serveur ouvert), on essaie le suivant.
$listener = $null
$tries = 0
while (-not $listener -and $tries -lt 12) {
  try {
    $l = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $Port)
    $l.Start()
    $listener = $l
  } catch {
    Write-Host "Port $Port occupe, essai du port suivant..." -ForegroundColor DarkGray
    $Port++
    $tries++
  }
}
if (-not $listener) {
  Write-Host "Impossible d'ouvrir un port. Ferme les autres fenetres du jeu et reessaie." -ForegroundColor Red
  Read-Host "Appuie sur Entree pour fermer"; exit
}

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   ZONE HOSTILE - serveur reseau (meme Wi-Fi)" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Sur CE PC              : http://localhost:$Port"
foreach ($ip in $ips) {
  Write-Host "  Adresse pour ton pote  : " -NoNewline
  Write-Host "http://$ip`:$Port" -ForegroundColor Green
}
Write-Host "----------------------------------------------------"
Write-Host "  Donne l'adresse verte a ton ami (meme Wi-Fi)." -ForegroundColor Yellow
Write-Host "  Gardez cette fenetre OUVERTE pendant la partie." -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Relais multijoueur en memoire (bus de messages par salle) ----
$rooms = @{}
$reqCount = 0

# Lit une requete HTTP complete (entetes + corps POST) sur le flux
function Read-Request($stream) {
  $ms = New-Object System.IO.MemoryStream
  $buf = New-Object byte[] 8192
  $headerEnd = -1
  while ($headerEnd -lt 0) {
    $n = $stream.Read($buf, 0, $buf.Length)
    if ($n -le 0) { break }
    $ms.Write($buf, 0, $n)
    $arr = $ms.ToArray()
    for ($i = 3; $i -lt $arr.Length; $i++) {
      if ($arr[$i - 3] -eq 13 -and $arr[$i - 2] -eq 10 -and $arr[$i - 1] -eq 13 -and $arr[$i] -eq 10) { $headerEnd = $i; break }
    }
  }
  if ($headerEnd -lt 0) { return $null }
  $all = $ms.ToArray()
  $headerText = [System.Text.Encoding]::ASCII.GetString($all, 0, $headerEnd - 3)
  $lines = $headerText -split "`r`n"
  $clen = 0
  foreach ($ln in $lines) { if ($ln -match '^(?i)content-length:\s*(\d+)') { $clen = [int]$matches[1] } }
  $bodyStart = $headerEnd + 1
  $bodyBytes = New-Object byte[] $clen
  $have = $all.Length - $bodyStart
  if ($have -gt 0) { [Array]::Copy($all, $bodyStart, $bodyBytes, 0, [Math]::Min($have, $clen)) }
  $off = [Math]::Max(0, $have)
  while ($off -lt $clen) {
    $n = $stream.Read($bodyBytes, $off, $clen - $off)
    if ($n -le 0) { break }
    $off += $n
  }
  $body = if ($clen -gt 0) { [System.Text.Encoding]::UTF8.GetString($bodyBytes, 0, $clen) } else { '' }
  return @{ line = $lines[0]; body = $body }
}

function Send-Bytes($stream, $status, $ct, $bytes) {
  $head = "HTTP/1.1 $status`r`nContent-Type: $ct`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
  $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
  $stream.Write($hb, 0, $hb.Length)
  $stream.Write($bytes, 0, $bytes.Length)
}
function Send-Json($stream, $json) { Send-Bytes $stream '200 OK' 'application/json' ([System.Text.Encoding]::UTF8.GetBytes($json)) }

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $req = Read-Request $stream
    if (-not $req) { $client.Close(); continue }

    $parts = $req.line.Split(' ')
    $method = $parts[0]
    $rawpath = $parts[1]
    $qs = ''
    if ($rawpath.Contains('?')) { $qs = $rawpath.Substring($rawpath.IndexOf('?') + 1); $rawpath = $rawpath.Substring(0, $rawpath.IndexOf('?')) }

    # Purge periodique des salles inactives (> 5 min)
    $reqCount++
    if ($reqCount % 400 -eq 0) {
      $cut = (Get-Date).AddMinutes(-5)
      foreach ($k in @($rooms.Keys)) { if ($rooms[$k].touched -lt $cut) { $rooms.Remove($k) } }
    }

    if ($rawpath -like '/r/*') {
      # ---- Endpoints du relais ----
      $seg = $rawpath.Trim('/').Split('/')   # r / <room> / <action>
      $room = if ($seg.Count -ge 2) { $seg[1] } else { '' }
      $action = if ($seg.Count -ge 3) { $seg[2] } else { '' }
      if (-not $rooms.ContainsKey($room)) {
        $rooms[$room] = @{ seq = 0; list = (New-Object System.Collections.ArrayList); touched = (Get-Date) }
      }
      $r = $rooms[$room]
      $r.touched = Get-Date
      if ($action -eq 'send') {
        $r.seq++
        [void]$r.list.Add(@{ seq = $r.seq; data = $req.body })
        if ($r.list.Count -gt 400) { $r.list.RemoveRange(0, $r.list.Count - 400) }
        Send-Json $stream ('{"seq":' + $r.seq + '}')
      } elseif ($action -eq 'poll') {
        $since = 0
        if ($qs -match 'since=(\d+)') { $since = [int]$matches[1] }
        $sb = New-Object System.Text.StringBuilder
        [void]$sb.Append('{"seq":').Append($r.seq).Append(',"msgs":[')
        $first = $true
        foreach ($m in $r.list) {
          if ($m.seq -gt $since) {
            if (-not $first) { [void]$sb.Append(',') }
            [void]$sb.Append($m.data)
            $first = $false
          }
        }
        [void]$sb.Append(']}')
        Send-Json $stream $sb.ToString()
      } else {
        Send-Json $stream '{"ok":true}'
      }
    } else {
      # ---- Fichiers statiques ----
      $path = $rawpath
      if ($path -eq '/') { $path = '/index.html' }
      $file = Join-Path $root ($path.TrimStart('/').Replace('/', '\'))
      if (Test-Path $file -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        $ct = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
        Send-Bytes $stream '200 OK' $ct ([System.IO.File]::ReadAllBytes($file))
      } else {
        Send-Bytes $stream '404 Not Found' 'text/plain' ([System.Text.Encoding]::ASCII.GetBytes('404'))
      }
    }
    $stream.Flush()
  } catch {}
  finally { $client.Close() }
}
