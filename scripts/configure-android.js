#!/usr/bin/env node

/**
 * Script de configuration automatique Android pour AYOKA MARKET
 * Ce script met à jour les fichiers de configuration Android
 * 
 * Usage: node scripts/configure-android.js
 * Ou via npm: npm run configure:android
 */

const fs = require('fs');
const path = require('path');

const ANDROID_STRINGS_PATH = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const ANDROID_STYLES_PATH = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'values', 'styles.xml');
const RESOURCES_STRINGS_PATH = path.join(__dirname, '..', 'resources', 'android-strings.xml');
const RESOURCES_STYLES_PATH = path.join(__dirname, '..', 'resources', 'android-styles.xml');

function copyFileIfExists(src, dest) {
  if (fs.existsSync(src)) {
    // Ensure destination directory exists
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      console.log(`  📁 Création du dossier: ${destDir}`);
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

function main() {
  console.log('🤖 Configuration Android pour AYOKA MARKET\n');
  
  // Check if Android project exists
  const androidPath = path.join(__dirname, '..', 'android');
  if (!fs.existsSync(androidPath)) {
    console.error('❌ Projet Android non trouvé');
    console.log('💡 Exécutez "npx cap add android" d\'abord');
    process.exit(1);
  }
  
  console.log('📝 Copie des fichiers de configuration:\n');
  
  // Copy strings.xml
  if (copyFileIfExists(RESOURCES_STRINGS_PATH, ANDROID_STRINGS_PATH)) {
    console.log('  ✅ strings.xml (nom de l\'app)');
  } else {
    console.log('  ⚠️  strings.xml non trouvé dans resources/');
  }
  
  // Copy styles.xml
  if (copyFileIfExists(RESOURCES_STYLES_PATH, ANDROID_STYLES_PATH)) {
    console.log('  ✅ styles.xml (splash screen)');
  } else {
    console.log('  ⚠️  styles.xml non trouvé dans resources/');
  }
  
  console.log('\n✨ Configuration Android terminée!\n');
  console.log('📱 Prochaines étapes:');
  console.log('   1. npx cap sync android');
  console.log('   2. npx cap run android');
  console.log('');
}

main();
