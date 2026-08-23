# 03 - Authentication, reCAPTCHA, Email, And OTP

Authentication is deferred until after URL validation and basic document/link checks. The current code decides whether additional landing authentication is required using `needsLandingAuth`, `processUserValidation`, and `runDeferredLandingAuth` in `LandingPage.js`.

## Auth Decision Inputs

Current auth decisions depend on:

- URL validity response `r`.
- Client/authenticator script availability.
- User role and role name.
- Whether the user is a Collator.
- Whether multi-user validation is required.
- Whether token OTP flow is enabled.
- Whether the user has temporary/free access.
- Whether reCAPTCHA is enabled and successfully verified.
- Whether email selection/validation is required.

React migration requirement:

- Create one derived `landingAuthRequirement` object from the URL validation response.
- Avoid duplicating auth-condition logic across components.
- Keep all access controls hidden until the derived auth state reaches `ready`.

## Deferred Auth Flow

`redirect()` is the main user action, but it does not always redirect immediately.

Current behavior:

1. User clicks `AGREE & CONTINUE`.
2. `redirect()` checks `needsLandingAuth(resData, pendingAuthResponse)`.
3. If auth is required and not completed, it records timing, calls `runDeferredLandingAuth(resData)`, and waits.
4. If auth result is `ready`, `redirect()` runs again and continues to access validation.
5. If auth is cancelled or errors, the landing controls are restored or changed to email validation retry.

React migration requirement:

- Treat `AGREE & CONTINUE` as a transition into auth/access, not as an unconditional route change.
- Keep auth pending states explicit: `idle`, `email_required`, `otp_required`, `captcha_required`, `ready`, `failed`, `cancelled`.

## Multi-User Email Validation

For multi-user links, legacy behavior:

1. Hide the main validate/continue button.
2. Prompt or validate user email through `validateUserEmail(resData)`.
3. Store selected email in `USER_INFO.MAIL_ID`.
4. Apply selected email back to `resData`.
5. Close any existing session for that email.
6. Build the editor redirect URL.
7. If token OTP is not required, update document view history before access continues.
8. If email is cancelled, show `#eMailValidate` and hide the main continue button.

React migration requirement:

- Email is part of the access identity, not just a form field.
- The selected email must be included before link-sharing check payloads are built.
- Cancelled email validation must not proceed to editor session creation.

## Token OTP Flow

The authenticator module lives in `src/modules/standalone/authenticator/index.js`.

Important rules:

- `currentFlow = response.r == 2 ? 'otp' : 'ip'`.
- Maximum OTP verification attempts: `3`.
- Rate limit window: `1` hour.
- Maximum OTP generations per hour: `2`.
- OTP generation endpoint: `generatetokenotpandsendemail`.
- OTP verification endpoint: `verifyaccesscode`.
- Precheck reads `generatetoken` rows for the current document/user context.

Legacy OTP sequence:

1. Run precheck.
2. Enforce generation and attempt limits.
3. Generate/send access code.
4. Show OTP input.
5. Verify code with backend.
6. On success, set `window.landingAuthCompleted = true`.
7. Call `redirect()` again.

React migration requirement:

- Keep OTP limits server-synchronized. Local counters alone are not sufficient.
- Keep the success transition separate from editor access grant.
- OTP success means "landing auth complete"; it does not mean "link-session access granted".

## reCAPTCHA Flow

The authenticator module loads Google reCAPTCHA Enterprise.

Current behavior:

- Uses v3 by default.
- Loads `https://www.google.com/recaptcha/enterprise.js?render=<siteKey>`.
- Executes action `landing`.
- Sends token to `verifycaptcha`.
- If verified, continues into OTP flow or shows the validate button.
- If load or quota errors occur, fallback behavior can allow the flow to continue without reCAPTCHA.
- Invalid captcha hides the continue button and shows an alert.

React migration requirement:

- Make reCAPTCHA status explicit: `loading`, `verified`, `failed`, `fallback_allowed`, `fallback_denied`.
- Keep quota/billing/resource-exhausted fallback behavior compatible with the existing module.
- Do not show the continue button on invalid captcha unless fallback is explicitly allowed by current rules.

## Temporary Or Free Access

Current logic can allow some temporary/free access users to bypass token OTP through `canUserAccessFreely(...)`.

React migration requirement:

- Preserve the exact rule before simplifying.
- Log or expose the bypass reason in development diagnostics.
- Keep the distinction between auth bypass and link-session access validation. Even free access must still pass the required access/session checks.

