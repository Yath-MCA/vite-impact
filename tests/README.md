# Playwright Test Suite for React Overlay System

Comprehensive end-to-end test suite for the React 18 + Vite overlay system featuring dialogs, popouts, sidebars, minimize/restore, fullscreen, and error tracking.

## Installation

```bash
# Install Playwright and dependencies
npm install
npx playwright install
```

## Test Structure

```
tests/
├── accessibility/          # A11y tests (keyboard nav, ARIA, focus)
│   └── accessibility.spec.ts
├── error/                  # Error tracking and boundary tests
│   └── error-tracker.spec.ts
├── fixtures/               # Test fixtures and custom test setup
│   └── test-fixtures.ts
├── modules/                # Module registry tests
│   ├── module-open.spec.ts
│   └── module-switch-type.spec.ts
├── overlay/                # Core overlay functionality tests
│   ├── dropover.spec.ts    # Drop-over/backdrop tests
│   ├── fullscreen.spec.ts  # Fullscreen toggle tests
│   ├── minimize.spec.ts    # Minimize/restore tests
│   ├── overlay.spec.ts     # Basic overlay tests
│   └── switch-type.spec.ts # Type switching tests
├── pages/                  # Page Object Models
│   └── overlay.page.ts
├── setup/                  # Global setup/teardown
│   ├── global-setup.ts
│   └── global-teardown.ts
└── utils/                  # Test utilities
    └── test-helpers.ts
```

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test tests/overlay/overlay.spec.ts

# Run with UI mode for debugging
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Run tests for specific browser
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run specific test suites
npm run test:e2e:overlay      # Overlay tests only
npm run test:e2e:module       # Module registry tests
npm run test:e2e:error        # Error tracker tests
npm run test:e2e:accessibility # Accessibility tests

# View test report
npm run test:report
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

- **Browsers**: Chromium, Firefox, WebKit
- **Devices**: Desktop + Mobile (Pixel 5, iPhone 12)
- **Parallel**: Enabled (disabled on CI)
- **Retries**: 2 retries on CI
- **Tracing**: On first retry
- **Screenshots**: On failure
- **Videos**: Retain on failure

## Page Object Model

The `OverlayPage` class provides methods for all overlay interactions:

```typescript
// Basic operations
await overlayPage.openOverlayByType('dialog');
await overlayPage.close();
await overlayPage.minimize();
await overlayPage.restoreFromDock();

// Type switching
await overlayPage.switchType('sidebar');

// State checks
const isVisible = await overlayPage.isVisible();
const type = await overlayPage.getOverlayType();
const count = await overlayPage.getVisibleOverlaysCount();

// Fullscreen
await overlayPage.toggleFullscreen();
```

## Test Isolation

All tests use:
- Fresh page instance per test
- `beforeEach` hooks to reset state
- No shared state between tests
- Proper cleanup in `afterEach`

## Key Features Tested

### 1. Basic Overlay Functionality
- Opening/closing overlays
- Header actions (minimize, fullscreen, close)
- Multiple overlay stacking
- Z-index management
- Focus management

### 2. Drop-Over Mode
- Backdrop visibility
- Body scroll locking
- Click-outside-to-close
- Background interaction blocking

### 3. Type Switching
- Runtime switching (dialog ↔ popout ↔ sidebar)
- Content preservation (no re-mount)
- State persistence
- Position/size updates

### 4. Minimize/Restore
- Minimize to dock
- Restore from dock
- Multiple minimized overlays
- State preservation

### 5. Fullscreen
- Toggle fullscreen mode
- Size/position restoration
- Content visibility
- Multi-type support

### 6. Module Registry
- Module registration
- Opening by name
- Default configuration
- Type switching with modules

### 7. Error Tracking
- Error boundary catching
- Error logging
- Error panel display
- Stack trace capture

### 8. Accessibility
- Keyboard navigation
- Focus trapping
- ARIA attributes
- Screen reader support

## Writing New Tests

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ overlayPage }) => {
    await overlayPage.goto();
  });

  test('should do something', async ({ overlayPage, page }) => {
    // Arrange
    await overlayPage.openOverlayByType('dialog');
    
    // Act
    await overlayPage.switchType('sidebar');
    
    // Assert
    await expect(overlayPage.overlaySidebar).toBeVisible();
  });
});
```

## Utilities

### Test Helpers

Located in `tests/utils/test-helpers.ts`:

- `waitForOverlayReady()` - Wait for overlay to render
- `getTopOverlay()` - Get highest z-index overlay
- `dragElement()` - Simulate drag operations
- `hasFocusTrap()` - Verify focus trapping
- `runBasicA11yCheck()` - Basic accessibility checks

### Test IDs

Use the `TestIds` constant for selectors:

```typescript
import { TestIds } from '../utils/test-helpers';

const container = page.locator(`[data-testid="${TestIds.overlay.container}"]`);
```

## CI/CD Integration

Tests run automatically on CI with:
- Parallel execution disabled
- 2 retries on failure
- HTML and JSON reports
- Artifact upload on failure

## Best Practices

1. **No arbitrary waits** - Use `expect.poll()` or `toBeVisible()`
2. **Test isolation** - Clean state in `beforeEach`
3. **Page Object Model** - Abstract interactions in page classes
4. **Data attributes** - Use `data-testid` for selectors
5. **Retry flaky operations** - Use `retry()` helper
6. **Accessibility** - Include a11y checks in relevant tests

## Troubleshooting

### Tests failing locally?
```bash
# Ensure dev server is not running on port 5173
# Playwright starts its own server

# Update Playwright browsers
npx playwright install --with-deps

# Run with visible browser
npx playwright test --headed

# Debug specific test
npx playwright test --debug tests/overlay/overlay.spec.ts
```

### Flaky tests?
- Check for race conditions in app code
- Add explicit waits for animations
- Use `expect.poll()` for async operations
- Verify test isolation

## Contributing

When adding new features:
1. Add corresponding test file in appropriate directory
2. Update Page Object Model if needed
3. Add test IDs to React components
4. Run full test suite before committing
5. Update this README with new features
