# Editor Client Role CSS Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load editor CSS dynamically for common editor styling, client-specific styling, and role-specific styling before CKEditor is rendered.

**Architecture:** Add a small editor CSS loader service that creates idempotent `<link rel="stylesheet">` tags and resolves when stylesheets load or safely no-op when a stylesheet is missing. Wire it into `EditorPage.jsx` as a readiness gate, and pass the same stylesheet URLs into CKEditor `contentsCss` so styles apply inside the editable iframe/body.

**Tech Stack:** React 18, CKEditor 4, Vite public assets, DOM `<link>` stylesheet loading, Vitest.

**Spec:** In-chat design from 2026-09-06; no separate design document was requested.

## Global Constraints

- Use existing runtime CSS folder `public/assets/css`.
- Do not move or rename user-added CSS files unless the user separately requests cleanup.
- Load common CSS before client CSS, and client CSS before role CSS.
- Missing optional client or role CSS must not block the editor.
- Preserve existing `EditorPage.jsx` editor content, CKEditor, session, guided tour, and tab-presence behavior.

---

### Task 1: Add Editor CSS Loader

**Files:**
- Create: `src/services/editorConfig/editorCssLoader.js`
- Test: `tests/unit/editorConfig/editorCssLoader.test.js`

**Interfaces:**
- Produces: `buildEditorCssUrls({ client, roleId, roleName, assetsBase = '/assets' }): string[]`
- Produces: `loadEditorCss(options): Promise<string[]>`
- Produces: `resetEditorCssLinks(): void`

- [ ] **Step 1: Write failing tests for URL ordering and normalization**

```js
import { beforeEach, describe, expect, it } from 'vitest';
import { buildEditorCssUrls } from '../../../src/services/editorConfig/editorCssLoader.js';

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
      '/assets/css/clients/PLOS.scss',
      '/assets/css/roles/copy-editor.css'
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/editorConfig/editorCssLoader.test.js`

Expected: FAIL because `editorCssLoader.js` does not exist.

- [ ] **Step 3: Implement URL builder**

```js
const COMMON_EDITOR_CSS = [
  'editor_common.css',
  'editor_ref_color.css',
  'editor_track_color.css',
  'editor_track_hide.css'
];

const CLIENT_CSS_EXTENSIONS = ['.css', '.scss'];

export function toRoleCssSlug(value) {
  return String(value || '')
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function buildEditorCssUrls({ client, roleId, roleName, assetsBase = '/assets' } = {}) {
  const base = String(assetsBase || '/assets').replace(/\/+$/, '');
  const urls = COMMON_EDITOR_CSS.map((fileName) => `${base}/css/common/${fileName}`);
  const clientName = String(client || '').trim();
  if (clientName) {
    const upperClient = clientName.toUpperCase();
    urls.push(`${base}/css/clients/${upperClient}.scss`);
  }
  const roleSlug = toRoleCssSlug(roleName || roleId);
  if (roleSlug) {
    urls.push(`${base}/css/roles/${roleSlug}.css`);
  }
  return urls;
}
```

- [ ] **Step 4: Write failing tests for idempotent link loading**

```js
import { beforeEach, describe, expect, it } from 'vitest';
import { loadEditorCss, resetEditorCssLinks } from '../../../src/services/editorConfig/editorCssLoader.js';

describe('loadEditorCss', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    resetEditorCssLinks();
  });

  it('creates stylesheet links once and resolves with loaded URLs', async () => {
    const promise = loadEditorCss({ client: 'LWW', roleName: 'Author' });
    const links = Array.from(document.querySelectorAll('link[data-impact-editor-css]'));
    links.forEach((link) => link.dispatchEvent(new Event('load')));

    await expect(promise).resolves.toContain('/assets/css/clients/LWW.scss');
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
```

- [ ] **Step 5: Implement link loader**

```js
const loadedUrls = new Set();
const pendingUrls = new Map();

function loadStylesheet(url) {
  if (loadedUrls.has(url)) return Promise.resolve(url);
  if (pendingUrls.has(url)) return pendingUrls.get(url);

  const existing = document.querySelector(`link[data-impact-editor-css][href="${url}"]`);
  if (existing) {
    loadedUrls.add(url);
    return Promise.resolve(url);
  }

  const promise = new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.dataset.impactEditorCss = 'true';
    link.onload = () => {
      loadedUrls.add(url);
      pendingUrls.delete(url);
      resolve(url);
    };
    link.onerror = () => {
      pendingUrls.delete(url);
      resolve(null);
    };
    document.head.appendChild(link);
  });

  pendingUrls.set(url, promise);
  return promise;
}

export async function loadEditorCss(options = {}) {
  if (typeof document === 'undefined') return [];
  const results = await Promise.all(buildEditorCssUrls(options).map(loadStylesheet));
  return results.filter(Boolean);
}

export function resetEditorCssLinks() {
  loadedUrls.clear();
  pendingUrls.clear();
}
```

- [ ] **Step 6: Run tests**

Run: `npm run test:unit -- tests/unit/editorConfig/editorCssLoader.test.js`

Expected: PASS.

### Task 2: Gate Editor Rendering on CSS Loading

**Files:**
- Modify: `src/features/editor/pages/EditorPage.jsx`
- Test: `tests/unit/features/featureCleanupImports.test.js`
- Test: `tests/unit/editorConfig/editorCssLoader.test.js`

**Interfaces:**
- Consumes: `loadEditorCss({ client, roleId, roleName }): Promise<string[]>`
- Consumes: `buildEditorCssUrls({ client, roleId, roleName }): string[]`

- [ ] **Step 1: Write failing integration-adjacent test for import safety**

Add this assertion to `tests/unit/features/featureCleanupImports.test.js`:

```js
it('loads editor page with dynamic CSS loader imports', async () => {
  const editor = await import('../../../src/features/editor/pages/EditorPage.jsx');
  expect(editor.default).toBeTypeOf('function');
});
```

- [ ] **Step 2: Run test to verify current state**

Run: `npm run test:unit -- tests/unit/features/featureCleanupImports.test.js`

Expected: PASS before wiring behavior; this guards import safety during the next step.

- [ ] **Step 3: Wire CSS readiness into `EditorPage.jsx`**

Add imports:

```js
import { buildEditorCssUrls, loadEditorCss } from '../../../services/editorConfig/editorCssLoader.js';
```

Add state near `ckeditorReady`:

```js
const [editorCssReady, setEditorCssReady] = useState(false);
```

Add effect after `sessionSrc` is created:

```js
useEffect(() => {
  let cancelled = false;
  setEditorCssReady(false);

  loadEditorCss({
    client: sessionSrc.client,
    roleId: sessionSrc.roleId,
    roleName: sessionSrc.roleName
  }).then(() => {
    if (!cancelled) setEditorCssReady(true);
  });

  return () => {
    cancelled = true;
  };
}, [sessionSrc.client, sessionSrc.roleId, sessionSrc.roleName]);
```

Update `editorConfig` dependencies and config:

```js
const editorCssUrls = useMemo(() => buildEditorCssUrls({
  client: sessionSrc.client,
  roleId: sessionSrc.roleId,
  roleName: sessionSrc.roleName
}), [sessionSrc.client, sessionSrc.roleId, sessionSrc.roleName]);

const editorConfig = useMemo(() => ({
  toolbar: [
    { name: 'document', items: ['Source', '-', 'Preview', 'Print'] },
    { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', '-', 'Undo', 'Redo'] },
    { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', '-', 'RemoveFormat'] },
    { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent'] },
    { name: 'links', items: ['Link', 'Unlink'] },
    { name: 'insert', items: ['Image', 'Table', 'HorizontalRule'] },
    { name: 'styles', items: ['Styles', 'Format', 'FontSize'] }
  ],
  height: 760,
  uiColor: '#f7f4ef',
  removePlugins: 'elementspath',
  resize_enabled: false,
  contentsCss: ['/ckeditor4/contents.css', ...editorCssUrls]
}), [editorCssUrls]);
```

Update render gate:

```jsx
ckeditorReady && editorCssReady && !editorContent.loading && editorContent.content != null
```

- [ ] **Step 4: Run targeted tests**

Run: `npm run test:unit -- tests/unit/features/featureCleanupImports.test.js tests/unit/editorConfig/editorCssLoader.test.js`

Expected: PASS.

### Task 3: Final Verification

**Files:**
- Verify only.

**Interfaces:**
- Confirms no new public API beyond `editorCssLoader.js`.

- [ ] **Step 1: Confirm active CSS paths exist**

Run: `rg --files public/assets/css`

Expected output includes:

```text
public/assets/css/common/editor_common.css
public/assets/css/common/editor_ref_color.css
public/assets/css/common/editor_track_color.css
public/assets/css/common/editor_track_hide.css
public/assets/css/clients/LWW.scss
public/assets/css/clients/OUP.scss
public/assets/css/clients/OSO.scss
public/assets/css/clients/PLOS.scss
```

- [ ] **Step 2: Run focused unit tests**

Run: `npm run test:unit -- tests/unit/editorConfig/editorCssLoader.test.js tests/unit/features/featureCleanupImports.test.js`

Expected: PASS.

- [ ] **Step 3: Run full unit suite and record existing baseline failures**

Run: `npm run test:unit`

Expected for current repo: may fail on existing missing legacy fixture `run-task/current/link_session/LinkSessionCore.js`. Do not fix that as part of this CSS loading task unless the user explicitly expands scope.

- [ ] **Step 4: Commit only CSS loading files**

```bash
git add src/services/editorConfig/editorCssLoader.js src/features/editor/pages/EditorPage.jsx tests/unit/editorConfig/editorCssLoader.test.js tests/unit/features/featureCleanupImports.test.js docs/superpowers/plans/2026-09-06-editor-client-role-css-loading.md
git commit -m "feat: load editor CSS by client and role"
```
