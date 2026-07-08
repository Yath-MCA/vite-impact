/**
 * Generate EditorMessageKey + legacy map and rekey editorMessageStore.js.
 *
 * Usage: node scripts/generate-editor-message-keys.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const messagesDir = path.join(root, 'src/features/editor/messages');
const storePath = path.join(messagesDir, 'editorMessageStore.js');

/** Manual overrides for readability (legacy → clean constant/value). */
const MANUAL_OVERRIDES = {
  LogOutShow: 'LOG_OUT_SHOW',
  LogOutShow_corole: 'LOG_OUT_SHOW_COROLE',
  Link_Opened: 'LINK_OPENED',
  ErrorImpact: 'ERROR_IMPACT',
  idle_session_alert: 'IDLE_SESSION_ALERT',
  refdel001: 'REF_DELETE_001',
  xrefsdel002: 'XREF_DELETE_002',
  xrefsdel003: 'XREF_DELETE_003',
  xrefsdel004: 'XREF_DELETE_004',
  authorDelete001: 'AUTHOR_DELETE_001',
  authorDelete002: 'AUTHOR_DELETE_002',
  AffDelete001: 'AFF_DELETE_001',
  AffDelete002: 'AFF_DELETE_002',
  AffDelete003: 'AFF_DELETE_003',
  AffDelete004: 'AFF_DELETE_004',
  Linkrenumber001: 'LINK_RENUMBER_001',
  headleveladd001: 'HEAD_LEVEL_ADD_001',
  headleveldel002: 'HEAD_LEVEL_DEL_002',
  GenaratePDF: 'GENERATE_PDF',
  demo_GenaratePDF: 'DEMO_GENERATE_PDF'
};

function legacyToCleanKey(legacyKey) {
  if (MANUAL_OVERRIDES[legacyKey]) {
    return MANUAL_OVERRIDES[legacyKey];
  }

  let s = legacyKey
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-zA-Z])(\d+)/g, '$1_$2');

  return s
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function ensureUniqueMappings(legacyKeys) {
  const cleanToLegacy = new Map();
  const legacyToClean = new Map();

  for (const legacyKey of legacyKeys) {
    let clean = legacyToCleanKey(legacyKey);

    if (cleanToLegacy.has(clean) && cleanToLegacy.get(clean) !== legacyKey) {
      const suffix = legacyKey.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      clean = `${clean}_${suffix}`;
      if (cleanToLegacy.has(clean)) {
        throw new Error(`Unresolved collision for legacy key: ${legacyKey}`);
      }
    }

    cleanToLegacy.set(clean, legacyKey);
    legacyToClean.set(legacyKey, clean);
  }

  return { legacyToClean, cleanToLegacy };
}

function emitEditorMessageKeys(legacyToClean) {
  const lines = [
    '/** Editor alert keys — use EditorMessageKey in React; legacy strings via resolveEditorMessageKey. */',
    'export const EditorMessageKey = Object.freeze({'
  ];

  for (const [, clean] of legacyToClean) {
    lines.push(`  ${clean}: '${clean}',`);
  }

  lines.push('});', '', 'export default EditorMessageKey;', '');
  return lines.join('\n');
}

function emitLegacyKeyMap(legacyToClean) {
  const lines = [
    "import { EditorMessageKey } from './editorMessageKeys.js';",
    '',
    '/** Legacy editor alert keys → EditorMessageKey (GlobalBridge / run-task compatibility). */',
    'export const EDITOR_MESSAGE_LEGACY_KEY_MAP = Object.freeze({'
  ];

  for (const [legacy, clean] of legacyToClean) {
    lines.push(`  '${legacy.replace(/'/g, "\\'")}': EditorMessageKey.${clean},`);
  }

  lines.push('});', '', 'export function resolveEditorMessageKey(key) {', '  if (!key) return key;', '  return EDITOR_MESSAGE_LEGACY_KEY_MAP[key] ?? key;', '}', '');
  return lines.join('\n');
}

function rekeyStoreSource(source, legacyToClean) {
  let next = source.replace(/\r\n/g, '\n');
  next = next.replace(
    /^\/\*\* Ported from[\s\S]*?\*\/\nexport const EDITOR_MESSAGES = \{\n/,
    "import { EditorMessageKey } from './editorMessageKeys.js';\n\n/** Ported from run-task/current/_initialAlertmessageLoader.js — do not mutate at runtime. */\nexport const EDITOR_MESSAGES = Object.freeze({\n"
  );

  for (const [legacy, clean] of [...legacyToClean].sort((a, b) => b[0].length - a[0].length)) {
    const escaped = legacy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const legacyPattern = new RegExp(
      `^([ \\t]*)(['"])${escaped}\\2: \\{`,
      'gm'
    );
    next = next.replace(legacyPattern, `$1[EditorMessageKey.${clean}]: Object.freeze({`);
  }

  next = next.replace(/^        \},$/gm, '        }),');
  if (!next.includes('\n});\n\nexport default EDITOR_MESSAGES')) {
    next = next.replace(/\n    \};\s*\n\nexport default EDITOR_MESSAGES;/, '\n});\n\nexport default EDITOR_MESSAGES;');
    next = next.replace(/\n\};\s*\n\nexport default EDITOR_MESSAGES;/, '\n});\n\nexport default EDITOR_MESSAGES;');
  }

  if (!next.endsWith('\n')) next += '\n';
  if (!next.includes('export default EDITOR_MESSAGES')) {
    next = next.replace(/\n\};\s*$/, '\n});\n\nexport default EDITOR_MESSAGES;\n');
  }

  return next;
}

async function loadLegacyKeys() {
  const mapPath = path.join(messagesDir, 'editorMessageLegacyKeyMap.js');
  if (fs.existsSync(mapPath)) {
    const mapModule = await import(`file:///${mapPath.replace(/\\/g, '/')}`);
    return Object.keys(mapModule.EDITOR_MESSAGE_LEGACY_KEY_MAP);
  }

  const sourcePath = storePath;
  const source = fs.readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');
  const keys = [];
  for (const match of source.matchAll(/^        (['"])([^'"]+)\1: \{/gm)) {
    keys.push(match[2]);
  }
  if (keys.length === 0) {
    throw new Error('No legacy editor message keys found in store source');
  }
  return keys;
}

async function main() {
  const legacyKeys = await loadLegacyKeys();

  if (legacyKeys.length === 0) {
    throw new Error('No editor message keys found');
  }

  const { legacyToClean } = ensureUniqueMappings(legacyKeys);

  const keysPath = path.join(messagesDir, 'editorMessageKeys.js');
  const mapPath = path.join(messagesDir, 'editorMessageLegacyKeyMap.js');

  fs.writeFileSync(keysPath, emitEditorMessageKeys(legacyToClean), 'utf8');
  fs.writeFileSync(mapPath, emitLegacyKeyMap(legacyToClean), 'utf8');

  const storeSource = fs.readFileSync(storePath, 'utf8');
  const rekeyed = rekeyStoreSource(storeSource, legacyToClean);

  const unreplaced = [...legacyToClean.keys()].filter((legacy) => {
    const escaped = legacy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`['"]${escaped}['"]: \\{`).test(rekeyed);
  });
  if (unreplaced.length > 0) {
    throw new Error(`Failed to rekey store entries: ${unreplaced.slice(0, 10).join(', ')}`);
  }

  fs.writeFileSync(storePath, rekeyed, 'utf8');

  console.log(`Generated ${legacyKeys.length} editor message keys.`);
  console.log(`  ${path.relative(root, keysPath)}`);
  console.log(`  ${path.relative(root, mapPath)}`);
  console.log(`  Rekeyed ${path.relative(root, storePath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
