import { describe, expect, it } from 'vitest';
import { ErrorTrackerProvider, useErrorTracker } from '../../../src/error/ErrorTrackerProvider.jsx';
import ErrorBoundary from '../../../src/error/ErrorBoundary.jsx';
import ErrorPanel from '../../../src/error/ErrorPanel.jsx';

describe('overlay error exports', () => {
  it('resolves ErrorTrackerProvider, useErrorTracker, ErrorBoundary, ErrorPanel', () => {
    expect(ErrorTrackerProvider).toBeTypeOf('function');
    expect(useErrorTracker).toBeTypeOf('function');
    expect(ErrorBoundary).toBeTypeOf('function');
    expect(ErrorPanel).toBeTypeOf('function');
  });
});
