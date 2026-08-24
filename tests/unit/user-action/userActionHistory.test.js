import { describe, expect, it } from 'vitest';
import {
  appendDialogActivity,
  createEmptyHistory,
  foldAliases,
  isHistoryEmpty,
  mergeHistory,
  serializedByteSize,
  trimHistory
} from '../../../src/services/user-action/userActionHistory.js';

describe('userActionHistory', () => {
  it('folds supp_file_workflow alias into attachments_flow', () => {
    const raw = {
      attachments_flow: [{ id: 'a1', timestamp: 1 }],
      supp_file_workflow: [{ id: 'a2', timestamp: 2 }]
    };
    const history = foldAliases(raw);
    expect(history.attachments_flow.map((e) => e.id)).toEqual(['a1', 'a2']);
  });

  it('assigns next _session on dialog open and copies it on close', () => {
    let dialogMap = {};
    dialogMap = appendDialogActivity(dialogMap, { dialog_id: 'D1', action: 'open', timestamp: 1 });
    dialogMap = appendDialogActivity(dialogMap, { dialog_id: 'D1', action: 'close', timestamp: 2 });
    expect(dialogMap.D1[0]._session).toBe(1);
    expect(dialogMap.D1[1]._session).toBe(1);
  });

  it('trims to newest 80% of each channel', () => {
    const history = createEmptyHistory();
    history.query_quick_answer = Array.from({ length: 10 }, (_, i) => ({ id: `q${i}`, timestamp: i }));
    const trimmed = trimHistory(history, 0.8);
    expect(trimmed.query_quick_answer).toHaveLength(8);
    expect(trimmed.query_quick_answer[0].id).toBe('q2');
  });

  it('merges local vs server preferring the newer timestamp per key', () => {
    const local = createEmptyHistory();
    local.insert_symbol = [{ id: 's1', timestamp: 5, value: 'local' }];
    const server = createEmptyHistory();
    server.insert_symbol = [{ id: 's1', timestamp: 10, value: 'server' }];
    const merged = mergeHistory(local, server);
    expect(merged.insert_symbol).toEqual([{ id: 's1', timestamp: 10, value: 'server' }]);
  });

  it('reports empty history when dialog map and tracked arrays are empty', () => {
    expect(isHistoryEmpty(createEmptyHistory())).toBe(true);
    const nonEmpty = createEmptyHistory();
    nonEmpty.insert_symbol = [{ id: 's1' }];
    expect(isHistoryEmpty(nonEmpty)).toBe(false);
  });

  it('computes serialized byte size', () => {
    expect(serializedByteSize(createEmptyHistory())).toBeGreaterThan(0);
  });
});
