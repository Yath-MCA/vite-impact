import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { STATUS, EVENTS, ACTIONS } from 'react-joyride';
import modulesReducer from '../../../src/store/modulesSlice.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../../src/features/editor/tour/tourSeenStorage.js', () => ({
  hasSeenTour: vi.fn(),
  setHasSeenTour: vi.fn()
}));

import { hasSeenTour, setHasSeenTour } from '../../../src/features/editor/tour/tourSeenStorage.js';
import { useGuidedTour } from '../../../src/features/editor/tour/useGuidedTour.js';

function renderHookWithStore(hook, props) {
  const testStore = configureStore({ reducer: { modules: modulesReducer } });
  const container = document.createElement('div');
  const root = createRoot(container);
  let latest = null;

  function Harness({ hookProps }) {
    const value = hook(hookProps);
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
    }
  };
}

describe('useGuidedTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not start the tour when hasSeenTour is true', () => {
    hasSeenTour.mockReturnValue(true);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour();
    });

    expect(harness.result.run).toBe(false);
  });

  it('starts the tour at step 0 when hasSeenTour is false', () => {
    hasSeenTour.mockReturnValue(false);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour();
    });

    expect(harness.result.run).toBe(true);
    expect(harness.result.stepIndex).toBe(0);
  });

  it('startTour({ force: true }) bypasses hasSeenTour', () => {
    hasSeenTour.mockReturnValue(true);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour({ force: true });
    });

    expect(harness.result.run).toBe(true);
  });

  it('handleJoyrideCallback advances stepIndex on a step:after event', () => {
    hasSeenTour.mockReturnValue(false);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour();
    });

    act(() => {
      harness.result.handleJoyrideCallback({
        status: STATUS.RUNNING,
        action: 'next',
        index: 0,
        type: EVENTS.STEP_AFTER
      });
    });

    expect(harness.result.stepIndex).toBe(1);
  });

  it('handleJoyrideCallback ends the tour and marks it seen on a terminal status', () => {
    hasSeenTour.mockReturnValue(false);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour();
    });

    act(() => {
      harness.result.handleJoyrideCallback({
        status: STATUS.FINISHED,
        action: 'next',
        index: 4,
        type: EVENTS.TOUR_END
      });
    });

    expect(harness.result.run).toBe(false);
    expect(setHasSeenTour).toHaveBeenCalledWith('DOC1', true);
  });

  it('handleJoyrideCallback also ends the tour and marks it seen on SKIPPED status', () => {
    hasSeenTour.mockReturnValue(false);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour();
    });

    act(() => {
      harness.result.handleJoyrideCallback({
        status: STATUS.SKIPPED,
        action: 'skip',
        index: 1,
        type: EVENTS.TOUR_END
      });
    });

    expect(harness.result.run).toBe(false);
    expect(setHasSeenTour).toHaveBeenCalledWith('DOC1', true);
  });

  it('handleJoyrideCallback decrements stepIndex on a step:after event with ACTIONS.PREV', () => {
    hasSeenTour.mockReturnValue(false);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour();
    });

    act(() => {
      harness.result.handleJoyrideCallback({
        status: STATUS.RUNNING,
        action: 'next',
        index: 0,
        type: EVENTS.STEP_AFTER
      });
    });

    expect(harness.result.stepIndex).toBe(1);

    act(() => {
      harness.result.handleJoyrideCallback({
        status: STATUS.RUNNING,
        action: ACTIONS.PREV,
        index: 1,
        type: EVENTS.STEP_AFTER
      });
    });

    expect(harness.result.stepIndex).toBe(0);
  });

  it('handleJoyrideCallback advances stepIndex past a missing target on TARGET_NOT_FOUND without ending the tour', () => {
    hasSeenTour.mockReturnValue(false);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour();
    });

    act(() => {
      harness.result.handleJoyrideCallback({
        status: STATUS.RUNNING,
        action: 'next',
        index: 2,
        type: EVENTS.TARGET_NOT_FOUND
      });
    });

    expect(harness.result.stepIndex).toBe(3);
    expect(harness.result.run).toBe(true);
    expect(setHasSeenTour).not.toHaveBeenCalled();
  });

  it('handleJoyrideCallback ends the tour on ACTIONS.CLOSE', () => {
    hasSeenTour.mockReturnValue(false);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour();
    });

    act(() => {
      harness.result.handleJoyrideCallback({
        status: STATUS.RUNNING,
        action: ACTIONS.CLOSE,
        index: 1,
        type: EVENTS.STEP_AFTER
      });
    });

    expect(harness.result.run).toBe(false);
    expect(setHasSeenTour).toHaveBeenCalledWith('DOC1', true);
  });
});
