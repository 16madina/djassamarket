# Configuration Capacitor

## Configuration Android après `npx cap add android`

### 1. Activer AndroidX (OBLIGATOIRE)

Modifiez le fichier `android/gradle.properties` et ajoutez ces lignes à la fin :

```properties
android.useAndroidX=true
android.enableJetifier=true
```

### 2. Configuration Java 17

Après avoir exécuté `npx cap add android`, vous devez configurer Java 17 :

### 1. Modifier `android/variables.gradle`

Créez ou modifiez le fichier `android/variables.gradle` :

```gradle
ext {
    minSdkVersion = 22
    compileSdkVersion = 34
    targetSdkVersion = 34
    androidxActivityVersion = '1.8.0'
    androidxAppCompatVersion = '1.6.1'
    androidxCoordinatorLayoutVersion = '1.2.0'
    androidxCoreVersion = '1.12.0'
    androidxFragmentVersion = '1.6.2'
    coreSplashScreenVersion = '1.0.1'
    androidxWebkitVersion = '1.9.0'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.1.5'
    androidxEspressoCoreVersion = '3.5.1'
    cordovaAndroidVersion = '10.1.1'
    
    // Configuration Java 17
    javaVersion = JavaVersion.VERSION_17
}
```

### 2. Vérifier `android/app/build.gradle`

Assurez-vous que la section `compileOptions` utilise Java 17 :

```gradle
android {
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}
```

### 3. Vérifier votre installation Java

```bash
java -version
```

Si vous n'avez pas Java 17, installez-le :
- **macOS**: `brew install openjdk@17`
- **Linux**: `sudo apt install openjdk-17-jdk`
- **Windows**: Téléchargez depuis [Oracle](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html) ou [Adoptium](https://adoptium.net/)

## Splash Screen personnalisé

Le splash screen Capacitor a été désactivé dans `capacitor.config.ts`. Pour ajouter votre propre splash :

### Android
1. Placez vos images splash dans `android/app/src/main/res/drawable-*dpi/`
2. Modifiez `android/app/src/main/res/values/styles.xml`

### iOS
1. Ouvrez le projet dans Xcode : `npx cap open ios`
2. Configurez le LaunchScreen.storyboard avec votre splash

## Commandes utiles

```bash
# Après modifications du code web
npm run build
npx cap sync

# Lancer sur Android
npx cap run android

# Lancer sur iOS (Mac uniquement)
npx cap run ios

# Ouvrir dans Android Studio
npx cap open android

# Ouvrir dans Xcode
npx cap open ios
```
