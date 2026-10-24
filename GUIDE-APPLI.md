# 📲 Zone Hostile en vraie appli (APK Android) + stores

## 1. Fabriquer l'APK (gratuit, rien à installer)

1. Le site doit être à jour sur Netlify (manifeste + icônes de ce dépôt déjà poussés).
2. Va sur **https://www.pwabuilder.com**, colle l'adresse de ton site Netlify, clique **Start**.
3. Attends l'analyse (le manifeste et le service worker doivent être validés), puis **Package for stores → Android**.
4. Réglages conseillés :
   - **Package ID** : unique et définitif, par exemple `com.liliboukhalfi.zonehostile` (impossible à changer après publication).
   - **App name** : Zone Hostile · **Version** : 1.0.0 · **Version code** : 1.
   - **Display mode** : Fullscreen · **Orientation** : Landscape.
   - **Signing key** : *Create new* → **garde précieusement** le fichier `signing.keystore` et `signing-key-info.txt` (mot de passe). Sans eux, impossible de mettre l'appli à jour sur le Play Store. Ces fichiers ne doivent **jamais** aller sur GitHub (déjà ignorés par `.gitignore`).
5. Télécharge le zip : tu y trouves un **`.apk`** (à installer directement), un **`.aab`** (pour le Play Store) et un **`assetlinks.json`**.

## 2. Mettre l'APK sur le site (bouton « Installer l'appli »)

1. Copie le `.apk` dans le dossier `downloads/` de ce dépôt et renomme-le **`ZoneHostile.apk`**.
2. Copie `assetlinks.json` dans **`.well-known/assetlinks.json`** (dossier à créer). Ça supprime la barre d'adresse dans l'appli.
3. Pousse sur GitHub : Netlify met tout en ligne. Sur un téléphone Android, le bouton **« 📲 Installer l'appli (Android) »** apparaît alors sur l'accueil du jeu.
4. Sur le téléphone : touche le bouton → ouvre le fichier téléchargé → autorise l'installation depuis cette source (Android le demande une fois).

> Mises à jour : l'appli charge le site en direct, donc **chaque push sur Netlify met l'appli à jour toute seule**. Un nouvel APK n'est utile que si tu changes l'icône, le nom ou le Package ID.

## 3. Play Store (Android)

- Compte **Google Play Console** : 25 $ une seule fois, vérification d'identité.
- Compte personnel récent : **test fermé de 14 jours avec au moins 12 testeurs** avant de pouvoir publier en production (règle en vigueur à ma dernière vérification : à re-contrôler).
- À fournir : le fichier **.aab**, icône 512×512, image de présentation 1024×500, au moins 2 captures d'écran, description courte et longue, **politique de confidentialité (URL)**, questionnaire de classification (jeu de tir : classement PEGI 12/16 environ), formulaire « Sécurité des données ».
- Délai de validation : de quelques heures à quelques jours.

## 4. App Store (iPhone)

- Compte **Apple Developer Program** : 99 $ par an.
- Il faut un **Mac avec Xcode** (ou un service de compilation en ligne). PWABuilder peut générer le projet Xcode.
- Apple refuse souvent les applis qui ne sont qu'un site dans une coque (règle 4.2) : il faut des fonctions vraiment natives (Capacitor + vibrations/haptique natives, etc.). C'est la partie la plus risquée.
- À fournir : captures par taille d'appareil, politique de confidentialité, classement d'âge (violence : 12+ ou 17+), puis passage en **TestFlight** avant la soumission.

## 5. À vérifier avant de publier sur un store

- **Licences des ressources** : modèles VRM chargés depuis `madjin/vrm-samples` (VRoid), modèle de soldat, sons (pack « 10 Glitch Sounds » libre de droits, musique CC0 de Tsorthan Grove), polices Google Fonts (libres). Les stores peuvent exiger la preuve que tu as le droit de redistribuer chaque élément.
- **Données personnelles** : le jeu envoie pseudo et position aux autres joueurs (PeerJS + relais Metered) : à déclarer dans la politique de confidentialité.
- **Contenu** : jeu de tir avec sang : choisir le bon classement d'âge.
