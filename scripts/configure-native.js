#!/usr/bin/env node

/**
 * Script de configuration automatique pour iOS et Android
 * Configure toutes les permissions et paramètres natifs pour AYOKA MARKET
 * 
 * Usage: node scripts/configure-native.js
 * Ou via npm: npm run configure:native
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('╔══════════════════════════════════════════════════╗');
console.log('║     🚀 AYOKA MARKET - Configuration Native       ║');
console.log('╚══════════════════════════════════════════════════╝\n');

const scriptsDir = __dirname;

// Check which platforms are installed
const iosExists = fs.existsSync(path.join(scriptsDir, '..', 'ios'));
const androidExists = fs.existsSync(path.join(scriptsDir, '..', 'android'));

if (!iosExists && !androidExists) {
  console.log('⚠️  Aucune plateforme native détectée.\n');
  console.log('Pour ajouter les plateformes:');
  console.log('  npx cap add ios');
  console.log('  npx cap add android\n');
  process.exit(0);
}

// Configure iOS
if (iosExists) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    require('./configure-ios.js');
  } catch (error) {
    console.error('❌ Erreur configuration iOS:', error.message);
  }
}

// Configure Android
if (androidExists) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    require('./configure-android.js');
  } catch (error) {
    console.error('❌ Erreur configuration Android:', error.message);
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n🎉 Configuration native terminée!\n');
console.log('Commandes suivantes:');
console.log('  npm run build        # Build l\'app web');
console.log('  npx cap sync         # Synchroniser avec les projets natifs');
console.log('  npx cap run ios      # Lancer sur iOS');
console.log('  npx cap run android  # Lancer sur Android\n');
