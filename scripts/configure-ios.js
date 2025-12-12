#!/usr/bin/env node

/**
 * Script de configuration automatique iOS pour AYOKA MARKET
 * Ce script met à jour Info.plist avec toutes les permissions et configurations nécessaires
 * 
 * Usage: node scripts/configure-ios.js
 * Ou via npm: npm run configure:ios
 */

const fs = require('fs');
const path = require('path');

const IOS_INFO_PLIST_PATH = path.join(__dirname, '..', 'ios', 'App', 'App', 'Info.plist');

// Configuration complète pour AYOKA MARKET
const PLIST_ADDITIONS = {
  // App Identity
  CFBundleDisplayName: 'AYOKA',
  CFBundleName: 'AYOKA MARKET',
  
  // Privacy Permissions (en français)
  NSCameraUsageDescription: 'AYOKA utilise votre appareil photo pour prendre des photos de vos articles à vendre',
  NSPhotoLibraryUsageDescription: 'AYOKA accède à votre galerie pour sélectionner des photos de vos articles',
  NSPhotoLibraryAddUsageDescription: 'AYOKA peut sauvegarder des photos dans votre galerie',
  NSLocationWhenInUseUsageDescription: 'AYOKA utilise votre position pour afficher les annonces près de chez vous et calculer les distances',
  NSFaceIDUsageDescription: 'AYOKA utilise Face ID pour vous authentifier rapidement et en toute sécurité',
  NSMicrophoneUsageDescription: 'AYOKA peut utiliser votre microphone pour enregistrer des vidéos de vos articles',
  NSUserTrackingUsageDescription: 'AYOKA ne suit pas vos activités à des fins publicitaires',
};

function readPlist(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier non trouvé: ${filePath}`);
    console.log('💡 Avez-vous exécuté "npx cap add ios" ?');
    process.exit(1);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function writePlist(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function updatePlistKey(plistContent, key, value) {
  // Escape special characters for XML
  const escapedValue = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Check if key already exists
  const keyRegex = new RegExp(`<key>${key}</key>\\s*<string>[^<]*</string>`, 'g');
  
  if (keyRegex.test(plistContent)) {
    // Update existing key
    return plistContent.replace(
      keyRegex,
      `<key>${key}</key>\n\t<string>${escapedValue}</string>`
    );
  } else {
    // Add new key before closing </dict>
    const closingDictIndex = plistContent.lastIndexOf('</dict>');
    if (closingDictIndex === -1) {
      console.error('❌ Format Info.plist invalide');
      process.exit(1);
    }
    
    const newEntry = `\t<key>${key}</key>\n\t<string>${escapedValue}</string>\n`;
    return plistContent.slice(0, closingDictIndex) + newEntry + plistContent.slice(closingDictIndex);
  }
}

function main() {
  console.log('🍎 Configuration iOS pour AYOKA MARKET\n');
  console.log('📂 Fichier:', IOS_INFO_PLIST_PATH);
  
  // Read current plist
  let plistContent = readPlist(IOS_INFO_PLIST_PATH);
  
  // Update each key
  console.log('\n📝 Mise à jour des configurations:\n');
  
  for (const [key, value] of Object.entries(PLIST_ADDITIONS)) {
    plistContent = updatePlistKey(plistContent, key, value);
    console.log(`  ✅ ${key}`);
  }
  
  // Write updated plist
  writePlist(IOS_INFO_PLIST_PATH, plistContent);
  
  console.log('\n✨ Configuration iOS terminée avec succès!\n');
  console.log('📱 Prochaines étapes:');
  console.log('   1. npx cap sync ios');
  console.log('   2. npx cap run ios');
  console.log('');
}

main();
