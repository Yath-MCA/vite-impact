import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createContext, runInContext } from 'node:vm';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../..');

function runLegacyScript(relativePath, extraSandbox = {}) {
  const filePath = path.join(ROOT, relativePath);
  const code = readFileSync(filePath, 'utf8');
  const sandbox = {
    module: { exports: {} },
    exports: {},
    window: {},
    console,
    Date,
    Math,
    Promise,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Request_ID: '999888777',
    DOC_ID: 'DOC_TEST',
    ...extraSandbox
  };
  sandbox.global = sandbox;
  const context = createContext(sandbox);
  runInContext(code, context);
  return context;
}

export function loadLinkSessionCore() {
  const context = runLegacyScript('run-task/current/link_session/LinkSessionCore.js');
  return context.module.exports || context.LinkSessionCore;
}

export function loadLinkSessionModule() {
  const coreContext = runLegacyScript('run-task/current/link_session/LinkSessionCore.js');
  const LinkSessionCore = coreContext.module.exports || coreContext.LinkSessionCore;
  const context = runLegacyScript('run-task/current/link_session/LinkSessionModule.js', {
    LinkSessionCore,
    document: {
      addEventListener: () => {}
    }
  });
  return context.window.LinkSessionModule;
}
