import { describe, expect, it } from 'vitest';

const expectLoadableComponent = (component) => {
  expect(['function', 'object']).toContain(typeof component);
  expect(component).toBeTruthy();
};

describe('feature cleanup imports', () => {
  it('loads legacy standalone pages from feature-owned page folders', async () => {
    const reports = await import('../../../src/features/dashboard/reports/pages/ReportsPage.jsx');
    const settings = await import('../../../src/features/settings/pages/SettingsPage.jsx');
    const supabase = await import('../../../src/features/supabase/pages/SupabasePage.jsx');

    expect(reports.default).toBeTypeOf('function');
    expect(settings.default).toBeTypeOf('function');
    expect(supabase.default).toBeTypeOf('function');
  });

  it('loads feature-owned component groups from feature folders', async () => {
    const clientGrid = await import('../../../src/features/extras/components/client/ArticlesGrid.jsx');
    const adminGrid = await import('../../../src/features/extras/components/admin/UserManagementGrid.jsx');
    const reportGrid = await import('../../../src/features/dashboard/reports/components/ReportGrid.jsx');

    expectLoadableComponent(clientGrid.default);
    expectLoadableComponent(adminGrid.default);
    expectLoadableComponent(reportGrid.default);
  });

  it('loads dashboard-owned feature groups from dashboard folders', async () => {
    const activity = await import('../../../src/features/dashboard/activity/UserActivity.jsx');
    const configManager = await import('../../../src/features/dashboard/config-manager/ConfigManagerPage.jsx');
    const docFinder = await import('../../../src/features/dashboard/doc-finder/DocsGrid.jsx');
    const dashboardGrid = await import('../../../src/features/dashboard/components/grid/AgGridWrapper.jsx');

    expectLoadableComponent(activity.default);
    expectLoadableComponent(configManager.default);
    expectLoadableComponent(docFinder.default);
    expectLoadableComponent(dashboardGrid.default);
  });

  it('loads editor-owned components and history from editor folders', async () => {
    const navbar = await import('../../../src/features/editor/components/Navbar1.jsx');
    const navigationPanel = await import('../../../src/features/editor/components/NavigationPanel.jsx');
    const history = await import('../../../src/features/editor/history/DocumentHistory.jsx');

    expectLoadableComponent(navbar.default);
    expectLoadableComponent(navigationPanel.default);
    expectLoadableComponent(history.default);
  });
});
