# Landing Page Current Flow And React Migration Verification

This document set captures the current validate URL landing page behavior and the guards that must be preserved when migrating the flow into a React application.

The current implementation is spread across:

- `snippet/validateurl.html`
- `src/js/dialogModules/LandingPage.js`
- `src/js/session_landing.js`
- `src/modules/shared/browser-compatible/index.js`
- `src/modules/standalone/authenticator/index.js`
- `src/modules/shared/link_session/LinkSessionCore.js`
- `src/modules/shared/link_session/bootstrap.js`

## Reading Order

1. [01 - Current Entry And URL Validation](01-current-entry-and-url-validation.md)
2. [02 - Pre Validation Guards](02-pre-validation-guards.md)
3. [03 - Authentication, reCAPTCHA, Email, And OTP](03-auth-recaptcha-email-otp.md)
4. [04 - Link Session And Access Validation](04-link-session-access-validation.md)
5. [05 - Landing To Editor Transition](05-landing-to-editor-transition.md)
6. [06 - React Migration Verification Matrix](06-react-migration-verification-matrix.md)

## Migration Goal

The React landing page should keep the same decision sequence:

1. Load client/theme landing shell.
2. Check browser compatibility.
3. Check maintenance state.
4. Parse and validate the `key` URL parameter.
5. Call URL validity API.
6. Hydrate client, document, user, and access state from the response.
7. Apply document/link status guards.
8. Apply email, multi-user, token OTP, and reCAPTCHA validation where required.
9. Run link-session access checks.
10. Commit session storage only after access is granted.
11. Verify active session on the server before redirecting to the editor.

## High Risk Areas

- Do not show the editor continue action until URL validation and required auth are complete.
- Do not treat DB or transport errors from link-sharing checks as access grants.
- Do not write editor session storage before link-session access is granted.
- Do not skip the server active-session confirmation except for explicitly supported legacy bypass cases.
- Preserve maintenance, browser, stale local data cleanup, same-browser duplicate tab checks, and idle/hidden-page reload behavior.

