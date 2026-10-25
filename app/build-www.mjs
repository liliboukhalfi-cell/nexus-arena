// Prépare app/www : une copie du jeu où toutes les bibliothèques (three.js, PeerJS, VRM, polices, modèle Xbot,
// textures) sont téléchargées et embarquées en local. L'APK n'a donc besoin ni de Chrome ni des CDN.
// Seuls les grands modèles VRM des personnages restent chargés en ligne (puis gardés en cache) pour garder un APK léger ;
// sans réseau, les personnages retombent sur le mannequin embarqué. Lancé par GitHub Actions (Node 20+).
import { mkdir, writeFile, readFile, rm, cp } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..');
const OUT = join(HERE, 'www');
const UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('Téléchargement impossible : ' + url + ' (' + r.status + ')');
  return Buffer.from(await r.arrayBuffer());
}
async function save(rel, buf) {
  const p = join(OUT, rel);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, buf);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const f of ['sw.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png'])
  await cp(join(SRC, f), join(OUT, f));
await cp(join(SRC, 'sounds'), join(OUT, 'sounds'), { recursive: true });
let html = await readFile(join(SRC, 'index.html'), 'utf8');

// 1. three.js r160 : modules utilisés + toutes leurs dépendances relatives (parcours des import)
const THREE_CDN = 'https://unpkg.com/three@0.160.0/';
const seen = new Set();
async function crawl(url) {
  if (seen.has(url)) return;
  seen.add(url);
  const buf = await get(url);
  await save('vendor/three/' + url.slice(THREE_CDN.length), buf);
  const src = buf.toString('utf8');
  for (const m of src.matchAll(/(?:from\s*|import\s*\(\s*|import\s+)['"](\.{1,2}\/[^'"]+)['"]/g)) await crawl(new URL(m[1], url).href);
}
for (const f of ['build/three.module.js', 'examples/jsm/loaders/GLTFLoader.js', 'examples/jsm/utils/SkeletonUtils.js',
  ...['EffectComposer', 'RenderPass', 'UnrealBloomPass', 'ShaderPass', 'OutputPass'].map(n => 'examples/jsm/postprocessing/' + n + '.js')])
  await crawl(THREE_CDN + f);
html = html.split(THREE_CDN).join('vendor/three/');
console.log('three.js :', seen.size, 'fichiers');

// 2. Bibliothèques isolées
const singles = [
  ['https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@2/lib/three-vrm.module.min.js', 'vendor/three-vrm.module.min.js'],
  ['https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js', 'vendor/peerjs.min.js']
];
for (const [url, rel] of singles) {
  const buf = await get(url);
  await save(rel, buf);
  html = html.split(url).join(rel);
  const bare = [...buf.toString('utf8').matchAll(/from\s*['"]([^./'"][^'"]*)['"]/g)].map(m => m[1]).filter(s => s !== 'three');
  if (bare.length) console.warn('⚠ imports non résolus dans', rel, ':', [...new Set(bare)].join(', '));
}

// 3. Modèle Xbot et textures photo (dépôt three.js r160)
const THREE_GH = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/';
await save('vendor/models/Xbot.glb', await get(THREE_GH + 'models/gltf/Xbot.glb'));
html = html.split(THREE_GH + 'models/gltf/Xbot.glb').join('vendor/models/Xbot.glb');
for (const m of html.matchAll(/loadRealTex\('([^']+)'/g)) await save('vendor/textures/' + m[1], await get(THREE_GH + 'textures/' + m[1]));
html = html.split(THREE_GH + 'textures/').join('vendor/textures/');

// 4. Polices Google (Butcherman, Teko) : la feuille de style et ses fichiers woff2
const fontCss = html.match(/https:\/\/fonts\.googleapis\.com\/css2\?[^"']+/);
if (fontCss) {
  let css = (await get(fontCss[0].replace(/&amp;/g, '&'))).toString('utf8');
  let i = 0;
  for (const m of [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)]) {
    const rel = 'vendor/fonts/f' + (i++) + '.woff2';
    await save(rel, await get(m[1]));
    css = css.split(m[1]).join(rel.replace('vendor/', ''));
  }
  await save('vendor/fonts.css', Buffer.from(css));
  html = html.split(fontCss[0]).join('vendor/fonts.css');
  console.log('polices :', i, 'fichiers');
}

await writeFile(join(OUT, 'index.html'), html);
const left = [...new Set([...html.matchAll(/https:\/\/(?:unpkg\.com|cdn\.jsdelivr\.net|fonts\.g[a-z]+\.com)[^'"\s)]*/g)].map(m => m[0]))];
console.log('Restent en ligne :', left.length ? left.join('\n  ') : 'rien');
