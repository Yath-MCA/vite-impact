# Plan: Localhost Dev Console Logger

## Summary
Add a lightweight, drop-in logging utility (`devLog`) that behaves like `console.log`/`warn`/`error`/`debug` but only actually prints when the app is running on localhost. It reuses the existing `isLocalHost()` domain check instead of reinventing environment detection, so no build-time env flag is needed.

## User Story
As a developer running the app locally,
I want a console logging helper that stays silent in deployed environments (dev/uat/stage/prod),
So that debug output never leaks to real users while I can still log freely during local development.

## Problem → Solution
Today, ad-hoc `console.log`/`console.error` calls throughout the codebase (e.g. `src/services/api/apiService.js:309`) always print, regardless of environment. → A new `src/shared/utils/devLogger.js` module exposes `devLog.log/warn/error/debug(...)`, each gated by the existing `isLocalHost()` check, callable anywhere as a drop-in replacement for `console.*`.

## Metadata
- **Complexity**: Small
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 3 (1 new module, 1 new test, 1 optional barrel export update)

---

## UX Design
N/A — internal developer-tooling change, no user-facing UX.

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 (critical) | `src/services/session/runtimeFlags.js` | 1-11 | `isLocalHost()` is the exact gate to reuse — do not reimplement hostname detection |
| P0 (critical) | `src/shared/utils/sanitizeHtml.js` | 1-16 | Canonical style for a small, dependency-free pure utility in `src/shared/utils/` |
| P1 (important) | `src/services/session/index.js` | 1-20 | Shows the barrel-export pattern (`export { x } from './y.js'`) used for this services folder |
| P1 (important) | `tests/unit/session/runtimeFlags.test.js` | 1-20 | Vitest style/import path convention for testing a `src/services/session/*` util |
| P1 (important) | `tests/unit/utils/sanitizeHtml.test.js` | 1-19 | Vitest style/import path convention for testing a `src/shared/utils/*` util |
| P2 (reference) | `src/features/landing/pages/ValidateUrlPage.jsx` | 13, 34 | Real call-site example: `const IS_LOCAL = typeof window !== 'undefined' && isLocalHost();` |
| P2 (reference) | `src/services/api/apiService.js` | 8, 13, 309 | Existing raw `console.error` call this utility could later replace (not required for this task) |
| P2 (reference) | `src/shared/utils/README.md` | all | Confirms `src/shared/utils/` is the correct home ("Pure helpers... callable from pages/services") |

## External Documentation
No external research needed — feature uses established internal patterns (`isLocalHost()` already exists and is tested).

---

## Patterns to Mirror

### NAMING_CONVENTION
// SOURCE: src/shared/utils/sanitizeHtml.js:1-5, src/services/session/runtimeFlags.js:1-4
```js
// camelCase file name matching the primary export; named export (not default)
export function sanitizeHtml(input) { ... }
export function isLocalHost(href = runtimeWindow.location?.href) { ... }
```
New module follows the same: `src/shared/utils/devLogger.js`, named export `devLog`.

### SSR-SAFE WINDOW ACCESS
// SOURCE: src/services/session/runtimeFlags.js:1
```js
const runtimeWindow = typeof window !== 'undefined' ? window : { location: { href: '' } };
```
Reuse `isLocalHost()` directly rather than re-deriving `window` access — it already guards for a missing `window`.

### CALL-SITE GATE PATTERN
// SOURCE: src/features/landing/pages/ValidateUrlPage.jsx:34
```js
const IS_LOCAL = typeof window !== 'undefined' && isLocalHost();
```
Confirms `isLocalHost()` takes no arguments at call time (defaults to `window.location.href`) — the new module should call it the same way, per log call (not cached at module load), so it re-evaluates if `window.location` changes (e.g. in tests).

### FILE HEADER COMMENT STYLE
// SOURCE: src/shared/utils/sanitizeHtml.js:1-4
```js
/**
 * Lightweight HTML sanitizer for trusted-but-untrusted branding HTML.
 * Strips scripts, event handlers, and dangerous URLs without a DOMPurify dependency.
 */
```
One short block comment stating purpose only — no verbose docstrings.

### TEST_STRUCTURE
// SOURCE: tests/unit/utils/sanitizeHtml.test.js:1-19
```js
import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../../../src/shared/utils/sanitizeHtml.js';

describe('sanitizeHtml', () => {
  it('strips script tags and event handlers', () => {
    ...
  });
});
```
Mirror exactly for `tests/unit/utils/devLogger.test.js`, using `vi.spyOn(console, 'log')` / `window.history.pushState` to assert print vs. silence.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/shared/utils/devLogger.js` | CREATE | New hostname-gated logger utility. No caller wired up in this task — call sites (e.g. migrating `apiService.js:309`) are explicitly out of scope, see "NOT Building" |
| `tests/unit/utils/devLogger.test.js` | CREATE | Unit tests covering local vs non-local behavior for all 4 methods |
| `src/shared/utils/README.md` | UPDATE | Add `devLogger.js` to "Key files" list, matching existing doc convention |

## NOT Building
- No changes to existing `console.*` call sites (e.g. `apiService.js:309`) — this task only adds the utility, not a repo-wide migration
- No build-time/env-variable based gating (e.g. `import.meta.env.DEV`) — explicitly reuses `isLocalHost()` domain-string check per user's stated intent
- No log persistence, remote logging, or log-level filtering beyond log/warn/error/debug
- No monkey-patching of the global `window.console` object (user selected the "new shared utility module" approach, not global wrapping)

---

## Step-by-Step Tasks

### Task 1: Create the devLogger utility
- **ACTION**: Create `src/shared/utils/devLogger.js`
- **IMPLEMENT**:
  ```js
  /**
   * Console logger gated to local development — silent everywhere isLocalHost() is false.
   */
  import { isLocalHost } from '../../services/session/runtimeFlags.js';

  function guard(method) {
    return (...args) => {
      if (isLocalHost()) {
        console[method](...args);
      }
    };
  }

  export const devLog = {
    log: guard('log'),
    warn: guard('warn'),
    error: guard('error'),
    debug: guard('debug'),
  };
  ```
- **MIRROR**: `NAMING_CONVENTION` and `SSR-SAFE WINDOW ACCESS` patterns above; single-line purpose comment like `sanitizeHtml.js`
- **IMPORTS**: `isLocalHost` from `../../services/session/runtimeFlags.js` (relative path from `src/shared/utils/` → `src/services/session/`)
- **GOTCHA**: `isLocalHost()` must be called per invocation (inside `guard`'s returned closure), not cached at module load — otherwise tests that stub `window.location` after import won't see the change, and the value would be wrong if evaluated before `window` exists (SSR/test setup).
- **VALIDATE**: `npm run lint` passes on the new file

### Task 2: Write unit tests
- **ACTION**: Create `tests/unit/utils/devLogger.test.js`
- **IMPLEMENT**:
  ```js
  import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
  import { devLog } from '../../../src/shared/utils/devLogger.js';

  describe('devLog', () => {
    let originalHref;

    beforeEach(() => {
      originalHref = window.location.href;
    });

    afterEach(() => {
      window.history.pushState({}, '', originalHref);
      vi.restoreAllMocks();
    });

    it('prints on localhost', () => {
      window.history.pushState({}, '', 'http://localhost:5173/');
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      devLog.log('hello');
      expect(spy).toHaveBeenCalledWith('hello');
    });

    it('stays silent off localhost', () => {
      window.history.pushState({}, '', 'https://product.company.co/');
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      devLog.log('hello');
      expect(spy).not.toHaveBeenCalled();
    });

    it('gates warn, error, and debug the same way', () => {
      window.history.pushState({}, '', 'https://product.company.co/');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      devLog.warn('w');
      devLog.error('e');
      devLog.debug('d');
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
      expect(debugSpy).not.toHaveBeenCalled();
    });
  });
  ```
- **MIRROR**: `TEST_STRUCTURE` pattern above (`tests/unit/utils/sanitizeHtml.test.js`)
- **IMPORTS**: `vitest` (`describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`)
- **GOTCHA**: `runtimeFlags.test.js` tests `isLocalHost(href)` by passing the href directly as an argument (pure-function style), avoiding any `window` mutation. `devLog` calls `isLocalHost()` with no argument (defaulting to `window.location.href`), so its tests must actually change `window.location` (via `pushState`) rather than pass an argument — confirm the vitest config's test `environment` (`happy-dom`, per `devDependencies`) supports `window.history.pushState` before relying on it; if not, fall back to `vi.stubGlobal('window', { location: { href: '...' } })`.
- **VALIDATE**: `npx vitest run devLogger` passes all 3 assertions

### Task 3: Document the new util in the folder README
- **ACTION**: Update `src/shared/utils/README.md`
- **IMPLEMENT**: Add `` - `devLogger.js` `` to the "Key files" bullet list (after `sanitizeHtml.js`, matching existing order)
- **MIRROR**: Existing bullet-list format in that README
- **IMPORTS**: N/A (docs only)
- **GOTCHA**: None
- **VALIDATE**: Visual diff review only — no automated check

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `devLog.log` on localhost | `window.location.href = 'http://localhost:5173/'` | `console.log` called with given args | No |
| `devLog.log` off localhost | `window.location.href = 'https://product.company.co/'` | `console.log` NOT called | No |
| `devLog.warn/error/debug` off localhost | same non-local href | none of the 3 methods called | Yes — verifies all 4 methods gate identically |

### Edge Cases Checklist
- [x] Empty/undefined input — not applicable; `devLog.*` forwards args as-is to `console.*`, which already handles any input including none
- [ ] Maximum size input — N/A, pass-through only
- [ ] Invalid types — N/A, pass-through only
- [ ] Concurrent access — N/A, stateless pure function
- [ ] Network failure — N/A
- [x] Permission denied — N/A (no I/O)

---

## Validation Commands

### Static Analysis
```bash
npm run lint
```
EXPECT: Zero lint errors/warnings on `src/shared/utils/devLogger.js` and `tests/unit/utils/devLogger.test.js`

### Unit Tests
```bash
npx vitest run devLogger
```
EXPECT: All 3 new tests pass

### Full Test Suite
```bash
npm run test:unit
```
EXPECT: No regressions in existing suites (especially `tests/unit/session/runtimeFlags.test.js`, unaffected since `isLocalHost` itself is untouched)

### Browser Validation (manual)
- [ ] Run `npm run dev`, open the app at `http://localhost:5173`, import `devLog` in any component temporarily and confirm `devLog.log('test')` prints in the browser console
- [ ] Confirm no build/type errors from `npm run build:local`

---

## Acceptance Criteria
- [ ] `src/shared/utils/devLogger.js` created, exporting `devLog` with `log`, `warn`, `error`, `debug` methods
- [ ] All 4 methods gated by `isLocalHost()` from `src/services/session/runtimeFlags.js` (no new hostname-detection logic)
- [ ] Unit tests in `tests/unit/utils/devLogger.test.js` pass, covering both localhost (prints) and non-localhost (silent) cases
- [ ] `npm run lint` passes
- [ ] `npm run test:unit` passes with no regressions
- [ ] `src/shared/utils/README.md` updated to list the new file

## Completion Checklist
- [ ] Code follows discovered patterns (named export, SSR-safe reuse of `isLocalHost`, short header comment)
- [ ] Error handling matches codebase style (none needed — pure pass-through, no try/catch precedent in `sanitizeHtml.js`)
- [ ] Logging follows codebase conventions (this IS the logging utility — N/A)
- [ ] Tests follow `tests/unit/utils/*.test.js` structure
- [ ] No hardcoded values
- [ ] Documentation updated (`README.md`)
- [ ] No unnecessary scope additions (no repo-wide `console.*` migration, no global monkey-patch)
- [ ] Self-contained — no questions needed during implementation

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `happy-dom`/vitest test environment may not fully support `window.history.pushState` used to drive `isLocalHost()` in tests | Low | Low | Fallback: use `vi.stubGlobal('window', { location: { href: '...' } })` if `pushState` proves unreliable in this repo's vitest config |
| Developers keep using raw `console.*` instead of `devLog` since nothing enforces adoption | Medium | Low | Out of scope per "NOT Building" — a future lint rule or repo-wide migration could enforce this later if desired |

## Notes
- The user's original request ("custom same like console feature will print on localhost domain") was clarified via AskUserQuestion to mean: a hostname-gated `console.log`-like utility, implemented as a new shared module (not a global `console` monkey-patch).
- This plan deliberately reuses the existing, already-tested `isLocalHost()` rather than introducing a second environment-detection mechanism — keeping exactly one source of truth for "are we local" across the codebase.
