# Fiche Projet Android

Application Android **Fiche Projet** développée pour le GEM Maison Bleue.

Le projet utilise **React**, **Vite** et **Capacitor** pour produire une application web empaquetée en application Android native.

## Stack technique

- React 19
- Vite 6
- Capacitor 7
- Android / Gradle
- JDK 17

## Structure du projet

```text
.
├── android/                 Projet Android généré par Capacitor
├── docs/                    Documentation du projet
├── public/                  Ressources statiques
├── src/                     Code source React
│   ├── App.jsx
│   ├── App.css
│   ├── logoData.js
│   └── main.jsx
├── capacitor.config.json    Configuration Capacitor
├── package.json
└── README.md
```

## Développement local

### Prérequis

- Node.js
- npm

Installer les dépendances :

```bash
npm ci
```

Lancer le serveur de développement :

```bash
npm run dev
```

Vite démarre alors l'application en mode développement.

## Générer l'application web

```bash
npm run build
```

Les fichiers générés sont placés dans :

```text
dist/
```

## Synchroniser avec Android

Après une modification du code React :

```bash
npm run build
npm run cap:sync
```

Cette commande copie la version web générée dans le projet Android et synchronise la configuration Capacitor.

Pour ouvrir le projet dans Android Studio :

```bash
npm run android
```

## Générer un APK Android

### Prérequis Android

- Android Studio ou le SDK Android
- JDK 17
- Gradle via le wrapper fourni dans `android/`

### Version de développement

Pour compiler et installer directement l'application sur une tablette connectée en USB :

```bash
npm ci
npm run build
npm run cap:sync
cd android
./gradlew installDebug
```

La tablette doit avoir le **débogage USB** activé.

### Version release

Depuis la racine du projet :

```bash
npm ci
npm run build
npm run cap:sync
cd android
./gradlew assembleRelease
```

L'APK généré se trouve ensuite dans :

```text
android/app/build/outputs/apk/release/
```

Selon la configuration de signature, le fichier généré peut être signé ou non signé.

## Signature de l'application

Les clés de signature Android et leurs mots de passe ne doivent jamais être ajoutés au dépôt.

Une configuration locale peut être créée à partir de :

```bash
cp android/app/release-signing.properties.example android/app/release-signing.properties
```

Puis générer une clé locale :

```bash
keytool -genkeypair -v \
  -keystore android/app/fiche-projet-release.jks \
  -alias fiche-projet \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Renseigner ensuite les informations nécessaires dans :

```text
android/app/release-signing.properties
```

Les fichiers de signature locaux sont exclus par le `.gitignore`.

## Installation avec ADB

Vérifier que la tablette est reconnue :

```bash
adb devices
```

Puis installer un APK :

```bash
adb install -r chemin/vers/application.apk
```

L'option `-r` permet de remplacer une version déjà installée.

## Problèmes fréquents

### La tablette n'apparaît pas dans `adb devices`

Vérifier :

- que le câble USB permet le transfert de données ;
- que le débogage USB est activé ;
- que l'autorisation USB a été acceptée sur la tablette ;
- que le mode USB est correctement configuré.

### Android refuse l'installation d'un APK

Autoriser l'installation d'applications depuis la source utilisée pour ouvrir l'APK, par exemple **Fichiers**, **Chrome**, **Drive** ou **Gmail**.

### L'installation échoue parce que l'application existe déjà

Essayer :

```bash
adb install -r chemin/vers/application.apk
```

Si nécessaire, désinstaller l'ancienne version avant de réinstaller l'application.

## Données sensibles

Les fiches produites par l'application peuvent contenir des données personnelles ou internes au GEM : noms, signatures, dates, lieux, budgets ou listes de participants.

Ces fichiers ne doivent pas être ajoutés au dépôt sauf s'ils sont entièrement anonymisés.

Le dépôt exclut également :

- les fichiers d'environnement ;
- les clés et certificats ;
- les mots de passe ;
- les fichiers de signature Android ;
- les APK et AAB générés ;
- les fichiers locaux des IDE ;
- les fichiers de build.

## À propos de l'APK

Le dépôt ne versionne pas les fichiers `.apk` générés : ils sont explicitement ignorés par le `.gitignore`.

Pour obtenir une version installable, il faut donc générer l'APK localement à partir des sources avec les commandes ci-dessus.
