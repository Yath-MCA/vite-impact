import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor } from '../../context/EditorContext.jsx';
import { useModuleLifecycle } from '../../store/useModuleLifecycle.js';
import { saveDocument } from './saveDocument.js';
import { claimValidateTab } from '../session/tabPresence.js';
import { getValidateAccessKey } from '../session/sessionStorage.js';
import { showEditorMessage, EditorMessageKey } from '../../features/editor/messages/editorMessages.js';

/**
 * Core save flow: session-validation-before-save (via claimValidateTab) ->
 * basic content validation -> save request -> state update. Dirty-state
 * tracking is read from EditorContext, not reimplemented. Mirrors
 * impactweb's SaveModule.save() core path (CJK validation, offline mode,
 * and save-history comparison are explicitly out of scope here).
 */
export function useSaveModule(docId) {
  const { content, isDirty, setIsDirty } = useEditor();
  const lifecycle = useModuleLifecycle('saveModule', 'SaveModule');
  const [saveState, setSaveState] = useState('idle');

  const autoSaveTimerRef = useRef(null);
  const isDirtyRef = useRef(isDirty);
  const saveRef = useRef(null);

  isDirtyRef.current = isDirty;

  const save = useCallback(async ({ autoSave = false } = {}) => {
    setSaveState('validating');

    const claim = await claimValidateTab({ docId, key: getValidateAccessKey() });
    if (!claim || !claim.ok) {
      await showEditorMessage(EditorMessageKey.EXPIRED_SESSION_ALERT);
      setSaveState('error');
      return { ok: false, reason: 'stale_session' };
    }

    if (!content || !content.trim()) {
      setSaveState('error');
      return { ok: false, reason: 'empty_content' };
    }

    setSaveState('saving');
    const result = await saveDocument({ docId, content });

    if (result.ok) {
      setSaveState('saved');
      setIsDirty(false);
      lifecycle.recordStat('buttonClicked', { buttonId: autoSave ? 'autosave' : 'save' });
      return { ok: true };
    }

    setSaveState('error');
    lifecycle.recordError('save', result.message);
    return { ok: false, reason: 'save_failed', message: result.message };
  }, [docId, content, setIsDirty, lifecycle]);

  saveRef.current = save;

  const startAutoSave = useCallback((intervalMs = 30000) => {
    if (autoSaveTimerRef.current) return;
    autoSaveTimerRef.current = setInterval(() => {
      if (isDirtyRef.current) {
        saveRef.current({ autoSave: true });
      }
    }, intervalMs);
  }, []);

  const stopAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopAutoSave(), [stopAutoSave]);

  return { saveState, save, startAutoSave, stopAutoSave, isDirty };
}
