import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function writePair(dir, readme, skills, { preserveReadme = false } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const readmePath = path.join(dir, 'README.md');
  if (!(preserveReadme && fs.existsSync(readmePath))) {
    fs.writeFileSync(readmePath, `${readme.trim()}\n`);
  }
  fs.writeFileSync(path.join(dir, 'skills.md'), `${skills.trim()}\n`);
  console.log('wrote', path.relative(root, dir), preserveReadme ? '(skills only if README exists)' : '');
}

function docs(dir, { title, purpose, files, deps, status, workflows, related, preserveReadme = false }) {
  const fileList = files?.length
    ? files.map((f) => `- \`${f}\``).join('\n')
    : '- _(none / see tree)_';

  const readme = `# ${title}

## Purpose / ownership
${purpose}

## Key files
${fileList}

## Dependencies
${deps}

## Status
**${status}**
`;

  const skills = `# ${title} skills

Use when editing \`${path.relative(root, dir).replace(/\\/g, '/')}/\`.

## Do
- Keep changes in this folder's responsibility.
- Update this README key-files list when adding important files.
- Prefer feature-MVC placement rules in \`docs/FEATURE_MVC_STRUCTURE.md\`.

## Do not
- Invent parallel ownership in another tree without documenting status.
- Break stable routes (\`/validateurl\`, \`/editor\`, \`/login\`, \`/config-manager\`).

## Workflows
${workflows}

## Related
${related}
`;

  writePair(dir, readme, skills, { preserveReadme });
}

// --- Features root ---
docs(path.join(root, 'src/features'), {
  title: 'features',
  purpose:
    'Product modules (feature-MVC). Gold standard: `dashboard/` (`pages`, `layout`, `routes`, `context`, `hooks`, `config`, `utils`). New product flows belong here — not under `components/`.',
  files: [
    'dashboard/',
    'landing/',
    'editor/',
    'auth/',
    'config-manager/',
    'doc-finder/',
    'extras/ (quarantine)'
  ],
  deps: 'Consumes `services/`, shared `components/`, and `core/router`. Overlay screens still mainly in `modules/`.',
  status: 'active (partial migration complete)',
  workflows: `1. Create \`features/<name>/{pages,hooks,routes}/\`.
2. Export routes; wire in \`core/router/AppRouter.jsx\`.
3. Keep HTTP in \`services/\`; UI chrome may stay in \`components/\`.
4. Add README + skills for the new feature; update \`docs/SKILLS_AND_WORKFLOWS.md\`.`,
  related: `- [skills.md](./skills.md)
- [docs/FEATURE_MVC_STRUCTURE.md](../../docs/FEATURE_MVC_STRUCTURE.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../docs/SKILLS_AND_WORKFLOWS.md)`
});

// Per-feature
const features = [
  {
    name: 'auth',
    purpose: 'Login / authentication entry UI.',
    files: ['pages/Login.jsx', 'index.js'],
    deps: '`context/AuthContext`, `config/theme`, route `/login`.',
    status: 'active',
    workflows: `1. Edit \`pages/Login.jsx\` for UI/auth form.
2. Keep token/user persistence in AuthContext/services.
3. Do not add new login pages under \`src/pages/\` (re-export only).`
  },
  {
    name: 'landing',
    purpose: 'ValidateUrl controller + landing UI + session CTA orchestration.',
    files: [
      'pages/ValidateUrlPage.jsx',
      'pages/LandingUI.jsx',
      'hooks/useLandingSessionFlow.js',
      'routes/landingRoutes.jsx'
    ],
    deps: '`services/session`, `utils/normalizeValidateResponse`, `config/landing-meta.json`. Routes `/`, `/validateurl`.',
    status: 'active',
    workflows: `1. Validation/orchestration → ValidateUrlPage + hook.
2. Presentation/CTA → LandingUI.
3. Session handshake only via \`services/session\`.
4. Keep email link URLs stable.`
  },
  {
    name: 'editor',
    purpose: 'Editor feature page + route exports. Chrome lives in `components/editor`.',
    files: ['pages/EditorPage.jsx', 'routes/editorRoutes.jsx', 'index.jsx'],
    deps: 'Editor/Layout/Module contexts; `components/editor/*`; `modules/ModuleManager`.',
    status: 'active',
    workflows: `1. Page shell/providers wiring in this feature.
2. Toolbar/panel UI in \`components/editor\`.
3. Session keys from \`services/session\` / StorageService.
4. Route \`/editor\` must stay on this feature (not \`features_old\`).`
  },
  {
    name: 'dashboard',
    purpose: 'Canonical feature module: dashboard pages, layout, context, routes, menu config.',
    files: ['pages/', 'layout/', 'context/', 'routes/dashboardRoutes.jsx', 'config/', 'hooks/', 'utils/'],
    deps: 'DocFinder/ConfigManager features; Auth; menu permissions utils.',
    status: 'active · gold standard',
    workflows: `1. Add pages under \`pages/\` and register in dashboardRoutes.
2. Keep layout chrome in \`layout/\`.
3. Filter menus via permissions helpers.
4. Mirror this structure when creating new features.`
  },
  {
    name: 'config-manager',
    purpose: 'Config Manager feature (canonical). `components/ConfigManager` is thin re-export.',
    files: ['ConfigManagerPage.jsx', 'ConfigList.jsx', 'ConfigEditor.jsx', 'ConfigHistory.jsx', 'index.js'],
    deps: 'Protected admin routes; dashboard nest route optional.',
    status: 'active',
    workflows: `1. Edit files here — not under components/ConfigManager.
2. Keep \`/config-manager/*\` admin-gated.
3. Preserve re-exports for old imports.`
  },
  {
    name: 'doc-finder',
    purpose: 'Doc Finder grids/query/toolbar (canonical). `components/DocFinder` re-exports.',
    files: ['DocsGrid.jsx', 'QueryBuilder.jsx', 'FetchToolbar.jsx', 'index.js'],
    deps: 'Used by dashboard pages; `services/docsApi` / getdocs APIs.',
    status: 'active',
    workflows: `1. Edit components here.
2. Import from \`features/doc-finder\` in dashboard.
3. Keep components/DocFinder as re-export only.`
  },
  {
    name: 'extras',
    purpose: 'Legacy/alternate dashboard variants. Quarantine — prefer `features/dashboard` and client routes cleanup.',
    files: [
      'AdminDashboard.jsx',
      'ClientDashboard.jsx',
      'DashboardPage.jsx',
      'DocDashboard.jsx',
      'DocFinderDashboard.jsx'
    ],
    deps: 'Some imports still used (e.g. `/client` → ClientDashboard). Fix imports before deletion.',
    status: 'quarantine / import-debt',
    workflows: `1. Do not add new screens here.
2. Prefer migrating callers to \`features/dashboard\`.
3. After import audit, delete or fold leftovers.
4. Document any remaining routed entry (ClientDashboard).`
  }
];

for (const f of features) {
  docs(path.join(root, 'src/features', f.name), {
    title: f.name,
    purpose: f.purpose,
    files: f.files,
    deps: f.deps,
    status: f.status,
    workflows: f.workflows,
    related: `- Parent: [../README.md](../README.md) · [../skills.md](../skills.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)`
  });
}

// Pages
docs(path.join(root, 'src/pages'), {
  title: 'pages',
  purpose:
    'Deprecated route-level entrypoints. Prefer canonical files under `src/features/`. Several files are thin re-exports; some legacy pages remain unused by AppRouter.',
  files: [
    'Landing.jsx → features/landing/pages/ValidateUrlPage',
    'ValidateUrlLanding.jsx → features/landing/pages/LandingUI',
    'Login.jsx → features/auth/pages/Login',
    'EditorPage.jsx → features/editor/pages/EditorPage',
    'ReportsPage.jsx / SettingsPage.jsx / SupabasePage.jsx (legacy / unused by main router)'
  ],
  deps: 'AppRouter should lazy-load features directly. Do not grow this folder.',
  status: 'thin re-export / deprecated',
  workflows: `1. Never add new product pages here.
2. Point AppRouter at \`features/*/pages\`.
3. Keep re-exports only for backwards imports.
4. Legacy unused pages: migrate to features or delete in a cleanup pass.`,
  related: `- [skills.md](./skills.md)
- Features: [../features/README.md](../features/README.md)`
});

// Services root + domains
docs(path.join(root, 'src/services'), {
  title: 'services',
  purpose: 'Shared Model layer: HTTP transport, session gateway, editor init/storage, bridges, optional supabase/ollama.',
  files: ['api/', 'session/', 'core/', 'bridge/', 'ollama/', 'supabase/', 'docsApi.js'],
  deps: 'Called by features/hooks/contexts. Prefer domain folders over new root mega-files.',
  status: 'active',
  workflows: `1. Add domain folder or extend existing (\`api\`, \`session\`, …).
2. Keep payload builders next to domain (\`sessionPayloads\`) or feature adapters.
3. Do not put React UI in services.
4. Add README/skills for new domains; update index.`,
  related: `- [skills.md](./skills.md)
- Session: [./session/](./session/)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../docs/SKILLS_AND_WORKFLOWS.md)`
});

const services = [
  {
    name: 'api',
    purpose: 'REST transport (`apiService`), endpoints, headers, form-encoded `jsondata` posts.',
    files: ['apiService.js', 'shareInviteClient.js'],
    deps: 'axios; `window.ENV` / VITE_*; used app-wide.',
    status: 'active',
    workflows: `1. Add endpoints to API_ENDPOINTS carefully.
2. Prefer makeRequest for standard payloads.
3. Feature-specific payload shaping belongs in domain services (e.g. session).`
  },
  {
    name: 'session',
    purpose: 'Linksharing session gateway (check/verify/request/poll), payloads, storage commit, config.',
    files: [
      'sessionGateway.js',
      'sessionPayloads.js',
      'sessionStorage.js',
      'sessionConfig.js',
      'sessionConstants.js',
      'index.js'
    ],
    deps: 'apiService; landing hook; legacy StorageService keys.',
    status: 'active',
    workflows: `1. Change process/status constants in sessionConstants.
2. Storage commit must stay legacy-compatible for editor bootstrap.
3. Config via window.ENV / VITE_.
4. Cover branches in \`tests/unit/session/\`.`
  },
  {
    name: 'core',
    purpose: 'Editor bootstrap helpers: init, loading, shared key, storage, URL.',
    files: [
      'EditorInitService.js',
      'InitService.js',
      'LoadingService.js',
      'SharedKeyService.js',
      'StorageService.js',
      'URLService.js',
      'index.js'
    ],
    deps: 'localStorage xmleditor:* keys; bridge globals.',
    status: 'active',
    workflows: `1. Align session commit keys with StorageService/SharedKeyService.
2. Prefer ES modules imports over new window globals.
3. Coordinate with features/editor bootstrap.`
  },
  {
    name: 'bridge',
    purpose: 'Global bridge wiring legacy window APIs to newer services.',
    files: ['GlobalBridge.js', 'index.js'],
    deps: 'services/core loading/init; legacy editor scripts.',
    status: 'active',
    workflows: `1. Add bridge methods only when legacy callers require globals.
2. Prefer direct service imports in React code.
3. Document new globals in README.`
  },
  {
    name: 'ollama',
    purpose: 'Ollama HTTP client and config (see existing README).',
    files: ['ollamaService.js', 'ollamaConfig.js', 'index.js', 'README.md'],
    deps: 'Env endpoints; UI may live under components/ollama (placeholder).',
    status: 'active',
    workflows: `1. Keep network in this service.
2. UI belongs in components/features, not here.
3. Extend existing README for API changes.`,
    preserveReadme: true
  },
  {
    name: 'supabase',
    purpose: 'Supabase client bootstrap.',
    files: ['supabaseClient.js'],
    deps: 'Env keys; `components/supabase` UI demos.',
    status: 'active',
    workflows: `1. Never hardcode secrets.
2. Gate usage when env missing.
3. Pair with supabase UI components carefully.`
  }
];

for (const s of services) {
  docs(path.join(root, 'src/services', s.name), {
    title: s.name,
    purpose: s.purpose,
    files: s.files,
    deps: s.deps,
    status: s.status,
    workflows: s.workflows,
    preserveReadme: s.preserveReadme === true,
    related: `- Parent: [../README.md](../README.md) · [../skills.md](../skills.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)`
  });
}

// Overlay system, core, context
docs(path.join(root, 'src/overlay-system'), {
  title: 'overlay-system',
  purpose:
    'Barrel/facade re-exporting overlay + module-registry + error-tracker pieces. Distinct from `components/overlay` (Popout UI) and `modules/` (ModuleManager/Registry + report screens).',
  files: ['index.js'],
  deps: 'Re-exports from overlay/, modules/ModuleRegistry, error/* — verify targets exist before expanding.',
  status: 'active · thin facade',
  workflows: `1. Clarify new overlay code: UI → components/overlay; registry screens → modules; app wiring → ModuleContext/editor.
2. Avoid creating a third parallel overlay framework.
3. Fix or remove broken re-export targets.
4. Document exports when expanding index.js.`,
  preserveReadme: true,
  related: `- [../components/overlay/README.md](../components/overlay/README.md)
- [../modules/README.md](../modules/README.md)`
});

docs(path.join(root, 'src/core'), {
  title: 'core',
  purpose: 'App shell: router, protected routes, global layout, providers facade.',
  files: [
    'router/AppRouter.jsx',
    'router/ProtectedRoute.jsx',
    'layout/*',
    'providers/index.js'
  ],
  deps: 'Features for lazy pages; Auth/Client providers; DashboardProvider for dashboard trees.',
  status: 'active',
  workflows: `1. Register stable routes in AppRouter.
2. Keep feature routes lazy-loaded from \`features/\`.
3. Prefer \`core/providers\` as the documented import path going forward.
4. Watch layout duplication vs \`components/layout\`.`,
  related: `- [skills.md](./skills.md)
- Features README, Components layout README`
});

docs(path.join(root, 'src/context'), {
  title: 'context',
  purpose: 'Global React providers: Auth, Client, Editor, Layout, Module.',
  files: [
    'AuthContext.jsx',
    'ClientContext.jsx',
    'EditorContext.jsx',
    'LayoutContext.jsx',
    'ModuleContext.jsx'
  ],
  deps: 'Re-exported from `core/providers` (Auth/Client). Editor/Layout/Module wrap editor routes.',
  status: 'active',
  workflows: `1. Keep provider logic here until moved under core/providers files.
2. Feature-local context stays under features (e.g. dashboard).
3. Do not put API session handshake in context — use services/session.`,
  related: `- [../core/providers/index.js](../core/providers/index.js)
- [../core/README.md](../core/README.md)`
});

// Cross-cutting
const other = [
  {
    rel: 'src/hooks',
    title: 'hooks',
    purpose: 'Shared React hooks (cross-feature). Feature-specific hooks live under `features/<name>/hooks`.',
    files: ['index.js and hook modules'],
    deps: 'React; browsers storage helpers as needed.',
    status: 'active',
    workflows: `1. Add shared hooks only if used by 2+ features.
2. Feature-only hooks → features/<name>/hooks.
3. Export from index when stable.`
  },
  {
    rel: 'src/utils',
    title: 'utils',
    purpose: 'Pure helpers (normalizeValidateResponse, sanitizeHtml, clientLoader, etc.).',
    files: ['normalizeValidateResponse.js', 'sanitizeHtml.js', 'clientLoader (and others)'],
    deps: 'No React providers; callable from pages/services.',
    status: 'active',
    workflows: `1. Keep utils pure and tested under tests/unit/utils when logic-heavy.
2. Domain IO stays in services.
3. Document new exports in README.`
  },
  {
    rel: 'src/plugins',
    title: 'plugins',
    purpose: 'Third-party wrappers (axios, moment, mustache, sweetalert, etc.).',
    files: ['per-plugin folders'],
    deps: 'Imported by app layers; keep wrappers thin.',
    status: 'active',
    workflows: `1. Prefer official packages directly unless a wrapper adds real value.
2. Document wrapper behavior in folder README when non-obvious.
3. See docs/PLUGINS_README.md for broader notes.`
  },
  {
    rel: 'src/config',
    title: 'config',
    purpose: 'App configuration: theme, landing-meta, permissions, presets, collections.',
    files: ['theme', 'landing-meta.json', 'permissions', 'README.md'],
    deps: 'Consumed by landing/dashboard/auth.',
    status: 'active',
    workflows: `1. Client branding/copy → landing-meta / theme carefully.
2. Do not put secrets here.
3. Extend existing config README for schema changes.`,
    preserveReadme: true
  },
  {
    rel: 'src/constants',
    title: 'constants',
    purpose: 'Shared constant values (non-session). Session constants live in `services/session`.',
    files: ['constant modules'],
    deps: 'Imported by UI/services.',
    status: 'active',
    workflows: `1. Prefer domain constants next to domain (sessionConstants).
2. Keep global constants small.
3. Update README when adding modules.`
  },
  {
    rel: 'src/styles',
    title: 'styles',
    purpose: 'Global / shared style sheets beyond index.css.',
    files: ['style modules'],
    deps: 'Tailwind + CSS; theme variables.',
    status: 'active',
    workflows: `1. Prefer Tailwind utility classes in components when consistent with app.
2. Shared CSS only for true cross-cutting styles.
3. Avoid duplicating client theme CSS already under assets.`
  },
  {
    rel: 'src/assets',
    title: 'assets',
    purpose: 'Static assets (client themes CSS, sample JSON, images referenced from app).',
    files: ['theme CSS, data JSON'],
    deps: 'Copied/imported by Vite.',
    status: 'active',
    workflows: `1. Prefer public/ for runtime static (logos) when served as URLs.
2. Keep large binaries out of git if possible.
3. Document new theme packs briefly.`
  },
  {
    rel: 'src/collection-config',
    title: 'collection-config',
    purpose: 'TS collection registry/resolver (newer config path parallel to config/collections).',
    files: ['registry/resolver modules'],
    deps: 'May overlap `src/config`; consolidate carefully.',
    status: 'active · parallel to config',
    workflows: `1. Prefer one config source of truth long-term.
2. Document which consumers use collection-config.
3. Do not fork silently.`
  }
];

for (const o of other) {
  docs(path.join(root, o.rel), {
    title: o.title,
    purpose: o.purpose,
    files: o.files,
    deps: o.deps,
    status: o.status,
    workflows: o.workflows,
    preserveReadme: o.preserveReadme === true,
    related: `- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../docs/SKILLS_AND_WORKFLOWS.md)
- [src/README.md](../README.md)`
  });
}

// Sparse / empty / legacy
const sparse = [
  {
    rel: 'src/checks',
    title: 'checks',
    purpose: 'Placeholder for validation checks.',
    status: 'empty / placeholder',
    workflows: '1. Implement or remove. 2. Prefer feature/services if checks are domain-specific.'
  },
  {
    rel: 'src/error',
    title: 'error',
    purpose: 'Placeholder for error UI/boundaries.',
    status: 'empty / placeholder',
    workflows: '1. Add error boundary components here or under components. 2. Document when filled.'
  },
  {
    rel: 'src/events',
    title: 'events',
    purpose: 'Placeholder for event bus / emitters.',
    status: 'empty / placeholder',
    workflows: '1. Prefer explicit props/callbacks or known services. 2. Fill only if a real event bus is introduced.'
  },
  {
    rel: 'src/routes',
    title: 'routes',
    purpose: 'Empty — routes live in `core/router` and `features/*/routes`.',
    status: 'empty · do not use',
    workflows: '1. Do not add routes here. 2. Use AppRouter + feature route modules.'
  },
  {
    rel: 'src/legacy',
    title: 'legacy',
    purpose: 'Legacy compatibility shims/facades.',
    status: 'legacy',
    workflows: '1. Prefer deleting after callers migrate. 2. Do not add new features here.'
  },
  {
    rel: 'src/grid',
    title: 'grid',
    purpose: 'Top-level grid package/examples — parallel to `components/grid` (prefer components/grid for app UI).',
    status: 'parallel / prefer components/grid',
    workflows: '1. New app grids → components/grid or feature. 2. Treat this as package/examples unless consolidating.',
    preserveReadme: true
  }
];

for (const s of sparse) {
  docs(path.join(root, s.rel), {
    title: s.title,
    purpose: s.purpose,
    files: [],
    deps: 'None or see parent src README.',
    status: s.status,
    workflows: s.workflows,
    preserveReadme: s.preserveReadme === true,
    related: `- [src/README.md](../README.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../docs/SKILLS_AND_WORKFLOWS.md)`
  });
}

console.log('extend-skills done');
