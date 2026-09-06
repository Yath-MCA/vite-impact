import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildEditorCssUrls,
  loadEditorCss,
  resetEditorCssLinks
} from '../../../src/services/editorConfig/editorCssLoader.js';

describe('editorCssLoader buildEditorCssUrls', () => {
  it('builds common, client, and role stylesheet URLs in load order', () => {
    expect(buildEditorCssUrls({
      client: 'PLOS',
      roleName: 'Copy Editor'
    })).toEqual([
      '/assets/css/common/editor_common.css',
      '/assets/css/common/editor_ref_color.css',
      '/assets/css/common/editor_track_color.css',
      '/assets/css/common/editor_track_hide.css',
      '/assets/css/clients/PLOS.css',
      '/assets/css/roles/copy-editor.css'
    ]);
  });
});

describe('loadEditorCss', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    resetEditorCssLinks();
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates stylesheet links once and resolves with loaded URLs', async () => {
    const promise = loadEditorCss({ client: 'LWW', roleName: 'Author' });
    const links = Array.from(document.querySelectorAll('link[data-impact-editor-css]'));
    links.forEach((link) => link.dispatchEvent(new Event('load')));

    await expect(promise).resolves.toContain('/assets/css/clients/LWW.css');
    expect(document.querySelectorAll('link[data-impact-editor-css]').length).toBe(6);

    const second = loadEditorCss({ client: 'LWW', roleName: 'Author' });
    await expect(second).resolves.toContain('/assets/css/roles/author.css');
    expect(document.querySelectorAll('link[data-impact-editor-css]').length).toBe(6);
  });

  it('does not reject when optional CSS fails to load', async () => {
    const promise = loadEditorCss({ client: 'UNKNOWN', roleName: 'Reviewer' });
    Array.from(document.querySelectorAll('link[data-impact-editor-css]')).forEach((link) => {
      link.dispatchEvent(new Event('error'));
    });

    await expect(promise).resolves.toEqual([]);
  });
});
