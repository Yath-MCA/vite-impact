#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { DOC_COLLECTIONS } from '../src/constants/docCollections.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const argDocId = process.argv[2];

if (!argDocId) {
  console.error('❌ Missing required argument: docid');
  console.error('Usage: npm run sync:doc -- <docid>');
  process.exit(1);
}

const docId = String(argDocId).trim();
const safeDocId = docId.replace(/[^a-zA-Z0-9-_]/g, '_');
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const mongoDb = process.env.MONGO_DB || 'xmleditor';
const outputDir = path.join(ROOT_DIR, 'public', 'snapshots', safeDocId);
const lookupPath = path.join(ROOT_DIR, 'public', 'snapshots', '_lookup.json');
const combinedOutputPath = path.join(outputDir, '_combined.json');

fs.mkdirSync(outputDir, { recursive: true });

const escapeForShell = (value) => `"${String(value).replace(/(["\\])/g, '\\$1')}"`;
const queryJson = JSON.stringify({ docid: docId });

const resolveMongoExportBinary = () => {
  if (process.env.MONGOEXPORT_BIN && fs.existsSync(process.env.MONGOEXPORT_BIN)) {
    return process.env.MONGOEXPORT_BIN;
  }

  const candidatePaths = [
    'C:/Program Files/MongoDB/Tools/100/bin/mongoexport.exe',
    'C:/Program Files/MongoDB/Tools/100/mongoexport.exe',
    'C:/Program Files/MongoDB/Tools/mongoexport.exe'
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return 'mongoexport';
};

const mongoExportBin = resolveMongoExportBinary();

const extractNestedValue = (source, keys) => {
  if (!source || typeof source !== 'object') {
    return null;
  }

  const stack = [source];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') {
      continue;
    }

    for (const key of keys) {
      const value = current[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }

    for (const child of Object.values(current)) {
      if (child && typeof child === 'object') {
        stack.push(child);
      }
    }
  }

  return null;
};

const updateLookup = (manuscriptNo, identifierValue) => {
  let currentLookup = {
    docid: {},
    manuscriptno: {},
    identifier: {}
  };

  if (fs.existsSync(lookupPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(lookupPath, 'utf8'));
      currentLookup = {
        docid: existing.docid || existing.doc_id || {},
        manuscriptno: existing.manuscriptno || {},
        identifier: existing.identifier || {}
      };
    } catch {
      currentLookup = {
        docid: {},
        manuscriptno: {},
        identifier: {}
      };
    }
  }

  currentLookup.docid[docId.toLowerCase()] = docId;

  if (manuscriptNo) {
    currentLookup.manuscriptno[manuscriptNo.toLowerCase()] = docId;
  }

  if (identifierValue) {
    currentLookup.identifier[identifierValue.toLowerCase()] = docId;
  }

  fs.writeFileSync(lookupPath, JSON.stringify(currentLookup, null, 2), 'utf8');
};

console.log(`🔄 Sync start for docid=${docId}`);
console.log(`📁 Output folder: ${outputDir}`);
console.log(`🗂️ Collections: ${DOC_COLLECTIONS.length}`);
console.log(`🧰 mongoexport: ${mongoExportBin}`);

let successCount = 0;
let failedCount = 0;
let extractedManuscriptNo = null;
let extractedIdentifier = null;
const combinedCollections = {};

for (const collectionName of DOC_COLLECTIONS) {
  const outFile = path.join(outputDir, `${collectionName}.json`);
  const command = [
    escapeForShell(mongoExportBin),
    `--uri=${escapeForShell(mongoUri)}`,
    `--db=${escapeForShell(mongoDb)}`,
    `--collection=${escapeForShell(collectionName)}`,
    `--query=${escapeForShell(queryJson)}`,
    '--jsonArray',
    `--out=${escapeForShell(outFile)}`
  ].join(' ');

  try {
    execSync(command, { stdio: 'pipe' });

    if (!fs.existsSync(outFile)) {
      fs.writeFileSync(outFile, '[]', 'utf8');
    }

    const content = fs.readFileSync(outFile, 'utf8').trim();
    if (!content) {
      fs.writeFileSync(outFile, '[]', 'utf8');
      combinedCollections[collectionName] = [];
    } else {
      try {
        const records = JSON.parse(content);
        combinedCollections[collectionName] = Array.isArray(records) ? records : [records];
        const firstRecord = Array.isArray(records) && records.length > 0 ? records[0] : null;

        if (firstRecord) {
          if (!extractedManuscriptNo) {
            extractedManuscriptNo = extractNestedValue(firstRecord, ['manuscriptno', 'manuscript_no', 'manuscriptNo']);
          }

          if (!extractedIdentifier) {
            extractedIdentifier = extractNestedValue(firstRecord, ['identifier', 'doi']);
          }
        }
      } catch {
        fs.writeFileSync(outFile, '[]', 'utf8');
        combinedCollections[collectionName] = [];
      }
    }

    const fileStats = fs.statSync(outFile);
    if (fileStats.size > MAX_FILE_SIZE_BYTES) {
      console.warn(`⚠️  ${collectionName} is large (${(fileStats.size / (1024 * 1024)).toFixed(2)} MB). This may slow down the React SPA.`);
    }

    successCount += 1;
    console.log(`✅ ${collectionName}`);
  } catch (error) {
    failedCount += 1;
    fs.writeFileSync(outFile, '[]', 'utf8');
    combinedCollections[collectionName] = [];
    console.error(`⚠️  ${collectionName} export failed: ${error.message}`);
  }
}

const combinedSnapshot = {
  docid: docId,
  generatedAt: new Date().toISOString(),
  totalCollections: DOC_COLLECTIONS.length,
  successCount,
  failedCount,
  collections: combinedCollections
};

fs.writeFileSync(combinedOutputPath, JSON.stringify(combinedSnapshot, null, 2), 'utf8');

updateLookup(extractedManuscriptNo, extractedIdentifier);

console.log('');
console.log('📊 Sync Summary');
console.log(`   Success: ${successCount}`);
console.log(`   Failed : ${failedCount}`);
console.log(`   Path   : ${path.join('public', 'snapshots', safeDocId)}`);
console.log(`   Combined: ${path.join('public', 'snapshots', safeDocId, '_combined.json')}`);
console.log(`   Lookup : ${path.join('public', 'snapshots', '_lookup.json')}`);

if (failedCount > 0) {
  process.exitCode = 2;
}
