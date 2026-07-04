# Nexus Arena — Shooter Multijoueur

Jeu FPS en 3D avec vagues d'ennemis et multijoueur P2P en ligne.

## Jouer en local

```bash
cd shooter-game
.\Jouer.bat
```

Le jeu lance sur `http://localhost:5174`.

## Déployer sur Netlify

1. **Crée un repo GitHub** :
   - Va sur [github.com/new](https://github.com/new)
   - Nom : `nexus-arena` (ou ce que tu veux)
   - Public, sans README
   
2. **Pousse le code** (depuis `C:\Users\PC\shooter-game`) :
   ```bash
   git remote add origin https://github.com/TON_PSEUDO/nexus-arena.git
   git branch -M main
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

3. **Déploie sur Netlify** :
   - Va sur [netlify.com](https://netlify.com)
   - "New site from Git"
   - Connecte ton compte GitHub
   - Sélectionne le repo `nexus-arena`
   - Deploy (aucune config nécessaire, Netlify détecte automatiquement)

## Modes de jeu

- **🌐 Jouer en ligne** : Partie publique avec tous les joueurs connectés
- **👥 Créer/Rejoindre privée** : Code à 6 lettres, contrôle par l'hôte
- **🎯 Tutoriel / Hors ligne** : Solo contre des bots

## Technos

- Three.js (3D photorealiste)
- PeerJS (P2P multijoueur sans serveur)
- WebAudio (synthèse sons)
- Soldier.glb (modèle 3D CDN)
