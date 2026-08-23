import { describe, expect, it } from 'vitest';

describe('feature module imports', () => {
  it('exposes editor module host and migrated feature screens from feature folders', async () => {
    const editorModuleManager = await import('../../../src/features/editor/modules/ModuleManager.jsx');
    const editorModuleRegistry = await import('../../../src/features/editor/modules/ModuleRegistry.jsx');
    const userActivity = await import('../../../src/features/dashboard/activity/UserActivity.jsx');
    const documentHistory = await import('../../../src/features/editor/history/DocumentHistory.jsx');
    const xmlFailure = await import('../../../src/features/dashboard/reports/XmlFailure.jsx');

    expect(editorModuleManager.default).toBeTypeOf('function');
    expect(editorModuleRegistry.ModuleRegistryProvider).toBeTypeOf('function');
    expect(userActivity.default).toBeTypeOf('function');
    expect(documentHistory.default).toBeTypeOf('function');
    expect(xmlFailure.default).toBeTypeOf('function');
  });
});
