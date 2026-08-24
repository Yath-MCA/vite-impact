import { describe, expect, it } from 'vitest';
import {
  appendDialogActivity,
  createEmptyHistory,
  isHistoryEmpty,
  mergeHistory,
  normalizeHistoryData,
  serializedByteSize,
  trimHistory
} from '../../../src/services/user-action/userActionHistory.js';

describe('userActionHistory', () => {
  it('folds supp_file_workflow alias into attachments_flow on normalize', () => {
    const raw = {
      attachments_flow: [{ filename: 'a', time_c: 1 }],
      supp_file_workflow: [{ filename: 'b', time_c: 2 }]
    };
    const history = normalizeHistoryData(raw);
    expect(history.attachments_flow.map((e) => e.filename)).toEqual(['a', 'b']);
  });

  it('normalizes an array-of-entries open_close_dialog into a dialog-id map', () => {
    const raw = {
      open_close_dialog: [
        { dialog_id: 'D1', action: 'open', _session: 1 },
        { dialog_id: 'D2', action: 'open', _session: 1 }
      ]
    };
    const history = normalizeHistoryData(raw);
    expect(Object.keys(history.open_close_dialog).sort()).toEqual(['D1', 'D2']);
  });

  it('assigns _session as count-of-prior-opens+1 on open, and copies the nearest unclosed open on close', () => {
    let dialogMap = {};
    dialogMap = appendDialogActivity(dialogMap, { dialog_id: 'D1', action: 'open' });
    dialogMap = appendDialogActivity(dialogMap, { dialog_id: 'D1', action: 'close' });
    dialogMap = appendDialogActivity(dialogMap, { dialog_id: 'D1', action: 'open' });
    expect(dialogMap.D1[0]._session).toBe(1);
    expect(dialogMap.D1[1]._session).toBe(1);
    expect(dialogMap.D1[2]._session).toBe(2);
  });

  it('trims to newest 80% of each channel and folds a raw supp_file_workflow input', () => {
    const history = createEmptyHistory();
    history.query_quick_answer = Array.from({ length: 10 }, (_, i) => ({ info: `q${i}`, time_c: i }));
    history.supp_file_workflow = [{ filename: 'legacy1', time_c: 1 }, { filename: 'legacy2', time_c: 2 }];

    const trimmed = trimHistory(history, 0.8);
    expect(trimmed.query_quick_answer).toHaveLength(8);
    expect(trimmed.query_quick_answer[0].info).toBe('q2');
    expect(trimmed.attachments_flow.map((e) => e.filename)).toEqual(['legacy2']);
  });

  it('merges array channels on the composite signature, newer time_c wins', () => {
    const local = createEmptyHistory();
    local.attachments_flow = [{ filename: 'f1', process: 'upload', time_c: 5, time_iso: 'A' }];
    const server = createEmptyHistory();
    server.attachments_flow = [{ filename: 'f1', process: 'upload', time_c: 10, time_iso: 'B' }];

    const merged = mergeHistory(local, server);
    expect(merged.attachments_flow).toEqual([{ filename: 'f1', process: 'upload', time_c: 10, time_iso: 'B' }]);
  });

  it('merges open_close_dialog entries keyed on _session + action', () => {
    const local = createEmptyHistory();
    local.open_close_dialog = { D1: [{ action: 'open', _session: 1, time_c: 1 }] };
    const server = createEmptyHistory();
    server.open_close_dialog = { D1: [{ action: 'open', _session: 1, time_c: 1 }, { action: 'close', _session: 1, time_c: 5 }] };

    const merged = mergeHistory(local, server);
    expect(merged.open_close_dialog.D1.map((e) => e.action)).toEqual(['open', 'close']);
  });

  it('reports empty history when dialog map and tracked arrays are empty', () => {
    expect(isHistoryEmpty(createEmptyHistory())).toBe(true);
    const nonEmpty = createEmptyHistory();
    nonEmpty.insert_symbol = [{ info: 'x' }];
    expect(isHistoryEmpty(nonEmpty)).toBe(false);
  });

  it('computes serialized byte size', () => {
    expect(serializedByteSize(createEmptyHistory())).toBeGreaterThan(0);
  });
});
