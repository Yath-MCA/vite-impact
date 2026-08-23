# Landing Migration Verification

## Unit Tests

Add unit tests for the config resolver.

Required cases:

- Default client resolves common navbar logo.
- `white` theme uses dark icons.
- `dark-blue` theme uses white icons.
- `crimson-red` theme uses white icons.
- Client logo override does not inherit default logo width accidentally.
- Footer `logo_section` resolves correctly.
- Unknown navbar theme throws a useful error.
- Unknown section key throws a useful error.
- No unresolved placeholders remain in rendered output.

## React Component Tests

Add component tests for:

- `LandingHeader`.
- `NavDownloadSection`.
- `LandingFooter`.
- `LandingMainLayout`.

Header assertions:

```txt
id="navDownloadSection"
id="FAQ_UI"
id="User_Guide_UI"
FAQ icon path is theme-driven
User Guide icon path is theme-driven
download handlers receive Help_FAQ_pdf / Help_Guide_pdf
```

Footer assertions:

```txt
footer container class comes from config
footer logo section renders when configured
browser support renders from shared data
```

## E2E Tests

Run E2E smoke tests for representative clients:

```txt
default - white theme
oup     - dark-blue theme
lse     - crimson-red theme
intellect - compact nested navbar/footer object
tnfjournals - extra footer/browser support behavior
```

For each client:

- Page loads.
- Correct title.
- Correct favicon.
- Correct logo.
- Correct navbar theme.
- Mobile navbar collapse works.
- FAQ download action is reachable.
- User Guide download action is reachable.
- Welcome heading renders.
- Instructions render.
- Disclaimer renders.
- DOI/book panel renders.
- Footer renders.
- No unresolved placeholders are visible.

## Visual Comparison

During migration, compare old generated HTML and React output.

Recommended checks:

```txt
desktop viewport: 1366 x 768
tablet viewport: 768 x 1024
mobile viewport: 390 x 844
```

Compare:

- Header height.
- Logo size.
- Navbar link alignment.
- Content column split.
- Footer layout.
- Text wrapping.
- Mobile collapse behavior.

## Manual Smoke Checklist

For each migrated client:

```txt
[ ] Open landing URL.
[ ] Confirm brand logo and favicon.
[ ] Confirm navbar color/theme.
[ ] Click FAQ.
[ ] Click User Guide.
[ ] Confirm welcome message.
[ ] Confirm Instructions section.
[ ] Confirm Disclaimer section.
[ ] Confirm DOI/book metadata panel.
[ ] Confirm Agree & Continue / Validate buttons.
[ ] Confirm footer browser support.
[ ] Resize to mobile and test nav collapse.
[ ] Confirm no console errors from config resolution.
```

## Build Verification

For the current repo, run:

```bash
npx vitest run tests/unit/landing-page-config.test.js tests/unit/generate-landing-pages.test.js
```

For the future React app, run:

```bash
npm run test
npm run build
npx playwright test
```

## Acceptance Criteria

The migration is acceptable when:

- All existing client keys render.
- Header/footer details come from compact config.
- No client stores repeated raw navbar HTML.
- Themes are selected by name.
- Runtime landing behavior remains compatible.
- Tests cover config resolution and representative page rendering.

