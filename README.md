# Fiche Projet Android

Application Android **Fiche Projet** pour le GEM Maison Bleue.

Ce dépôt contient le code source React/Capacitor et un APK prêt à installer sur une tablette Android.

## Installation rapide sur une tablette

Le fichier APK déjà généré se trouve ici :

```text
apk/Fiche-Projet.apk
```

### 1. Copier l'APK sur la tablette

Au choix :

- brancher la tablette à l'ordinateur avec un câble USB, puis copier `apk/Fiche-Projet.apk` dans le dossier `Téléchargements` de la tablette ;
- envoyer le fichier APK sur la tablette par mail, Google Drive, clé USB ou autre moyen de transfert ;
- utiliser ADB si la tablette est configurée en mode développeur.

### 2. Autoriser l'installation

Sur la tablette :

1. ouvrir l'application **Fichiers** ou **Téléchargements** ;
2. appuyer sur `Fiche-Projet.apk` ;
3. si Android bloque l'installation, appuyer sur **Paramètres** ;
4. autoriser l'installation depuis cette source ;
5. revenir à l'APK et appuyer sur **Installer**.

Le nom de l'application installée est **Fiche Projet**.

## Installation avec ADB

Cette méthode est pratique si la tablette est branchée à l'ordinateur.

### Préparer la tablette

1. Ouvrir **Paramètres** > **À propos de la tablette**.
2. Appuyer plusieurs fois sur **Numéro de build** pour activer les options développeur.
3. Ouvrir **Options pour les développeurs**.
4. Activer **Débogage USB**.
5. Brancher la tablette à l'ordinateur et accepter l'autorisation USB affichée sur la tablette.

### Installer l'APK

Depuis la racine du projet :

```bash
adb devices
adb install -r apk/Fiche-Projet.apk
```

`-r` permet de remplacer une version déjà installée de l'application.

## Générer un nouvel APK

À utiliser après une modification du code.

### Prérequis

- Node.js et npm ;
- Android Studio ou le SDK Android ;
- Java compatible avec Gradle/Android ;
- une tablette Android, ou un émulateur, pour tester l'installation.

### Construire l'application

Depuis la racine du projet :

```bash
npm install
npm run build
npm run cap:sync
cd android
./gradlew assembleRelease
```

L'APK généré se trouve ensuite dans :

```text
android/app/build/outputs/apk/release/app-release.apk
```

Pour le copier dans le dossier `apk/` du projet :

```bash
cp android/app/build/outputs/apk/release/app-release.apk apk/Fiche-Projet.apk
```

## Installer directement depuis les sources

Si la tablette est branchée en USB avec le débogage activé :

```bash
npm install
npm run build
npm run cap:sync
cd android
./gradlew installDebug
```

Cette commande compile puis installe une version de développement sur la tablette connectée.

## Problèmes fréquents

### Android refuse l'installation

Autoriser l'installation depuis l'application utilisée pour ouvrir l'APK, par exemple **Fichiers**, **Chrome**, **Drive** ou **Gmail**.

### L'installation échoue car l'application existe déjà

Essayer d'abord :

```bash
adb install -r apk/Fiche-Projet.apk
```

Si cela ne suffit pas, désinstaller l'ancienne version depuis la tablette, puis réinstaller l'APK.

### La tablette n'apparait pas avec `adb devices`

Vérifier que :

- le câble USB permet bien le transfert de données ;
- le débogage USB est activé ;
- l'autorisation USB a été acceptée sur la tablette ;
- le mode USB de la tablette est réglé sur transfert de fichiers si nécessaire.
