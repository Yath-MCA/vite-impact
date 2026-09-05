import { describe, it, expect } from 'vitest';
import { store } from '../../../src/store/index.js';

describe('store/index', () => {
  it('registers the modules slice under the "modules" key with the documented initial shape', () => {
    expect(store.getState()).toEqual({
      modules: {
        runtime: { activeModuleId: null, activeDialogId: null, lastAction: null, updatedAt: null },
        modules: { byId: {}, openIds: [] },
        timeline: []
      }
    });
  });

  it('dispatches through to the modules reducer', async () => {
    const { moduleInitialized } = await import('../../../src/store/modulesSlice.js');
    store.dispatch(moduleInitialized({ id: 'probe', name: 'ProbeModule' }));
    expect(store.getState().modules.modules.byId.probe).toMatchObject({ id: 'probe', name: 'ProbeModule' });
  });
});
