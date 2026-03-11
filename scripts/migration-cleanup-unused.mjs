import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');
const tempRoot = path.join(rootDir, 'temp_migration');

const categoryMap = {
  components: 'unused_components',
  pages: 'unused_pages',
  hooks: 'unused_hooks',
  utils: 'unused_utils',
  styles: 'unused_styles'
};

const protectedBasenames = new Set(['index.js', 'index.jsx', 'main.jsx', 'App.jsx']);

function isExcluded(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  const base = path.basename(normalized);
  if (protectedBasenames.has(base)) return true;
  if (normalized.startsWith('routes/')) return true;
  if (normalized.startsWith('config/')) return true;
  if (normalized.startsWith('context/')) return true;
  if (normalized.startsWith('services/')) return true;
  if (normalized.startsWith('modules/')) return true;
  if (normalized.includes('/api/')) return true;
  return false;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(abs);
    return abs;
  }));
  return files.flat();
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null;

  const base = path.resolve(path.dirname(fromFile), spec);
  const attempts = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.js'),
    path.join(base, 'index.jsx')
  ];

  for (const candidate of attempts) {
    if (await exists(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function parseDependencies(filePath) {
  const source = await fs.readFile(filePath, 'utf8');
  const deps = new Set();

  const importRegex = /(?:import\s+[^'"`]*?from\s*|import\s*\(|require\s*\()\s*['"`]([^'"`]+)['"`]/g;
  let match = importRegex.exec(source);
  while (match) {
    const spec = match[1];
    const resolved = await resolveImport(filePath, spec);
    if (resolved) deps.add(resolved);
    match = importRegex.exec(source);
  }

  return [...deps];
}

function toTempDestination(filePath) {
  const relFromSrc = path.relative(srcDir, filePath);
  const [topLevel, ...rest] = relFromSrc.split(path.sep);
  const bucket = categoryMap[topLevel] || 'archived_files';
  return path.join(tempRoot, bucket, ...rest.length ? rest : [path.basename(filePath)]);
}

async function ensureDirs() {
  const dirs = [
    'unused_components',
    'unused_pages',
    'unused_hooks',
    'unused_utils',
    'unused_styles',
    'archived_files'
  ];

  await Promise.all(dirs.map((dir) => fs.mkdir(path.join(tempRoot, dir), { recursive: true })));
}

async function main() {
  await ensureDirs();

  const allFiles = (await walk(srcDir)).filter((file) => /\.(js|jsx)$/.test(file));
  const fileSet = new Set(allFiles);

  const entryCandidates = [
    path.join(srcDir, 'main.jsx'),
    path.join(srcDir, 'App.jsx'),
    path.join(srcDir, 'routes', 'AppRouter.jsx')
  ];

  const queue = [];
  for (const entry of entryCandidates) {
    if (await exists(entry)) queue.push(entry);
  }

  const used = new Set();

  while (queue.length) {
    const file = queue.pop();
    if (!file || used.has(file) || !fileSet.has(file)) continue;

    used.add(file);
    const deps = await parseDependencies(file);
    for (const dep of deps) {
      if (fileSet.has(dep) && !used.has(dep)) {
        queue.push(dep);
      }
    }
  }

  const candidates = allFiles.filter((file) => {
    const rel = path.relative(srcDir, file);
    if (isExcluded(rel)) return false;
    return !used.has(file);
  });

  const report = [];

  for (const originalPath of candidates) {
    const destinationPath = toTempDestination(originalPath);
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.rename(originalPath, destinationPath);

    report.push({
      original: path.relative(rootDir, originalPath).replace(/\\/g, '/'),
      movedTo: path.relative(rootDir, destinationPath).replace(/\\/g, '/'),
      reason: 'unused/import not found'
    });
  }

  const reportPath = path.join(tempRoot, 'migration-report.json');
  await fs.writeFile(reportPath, JSON.stringify({ movedCount: report.length, files: report }, null, 2));

  console.log(`Moved ${report.length} files.`);
  console.log(`Report: ${path.relative(rootDir, reportPath)}`);
}

main().catch((error) => {
  console.error('Migration cleanup failed:', error);
  process.exit(1);
});
