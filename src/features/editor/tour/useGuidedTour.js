import { useCallback, useState } from 'react';
import { STATUS, EVENTS } from 'react-joyride';
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
  const { open, close, recordStat } = useModuleLifecycle('guidedTour', 'GuidedTour');

  const startTour = useCallback(({ force = false } = {}) => {
    if (!force && hasSeenTour(docId)) return;
    setStepIndex(0);
    setRun(true);
    open();
  }, [docId, open]);

  const handleJoyrideCallback = useCallback((data) => {
    const { status, action, index, type } = data;

    if (type === EVENTS.STEP_AFTER) {
      recordStat('buttonClicked', { buttonId: action });
      setStepIndex(index + 1);
    }

    if (TERMINAL_STATUSES.includes(status)) {
      setRun(false);
      close();
      setHasSeenTour(docId, true);
    }
  }, [docId, close, recordStat]);

  return { run, stepIndex, steps: tourSteps, startTour, handleJoyrideCallback };
}
