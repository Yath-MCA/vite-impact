# Playwright Test Suite - Complete Setup Guide

## What Was Created

### 1. Configuration Files
- **`playwright.config.ts`** - Full Playwright configuration with TypeScript, parallel execution, retries, and all browsers
- **`package.json`** - Updated with test scripts and dependencies

### 2. Test Structure (15 files)
```
tests/
├── accessibility/
│   └── accessibility.spec.ts      (12 test cases)
├── error/
│   └── error-tracker.spec.ts      (14 test cases)
├── fixtures/
│   └── test-fixtures.ts
├── modules/
│   ├── module-open.spec.ts        (16 test cases)
│   └── module-switch-type.spec.ts (14 test cases)
├── overlay/
│   ├── dropover.spec.ts           (17 test cases)
│   ├── fullscreen.spec.ts         (16 test cases)
│   ├── minimize.spec.ts           (18 test cases)
│   ├── overlay.spec.ts            (19 test cases)
│   └── switch-type.spec.ts        (16 test cases)
├── pages/
│   └── overlay.page.ts            (Page Object Model)
├── setup/
│   ├── global-setup.ts
│   └── global-teardown.ts
├── utils/
│   └── test-helpers.ts
├── README.md
├── TEST_IDS.md
└── SUMMARY.md
```

**Total: 142 test cases across 8 test files**

### 3. Updated React Components
Added `data-testid` attributes to:
- `src/overlay/Dialog.jsx`
- `src/overlay/Header.jsx`
- `src/overlay/Dock.jsx`
- `src/error/ErrorBoundary.jsx`

## Installation Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Install Playwright Browsers
```bash
npx playwright install
```

Or with dependencies:
```bash
npx playwright install --with-deps
```

### Step 3: Verify Installation
```bash
npx playwright --version
```

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Test Suites
```bash
# Overlay tests only
npm run test:e2e:overlay

# Module registry tests
npm run test:e2e:module

# Error tracker tests
npm run test:e2e:error

# Accessibility tests
npm run test:e2e:accessibility
```

### Specific Browsers
```bash
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### Debug Mode
```bash
# UI mode with step-through
npm run test:e2e:ui

# Debug specific test
npx playwright test --debug tests/overlay/overlay.spec.ts

# Headed mode (visible browser)
npx playwright test --headed
```

### Generate Code
```bash
npm run test:codegen
```

## Test Reports

### View HTML Report
```bash
npm run test:report
```

### JSON Report
Located at: `test-results/results.json`

## Test Categories

### 1. Basic Overlay Tests (`overlay.spec.ts`)
- ✓ Open dialog, popout, sidebar
- ✓ Header title and action buttons
- ✓ Close via button, backdrop, ESC
- ✓ Multiple overlay stacking
- ✓ Z-index management
- ✓ Focus management

### 2. Type Switching Tests (`switch-type.spec.ts`)
- ✓ Dialog ↔ Popout ↔ Sidebar
- ✓ Content preservation (no re-mount)
- ✓ Form state preservation
- ✓ Sequential type cycling

### 3. Minimize/Restore Tests (`minimize.spec.ts`)
- ✓ Minimize to dock
- ✓ Restore from dock
- ✓ Multiple minimized overlays
- ✓ State preservation
- ✓ Body scroll management

### 4. Fullscreen Tests (`fullscreen.spec.ts`)
- ✓ Enter/exit fullscreen
- ✓ Size/position restoration
- ✓ All overlay types
- ✓ Content visibility

### 5. Drop-Over Tests (`dropover.spec.ts`)
- ✓ Backdrop visibility
- ✓ Body scroll locking
- ✓ Click-outside-to-close
- ✓ Mixed modes

### 6. Module Registry Tests (`modules/`)
- ✓ Register/open modules
- ✓ Default configuration
- ✓ Type switching with modules
- ✓ Multiple instances

### 7. Error Tracking Tests (`error/`)
- ✓ Error boundary catching
- ✓ Error logging
- ✓ Error panel
- ✓ Error recovery

### 8. Accessibility Tests (`accessibility/`)
- ✓ Keyboard navigation
- ✓ Focus trapping
- ✓ ARIA attributes
- ✓ Screen reader support

## Page Object Model

The `OverlayPage` class provides:

```typescript
// Navigation
await overlayPage.goto();

// Open overlays
await overlayPage.openOverlayByType('dialog');
await overlayPage.openModuleFromRegistry('example');

// Actions
await overlayPage.switchType('sidebar');
await overlayPage.minimize();
await overlayPage.restoreFromDock();
await overlayPage.toggleFullscreen();
await overlayPage.close();

// State checks
const isVisible = await overlayPage.isVisible();
const type = await overlayPage.getOverlayType();
const count = await overlayPage.getVisibleOverlaysCount();
const isFullscreen = await overlayPage.isFullscreen();
const isBackdropVisible = await overlayPage.isBackdropVisible();
```

## Key Features

✅ **TypeScript** - Full type safety
✅ **Page Object Model** - Maintainable, reusable tests
✅ **Test Isolation** - Each test is independent
✅ **No Flaky Waits** - Uses `expect.poll()` and proper locators
✅ **Accessibility** - Comprehensive a11y testing
✅ **Multi-Browser** - Chromium, Firefox, WebKit
✅ **Mobile Support** - Responsive testing
✅ **CI/CD Ready** - Configured for continuous integration
✅ **Parallel Execution** - Fast test runs
✅ **Rich Reporting** - HTML, JSON, screenshots, videos

## CI/CD Configuration

The tests are configured for CI with:
- Retries: 2 on CI
- Workers: 1 on CI (sequential)
- Artifacts: Screenshots and videos on failure
- Reporters: HTML, JSON, list

## Troubleshooting

### Tests failing?
```bash
# Ensure no dev server is running on port 5173
# Playwright starts its own server

# Update browsers
npx playwright install

# Run in headed mode to see what's happening
npx playwright test --headed

# Debug specific test
npx playwright test tests/overlay/overlay.spec.ts --debug
```

### Port already in use?
```bash
# Kill process on port 5173
npx kill-port 5173

# Or change port in playwright.config.ts
```

### Missing data-testid attributes?
Check `tests/TEST_IDS.md` for the complete list of required attributes.

## Next Steps

1. **Update Popout.jsx and Sidebar.jsx** with the same data-testid pattern as Dialog.jsx
2. **Update Footer.jsx** if you have action buttons
3. **Create ErrorPanel.jsx** if you want to test error viewing
4. **Run tests** to verify everything works
5. **Add more tests** as you add features

## Additional Resources

- `tests/README.md` - Full test documentation
- `tests/TEST_IDS.md` - Required data-testid reference
- `tests/SUMMARY.md` - Quick reference guide
- [Playwright Docs](https://playwright.dev)

---

**Total Files Created**: 15
**Total Test Cases**: 142
**Browsers Supported**: 3 (Chromium, Firefox, WebKit)
**Mobile Devices**: 2 (Pixel 5, iPhone 12)
