# Configuration des Deep Links - AYOKA MARKET

Ce document explique comment configurer les deep links pour que les utilisateurs puissent ouvrir l'application directement depuis des liens partagés.

## Vue d'ensemble

Les deep links permettent de :
1. **Ouvrir l'app** si elle est installée
2. **Rediriger vers les stores** si l'app n'est pas installée
3. **Capturer le code parrain** automatiquement

## Configuration requise

### 1. iOS - Apple App Site Association

Remplacez `TEAM_ID` dans `public/.well-known/apple-app-site-association` par votre Team ID Apple.

Pour trouver votre Team ID :
1. Connectez-vous à [Apple Developer](https://developer.apple.com)
2. Allez dans "Membership"
3. Votre Team ID est affiché

### 2. Android - Asset Links

Remplacez `SHA256_FINGERPRINT_HERE` dans `public/.well-known/assetlinks.json` par le SHA-256 de votre certificat de signature.

Pour obtenir le SHA-256 :
```bash
keytool -list -v -keystore your-keystore.jks -alias your-alias
```

### 3. Configuration Xcode (iOS)

Ajoutez les Associated Domains dans votre projet Xcode :

1. Sélectionnez votre target
2. Allez dans "Signing & Capabilities"
3. Cliquez sur "+ Capability"
4. Ajoutez "Associated Domains"
5. Ajoutez les domaines :
   - `applinks:ayokamarket.com`
   - `applinks:www.ayokamarket.com`

### 4. Configuration Android

Ajoutez les intent filters dans `android/app/src/main/AndroidManifest.xml` :

```xml
<activity
    android:name=".MainActivity"
    android:launchMode="singleTask">
    
    <!-- Intent filter existant -->
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
    
    <!-- Deep Links avec App Links -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" />
        <data android:host="ayokamarket.com" />
        <data android:host="www.ayokamarket.com" />
    </intent-filter>
    
    <!-- Custom URL Scheme -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="ayokamarket" />
    </intent-filter>
</activity>
```

## Formats de liens supportés

### Liens de parrainage
```
https://ayokamarket.com?ref=AYOKA-ABC123
https://ayokamarket.com/open?ref=AYOKA-ABC123
```

### Liens vers une annonce
```
https://ayokamarket.com/listing/123e4567-e89b-12d3-a456-426614174000
```

### Liens vers le profil
```
https://ayokamarket.com/seller/123e4567-e89b-12d3-a456-426614174000
```

### Custom URL Scheme (app native uniquement)
```
ayokamarket://
ayokamarket://listing/123e4567
ayokamarket://?ref=AYOKA-ABC123
```

## Flux utilisateur

### Scénario 1 : L'app est installée
1. L'utilisateur clique sur un lien partagé
2. L'app s'ouvre directement
3. Le code parrain est capturé automatiquement
4. L'utilisateur est redirigé vers la page cible

### Scénario 2 : L'app n'est pas installée
1. L'utilisateur clique sur un lien partagé
2. La page `/open` s'affiche
3. L'utilisateur peut :
   - Télécharger l'app depuis le store
   - Continuer sur le site web
4. Le code parrain est stocké (valide 7 jours)

## Vérification

### Vérifier les App Links (Android)
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://ayokamarket.com?ref=TEST123" com.ayoka.market
```

### Vérifier les Universal Links (iOS)
Envoyez-vous un lien par iMessage ou Notes et cliquez dessus.

## Dépannage

### Les liens ne fonctionnent pas sur Android
- Vérifiez que `android:autoVerify="true"` est présent
- Vérifiez que le fichier `assetlinks.json` est accessible
- Testez avec : `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://ayokamarket.com`

### Les liens ne fonctionnent pas sur iOS
- Vérifiez que le fichier AASA est servi avec `application/json`
- Vérifiez que le Team ID est correct
- Testez avec : `https://app-site-association.cdn-apple.com/a/v1/ayokamarket.com`

## Mise à jour des stores

### App Store ID
Remplacez `YOUR_APP_STORE_ID` dans `src/pages/OpenApp.tsx` par l'ID de votre app une fois publiée.

### Google Play Package
Le package `com.ayoka.market` est déjà configuré.
