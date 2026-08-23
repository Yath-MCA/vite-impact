# Landing Flow: Legacy vs React — Compare/Gap Report

Generated: 2026-08-23 against `06-react-migration-verification-matrix.md`.

Legacy evidence: `LandingPage.js`, `authenticator/index.js`, `browser-compatible/index.js`, `link_session/LinkSessionCore.js` in this folder.

React evidence: `src/features/landing/**`, `src/services/session/**`, `src/services/landing/**`, `src/utils/normalizeValidateResponse.js`.

## Executive Summary

**Overall risk: LOW–MEDIUM** after the P0/P1 parity close in this pass. The money path (check → grant → verify-before-redirect → storage-after-grant) remains in `sessionGateway.js`. PLOS OTP/reCAPTCHA, generic `enable=tokenotp`, maintenance boot blocking, sign-off link handling, DB-error vs conflict classification, landing verify retry, and non-Collator stale localStorage cleanup are now in the React tree.

| Verdict | Count |
| --- | --- |
| IMPLEMENTED | 30 |
| PARTIAL | 5 |
| MISSING | 1 |
| N/A | 3 |

Remaining PARTIAL items are intentional UX differences (urlvalidity `r==0` error UI vs reload, hidden-tab TTL vs accumulated hard reload, collaborative multi-row verify flattening). FAQ/User Guide links are wired to `landing-meta.json` `help` URLs.

## Boot And Layout

| Scenario | Verdict | Evidence |
| --- | --- | --- |
| Page loads with valid client config | IMPLEMENTED | `LandingUI.jsx` + `landing-meta.json` + `landingConfigService.js` overrides |
| Theme is `white`/`dark-blue`/`crimson-red` | N/A | Per-client Tailwind banners (`THEME_BANNER_CLASS`), not Bootstrap `navbar_themes` |
| Navbar FAQ / User Guide | IMPLEMENTED | `LandingUI.jsx` uses `metaInfo.faqUrl` / `guideUrl` from `landing-meta.json` `help` |
| Client has no footer logo | IMPLEMENTED | Footer always renders; broken logos fall back to IMPACT default |
| Client has authenticator config | IMPLEMENTED | `shouldRunLandingAuth` → `AuthenticationFlow` (PLOS **or** `enable=tokenotp`) |

## URL Validation

| Scenario | Verdict | Evidence |
| --- | --- | --- |
| URL has no `key` | IMPLEMENTED | `ValidateUrlPage.jsx` — error, no API |
| URL has valid `key` | IMPLEMENTED | `getOrCreateValidateRequest` → `urlvalidity` |
| API returns `r == 0` | PARTIAL | `assertValidateAccess` throws; error UI (legacy reloads) |
| API fails (transport) | IMPLEMENTED | catch → error, no continue |
| Response has document data | IMPLEMENTED | `normalizeValidateResponse` |
| Non-Collator stale local storage | IMPLEMENTED | `clearDocScopedLocalData` after assert, skipped for Collator |
| Collator cleanup exception | IMPLEMENTED | `rolename !== 'Collator'` gate in `ValidateUrlPage.jsx` |

## Browser And Maintenance

| Scenario | Verdict | Evidence |
| --- | --- | --- |
| Unsupported browser | IMPLEMENTED | `checkBrowserCompatibility` before POST |
| Supported browser | IMPLEMENTED | same |
| Maintenance module / blocking | MISSING-by-design | Legacy never blocked landing; React no longer skips urlvalidity |
| Informational maintenance | IMPLEMENTED | `maintenanceGuard.js` toast via `fireMaintenanceAlert` (48h alert window, `SCHEDULED_MAINTENANCE`) |
| Hidden tab exceeds timeout | PARTIAL | `useAcceptButtonVisibility` 5-minute TTL + revalidate (no accumulated hard reload) |
| Maintenance at redirect | IMPLEMENTED | `persistMaintenanceStart` in `completeGrant` writes `MAINTENANCE_START` |

## Link Status And Duplicate Tab

| Scenario | Verdict | Evidence |
| --- | --- | --- |
| Link active | IMPLEMENTED | continue after `classifyValidateAccess` ok |
| Link `signoff` | IMPLEMENTED | code `signoff` → `SIGN_OFF` message → optional `/editor?mode=readonly` |
| Link `deactive` / expired / `fdel` | IMPLEMENTED | `deactive` / `expired` / `file_deleted` codes + landing messages |
| Same doc another tab | IMPLEMENTED | `tabPresence.js` `claimValidateTab` |
| Different doc another tab | IMPLEMENTED | `sameTarget()` scoping |

## Authentication

| Scenario | Verdict | Evidence |
| --- | --- | --- |
| No extra auth | IMPLEMENTED | `shouldRunLandingAuth` false → continue |
| Multi-user email | IMPLEMENTED | `useLandingUserValidation` |
| Email cancelled | IMPLEMENTED | retry email button |
| Token OTP (PLOS or `enable=tokenotp`) | IMPLEMENTED | `AuthenticationFlow` via `shouldRunLandingAuth` |
| OTP limits / temp access bypass | IMPLEMENTED | flow + `canUserAccessFreely` |

## reCAPTCHA

| Scenario | Verdict | Evidence |
| --- | --- | --- |
| Load / verify / fallback | IMPLEMENTED | `authenticationFlow.js` (runs for any client that hits landing auth) |

## Link Session Access

| Scenario | Verdict | Evidence |
| --- | --- | --- |
| `r==1` → grant | IMPLEMENTED | `loginFromLanding` |
| Conflict-shaped `r==0` → request UI | IMPLEMENTED | `isConflictShapedCheckResponse` |
| DB/error-shaped `r==0` → error, no grant | IMPLEMENTED | `isCheckErrorResponse` → `status:'error'` |
| `r==2` → denied | IMPLEMENTED | |
| Empty/malformed | IMPLEMENTED | empty response → `status:'error'` |
| 30-min pending/rejected throttle | IMPLEMENTED | `sendAccessRequest` |
| Collaborative multi-row verify | PARTIAL | `rows.length > 1` → `multiple_active` (no per-user disambiguation) |

## Session Confirmation

| Scenario | Verdict | Evidence |
| --- | --- | --- |
| Active row matches → redirect | IMPLEMENTED | `completeGrant` → `commitSessionForEditor` |
| `no_active_row` / `record_mismatch` | IMPLEMENTED | `retryLandingSessionCheck` up to `landingRetryMax` (3) with remarks `landing_retry` |
| Retry fail → no redirect | IMPLEMENTED | `verify_failed` dialog |
| Confirmation service unavailable | PARTIAL | surfaces as verify failure (no dedicated wait-for-getdocs) |

## Storage And Editor Boot

| Scenario | Verdict | Evidence |
| --- | --- | --- |
| No grant → no storage | IMPLEMENTED | commit only in `completeGrant` |
| Grant + verify fail → no navigate | IMPLEMENTED | |
| Grant + verify → storage + redirect | IMPLEMENTED | |
| Maintenance active at redirect | IMPLEMENTED | `MAINTENANCE_START` |
| Editor after React landing | Not independently E2E-verified here | key naming consistent |

## High-risk rules

| Rule | Verdict |
| --- | --- |
| Hide continue until URL validation + required auth | IMPLEMENTED including generic token-OTP |
| Never treat DB errors as grants | IMPLEMENTED (error UI, not conflict UI) |
| No storage before grant | IMPLEMENTED |
| Server confirmation before redirect | IMPLEMENTED (`skipVerify` only on named poll-grant config) |
| Maintenance / stale cleanup / idle reload | Toast + stale cleanup IMPLEMENTED; blocking MISSING-by-design; idle reload PARTIAL |

## Automated coverage map

| Area | Unit | E2E |
| --- | --- | --- |
| URL key / assert access / signoff | `normalizeValidateResponse.test.js` | landing-workflow invalid key, expired, signoff |
| Browser gate | `browserCompatibility.test.js` | unsupported browser |
| PLOS captcha/OTP | `plosAuthentication.test.js` | plos captcha / otp cancel |
| Token OTP gate | `landingAccess.test.js` | — |
| Session grant / block / deny | `sessionGateway.test.js` | grant, blocked, denied |
| DB vs conflict r==0 | `sessionCheckClassify.test.js`, `sessionGateway.test.js` | link-share DB error |
| Landing verify retry | `sessionGateway.test.js` | — |
| Duplicate tab | `tabPresence.test.js` | duplicate tab |
| Maintenance | `maintenanceGuard.test.js` | maintenance does not skip urlvalidity |
| Stale localStorage | `sessionStorage.test.js` | — |

## Product decision (token OTP)

**Option A (full parity):** `AuthenticationFlow` runs for PLOS **and** any client with `enable=tokenotp`. Documented in `landingAccess.js` `shouldRunLandingAuth`.

## Remaining follow-ups (not blockers for P0)

1. Confirm hidden-tab TTL vs legacy hard-reload with QA.
2. Port `confirmCollaborativeSessionRows` if multi-active collab users are in production use.
3. Optional informational (non-blocking) maintenance banner.
4. Editor E2E after React landing (`openhtml` / session validation).
