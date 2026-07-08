import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function writePair(dir, readme, skills) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'README.md'), `${readme.trim()}\n`);
  fs.writeFileSync(path.join(dir, 'skills.md'), `${skills.trim()}\n`);
  console.log('wrote', path.relative(root, dir));
}

function componentDocs({ name, purpose, files, deps, status, workflows }) {
  const fileList = files.length
    ? files.map((f) => `- \`${f}\``).join('\n')
    : '- _(none yet)_';

  const readme = `# ${name}

## Purpose / ownership
${purpose}

## Key files
${fileList}

## Dependencies
${deps}

## Status
**${status}**
`;

  const skills = `# ${name} skills

Use when editing \`src/components/${name}/\` (or related imports).

## Do
- Keep changes scoped to this folder's responsibility.
- Prefer reuse from shared charts/grid/layout when possible.
- Update this README key-files list when adding files.

## Do not
- Add route-level pages here — use \`src/features/\`.
- Introduce new session/API orchestration — use \`src/services/\`.

## Workflows
${workflows}

## Related
- Parent: [../README.md](../README.md) · [../skills.md](../skills.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
`;

  writePair(path.join(root, 'src/components', name), readme, skills);
}

function moduleDocs({ name, purpose, files, deps, status, workflows }) {
  const fileList = files.map((f) => `- \`${f}\``).join('\n');

  const readme = `# ${name}

## Purpose / ownership
${purpose}

## Key files
${fileList}

## Dependencies
${deps}

## Status
**${status}**
`;

  const skills = `# ${name} skills

Use when editing \`src/modules/${name}/\`.

## Do
- Keep screens focused; reuse \`src/components\` widgets.
- Register overlays via ModuleRegistry when used in editor overlays.
- Update key files in README when adding screens.

## Do not
- Add new primary app routes without \`features/${name}\` migration planning.
- Bypass ModuleManager when the UI is meant as an editor overlay.

## Workflows
${workflows}

## Related
- Parent: [../README.md](../README.md) · [../skills.md](../skills.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
`;

  writePair(path.join(root, 'src/modules', name), readme, skills);
}

const components = [
  {
    name: 'admin',
    purpose: 'Admin console grids for users, clients, projects, and system metrics.',
    files: ['UserManagementGrid.jsx', 'ClientManagementGrid.jsx', 'ProjectGrid.jsx', 'SystemMetrics.jsx'],
    deps: 'Often paired with dashboard/admin features and grid wrappers; data via services/API.',
    status: 'active',
    workflows: `1. Extend an existing grid or metrics widget.
2. Wire columns/actions to existing API helpers.
3. Smoke-test from admin dashboard routes.
4. Document new exports here.`
  },
  {
    name: 'alerts',
    purpose: 'Alert / collection-grid experiments (may include nested TS demo under collection-grid).',
    files: ['collection-grid/ (nested demo)'],
    deps: 'Experimental; avoid depending from production features without review.',
    status: 'placeholder / sparse',
    workflows: `1. Inventory nested demos before production use.
2. Promote stable pieces to \`charts/\` or a feature module.
3. Do not expand demos into product routes from here.`
  },
  {
    name: 'charts',
    purpose: 'Reusable chart widgets for dashboards and reports.',
    files: ['AreaChart.jsx', 'BarChart.jsx', 'LineChart.jsx', 'PieChart.jsx'],
    deps: 'Presentational; parents pass series data.',
    status: 'active',
    workflows: `1. Add or adjust a chart component with stable props.
2. Reuse from dashboard/client/reports UIs.
3. Avoid embedding fetch logic.`
  },
  {
    name: 'client',
    purpose: 'Client-facing dashboard widgets (articles, production, queries).',
    files: ['ArticlesGrid.jsx', 'ArticleStatusChart.jsx', 'ProductionOverview.jsx', 'QueriesReport.jsx'],
    deps: 'Used by client/extras dashboards; charts/grid helpers.',
    status: 'active · consider feature later',
    workflows: `1. Change widgets carefully — used by client dashboard views.
2. Prefer shared charts/grid.
3. Long-term: relocate under \`features/client\` if ownership grows.`
  },
  {
    name: 'common',
    purpose: 'Reserved folder for small shared primitives (buttons, badges, etc.).',
    files: [],
    deps: 'None yet.',
    status: 'placeholder',
    workflows: `1. Add only truly cross-cutting primitives.
2. Create files + update this README.
3. Prefer existing layout/loading widgets if they already fit.`
  },
  {
    name: 'ConfigManager',
    purpose: 'Deprecated thin re-exports for Config Manager. Canonical implementation: `src/features/config-manager/`.',
    files: ['ConfigManagerPage.jsx (re-export)', 'legacy siblings may still exist — prefer features path'],
    deps: 'Re-exports feature module; do not grow logic here.',
    status: 'thin re-export',
    workflows: `1. Edit \`src/features/config-manager/*\` only.
2. Keep re-export for old imports.
3. Route: \`/config-manager/*\` via AppRouter + dashboard.`
  },
  {
    name: 'dashboard',
    purpose: 'Dashboard widgets (stats, notifications, activity/query charts, recent docs).',
    files: ['StatsCards.jsx', 'Notifications.jsx', 'ActivityChart.jsx', 'QueryChart.jsx', 'RecentDocumentsGrid.jsx'],
    deps: 'Consumed by `features/dashboard`; charts/grid.',
    status: 'active',
    workflows: `1. Prefer feature layout/pages for composition.
2. Keep widgets dumb; data from dashboard hooks/context.
3. Update README when adding widgets.`
  },
  {
    name: 'DocFinder',
    purpose: 'Deprecated thin re-exports for Doc Finder. Canonical: `src/features/doc-finder/`.',
    files: ['DocsGrid.jsx', 'QueryBuilder.jsx', 'FetchToolbar.jsx (re-exports)'],
    deps: 'Re-exports feature module.',
    status: 'thin re-export',
    workflows: `1. Edit \`src/features/doc-finder/*\`.
2. Keep re-exports for legacy imports.
3. Dashboard DocDashboard should import from features.`
  },
  {
    name: 'editor',
    purpose: 'Editor chrome UI (toolbars, navigation, thumbnails, PDF preview, TOC, footer).',
    files: [
      'Navbar1.jsx',
      'Navbar2.jsx',
      'NavigationPanel.jsx',
      'ThumbnailPanel.jsx',
      'PdfPreview.jsx',
      'SharedMiddleColumn.jsx',
      'EditorFooter.jsx',
      'Toc.jsx',
      'Comments.jsx',
      'Queries.jsx'
    ],
    deps: 'Consumed by `features/editor/pages/EditorPage.jsx` and editor contexts/modules.',
    status: 'active',
    workflows: `1. Change UI chrome here; page orchestration stays in \`features/editor\`.
2. Respect LayoutContext / EditorContext / ModuleContext contracts.
3. Test /editor route after toolbar/panel changes.`
  },
  {
    name: 'grid',
    purpose: 'Shared AG Grid wrapper used by dashboards and finders.',
    files: ['AgGridWrapper.jsx'],
    deps: 'ag-grid-react / community (+ enterprise where licensed).',
    status: 'active',
    workflows: `1. Keep wrapper config centralized.
2. Feature/grids pass column defs + row data.
3. Avoid duplicating AgGrid setup elsewhere.`
  },
  {
    name: 'layout',
    purpose: 'App layout pieces (AppLayout, header, sidebar, footer, dashboard top bar). Overlaps `src/core/layout`.',
    files: ['AppLayout.jsx', 'Header.jsx', 'Sidebar.jsx', 'Footer.jsx', 'DashboardTopBar.jsx'],
    deps: 'Used by extras/dashboard shells; prefer consolidating with core/layout over time.',
    status: 'active',
    workflows: `1. Check \`core/layout\` before adding parallel shells.
2. Prefer one AppLayout source of truth.
3. Document any intentional duplication.`
  },
  {
    name: 'loading',
    purpose: 'Loading / progress presentation helpers.',
    files: ['index.js', 'ProgressCircle.css'],
    deps: 'May align with legacy loading dialogs / services/core LoadingService.',
    status: 'active',
    workflows: `1. Export stable loading UI from index.
2. Do not hardcode editor bootstrap here — use services/core.
3. Keep CSS scoped.`
  },
  {
    name: 'ollama',
    purpose: 'Reserved UI area for Ollama chat widgets. Service docs live under `src/services/ollama`.',
    files: [],
    deps: 'Pair with `src/services/ollama` when implementing UI.',
    status: 'placeholder',
    workflows: `1. Implement UI only after service contract is clear.
2. Keep network calls in services.
3. Update README when first component lands.`
  },
  {
    name: 'overlay',
    purpose: 'Popout overlay presentation used with module overlays.',
    files: ['PopoutOverlay.jsx'],
    deps: 'Works with ModuleContext / modules ModuleManager patterns.',
    status: 'active',
    workflows: `1. Keep overlay shell generic.
2. Module content comes from registry/modules.
3. Coordinate z-index with editor layout.`
  },
  {
    name: 'reports',
    purpose: 'Shared report UI building blocks (filters, charts, grid). Screen-level reports also exist under `src/modules/reports`.',
    files: ['ReportFilters.jsx', 'ReportCharts.jsx', 'ReportGrid.jsx'],
    deps: 'charts/grid; feature migration target `features/reports`.',
    status: 'active · migrate-to-feature',
    workflows: `1. Prefer shared widgets here; full report pages in modules (for now).
2. When migrating, move pages to features/reports and keep widgets shared.
3. Do not confuse with modules/reports screens.`
  },
  {
    name: 'sidebar',
    purpose: 'Reserved folder for sidebar-specific extras beyond layout/Sidebar.',
    files: [],
    deps: 'Prefer `components/layout/Sidebar.jsx` for main nav.',
    status: 'placeholder',
    workflows: `1. Put nav chrome in layout unless truly sidebar-only widgets.
2. Document new files here.
3. Avoid splitting primary nav across multiple folders.`
  },
  {
    name: 'supabase',
    purpose: 'Supabase demo/integration UI (auth, search, files, metadata RPC).',
    files: ['SupabaseAuth.jsx', 'DocumentSearch.jsx', 'FileDashboard.jsx', 'ContentMetadataRpc.jsx'],
    deps: '`src/services/supabase` and env keys; pages may be optional in router.',
    status: 'active',
    workflows: `1. Keep secrets in env; never hardcode.
2. Prefer services wrappers for Supabase clients.
3. Gate routes if not enabled in an environment.`
  }
];

for (const c of components) componentDocs(c);

moduleDocs({
  name: 'activity',
  purpose: 'User activity module screen for the CMS/editor module system.',
  files: ['UserActivity.jsx'],
  deps: 'ModuleManager/Registry; optional future home `features/activity`.',
  status: 'active · migrate-to-feature later',
  workflows: `1. Update UserActivity UI/data wiring.
2. Ensure registry id remains stable if referenced.
3. Plan move to features/activity when routes are re-enabled.`
});

moduleDocs({
  name: 'history',
  purpose: 'Document history module screen.',
  files: ['DocumentHistory.jsx'],
  deps: 'ModuleManager/Registry; future `features/history`.',
  status: 'active · migrate-to-feature later',
  workflows: `1. Extend DocumentHistory carefully.
2. Keep overlay registration consistent.
3. Migrate to feature folder when product nav needs a dedicated route.`
});

moduleDocs({
  name: 'reports',
  purpose: 'Report module screens (XML failure, compare, corrections, package/save failures).',
  files: [
    'XmlFailure.jsx',
    'CompareReports.jsx',
    'CorrectionCount.jsx',
    'PackagePdfFailure.jsx',
    'SaveFailureItems.jsx'
  ],
  deps: 'May use components/reports widgets and services/API; future `features/reports`.',
  status: 'active · migrate-to-feature later',
  workflows: `1. Add a new report screen file here + registry entry.
2. Reuse components/reports filters/charts/grid.
3. When promoting to feature, move pages and keep shared widgets.
4. Smoke-test each failure report view.`
});

console.log('done');
