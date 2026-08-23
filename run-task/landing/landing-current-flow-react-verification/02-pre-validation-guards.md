# 02 - Pre Validation Guards

Pre-validation guards run before the user can move from the landing page to the editor. These guards protect browser support, maintenance windows, duplicate tabs, stale storage, and link state.

## Browser Compatibility Guard

Source: `src/modules/shared/browser-compatible/index.js`.

Current supported browser policy:

| Browser | Minimum version | Allowed |
| --- | ---: | --- |
| Chrome | 72 | Yes |
| Firefox | 66 | Yes |
| Edge | 80 | Yes |
| Safari | 14 | Yes |
| Opera | 98 | Yes |
| IE | 11 | No |
| Brave | Any | No |

Current behavior:

- Browser detection writes `window.browserInfo`.
- If the browser is unsupported, the landing form can be removed/hidden.
- `LandingPage.js` waits briefly for `browserInfo`.
- If incompatible, landing shows `Land_Page_NOT_SUPPORT_BROW` and stops.

React migration requirement:

- Perform browser compatibility before URL validation proceeds.
- Render an unsupported browser state that blocks all continue/auth controls.
- Keep the final decision centralized so child components cannot accidentally show the continue button.

## Maintenance Mode Guard

Landing runtime calls:

```js
MAINTENANCE.Init({ init: true, fire: true })
```

Current maintenance behavior is maintained separately by the `ServerMaintenance` flow. The landing page checks whether the shared maintenance module exists and lets it initialize and show maintenance messaging.

React migration requirement:

- Check maintenance during boot.
- Preserve current behavior for active or future maintenance windows.
- If maintenance should block editor access, that block must happen before session storage and redirect.
- If maintenance is informational only for a given window, continue to show the alert/toast without losing URL validation state.
- Persist `MAINTENANCE_START` in session storage when redirecting during an active maintenance state, matching legacy behavior.

## URL Key Guard

Current logic requires the `key` search parameter.

Failure behavior:

- Show invalid link alert.
- Stop URL validation.
- Do not call the URL validity endpoint.
- Do not show `AGREE & CONTINUE`.

React migration requirement:

- Treat missing `key` as a terminal boot error.
- Keep the error state deterministic and testable.

## Stale Storage Cleanup Guard

After a successful validity response:

- Non-Collator users clear document-scoped local storage for the document id.
- Stale duplicate-tab page availability signals are cleared.

React migration requirement:

- Keep cleanup tied to the validated `docid`.
- Do not clear unrelated user or document storage.
- Preserve the Collator exception unless the backend/session model is changed.

## Same Browser Duplicate Open Guard

Current landing checks whether the same document is already open in another page/tab in the same browser.

Behavior:

- Landing writes/listens for page availability signals through browser storage events.
- `waitForExistingPageSignal(docid, 800)` waits for a same-document response.
- If an existing page responds, show `Land_Page_Link_Opened` and stop.

React migration requirement:

- Keep a cross-tab duplicate-document signal using `localStorage`, `BroadcastChannel`, or a compatible existing utility.
- Block redirect when the same document is already active in the same browser.
- Add tests for two tabs with the same `docid`.

## Link Status And Expiry Guard

After URL validation, `handleLinkStatus(linkStatus, isExpired, resData)` decides whether the link is usable.

Current state categories include:

- Active link.
- Inactive link.
- Expired/deleted link through `fdel`.
- Signoff/deactive style statuses.

React migration requirement:

- Normalize status into a typed enum.
- Keep the original backend values in logs/debug info.
- Do not continue into auth or link-session access if status is inactive or expired.

## Hidden Page Timeout Guard

Legacy landing tracks time spent while the page is hidden:

- Local environment: 5 minutes.
- Other environments: 10 minutes.

If hidden time exceeds the threshold, the landing page reloads. This reduces stale access decisions and stale session context.

React migration requirement:

- Recreate the hidden/visibility timer.
- Reset or revalidate state after reload.
- Do not reuse an old `NEW_SESSION_ID` after timeout.

