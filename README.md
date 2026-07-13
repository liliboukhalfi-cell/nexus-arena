# ⚔ Zone Hostile — Shooter FPS

Jeu de tir 3D à la première personne : survis à des vagues d'ennemis, seul ou en
multijoueur. Personnages anime (VRM), 4 armes, progression par niveaux.

Tout tient dans **un seul fichier** : `index.html` (rien à installer, rien à compiler).

## ▶ Jouer sur ce PC

Double-clique sur **`Jouer.bat`** → le jeu s'ouvre sur `http://localhost:5174`.

## 👥 Jouer à deux sur le même Wi-Fi

Double-clique sur **`Jouer-avec-un-pote.bat`** :
1. La première fois, autorise le pare-feu (fenêtre bleue → **Oui**).
2. Une fenêtre affiche une adresse verte `http://192.168.x.x:5174`.
3. Donne cette adresse à ton pote (même Wi-Fi) — il l'ouvre dans son navigateur.
4. Toi : **Créer une partie privée** → partage le code. Lui : **Rejoindre**.
5. Garde la fenêtre noire ouverte pendant la partie.

## 🎮 Contrôles

| Action | Clavier/souris | Tactile |
|--------|----------------|---------|
| Se déplacer | ZQSD / WASD | Joystick gauche |
| Viser | Souris | Glisser l'écran |
| Tirer | Clic gauche | Bouton 🔥 |
| Changer d'arme | Touches 1-4 ou molette | — |
| Recharger | R | Bouton R |
| Sauter | Espace | Bouton ⤴ |
| Vue 1ʳᵉ / 3ᵉ personne | V | — |
| Plein écran | F (à l'accueil) | Bouton ⛶ |

## Contenu

- **8 personnages** anime (VRM/VRoid) sélectionnables à l'accueil, avec aperçu 3D tournable.
- **4 armes** : fusil d'assaut, pistolet, fusil à pompe, sniper (cadences, dégâts, dispersion différents).
- **Progression** : XP et niveaux sauvegardés entre les parties (meilleur score gardé).
- **Sons & musique** synthétisés (aucun fichier), désactivables dans ⚙ Paramètres.
- **Multijoueur P2P** (PeerJS) : en ligne public, partie privée par code, ou hors ligne contre des bots.
- **Qualité graphique** réglable (Basse/Normale/Haute) + baisse automatique si le jeu rame.

## Structure du dossier

```
shooter-game/
├── index.html              ← tout le jeu (HTML + CSS + JS)
├── Jouer.bat               ← lance le jeu en local
├── Jouer-avec-un-pote.bat  ← serveur réseau (même Wi-Fi)
├── serve.ps1               ← serveur local (localhost)
├── serve-lan.ps1           ← serveur réseau (toutes interfaces)
└── README.md
```

## Technos

- **Three.js** — rendu 3D
- **@pixiv/three-vrm** — personnages anime VRM
- **PeerJS** — multijoueur pair-à-pair (pas de serveur de jeu)
- **WebAudio** — sons et musique par synthèse

> Les librairies et modèles 3D sont chargés depuis des CDN : une connexion internet
> est nécessaire au premier lancement (ensuite mis en cache par le navigateur).
