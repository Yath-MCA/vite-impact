#!/usr/bin/env node

/**
 * CKEditor 4 Setup Script
 * 
 * This script helps download and setup CKEditor 4 Full Package
 * Run: node setup-ckeditor4.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');

const CKEDITOR_VERSION = '4.22.1';
const CKEDITOR_URL = `https://download.cksource.com/CKEditor/CKEditor/CKEditor%20${CKEDITOR_VERSION}/ckeditor_${CKEDITOR_VERSION}_full.zip`;
const TARGET_DIR = path.join(__dirname, 'public', 'ckeditor4');
const TEMP_ZIP = path.join(__dirname, 'ckeditor_temp.zip');

console.log('📝 CKEditor 4 Setup Script');
console.log('==========================\n');

// Check if CKEditor 4 already exists
if (fs.existsSync(path.join(TARGET_DIR, 'ckeditor.js'))) {
  console.log('✅ CKEditor 4 is already installed!');
  console.log(`   Location: ${TARGET_DIR}`);
  process.exit(0);
}

console.log('📦 Downloading CKEditor 4 Full Package...');
console.log(`   Version: ${CKEDITOR_VERSION}`);
console.log(`   URL: ${CKEDITOR_URL}\n`);

// Create public directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}

// Download the file
const file = fs.createWriteStream(TEMP_ZIP);
https.get(CKEDITOR_URL, (response) => {
  if (response.statusCode !== 200) {
    console.error(`❌ Failed to download: HTTP ${response.statusCode}`);
    console.log('\n📝 Manual Installation Instructions:');
    console.log('   1. Download CKEditor 4 from: https://ckeditor.com/ckeditor-4/download/');
    console.log('   2. Extract the zip file');
    console.log(`   3. Copy contents to: ${TARGET_DIR}`);
    process.exit(1);
  }

  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('✅ Download complete!\n');
    console.log('📂 Extracting files...');

    // Check if unzip is available
    exec(`unzip -o "${TEMP_ZIP}" -d "${path.join(__dirname, 'public')}"`, (error, stdout, stderr) => {
      // Clean up temp file
      fs.unlinkSync(TEMP_ZIP);

      if (error) {
        console.error('❌ Failed to extract:', error.message);
        console.log('\n📝 Please install unzip or extract manually:');
        console.log(`   1. Extract ${TEMP_ZIP}`);
        console.log(`   2. Rename extracted folder to 'ckeditor4'`);
        console.log(`   3. Move to: ${TARGET_DIR}`);
        process.exit(1);
      }

      // Rename ckeditor to ckeditor4 if needed
      const extractedDir = path.join(__dirname, 'public', 'ckeditor');
      if (fs.existsSync(extractedDir) && !fs.existsSync(TARGET_DIR)) {
        fs.renameSync(extractedDir, TARGET_DIR);
      }

      console.log('✅ Extraction complete!\n');
      console.log('🎉 CKEditor 4 has been successfully installed!');
      console.log(`   Location: ${TARGET_DIR}\n`);
      console.log('🚀 You can now run:');
      console.log('   npm install');
      console.log('   npm run dev');
    });
  });
}).on('error', (err) => {
  fs.unlinkSync(TEMP_ZIP);
  console.error('❌ Download error:', err.message);
  console.log('\n📝 Manual Installation:');
  console.log('   Download from https://ckeditor.com/ckeditor-4/download/');
  process.exit(1);
});
