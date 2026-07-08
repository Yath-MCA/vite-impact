# LinkSession Request Module

Editor incoming-request dialog (`LinkSessionRequestDialog`).

**Full docs:** [README.md](./README.md) · [MODULES.md](../link_session/MODULES.md)

## Registration

`module_main.js` — `LinkSessionRequestModule`, depends on `LinkSessionService`.

Load before `CHECK_REQUEST.Init()` completes; `openRequestDialog` retries until registered.

## Methods

- `request_dialog()` — show accept/reject dialog
- `showLoop()` — 30s auto-accept countdown
- `handleConfirmDialog` — accept/reject via `LinkSessionService.getInstance().getJsonOrBuild`
- `handleDialogAutoAccept` — docstatus `3` after timeout

## Globals

- `window.LinkSessionRequestDialog` (alias: deprecated `LinkShareDialog`)
- `window.LinkSessionPorts.request`
- `window.confirmok`

## DOM

Template id: `LinkSessionRequestDialog` — not legacy `LinkShareDialog`.
