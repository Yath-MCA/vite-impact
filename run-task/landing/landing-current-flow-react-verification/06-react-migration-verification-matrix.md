# 06 - React Migration Verification Matrix

Use this checklist to verify that a React implementation matches the current landing behavior.

## Boot And Layout

| Scenario | Expected result |
| --- | --- |
| Page loads with valid client config | Header, navbar, landing body, and footer render with selected theme |
| Theme is `white` | Header/footer use white theme styling and readable text contrast |
| Theme is `dark-blue` | Header/footer use dark-blue theme styling and readable text contrast |
| Theme is `crimson-red` | Header/footer use crimson-red theme styling and readable text contrast |
| Navbar collapsed on mobile | Download/help links are available under `navDownloadSection` equivalent |
| Client has no footer logo | Footer still renders without broken image |
| Client has authenticator script/config | Authenticator flow can initialize |

## URL Validation

| Scenario | Expected result |
| --- | --- |
| URL has no `key` | Invalid link alert/state; no API call; no continue |
| URL has valid `key` | POST to URL validity endpoint with wrapped `jsondata` payload |
| URL validity API returns `r == 0` | Stop/reload or invalid state matching legacy behavior |
| URL validity API fails | Invalid link/try-again state; no continue |
| URL validity response has document data | Document/user/client state is hydrated |
| Non-Collator valid response | Document-scoped stale local storage is cleared |
| Collator valid response | Collator cleanup exception is preserved |

## Browser And Maintenance

| Scenario | Expected result |
| --- | --- |
| Unsupported browser | Browser alert/state; landing form blocked |
| Supported browser | URL validation may continue |
| Maintenance module available | `Init({ init: true, fire: true })` equivalent behavior runs |
| Active blocking maintenance | Redirect is blocked before storage commit |
| Informational maintenance | Message appears without losing validated state |
| Hidden tab exceeds timeout | Landing reloads and does not reuse stale session id |

## Link Status And Duplicate Tab

| Scenario | Expected result |
| --- | --- |
| Link status active and not expired | Auth/access validation may continue |
| Link status inactive | Inactive alert/state; no auth/access/redirect |
| Link expired/deleted | Expired alert/state; no auth/access/redirect |
| Same document open in another same-browser tab | Already-open alert/state; no redirect |
| Different document open in another tab | Current landing can continue |

## Authentication

| Scenario | Expected result |
| --- | --- |
| No extra auth required | Continue proceeds to link-session access |
| Multi-user email required | Email selection/validation runs before access check |
| Email validation cancelled | Email retry control/state shown; no redirect |
| Token OTP required | OTP precheck, generation, and verification run |
| OTP verified | Landing auth becomes complete; access check still required |
| OTP failed under max attempts | Remaining attempts shown |
| OTP max attempts reached | Attempt exceeded state; no redirect |
| OTP generation limit reached | Limit state; no redirect |
| Temporary/free access bypass applies | OTP bypassed, but access/session checks still run |

## reCAPTCHA

| Scenario | Expected result |
| --- | --- |
| reCAPTCHA loads and verifies | Auth flow continues |
| reCAPTCHA invalid token | Continue hidden/blocked; captcha alert shown |
| reCAPTCHA load timeout | Existing fallback behavior preserved |
| reCAPTCHA quota/billing error | Existing fallback behavior preserved |
| OTP flow with captcha success | OTP starts after captcha verification |
| IP/simple flow with captcha success | Continue button becomes available |

## Link Session Access

| Scenario | Expected result |
| --- | --- |
| `check` returns `r == 1` | Access grant path starts |
| `check` returns conflict-shaped `r == 0` | Request access UI/polling starts |
| `check` returns DB/error-shaped `r == 0` | Error/try-again; no grant |
| `check` returns `r == 2` | Access denied message; no redirect |
| Empty/malformed response | Request error; no redirect |
| Pending request older than 30 minutes | Existing refresh/reinsert behavior preserved |
| Fresh pending request | No silent grant |
| Rejected request older than 30 minutes | Can send again using current rules |

## Session Confirmation

| Scenario | Expected result |
| --- | --- |
| Active row matches doc/session | Redirect allowed |
| No active row after grant | Landing retry runs up to configured limit |
| Retry succeeds | Session storage updated if needed; redirect allowed |
| Retry fails | Try-again state; no redirect |
| Record mismatch | Retry only through landing retry path |
| Multiple active rows in single-user mode | No redirect |
| Collaborative rows valid for distinct users | Redirect allowed |
| Collaborative duplicate active row for same user | No redirect |
| Confirmation service unavailable | No redirect |

## Storage And Editor Boot

| Scenario | Expected result |
| --- | --- |
| Access not granted | Editor session storage not committed |
| Access granted but confirmation fails | Storage backup cleaned/restored; no navigation |
| Access granted and confirmed | `docid`, `sessionid`, redirect state committed before navigation |
| Maintenance active at redirect | `MAINTENANCE_START` stored |
| Editor loads after React landing | Editor session validation passes before `openhtml` |

## Suggested Automated Coverage

Add React unit tests for:

- URL key parsing.
- URL validity response normalization.
- Auth requirement derivation.
- Link status normalization.
- Editor URL building.
- Link-session response classification.
- Session confirmation decision mapping.

Add browser/E2E tests for:

- Valid landing to editor.
- Invalid key.
- Unsupported browser mock.
- Maintenance block.
- Multi-user email validation.
- OTP success and failure.
- Access conflict and polling.
- Confirmation retry failure.
- Duplicate tab detection.

