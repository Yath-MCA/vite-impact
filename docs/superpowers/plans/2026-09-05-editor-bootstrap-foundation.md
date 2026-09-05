# Editor Bootstrap Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `EditorPage.jsx`'s hardcoded sample content and absent config loading with real per-client config loading (config.xml/split/ceg) and real document-content fetching, matching `impactweb`'s `LoadingConfig`/`EDITOR_INITIALIZE` behavior.

**Architecture:** Two new React hooks (`useClientConfig`, `useEditorContent`) plus their supporting pure functions, added under a new `src/services/editorConfig/` module, wired into the existing `EditorPage.jsx` in place of `INITIAL_CONTENT`.

**Tech Stack:** React (hooks), `fetch` + `DOMParser` (no new dependencies), Vitest + happy-dom for tests.

**Spec:** `docs/superpowers/specs/2026-09-05-editor-bootstrap-foundation-design.md`

## Global Constraints

- No new npm dependencies — use native `fetch` and `DOMParser`, matching the spec's "not `XMLHttpRequest`" instruction and the existing `WorkflowDownloadService.js`/`LoadingService.js` pattern of calling `fetch` directly.
- Config fetch failures must fall back to safe defaults and never block the editor from loading (spec: "Error Handling").
- Content fetch failures must show a blocking error state, never a silent hardcoded fallback (spec: "Error Handling").
- Runtime config values must follow the existing `env(windowKey, viteKey, defaultVal)` pattern used in `src/services/session/sessionConfig.js` and `src/services/api/apiService.js` (prefer `window.ENV`, then `import.meta.env.VITE_*`, then a default).
- Document content is fetched from `${BUCKET_URL}${docId}/${docId}.html` (confirmed against this project's real `BUCKET_URL` env value — see `public/env.js`), not a placeholder.
- Tests live under `tests/unit/<domain>/*.test.js` (Vitest, `happy-dom` environment, `include: ['tests/unit/**/*.test.js']` per `vite.config.js`). Hook tests use this project's existing hand-rolled `renderHook` harness (see `tests/unit/landing/useLandingSessionFlow.test.js`) — there is no `@testing-library/react` dependency in this project.

---

## File Structure

```
src/services/editorConfig/
├── editorConfigConstants.js   # env-driven URL builders (Task 1)
├── parseClientConfigXml.js    # pure XML -> toggles parser (Task 2)
├── useClientConfig.js         # config-loading hook (Task 3)
└── useEditorContent.js        # content-loading hook (Task 4)

tests/unit/editorConfig/
├── editorConfigConstants.test.js
├── parseClientConfigXml.test.js
├── useClientConfig.test.js
└── useEditorContent.test.js

src/features/editor/pages/EditorPage.jsx   # modified in Task 5
```

---

### Task 1: Config/content URL builders

**Files:**
- Create: `src/services/editorConfig/editorConfigConstants.js`
- Test: `tests/unit/editorConfig/editorConfigConstants.test.js`

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces:
  - `editorConfigEnv: { bucketUrl: string, assetsBase: string, configVersion: string }` (mutable exported object — tests may reassign fields directly).
  - `buildDocumentContentUrl(docId: string): string`
  - `buildClientConfigBasePath({ dtd: string, client: string }): string`

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/editorConfig/editorConfigConstants.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import {
  editorConfigEnv,
  buildDocumentContentUrl,
  buildClientConfigBasePath
} from '../../../src/services/editorConfig/editorConfigConstants.js';

describe('editorConfigConstants', () => {
  const originalBucketUrl = editorConfigEnv.bucketUrl;
  const originalAssetsBase = editorConfigEnv.assetsBase;
  const originalConfigVersion = editorConfigEnv.configVersion;

  beforeEach(() => {
    editorConfigEnv.bucketUrl = originalBucketUrl;
    editorConfigEnv.assetsBase = originalAssetsBase;
    editorConfigEnv.configVersion = originalConfigVersion;
  });

  describe('buildDocumentContentUrl', () => {
    it('builds a bucket/docId/docId.html URL when bucketUrl has a trailing slash', () => {
      editorConfigEnv.bucketUrl = 'http://localhost/xmleditor/';
      expect(buildDocumentContentUrl('DOC123')).toBe('http://localhost/xmleditor/DOC123/DOC123.html');
    });

    it('normalizes a bucketUrl without a trailing slash', () => {
      editorConfigEnv.bucketUrl = 'http://localhost/xmleditor';
      expect(buildDocumentContentUrl('DOC123')).toBe('http://localhost/xmleditor/DOC123/DOC123.html');
    });
  });

  describe('buildClientConfigBasePath', () => {
    beforeEach(() => {
      editorConfigEnv.assetsBase = '/assets';
      editorConfigEnv.configVersion = 'v1';
    });

    it('maps BITS dtd to the books folder', () => {
      expect(buildClientConfigBasePath({ dtd: 'BITS', client: 'OXMEDO' }))
        .toBe('/assets/v1/config/books/oxmedo/');
    });

    it('maps any non-BITS dtd (e.g. JATS) to the journals folder', () => {
      expect(buildClientConfigBasePath({ dtd: 'JATS', client: 'PLOS' }))
        .toBe('/assets/v1/config/journals/plos/');
    });

    it('lowercases the client name regardless of input case', () => {
      expect(buildClientConfigBasePath({ dtd: 'JATS', client: 'AcS' }))
        .toBe('/assets/v1/config/journals/acs/');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/editorConfig/editorConfigConstants.test.js`
Expected: FAIL — `Cannot find module '../../../src/services/editorConfig/editorConfigConstants.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/services/editorConfig/editorConfigConstants.js
const runtimeWindow = typeof window !== 'undefined' ? window : { ENV: {} };

const env = (windowKey, viteKey, defaultVal) => {
  if (runtimeWindow.ENV && runtimeWindow.ENV[windowKey] !== undefined) {
    return runtimeWindow.ENV[windowKey];
  }
  return import.meta.env[viteKey] ?? defaultVal;
};

export const editorConfigEnv = {
  bucketUrl: env('BUCKET_URL', 'VITE_BUCKET_URL', 'http://localhost/xmleditor/'),
  assetsBase: env('EDITOR_CONFIG_ASSETS_BASE', 'VITE_EDITOR_CONFIG_ASSETS_BASE', '/assets'),
  configVersion: env('EDITOR_CONFIG_VERSION', 'VITE_EDITOR_CONFIG_VERSION', 'v1')
};

export function buildDocumentContentUrl(docId) {
  const base = editorConfigEnv.bucketUrl.endsWith('/')
    ? editorConfigEnv.bucketUrl
    : `${editorConfigEnv.bucketUrl}/`;
  return `${base}${docId}/${docId}.html`;
}

export function buildClientConfigBasePath({ dtd, client }) {
  const dtdFolder = String(dtd || '').toUpperCase() === 'BITS' ? 'books' : 'journals';
  const clientLower = String(client || '').toLowerCase();
  return `${editorConfigEnv.assetsBase}/${editorConfigEnv.configVersion}/config/${dtdFolder}/${clientLower}/`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/editorConfig/editorConfigConstants.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/editorConfig/editorConfigConstants.js tests/unit/editorConfig/editorConfigConstants.test.js
git commit -m "feat(editor-config): add config/content URL builders"
```

---

### Task 2: Client config XML parser

**Files:**
- Create: `src/services/editorConfig/parseClientConfigXml.js`
- Test: `tests/unit/editorConfig/parseClientConfigXml.test.js`

**Interfaces:**
- Consumes: nothing (leaf module, pure function).
- Produces:
  - `CLIENT_CONFIG_DEFAULTS: { layoutMode: 'default', readOnlyLayoutMode: 'default', figCap: null, tabCap: null }`
  - `parseClientConfigXml(xmlDoc: Document | null): { layoutMode: string, readOnlyLayoutMode: string, figCap: string|null, tabCap: string|null }`

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/editorConfig/parseClientConfigXml.test.js
import { describe, it, expect } from 'vitest';
import {
  parseClientConfigXml,
  CLIENT_CONFIG_DEFAULTS
} from '../../../src/services/editorConfig/parseClientConfigXml.js';

function parseXml(xmlString) {
  return new DOMParser().parseFromString(xmlString, 'application/xml');
}

describe('parseClientConfigXml', () => {
  it('reads three-column layout mode and read-only mode from editor6Layout', () => {
    const doc = parseXml(
      '<root><item name="editor6Layout" editor6="three-column" read-only="minimal"></item></root>'
    );
    const result = parseClientConfigXml(doc);
    expect(result.layoutMode).toBe('three-column');
    expect(result.readOnlyLayoutMode).toBe('minimal');
  });

  it('reads figCap/tabCap from Generate_Items', () => {
    const doc = parseXml(
      '<root><item name="Generate_Items" figCap="Fig." tabCap="Table"></item></root>'
    );
    const result = parseClientConfigXml(doc);
    expect(result.figCap).toBe('Fig.');
    expect(result.tabCap).toBe('Table');
  });

  it('returns defaults when editor6Layout/Generate_Items nodes are missing', () => {
    const doc = parseXml('<root><item name="something-else"></item></root>');
    expect(parseClientConfigXml(doc)).toEqual(CLIENT_CONFIG_DEFAULTS);
  });

  it('returns defaults without throwing when given null', () => {
    expect(parseClientConfigXml(null)).toEqual(CLIENT_CONFIG_DEFAULTS);
  });

  it('returns defaults without throwing when given a non-Document value', () => {
    expect(parseClientConfigXml({})).toEqual(CLIENT_CONFIG_DEFAULTS);
  });

  it('leaves layoutMode at default when editor6 attribute is not three-column', () => {
    const doc = parseXml('<root><item name="editor6Layout" editor6="default"></item></root>');
    expect(parseClientConfigXml(doc).layoutMode).toBe('default');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/editorConfig/parseClientConfigXml.test.js`
Expected: FAIL — `Cannot find module '../../../src/services/editorConfig/parseClientConfigXml.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/services/editorConfig/parseClientConfigXml.js
export const CLIENT_CONFIG_DEFAULTS = Object.freeze({
  layoutMode: 'default',
  readOnlyLayoutMode: 'default',
  figCap: null,
  tabCap: null
});

/**
 * Mirrors impactweb's SET_EDITOR_LAYOUT_CONFIG + Generate_Items reads
 * (src/js/_initialScriptLoader.js MetaConfig.handleResponse) against
 * this project's fetched config.xml. Never throws — always returns a
 * usable toggles object, defaulting whatever it can't find.
 */
export function parseClientConfigXml(xmlDoc) {
  const result = { ...CLIENT_CONFIG_DEFAULTS };

  if (!xmlDoc || typeof xmlDoc.querySelector !== 'function') {
    return result;
  }

  try {
    const layoutNode = xmlDoc.querySelector('[name="editor6Layout"]');
    if (layoutNode) {
      if (layoutNode.getAttribute('editor6') === 'three-column') {
        result.layoutMode = 'three-column';
      }
      const readOnly = layoutNode.getAttribute('read-only') || layoutNode.getAttribute('readOnly');
      if (readOnly) {
        result.readOnlyLayoutMode = readOnly;
      }
    }

    const generateNode = xmlDoc.querySelector('[name="Generate_Items"]');
    if (generateNode) {
      result.figCap = generateNode.getAttribute('figCap') || null;
      result.tabCap = generateNode.getAttribute('tabCap') || null;
    }
  } catch {
    return { ...CLIENT_CONFIG_DEFAULTS };
  }

  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/editorConfig/parseClientConfigXml.test.js`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/editorConfig/parseClientConfigXml.js tests/unit/editorConfig/parseClientConfigXml.test.js
git commit -m "feat(editor-config): add client config XML parser"
```

---

### Task 3: `useClientConfig` hook

**Files:**
- Create: `src/services/editorConfig/useClientConfig.js`
- Test: `tests/unit/editorConfig/useClientConfig.test.js`

**Interfaces:**
- Consumes:
  - `buildClientConfigBasePath({ dtd, client }): string` (Task 1)
  - `parseClientConfigXml(xmlDoc): toggles` and `CLIENT_CONFIG_DEFAULTS` (Task 2)
- Produces:
  - `useClientConfig({ client, dtd, journalCode, refStyle, isJournal }): { toggles: object, refStyleRules: Document|null, loading: boolean, error: {message: string}|null }`
  - Later tasks (Task 5 / `EditorPage.jsx`) call this hook with those five named fields.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/editorConfig/useClientConfig.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { useClientConfig } from '../../../src/services/editorConfig/useClientConfig.js';

function renderHook(hook, props) {
  const container = document.createElement('div');
  const root = createRoot(container);
  let latest = null;

  function Harness({ hookProps }) {
    const value = hook(hookProps);
    useEffect(() => {
      latest = value;
    });
    return null;
  }

  act(() => {
    root.render(React.createElement(Harness, { hookProps: props }));
  });

  return {
    get result() {
      return latest;
    },
    rerender(nextProps) {
      act(() => {
        root.render(React.createElement(Harness, { hookProps: nextProps }));
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
    }
  };
}

function xmlResponse(xmlString, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    text: () => Promise.resolve(xmlString)
  });
}

describe('useClientConfig', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in a loading state before resolving', () => {
    global.fetch.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(useClientConfig, {
      client: 'PLOS', dtd: 'JATS', journalCode: 'PONE', refStyle: '', isJournal: true
    });
    expect(result.loading).toBe(true);
  });

  it('parses config.xml into toggles once all requests resolve', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.endsWith('config.xml')) {
        return xmlResponse('<root><item name="editor6Layout" editor6="three-column"></item></root>');
      }
      return xmlResponse('<root></root>');
    });

    const { result } = renderHook(useClientConfig, {
      client: 'PLOS', dtd: 'JATS', journalCode: 'PONE', refStyle: '', isJournal: true
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.loading).toBe(false);
    expect(result.toggles.layoutMode).toBe('three-column');
    expect(result.error).toBeNull();
  });

  it('falls back to default toggles and sets error when a request fails, without blocking', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.endsWith('config.xml')) {
        return Promise.reject(new Error('network down'));
      }
      return xmlResponse('<root></root>');
    });

    const { result } = renderHook(useClientConfig, {
      client: 'PLOS', dtd: 'JATS', journalCode: 'PONE', refStyle: '', isJournal: true
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.loading).toBe(false);
    expect(result.toggles.layoutMode).toBe('default');
    expect(result.error).not.toBeNull();
  });

  it('requests the ceg refStyling file using refStyle when isJournal is false', async () => {
    global.fetch.mockImplementation((url) => xmlResponse('<root></root>'));

    renderHook(useClientConfig, {
      client: 'OXMEDO', dtd: 'BITS', journalCode: 'OXMEDO', refStyle: 'apa', isJournal: false
    });

    await act(async () => {
      await Promise.resolve();
    });

    const requestedUrls = global.fetch.mock.calls.map((call) => call[0]);
    expect(requestedUrls.some((url) => url.includes('ceg/refStyling_apa.xml'))).toBe(true);
  });

  it('skips fetching entirely when client or dtd is missing', () => {
    const { result } = renderHook(useClientConfig, {
      client: '', dtd: '', journalCode: '', refStyle: '', isJournal: false
    });
    expect(result.loading).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/editorConfig/useClientConfig.test.js`
Expected: FAIL — `Cannot find module '../../../src/services/editorConfig/useClientConfig.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/services/editorConfig/useClientConfig.js
import { useEffect, useRef, useState } from 'react';
import { buildClientConfigBasePath } from './editorConfigConstants.js';
import { parseClientConfigXml, CLIENT_CONFIG_DEFAULTS } from './parseClientConfigXml.js';

async function fetchXmlDoc(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${url}`);
  }
  const text = await response.text();
  return new DOMParser().parseFromString(text, 'application/xml');
}

/**
 * Loads a client's config.xml + split override + ceg refStyling in
 * parallel, mirroring impactweb's LoadingConfig (_initialScriptLoader.js).
 * Only config.xml's editor6Layout/Generate_Items feed `toggles` in this
 * sub-project — the split doc is fetched (proving it loads) but not yet
 * parsed further; `refStyleRules` exposes the raw ceg XML Document for
 * future reference-styling work.
 */
export function useClientConfig({ client, dtd, journalCode, refStyle, isJournal }) {
  const [state, setState] = useState({
    toggles: { ...CLIENT_CONFIG_DEFAULTS },
    refStyleRules: null,
    loading: true,
    error: null
  });
  const requestKeyRef = useRef('');

  useEffect(() => {
    if (!client || !dtd) {
      setState({
        toggles: { ...CLIENT_CONFIG_DEFAULTS },
        refStyleRules: null,
        loading: false,
        error: null
      });
      return undefined;
    }

    const requestKey = `${client}|${dtd}|${journalCode}|${refStyle}`;
    requestKeyRef.current = requestKey;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const basePath = buildClientConfigBasePath({ dtd, client });
    const cegFileBase = !isJournal && refStyle ? refStyle : journalCode;

    const configUrl = `${basePath}config.xml`;
    const splitUrl = journalCode ? `${basePath}split/${journalCode}.xml` : null;
    const cegUrl = cegFileBase ? `${basePath}ceg/refStyling_${encodeURIComponent(cegFileBase)}.xml` : null;

    Promise.allSettled([
      fetchXmlDoc(configUrl),
      splitUrl ? fetchXmlDoc(splitUrl) : Promise.resolve(null),
      cegUrl ? fetchXmlDoc(cegUrl) : Promise.resolve(null)
    ]).then(([configResult, splitResult, cegResult]) => {
      if (cancelled || requestKeyRef.current !== requestKey) return;

      const configDoc = configResult.status === 'fulfilled' ? configResult.value : null;
      const cegDoc = cegResult.status === 'fulfilled' ? cegResult.value : null;
      const anyFailed = [configResult, splitResult, cegResult].some((r) => r.status === 'rejected');

      setState({
        toggles: parseClientConfigXml(configDoc),
        refStyleRules: cegDoc,
        loading: false,
        error: anyFailed ? { message: 'One or more client config resources failed to load' } : null
      });
    });

    return () => {
      cancelled = true;
    };
  }, [client, dtd, journalCode, refStyle, isJournal]);

  return state;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/editorConfig/useClientConfig.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/editorConfig/useClientConfig.js tests/unit/editorConfig/useClientConfig.test.js
git commit -m "feat(editor-config): add useClientConfig hook"
```

---

### Task 4: `useEditorContent` hook

**Files:**
- Create: `src/services/editorConfig/useEditorContent.js`
- Test: `tests/unit/editorConfig/useEditorContent.test.js`

**Interfaces:**
- Consumes: `buildDocumentContentUrl(docId): string` (Task 1)
- Produces: `useEditorContent(docId: string): { content: string|null, loading: boolean, error: {message: string}|null }` — consumed by Task 5 (`EditorPage.jsx`).

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/editorConfig/useEditorContent.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { useEditorContent } from '../../../src/services/editorConfig/useEditorContent.js';

function renderHook(hook, props) {
  const container = document.createElement('div');
  const root = createRoot(container);
  let latest = null;

  function Harness({ hookProps }) {
    const value = hook(hookProps);
    useEffect(() => {
      latest = value;
    });
    return null;
  }

  act(() => {
    root.render(React.createElement(Harness, { hookProps: props }));
  });

  return {
    get result() {
      return latest;
    },
    rerender(nextProps) {
      act(() => {
        root.render(React.createElement(Harness, { hookProps: nextProps }));
      });
    }
  };
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('useEditorContent', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in a loading state with no content', () => {
    global.fetch.mockReturnValue(new Promise(() => {}));
    const harness = renderHook(useEditorContent, 'DOC123');
    expect(harness.result.loading).toBe(true);
    expect(harness.result.content).toBeNull();
    expect(harness.result.error).toBeNull();
  });

  it('sets content once the fetch resolves successfully', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('<p>Hello document</p>')
    });

    const harness = renderHook(useEditorContent, 'DOC123');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(harness.result.loading).toBe(false);
    expect(harness.result.content).toBe('<p>Hello document</p>');
    expect(harness.result.error).toBeNull();
  });

  it('sets a blocking error and leaves content null on a non-ok response', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve('') });

    const harness = renderHook(useEditorContent, 'DOC123');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(harness.result.loading).toBe(false);
    expect(harness.result.content).toBeNull();
    expect(harness.result.error).not.toBeNull();
  });

  it('sets an error immediately and never fetches when docId is falsy', () => {
    const harness = renderHook(useEditorContent, '');
    expect(harness.result.loading).toBe(false);
    expect(harness.result.content).toBeNull();
    expect(harness.result.error).not.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/editorConfig/useEditorContent.test.js`
Expected: FAIL — `Cannot find module '../../../src/services/editorConfig/useEditorContent.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/services/editorConfig/useEditorContent.js
import { useEffect, useRef, useState } from 'react';
import { buildDocumentContentUrl } from './editorConfigConstants.js';

/**
 * Fetches a document's editable HTML content by docId, mirroring
 * impactweb's EDITOR_INITIALIZE.RUN_READY_TO_OPEN content load. Unlike
 * useClientConfig, a failure here is blocking — EditorPage.jsx must show
 * an error state rather than silently falling back to placeholder text.
 */
export function useEditorContent(docId) {
  const [state, setState] = useState({ content: null, loading: true, error: null });
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!docId) {
      setState({ content: null, loading: false, error: { message: 'Missing docId' } });
      return undefined;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let cancelled = false;
    setState({ content: null, loading: true, error: null });

    fetch(buildDocumentContentUrl(docId))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Document fetch failed: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        if (cancelled || requestIdRef.current !== requestId) return;
        setState({ content: text, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled || requestIdRef.current !== requestId) return;
        setState({ content: null, loading: false, error: { message: err.message } });
      });

    return () => {
      cancelled = true;
    };
  }, [docId]);

  return state;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/editorConfig/useEditorContent.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/editorConfig/useEditorContent.js tests/unit/editorConfig/useEditorContent.test.js
git commit -m "feat(editor-config): add useEditorContent hook"
```

---

### Task 5: Wire config + content loading into `EditorPage.jsx`

**Files:**
- Modify: `src/features/editor/pages/EditorPage.jsx`

**Interfaces:**
- Consumes:
  - `useClientConfig({ client, dtd, journalCode, refStyle, isJournal })` (Task 3)
  - `useEditorContent(docId)` (Task 4)
  - `getValidateResponse()` from `src/services/session/sessionStorage.js` (existing)
  - `normalizeSessionSource(docData, validateResponse)` from `src/services/session/sessionSource.js` (existing) — returns `{ client, dtd, shorttitle, raw, ... }`
- Produces: no new exports — this is the leaf consumer for this sub-project.

This task has no unit test of its own (it is a wiring change in a page component with existing CKEditor/session-tab integration that is impractical to unit-test in isolation); it is verified with the manual smoke steps in Step 4, per the spec's Testing section.

- [ ] **Step 1: Read the current file to confirm line anchors**

Run: `Read src/features/editor/pages/EditorPage.jsx` — locate the following four snippets (line numbers may have drifted slightly from the ones below; match by content, not by number).

- [ ] **Step 2: Apply the import and state changes**

Replace the `INITIAL_CONTENT` constant and add the new imports. Find:

```js
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CKEditor } from 'ckeditor4-react';
import { Image as ImageIcon } from 'lucide-react';
import { useEditor } from '../../../context/EditorContext';
import { useLayout } from '../../../context/LayoutContext';
import { MODULE_TYPES, useModule } from '../../../context/ModuleContext';
import Navbar1 from '../components/Navbar1';
import Navbar2 from '../components/Navbar2';
import SharedMiddleColumn from '../components/SharedMiddleColumn';
import EditorFooter from '../components/EditorFooter';
import ModuleManager from '../modules/ModuleManager';
import { registerEditorAlertBridge } from '../messages/registerEditorAlertBridge.js';
import { initDownloadService } from '../../../services/download/index.js';
import { initErrorOps } from '../../../services/error/index.js';
import {
  claimValidateTab,
  releaseValidateTab,
  startTabPresenceListener,
  stopTabPresence
} from '../../../services/session/tabPresence.js';
import { SESSION_STORAGE_KEYS } from '../../../services/session/sessionConstants.js';
import { getValidateAccessKey } from '../../../services/session/sessionStorage.js';
import { showEditorMessage, EditorMessageKey } from '../messages/editorMessages.js';
import { loadCKEditor } from '../../../shared/utils/loadCKEditor.js';
```

Replace with:

```js
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CKEditor } from 'ckeditor4-react';
import { Image as ImageIcon } from 'lucide-react';
import { useEditor } from '../../../context/EditorContext';
import { useLayout } from '../../../context/LayoutContext';
import { MODULE_TYPES, useModule } from '../../../context/ModuleContext';
import Navbar1 from '../components/Navbar1';
import Navbar2 from '../components/Navbar2';
import SharedMiddleColumn from '../components/SharedMiddleColumn';
import EditorFooter from '../components/EditorFooter';
import ModuleManager from '../modules/ModuleManager';
import { registerEditorAlertBridge } from '../messages/registerEditorAlertBridge.js';
import { initDownloadService } from '../../../services/download/index.js';
import { initErrorOps } from '../../../services/error/index.js';
import {
  claimValidateTab,
  releaseValidateTab,
  startTabPresenceListener,
  stopTabPresence
} from '../../../services/session/tabPresence.js';
import { SESSION_STORAGE_KEYS } from '../../../services/session/sessionConstants.js';
import { getValidateAccessKey, getValidateResponse } from '../../../services/session/sessionStorage.js';
import { normalizeSessionSource } from '../../../services/session/sessionSource.js';
import { showEditorMessage, EditorMessageKey } from '../messages/editorMessages.js';
import { loadCKEditor } from '../../../shared/utils/loadCKEditor.js';
import { useClientConfig } from '../../../services/editorConfig/useClientConfig.js';
import { useEditorContent } from '../../../services/editorConfig/useEditorContent.js';
```

Find:

```js
const INITIAL_CONTENT = `
  <article>
    <h1>CMS Editor Workspace</h1>
    <p>This starter page provides a modular editing workspace with navigation, preview, overlays, permissions, and a responsive two-tier toolbar.</p>
    <h2>Introduction</h2>
    <p>Use the left panel for structural navigation, edit content in the center canvas, and compare output in the preview panel.</p>
    <h2>Editorial Notes</h2>
    <p>Dialogs, sidebars, and popouts can be attached to workflows such as settings, queries, or media insertion.</p>
    <h2>Production Preview</h2>
    <p>The preview panel reflects content updates and keeps the editor layout aligned with production-oriented review tasks.</p>
  </article>
`;
```

Delete this constant entirely — it is no longer used once Step 3 wires in real content.

- [ ] **Step 3: Wire the hooks into the component body**

Find:

```js
  const [editorData, setEditorData] = useState(INITIAL_CONTENT);
  const [ckeditorReady, setCkeditorReady] = useState(
    typeof window !== 'undefined' && Boolean(window.CKEDITOR)
  );
  const syncTimerRef = useRef(null);
  const sessionDocId =
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(SESSION_STORAGE_KEYS.DOC_ID)
      : null;
  const validateKey =
    typeof sessionStorage !== 'undefined' ? getValidateAccessKey() : '';
```

Replace with:

```js
  const [editorData, setEditorData] = useState('');
  const [ckeditorReady, setCkeditorReady] = useState(
    typeof window !== 'undefined' && Boolean(window.CKEDITOR)
  );
  const syncTimerRef = useRef(null);
  const sessionDocId =
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(SESSION_STORAGE_KEYS.DOC_ID)
      : null;
  const validateKey =
    typeof sessionStorage !== 'undefined' ? getValidateAccessKey() : '';

  const sessionSrc = useMemo(
    () => normalizeSessionSource({}, getValidateResponse()),
    []
  );
  const isJournal = String(sessionSrc.dtd || '').toUpperCase().includes('JATS');
  const clientConfig = useClientConfig({
    client: sessionSrc.client,
    dtd: sessionSrc.dtd,
    journalCode: sessionSrc.shorttitle,
    refStyle: sessionSrc.raw?.refstyle || '',
    isJournal
  });
  const editorContent = useEditorContent(sessionDocId);
  const isThreeColumnConfig = clientConfig.toggles.layoutMode === 'three-column';
```

Find:

```js
  useEffect(() => {
    updateContent(INITIAL_CONTENT);
    setIsDirty(false);
  }, [setIsDirty, updateContent]);
```

Replace with:

```js
  useEffect(() => {
    if (editorContent.content == null) return;
    setEditorData(editorContent.content);
    updateContent(editorContent.content);
    setIsDirty(false);
  }, [editorContent.content, setIsDirty, updateContent]);
```

- [ ] **Step 4: Update the render to use fetched content, error state, and config-driven layout**

Find:

```js
      <main className="flex min-h-0 flex-1 overflow-hidden pb-16">
        {toggles.showToc && (
          <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white">
            <Suspense fallback={<PanelLoader />}>
              <NavigationPanel />
            </Suspense>
          </div>
        )}

        <section className="flex min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 flex-1 justify-center overflow-y-auto bg-[#ece7de] px-3 py-4 md:px-6 md:py-6">
            <div className="w-full max-w-5xl rounded-sm border border-gray-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.10)]">
              {ckeditorReady ? (
                <CKEditor
                  initData={editorData}
                  onChange={handleEditorChange}
                  onInstanceReady={handleEditorReady}
                  onInstanceDestroyed={handleEditorDestroyed}
                  config={editorConfig}
                />
              ) : (
                <div className="flex h-[760px] items-center justify-center text-sm text-gray-500">
                  Loading editor…
                </div>
              )}
            </div>
          </div>

          <div className="hidden w-[32rem] flex-shrink-0 border-l border-gray-200 bg-white xl:block">
            <Suspense fallback={<PanelLoader />}>
              <PdfPreview />
            </Suspense>
          </div>
        </section>

        {toggles.showThumbnails && (
          <div className="w-[128px] flex-shrink-0 border-l border-gray-200 bg-white">
            <Suspense fallback={<PanelLoader />}>
              <ThumbnailPanel />
            </Suspense>
          </div>
        )}
      </main>
```

Replace with:

```js
      <main className="flex min-h-0 flex-1 overflow-hidden pb-16">
        {toggles.showToc && !isThreeColumnConfig && (
          <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white">
            <Suspense fallback={<PanelLoader />}>
              <NavigationPanel />
            </Suspense>
          </div>
        )}

        <section className="flex min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 flex-1 justify-center overflow-y-auto bg-[#ece7de] px-3 py-4 md:px-6 md:py-6">
            <div className="w-full max-w-5xl rounded-sm border border-gray-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.10)]">
              {editorContent.error ? (
                <div className="flex h-[760px] flex-col items-center justify-center gap-2 text-sm text-red-600">
                  <p className="font-medium">Unable to load this document.</p>
                  <p className="text-gray-500">{editorContent.error.message}</p>
                </div>
              ) : ckeditorReady && !editorContent.loading && editorData ? (
                <CKEditor
                  initData={editorData}
                  onChange={handleEditorChange}
                  onInstanceReady={handleEditorReady}
                  onInstanceDestroyed={handleEditorDestroyed}
                  config={editorConfig}
                />
              ) : (
                <div className="flex h-[760px] items-center justify-center text-sm text-gray-500">
                  Loading document…
                </div>
              )}
            </div>
          </div>

          {!isThreeColumnConfig && (
            <div className="hidden w-[32rem] flex-shrink-0 border-l border-gray-200 bg-white xl:block">
              <Suspense fallback={<PanelLoader />}>
                <PdfPreview />
              </Suspense>
            </div>
          )}
        </section>

        {toggles.showThumbnails && !isThreeColumnConfig && (
          <div className="w-[128px] flex-shrink-0 border-l border-gray-200 bg-white">
            <Suspense fallback={<PanelLoader />}>
              <ThumbnailPanel />
            </Suspense>
          </div>
        )}
      </main>
```

- [ ] **Step 5: Manual smoke verification**

1. Start the dev server: `npm run dev` (see `.claude/launch.json`, port 3000).
2. In a browser devtools console on the app, set a fake session so the editor route has a `docId`:
   ```js
   sessionStorage.setItem('docid', 'SMOKE_TEST_DOC');
   ```
3. Navigate to `/editor`. Confirm:
   - Network tab shows a request to `.../SMOKE_TEST_DOC/SMOKE_TEST_DOC.html` (will 404 in local dev without a real bucket — that's expected) and requests to `.../config/journals//config.xml` etc. (empty client is fine for this smoke check, just confirming the requests fire).
   - The page shows "Loading document…" while `useEditorContent` is pending, then either real content or the red error panel once the (expected, local-dev) 404 resolves — never the old hardcoded "CMS Editor Workspace" text.
4. Confirm no new console errors beyond the expected 404s for the smoke-test URLs.

- [ ] **Step 6: Commit**

```bash
git add src/features/editor/pages/EditorPage.jsx
git commit -m "feat(editor): load real document content and client config in EditorPage"
```

---

## Self-Review

**Spec coverage:**
- "Fetch + parse 3 XML resources in parallel (config.xml, split override, ceg refStyling)" → Task 3 (`useClientConfig`).
- "Fetch document content from server" → Task 4 (`useEditorContent`).
- "Replace `INITIAL_CONTENT`... adding config-driven UI toggles" → Task 5.
- "Config fetch failure... falls back to safe defaults, editor still loads" → Task 3's `Promise.allSettled` + `parseClientConfigXml` defaults; Task 5 never blocks rendering on `clientConfig.error`.
- "Content fetch failure... blocking error state" → Task 4's `error` state + Task 5's red error panel replacing the CKEditor slot.
- "Testing: Vitest unit tests... manual smoke test" → Tasks 1–4 each have unit tests; Task 5 has the manual smoke steps.
- "Explicitly Out of Scope" items (favicon/lang fetch, tier1/query/tier2 modules, `_editorLayout.js` column mechanics) → none of the 5 tasks touch these; confirmed no scope creep.
- Spec's "Open Question" (document content endpoint) → resolved before this plan was written: `BUCKET_URL` + `docId` + `docId.html`, confirmed against this project's real `public/env.js` value.

**Placeholder scan:** No "TBD"/"TODO"/"add appropriate error handling" strings in any task. Every code block is complete, runnable code. The one open item from the spec (content endpoint) was resolved via user confirmation before writing Task 4, not left as a placeholder.

**Type consistency:**
- `useClientConfig` return shape `{ toggles, refStyleRules, loading, error }` used identically in Task 3's tests and Task 5's `clientConfig.toggles.layoutMode` access.
- `useEditorContent` return shape `{ content, loading, error }` used identically in Task 4's tests and Task 5's `editorContent.content`/`.loading`/`.error` access.
- `buildClientConfigBasePath({ dtd, client })` and `buildDocumentContentUrl(docId)` signatures match between Task 1's definition and Tasks 3/4's usage.
- `parseClientConfigXml(xmlDoc)` and `CLIENT_CONFIG_DEFAULTS` match between Task 2's definition and Task 3's usage.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-05-editor-bootstrap-foundation.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
