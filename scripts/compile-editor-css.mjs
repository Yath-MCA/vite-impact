import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { compile } from 'sass';

const clientsDir = path.resolve('public/assets/css/clients');

if (!existsSync(clientsDir)) {
  process.exit(0);
}

mkdirSync(clientsDir, { recursive: true });

const scssFiles = readdirSync(clientsDir)
  .filter((fileName) => fileName.toLowerCase().endsWith('.scss'));

for (const fileName of scssFiles) {
  const sourcePath = path.join(clientsDir, fileName);
  const outputPath = path.join(clientsDir, fileName.replace(/\.scss$/i, '.css'));
  const result = compile(sourcePath, {
    style: 'expanded',
    loadPaths: [clientsDir]
  });

  writeFileSync(outputPath, `${result.css}\n`, 'utf8');
}

console.log(`Compiled ${scssFiles.length} editor client CSS file(s).`);
