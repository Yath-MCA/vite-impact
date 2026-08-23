# 01 - Current Entry And URL Validation

## Current Landing Shell

The landing page shell is `snippet/validateurl.html`.

Important runtime includes:

- `assets/${VERSION}/modules/browser-compatible/index.js`
- `assets/${VERSION}/js/session_landing.js`
- `assets/${VERSION}/js/landing.js`
- `${authenticator_script}` when the selected client config enables the authenticator module

Important DOM controls:

- `#navDownloadSection`: header navbar collapse region for download/help links.
- `#ValidateBtnOpt`: main `AGREE & CONTINUE` action. Calls `redirect()`.
- `#generateOTPBtn`: token/access-code action used by the authenticator flow.
- `#eMailValidate`: email validation retry action. Reloads the page.

The React app should keep these as semantic controls, but the DOM ids do not have to remain public API unless legacy scripts are still loaded. If legacy scripts stay loaded during phased migration, keep compatible ids until those scripts are replaced.

## URL Validation Entry Point

Current logic starts on `DOMContentLoaded` in `src/js/dialogModules/LandingPage.js`.

Sequence:

1. Ensure `window.browserInfo` exists. If missing, call `fireEvent_browser_validation()`.
2. Wait briefly for browser detection to complete.
3. If the browser is incompatible, show `Land_Page_NOT_SUPPORT_BROW` and stop.
4. Initialize alert dialog support.
5. If `window.MAINTENANCE` exists, call `MAINTENANCE.Init({ init: true, fire: true })`.
6. Bind landing abandon tracking.
7. Parse URL search params.
8. Require `key`.
9. If `alert=idle_session_sign_off`, show `Land_Page_SESSION_OUT`.
10. POST `{ key }` to `API_URL_VALIDITY`.
11. Handle the response with `commonfn.validateuserpost`.

React migration rule: model this as a boot state machine, not as independent effects that can race each other. URL validation should not run past a failed browser guard or missing key guard.

## URL Validity Request

The legacy request uses `commonfn.callajaxwithoutjsontype`:

- Method: `POST`
- Payload wrapper: `jsondata=<JSON string>`
- Headers: `appkey`, `apikey`
- Callback: `validateuserpost`
- Endpoint: `API_URL_VALIDITY`

React migration should preserve:

- Same payload shape unless backend API is changed.
- Same auth headers.
- Same invalid-link behavior on request error.
- Same `r == 0` handling, which reloads/stops for invalid validity responses.

## URL Validity Response Handling

`commonfn.validateuserpost(response)` currently performs these steps:

1. Read `response.data` into `resData`.
2. Stop/reload when `resData.r == 0` or `response.r == 0`.
3. Copy top-level response values such as `r` and `enable` into `resData`.
4. Clear stale document scoped local data for non-Collator users.
5. Clear stale page-available duplicate-tab signal.
6. Initialize global landing state.
7. Update user state from the response.
8. Update landing UI with document details.
9. Load and show cover image if configured.
10. Check whether the same document is already open in the same browser.
11. Evaluate link status and expiry.
12. Continue into user/auth validation with `processUserValidation`.

React migration should convert globals into explicit state:

| Legacy global | React/db-backed equivalent |
| --- | --- |
| `RES_DATA` / `SHARED_KEY` | URL validation result state |
| `USER_INFO` | Authenticated landing user state |
| `DOC_ID` | Document access context |
| `DOC_DTD` | Document type/schema context |
| `NEW_SESSION_ID` | Landing-created editor session id |
| `redirect_url` | Derived editor route |
| `landingAuthCompleted` | Auth guard completion flag |

## Invalid And Early Stop Conditions

The React page must stop and not show continue when:

- URL has no `key`.
- URL validity API fails or returns invalid shape.
- Response status marks the link inactive.
- Response marks the link expired/deleted.
- Browser is unsupported.
- Same document is already open in the same browser.
- Required email/token/OTP authentication is cancelled or failed.
- Link-session check denies access.
- Session confirmation fails and retry cannot recover.

