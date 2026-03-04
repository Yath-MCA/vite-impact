#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';

const runProcess = (command, args, options = {}) =>
  spawn(command, args, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: isWindows,
    ...options
  });

const frontend = runProcess(npmCommand, ['run', 'dev:frontend']);
const backend = runProcess(npmCommand, ['run', 'dev:backend']);

console.log(`🚀 Fullstack dev started`);
console.log(`   Frontend : npm run dev:frontend`);
console.log(`   Backend  : npm run dev:backend`);

let shuttingDown = false;

const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\n🛑 Received ${signal}. Stopping processes...`);

  if (!frontend.killed) {
    frontend.kill('SIGINT');
  }

  if (!backend.killed) {
    backend.kill('SIGINT');
  }

  setTimeout(() => {
    process.exit(0);
  }, 600);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

frontend.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`Frontend exited with code ${code}`);
    shutdown('frontend-exit');
  }
});

backend.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`Backend exited with code ${code}`);
    shutdown('backend-exit');
  }
});
