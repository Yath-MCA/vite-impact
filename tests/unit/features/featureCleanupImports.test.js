import { describe, expect, it } from 'vitest';

const expectLoadableComponent = (component) => {
  expect(['function', 'object']).toContain(typeof component);
  expect(component).toBeTruthy();
};

describe('feature cleanup imports', () => {
  it('loads legacy standalone pages from feature-owned page folders', async () => {
    const reports = await import('../../../src/features/reports/pages/ReportsPage.jsx');
    const settings = await import('../../../src/features/settings/pages/SettingsPage.jsx');
    const supabase = await import('../../../src/features/supabase/pages/SupabasePage.jsx');

    expect(reports.default).toBeTypeOf('function');
    expect(settings.default).toBeTypeOf('function');
    expect(supabase.default).toBeTypeOf('function');
  });

  it('loads feature-owned component groups from feature folders', async () => {
    const clientGrid = await import('../../../src/features/extras/components/client/ArticlesGrid.jsx');
    const adminGrid = await import('../../../src/features/extras/components/admin/UserManagementGrid.jsx');
    const reportGrid = await import('../../../src/features/reports/components/ReportGrid.jsx');

    expectLoadableComponent(clientGrid.default);
    expectLoadableComponent(adminGrid.default);
    expectLoadableComponent(reportGrid.default);
  });
});
