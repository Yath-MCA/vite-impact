import { describe, it, expect, beforeEach } from 'vitest';
import {
  getEditorMessage,
  getAllEditorMessages
} from '../../../src/features/editor/messages/editorMessages.js';
import { registerEditorAlertBridge } from '../../../src/features/editor/messages/registerEditorAlertBridge.js';

describe('getEditorMessage', () => {
  it('returns triad prompt phase by default for refdel001', () => {
    const full = getEditorMessage('refdel001');
    expect(full.prompt.title).toBe('Reference');
    expect(full.prompt.okText).toBe('Yes');

    const promptOnly = getEditorMessage('refdel001', {}, { phase: 'prompt' });
    expect(promptOnly.title).toBe('Reference');
    expect(promptOnly.text).toContain('delete the reference');
  });

  it('returns SIGN_OFF dialog text with DOC_TYPE interpolation', () => {
    const msg = getEditorMessage('SIGN_OFF', { DOC_TYPE: 'article' });
    expect(msg.text).toContain('article');
    expect(msg.text).toContain('read-only');
  });

  it('returns null for unknown keys', () => {
    expect(getEditorMessage('___missing___')).toBeNull();
  });
});

describe('registerEditorAlertBridge', () => {
  beforeEach(() => {
    delete globalThis.AlertMessages;
    delete globalThis.ALERT_MESSAGE;
  });

  it('exposes get / getAll for GlobalBridge', () => {
    registerEditorAlertBridge(globalThis);
    expect(globalThis.AlertMessages.get('SIGN_OFF')).toBeTruthy();
    expect(Object.keys(globalThis.AlertMessages.getAll()).length).toBeGreaterThan(50);
    expect(getAllEditorMessages().SCH_MAINTENANCE).toBeTruthy();
  });
});
