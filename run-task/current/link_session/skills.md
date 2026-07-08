# LinkSession Module

Unified linksharing session layer. **Send Request = Level 1 priority.**

**Documentation:**
- [MODULES.md](./MODULES.md) — architecture, all modules, init, globals, troubleshooting
- [CORE.md](./CORE.md) — `LinkSessionCore` method reference
- [API.md](./API.md) — backend process catalog
- [link_session_send/README.md](../link_session_send/README.md) — send UI (P0)
- [link_session_request/README.md](../link_session_request/README.md) — request dialog

## Structure

| Module | Path | Role |
|--------|------|------|
| **LinkSessionCore** | `LinkSessionCore.js` | UI-free payloads, handlers, verify, scheduler |
| **bootstrap** | `bootstrap.js` | `commonfn.*` wiring |
| **ports** | `ports.js` | `LinkSessionPorts`, dialog open retry |
| **LinkSessionSendModule** | `../link_session_send/` | Landing send + poll UI (P0) |
| **LinkSessionRequestModule** | `../link_session_request/` | Editor accept/reject dialog |
| **LinkSessionEditor** | `LinkSessionEditor.js` | Editor gulp entry (core + `CHECK_REQUEST`) |
| **LinkSessionService** | `index.js` | Webpack editor entry (on hold) |
| **Landing wrapper** | `LinkSessionModule.js` | `extends Core`, landing `getInstance()` |

## Landing

```javascript
const mod = LinkSessionModule.getInstance();
mod.loginFromLanding(buildLandingSessionContext()); // ctx.ui → send module
```

Gulp landing: `session_landing.js` then `landing.js` — see `page_script_landing.html`

Gulp editor: `session_editor.js` between `e6_common` and `e6_main`

## Editor

```javascript
// Gulp (current): CHECK_REQUEST set by session_editor.js at load time
CHECK_REQUEST.Init();

// Webpack (on hold):
// await moduleRegistry.getModule('LinkSessionService');
// await moduleRegistry.getModule('LinkSessionRequestModule');
```

Production: [`_initalLoadingDialog.js`](../../js/_initalLoadingDialog.js) — skips webpack module load if `CHECK_REQUEST` exists → `Init()` → `new_session_check()`.

## Tests

`npm run test:unit` · `npm run test:module:link-session`
