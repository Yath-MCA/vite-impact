import { describe, it, expect } from 'vitest';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import modulesReducer from '../../../src/store/modulesSlice.js';
import { useModuleLifecycle } from '../../../src/store/useModuleLifecycle.js';

function renderHookWithStore(hook, props) {
  const testStore = configureStore({ reducer: { modules: modulesReducer } });
  const container = document.createElement('div');
  const root = createRoot(container);
  let latest = null;

  function Harness({ hookProps }) {
    const value = hook(...hookProps);
    useEffect(() => {
      latest = value;
    });
    return null;
  }

  act(() => {
    root.render(
      React.createElement(Provider, { store: testStore },
        React.createElement(Harness, { hookProps: props })
      )
    );
  });

  return {
    get result() {
      return latest;
    },
    get storeState() {
      return testStore.getState();
    }
  };
}

describe('useModuleLifecycle', () => {
  it('starts with a null state before init() is called', () => {
    const { result } = renderHookWithStore(useModuleLifecycle, ['gt', 'GuidedTour']);
    expect(result.state).toBeNull();
  });

  it('init() creates the module entry with the given name', () => {
    const harness = renderHookWithStore(useModuleLifecycle, ['gt', 'GuidedTour']);
    act(() => {
      harness.result.init('onthefly');
    });
    expect(harness.storeState.modules.modules.byId.gt).toMatchObject({
      id: 'gt',
      name: 'GuidedTour',
      dialogType: 'onthefly',
      initiated: true
    });
  });

  it('open()/close() toggle isOpen and openIds', () => {
    const harness = renderHookWithStore(useModuleLifecycle, ['gt', 'GuidedTour']);
    act(() => {
      harness.result.init();
      harness.result.open();
    });
    expect(harness.storeState.modules.modules.byId.gt.isOpen).toBe(true);
    expect(harness.storeState.modules.modules.openIds).toEqual(['gt']);

    act(() => {
      harness.result.close();
    });
    expect(harness.storeState.modules.modules.byId.gt.isOpen).toBe(false);
    expect(harness.storeState.modules.modules.openIds).toEqual([]);
  });

  it('recordStat("buttonClicked", { buttonId }) increments that button counter', () => {
    const harness = renderHookWithStore(useModuleLifecycle, ['save', 'SaveModule']);
    act(() => {
      harness.result.init();
      harness.result.recordStat('buttonClicked', { buttonId: 'confirm' });
    });
    expect(harness.storeState.modules.modules.byId.save.stats.buttonClicks.confirm).toBe(1);
  });

  it('recordError(functionName, message) increments errors and sets lastError', () => {
    const harness = renderHookWithStore(useModuleLifecycle, ['save', 'SaveModule']);
    act(() => {
      harness.result.init();
      harness.result.recordError('iSave', 'network down');
    });
    expect(harness.storeState.modules.modules.byId.save.errors).toBe(1);
    expect(harness.storeState.modules.modules.byId.save.lastError).toMatchObject({
      functionName: 'iSave',
      message: 'network down'
    });
  });
});
