import { useCallback, useEffect, useState } from 'react';
import { STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { useModuleLifecycle } from '../../../store/useModuleLifecycle.js';
import { tourSteps } from './tourSteps.js';
import { hasSeenTour, setHasSeenTour } from './tourSeenStorage.js';

const TERMINAL_STATUSES = [STATUS.FINISHED, STATUS.SKIPPED];

/**
 * Wraps react-joyride's step/overlay mechanics with this app's own
 * analytics (useModuleLifecycle) and a per-document "seen" flag, replacing
 * legacy GuidedTour's bootstraptour integration + HandlingSessionStorage.
 *
 * NOTE: `open`, `close`, and `recordStat` are destructured individually
 * (rather than depending on the whole `lifecycle` object) because
 * useModuleLifecycle returns a new object literal every render — depending
 * on the whole object would defeat useCallback's memoization. Each of these
 * three functions is itself independently wrapped in useCallback with
 * stable dependencies (dispatch, moduleId) in useModuleLifecycle.js, so they
 * are safe and correct to depend on directly.
 */
export function useGuidedTour(docId) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const { init, open, close, recordStat } = useModuleLifecycle('guidedTour', 'GuidedTour');

  useEffect(() => {
    init();
  }, []);

  const startTour = useCallback(({ force = false } = {}) => {
    if (!force && hasSeenTour(docId)) return;
    setStepIndex(0);
    setRun(true);
    open();
  }, [docId, open]);

  const handleJoyrideCallback = useCallback((data) => {
    const { status, action, index, type } = data;

    const isTerminal = TERMINAL_STATUSES.includes(status) || action === ACTIONS.CLOSE;

    if (isTerminal) {
      setRun(false);
      close();
      setHasSeenTour(docId, true);
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      if (type === EVENTS.STEP_AFTER) {
        recordStat('buttonClicked', { buttonId: action });
      }
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }
  }, [docId, close, recordStat]);

  return { run, stepIndex, steps: tourSteps, startTour, handleJoyrideCallback };
}
