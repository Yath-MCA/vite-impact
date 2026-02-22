# Overlay & Module System

A production-ready, scalable overlay system for React 18 with dynamic type switching, minimize dock, and comprehensive error tracking.

## Features

- **Three Overlay Types**: Dialog (center modal), Popout (draggable window), Sidebar (right drawer)
- **Dynamic Type Switching**: Switch between types at runtime without unmounting content
- **Minimize System**: Minimize overlays to a dock that preserves state
- **Fullscreen Support**: Toggle fullscreen on any overlay type
- **Error Tracking**: Global error boundary and error logging system
- **Module Registry**: Register reusable modules that work across all overlay types
- **No External Dependencies**: Built with only React and TailwindCSS

## Installation

All components are included. Just ensure you have the required dependencies:

```bash
npm install lucide-react
```

## Quick Start

### 1. Wrap Your App with Providers

```jsx
import { 
  OverlayProvider, 
  ModuleRegistryProvider, 
  ErrorTrackerProvider 
} from './overlay-system';

function App() {
  return (
    <ErrorTrackerProvider>
      <ModuleRegistryProvider>
        <OverlayProvider>
          <YourApp />
          <OverlayManager />
        </OverlayProvider>
      </ModuleRegistryProvider>
    </ErrorTrackerProvider>
  );
}
```

### 2. Register Modules

```jsx
import { useModuleRegistry, FOOTER_TYPES, OVERLAY_TYPES } from './overlay-system';

function App() {
  const { registerModule } = useModuleRegistry();

  useEffect(() => {
    registerModule({
      name: 'settings',
      component: SettingsComponent,
      defaultType: OVERLAY_TYPES.DIALOG,
      dropOver: true,
      footerType: FOOTER_TYPES.ACTIONS,
      width: 500,
      height: 400
    });
  }, []);
}
```

### 3. Open Overlays

```jsx
import { useOverlay, useModuleRegistry } from './overlay-system';

function MyComponent() {
  const { openOverlay, openModule } = useOverlay();

  // Direct overlay opening
  const handleOpen = () => {
    openOverlay({
      type: 'dialog',
      title: 'My Dialog',
      component: MyComponent,
      dropOver: true,
      footerType: 'actions',
      width: 600,
      height: 400
    });
  };

  // Via module registry
  const handleOpenModule = () => {
    openModule('settings', { userId: 123 });
  };
}
```

## API Reference

### OverlayProvider

Context methods:
- `openOverlay(config)` - Open a new overlay
- `openModule(name, props)` - Open a registered module
- `closeOverlay(id)` - Close overlay by ID
- `minimizeOverlay(id)` - Minimize to dock
- `restoreOverlay(id)` - Restore from dock
- `toggleFullscreen(id)` - Toggle fullscreen
- `switchOverlayType(id, newType)` - Switch between dialog/popout/sidebar

### Overlay Config

```typescript
{
  id?: string;           // Auto-generated if not provided
  type: 'dialog' | 'popout' | 'sidebar';
  title: string;
  component: Component;
  props?: object;        // Props passed to component
  dropOver?: boolean;    // Show backdrop, default: true
  footerType?: 'actions' | 'none';
  width?: number;
  height?: number;
  position?: { x, y };   // For popout only
  onClose?: () => void;
  onAction?: (action, props) => void;
  actionConfig?: {
    primary?: { label, action };
    secondary?: { label, action };
    danger?: { label, action };
  };
}
```

### Module Registration

```typescript
{
  name: string;                    // Unique identifier
  component: Component;            // React component
  defaultType: OverlayType;        // Default overlay type
  dropOver?: boolean;              // Default backdrop setting
  footerType?: FooterType;         // Default footer type
  width?: number;                  // Default width
  height?: number;                 // Default height
  defaultProps?: object;           // Default props
}
```

### Error Tracking

```jsx
import { useErrorTracker } from './overlay-system';

function MyComponent() {
  const { logError, getErrors, clearErrors } = useErrorTracker();

  const handleError = (err) => {
    logError(err, { context: 'myComponent' });
  };
}
```

Wrap components with ErrorBoundary:

```jsx
<ErrorBoundary name="MyComponent">
  <MyComponent />
</ErrorBoundary>
```

## Features

### Dynamic Type Switching

Overlays can switch types without losing state:

```jsx
const { switchOverlayType } = useOverlay();

// Switch from dialog to sidebar
switchOverlayType(overlayId, 'sidebar');
```

### Minimize to Dock

Minimized overlays move to a bottom-right dock:

```jsx
const { minimizeOverlay, restoreOverlay } = useOverlay();

minimizeOverlay(id);
restoreOverlay(id);
```

### Fullscreen Mode

Any overlay can go fullscreen:

```jsx
const { toggleFullscreen } = useOverlay();

toggleFullscreen(id);
```

### Draggable Popouts

Popouts are draggable by the header and resizable from the bottom-right corner.

### Error Tracking

Global error tracking with ErrorPanel component:

```jsx
import { ErrorPanel } from './overlay-system';

// Open error panel as overlay
openOverlay({
  type: 'sidebar',
  title: 'Error Log',
  component: ErrorPanel,
  width: 400
});
```

## Keyboard Shortcuts

- **ESC**: Close top-most overlay with `dropOver: true`

## Styling

The system uses TailwindCSS classes. Override styles by targeting:

- `.overlay-dialog` - Dialog container
- `.overlay-popout` - Popout container  
- `.overlay-sidebar` - Sidebar container
- `.overlay-header` - Header component
- `.overlay-footer` - Footer component
- `.overlay-dock` - Minimize dock

## Example

See `ExampleUsage.jsx` for a complete working example.

## Architecture

```
┌─────────────────────────────────────┐
│         OverlayProvider             │
│  - Manages overlay state            │
│  - Z-index stacking                 │
│  - Type switching                   │
└─────────────┬───────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────┐      ┌──────▼──────┐
│ Dialog │      │ ModuleRegistry │
│ Popout │      │ - Register     │
│Sidebar │      │ - Open modules │
└────────┘      └──────────────┘

┌─────────────────────────────────────┐
│       ErrorTrackerProvider          │
│  - Global error logging             │
│  - Error boundaries                 │
└─────────────────────────────────────┘
```

## License

MIT
