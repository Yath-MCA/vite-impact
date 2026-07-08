import { describe, it, expect, beforeEach } from 'vitest';
import {
  EditorMessageKey,
  getEditorMessage,
  getAllEditorMessages
} from '../../../src/features/editor/messages/editorMessages.js';
import {
  EDITOR_MESSAGE_LEGACY_KEY_MAP,
  resolveEditorMessageKey
} from '../../../src/features/editor/messages/editorMessageLegacyKeyMap.js';
import { EDITOR_MESSAGES } from '../../../src/features/editor/messages/editorMessageStore.js';
import { registerEditorAlertBridge } from '../../../src/features/editor/messages/registerEditorAlertBridge.js';

describe('EditorMessageKey', () => {
  it('uses clean SCREAMING_SNAKE values matching constant names', () => {
    expect(EditorMessageKey.LOG_OUT_SHOW).toBe('LOG_OUT_SHOW');
    expect(EditorMessageKey.LINK_OPENED).toBe('LINK_OPENED');
    expect(EditorMessageKey.REF_DELETE_001).toBe('REF_DELETE_001');
  });
});

describe('getEditorMessage', () => {
  it('returns triad prompt phase by default for REF_DELETE_001', () => {
    const full = getEditorMessage(EditorMessageKey.REF_DELETE_001);
    expect(full.prompt.title).toBe('Reference');
    expect(full.prompt.okText).toBe('Yes');

    const promptOnly = getEditorMessage(EditorMessageKey.REF_DELETE_001, {}, { phase: 'prompt' });
    expect(promptOnly.title).toBe('Reference');
    expect(promptOnly.text).toContain('delete the reference');
  });

  it('returns SIGN_OFF dialog text with DOC_TYPE interpolation', () => {
    const msg = getEditorMessage(EditorMessageKey.SIGN_OFF, { DOC_TYPE: 'article' });
    expect(msg.text).toContain('article');
    expect(msg.text).toContain('read-only');
  });

  it('resolves legacy key strings via resolveEditorMessageKey', () => {
    const legacy = getEditorMessage('refdel001');
    const modern = getEditorMessage(EditorMessageKey.REF_DELETE_001);
    expect(legacy?.prompt?.title).toBe(modern?.prompt?.title);
  });

  it('returns null for unknown keys', () => {
    expect(getEditorMessage('___missing___')).toBeNull();
  });
});

describe('EDITOR_MESSAGE_LEGACY_KEY_MAP', () => {
  it('maps every legacy key to a key present in EDITOR_MESSAGES', () => {
    for (const [, cleanKey] of Object.entries(EDITOR_MESSAGE_LEGACY_KEY_MAP)) {
      expect(EDITOR_MESSAGES[cleanKey]).toBeTruthy();
    }
  });

  it('resolveEditorMessageKey passes through clean keys', () => {
    expect(resolveEditorMessageKey(EditorMessageKey.SIGN_OFF)).toBe(EditorMessageKey.SIGN_OFF);
    expect(resolveEditorMessageKey('LogOutShow')).toBe(EditorMessageKey.LOG_OUT_SHOW);
  });
});

describe('registerEditorAlertBridge', () => {
  beforeEach(() => {
    delete globalThis.AlertMessages;
    delete globalThis.ALERT_MESSAGE;
  });

  it('exposes get / getAll for GlobalBridge with legacy and clean keys', () => {
    registerEditorAlertBridge(globalThis);
    expect(globalThis.AlertMessages.get('SIGN_OFF')).toBeTruthy();
    expect(globalThis.AlertMessages.get('LogOutShow')).toBeTruthy();
    expect(globalThis.AlertMessages.get(EditorMessageKey.SIGN_OFF)).toBeTruthy();
    expect(Object.keys(globalThis.AlertMessages.getAll()).length).toBeGreaterThan(50);
    expect(getAllEditorMessages()[EditorMessageKey.SCH_MAINTENANCE]).toBeTruthy();
  });
});
