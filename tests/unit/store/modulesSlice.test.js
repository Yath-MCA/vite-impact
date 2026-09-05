import { describe, it, expect } from 'vitest';
import modulesReducer, {
  moduleInitialized,
  moduleOpened,
  moduleClosed,
  buttonClicked,
  inputInteracted,
  errorRecorded
} from '../../../src/store/modulesSlice.js';

function initial() {
  return modulesReducer(undefined, { type: '@@INIT' });
}

describe('modulesSlice', () => {
  it('starts with the documented initial shape', () => {
    const state = initial();
    expect(state).toEqual({
      runtime: { activeModuleId: null, activeDialogId: null, lastAction: null, updatedAt: null },
      modules: { byId: {}, openIds: [] },
      timeline: []
    });
  });

  it('moduleInitialized records name/dialogType and marks initiated', () => {
    const state = modulesReducer(initial(), moduleInitialized({ id: 'gt', name: 'GuidedTour', dialogType: 'onthefly' }));
    expect(state.modules.byId.gt).toMatchObject({
      id: 'gt',
      name: 'GuidedTour',
      dialogType: 'onthefly',
      initiated: true,
      isOpen: false
    });
    expect(state.timeline).toHaveLength(1);
    expect(state.timeline[0].type).toBe('module/initialized');
  });

  it('moduleOpened sets isOpen, increments openCount, and sets active ids', () => {
    let state = modulesReducer(initial(), moduleInitialized({ id: 'gt', name: 'GuidedTour' }));
    state = modulesReducer(state, moduleOpened({ id: 'gt' }));
    expect(state.modules.byId.gt.isOpen).toBe(true);
    expect(state.modules.byId.gt.stats.openCount).toBe(1);
    expect(state.modules.openIds).toEqual(['gt']);
    expect(state.runtime.activeDialogId).toBe('gt');
    expect(state.runtime.activeModuleId).toBe('GuidedTour');
  });

  it('moduleClosed on the active module clears activeDialogId', () => {
    let state = modulesReducer(initial(), moduleOpened({ id: 'gt' }));
    state = modulesReducer(state, moduleClosed({ id: 'gt' }));
    expect(state.modules.byId.gt.isOpen).toBe(false);
    expect(state.modules.byId.gt.stats.closeCount).toBe(1);
    expect(state.modules.openIds).toEqual([]);
    expect(state.runtime.activeDialogId).toBeNull();
  });

  it('moduleClosed on a non-active module leaves activeDialogId untouched', () => {
    let state = modulesReducer(initial(), moduleOpened({ id: 'gt' }));
    state = modulesReducer(state, moduleOpened({ id: 'save' }));
    // 'save' is now active; close 'gt' (not active)
    state = modulesReducer(state, moduleClosed({ id: 'gt' }));
    expect(state.runtime.activeDialogId).toBe('save');
    expect(state.modules.openIds).toEqual(['save']);
    expect(state.modules.byId.gt.isOpen).toBe(false);
  });

  it('buttonClicked increments the per-button counter', () => {
    let state = modulesReducer(initial(), moduleInitialized({ id: 'save', name: 'SaveModule' }));
    state = modulesReducer(state, buttonClicked({ id: 'save', buttonId: 'confirm' }));
    state = modulesReducer(state, buttonClicked({ id: 'save', buttonId: 'confirm' }));
    expect(state.modules.byId.save.stats.buttonClicks.confirm).toBe(2);
  });

  it('inputInteracted increments the input counter', () => {
    let state = modulesReducer(initial(), moduleInitialized({ id: 'save', name: 'SaveModule' }));
    state = modulesReducer(state, inputInteracted({ id: 'save' }));
    expect(state.modules.byId.save.stats.inputInteractions).toBe(1);
  });

  it('errorRecorded increments errors and stores lastError', () => {
    let state = modulesReducer(initial(), moduleInitialized({ id: 'save', name: 'SaveModule' }));
    state = modulesReducer(state, errorRecorded({ id: 'save', functionName: 'iSave', message: 'network down' }));
    expect(state.modules.byId.save.errors).toBe(1);
    expect(state.modules.byId.save.lastError).toMatchObject({ functionName: 'iSave', message: 'network down' });
  });

  it('caps the timeline at 100 entries, dropping the oldest first', () => {
    let state = modulesReducer(initial(), moduleInitialized({ id: 'save', name: 'SaveModule' }));
    for (let i = 0; i < 105; i += 1) {
      state = modulesReducer(state, buttonClicked({ id: 'save', buttonId: `btn${i}` }));
    }
    expect(state.timeline).toHaveLength(100);
    expect(state.timeline[0].buttonId).toBe('btn5');
    expect(state.timeline[99].buttonId).toBe('btn104');
  });
});
