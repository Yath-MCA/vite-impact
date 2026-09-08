# React + Vite ES5 Legacy Refactor

## Overview

Complete refactoring of ES5 IIFE-based initialization system into React + Vite application with full backward compatibility.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Legacy Environment                        │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ window globals  │  │ Existing scripts │                 │
│  │ (preserved)     │  │ (unchanged)      │                 │
│  └────────┬────────┘  └──────────────────┘                 │
└───────────┼─────────────────────────────────────────────────┘
            │
            │ calls/reads
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Global Bridge Layer                       │
│  • Maps legacy globals to services                           │
│  • Maintains API compatibility                               │
│  • Proxies function calls                                    │
└───────────┬─────────────────────────────────────────────────┘
            │
            │ uses
            ▼
┌─────────────────────────────────────────────────────────────┐
│                   React UI Layer                             │
│  ┌─────────────────────────────────────────┐                │
│  │ <ImpactRoot>                            │                │
│  │   └─ <AppInitializer>                   │                │
│  │        └─ <InitialLoadDialog>           │                │
│  │             └─ <ProgressCircle>         │                │
│  └─────────────────────────────────────────┘                │
│  • Renders loading UI                                        │
│  • Subscribes to events                                      │
│  • No business logic                                         │
└───────────┬─────────────────────────────────────────────────┘
            │
            │ subscribes to
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Event System                              │
│  • EventEmitter pub/sub                                      │
│  • Decoupled communication                                   │
│  • window.eventBus singleton                                 │
└───────────┬─────────────────────────────────────────────────┘
            │
            │ emits/consumes
            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer (ES5)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ InitService  │ │LoadingService│ │EditorInitSvc │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │URLService    │ │StorageService│ │SharedKeySvc  │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  • No React, pure ES5                                        │
│  • No JSX                                                    │
│  • Framework-agnostic                                        │
└─────────────────────────────────────────────────────────────┘
```

## Priority Hierarchy

```
Field Override > Preset Config > Global Defaults

Example Resolution:
Field Config:   { field: "status", width: 150 }
Preset:         { filter: "agSetColumnFilter", width: 100 }
Global Defaults:{ sortable: true, resizable: true }
Result:         { field: "status", width: 150, filter: "agSetColumnFilter", sortable: true, resizable: true }
```

## File Structure

```
legacy-refactor/
├── src/
│   ├── components/
│   │   └── loading/
│   │       ├── ProgressCircle.jsx      # Circular progress component
│   │       ├── ProgressCircle.css      # Styles
│   │       ├── InitialLoadDialog.jsx   # Loading dialog
│   │       ├── AppInitializer.jsx      # Main orchestrator
│   │       └── ImpactRoot.jsx          # Root component
│   ├── services/
│   │   ├── core/
│   │   │   ├── URLService.js           # URL parsing
│   │   │   ├── StorageService.js       # localStorage wrapper
│   │   │   ├── SharedKeyService.js     # Shared key management
│   │   │   ├── InitService.js          # Initialization logic
│   │   │   ├── LoadingService.js       # Config loading
│   │   │   └── EditorInitService.js    # Editor initialization
│   │   └── bridge/
│   │       └── GlobalBridge.js         # Legacy API bridge
│   ├── events/
│   │   └── EventEmitter.js             # Pub/sub system
│   ├── main.jsx                        # Entry point
│   └── index.js                        # Exports
├── index.html                          # HTML template
├── vite.config.js                      # Vite configuration
├── package.json                        # Dependencies
└── README.md                           # This file
```

## Quick Start

### Installation

```bash
cd legacy-refactor
npm install
```

### Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

Output files:
- `dist/impact-app.js` - Main bundle (IIFE)
- `dist/impact-app.css` - Styles
- `dist/index.html` - HTML template

### Integration with Legacy System

Add to your HTML:

```html
<!-- After legacy scripts, before closing body -->
<script src="path/to/impact-app.js"></script>
```

The app auto-initializes and creates `#impact-root` container.

## Configuration

### Environment Variables

```env
# Optional: Debug mode
VITE_DEBUG=true

# Optional: API endpoints
VITE_API_URL=https://api.example.com
```

### Vite Config Options

```javascript
// vite.config.js
export default defineConfig({
  build: {
    lib: {
      name: 'ImpactApp',        // Global variable name
      formats: ['iife'],         // Output format
      fileName: 'impact-app'     // Output filename (no hash)
    },
    target: 'es5',              // ES5 compatibility
    minify: 'terser'            // Minification
  }
});
```

## Legacy API Compatibility

All legacy globals are preserved:

```javascript
// These still work exactly as before:
window.INIT_CONFIG.run();
window.LOADING_CONFIG.Init(SHARED_KEY);
window.EDITOR_INITIALIZE.preInitialize();
window.InitialLoadDialog.updateProgress(5);

// Properties:
window.LOADING_CONFIG.canLoadEditor;   // true/false
window.LOADING_CONFIG.isFullyLoaded;   // true/false
window.DOC_ID;                         // Document ID
window.USER_INFO;                      // User info object
window.SHARED_KEY;                     // Shared key object
```

## Migration Strategy

### Phase 1: Side-by-Side (Current)
- Deploy new system alongside legacy
- Legacy globals remain functional
- New services power the UI

### Phase 2: Gradual Migration
- Move business logic to services
- Keep legacy API as thin wrapper
- Test thoroughly

### Phase 3: Legacy Cleanup
- Remove old IIFE scripts
- Keep only GlobalBridge for API
- Services become source of truth

## Event System

```javascript
// Subscribe to events
window.eventBus.on('loading:progress', (data) => {
  console.log('Progress:', data.value, data.message);
});

window.eventBus.on('editor:ready', (data) => {
  console.log('Editor ready!');
});

// Available events:
// init:complete, init:failed, init:waiting
// loading:progress, loading:complete, loading:error
// editor:ready, editor:timeout, editor:state:change
// dialog:progress, dialog:complete
```

## State Machine

EditorInitService states:

```
IDLE → WAITING_SHARED_KEY → WAITING_LOADING → READY
                    ↓
              TIMEOUT (reloads page)
                    ↓
               FAILED
```

## Browser Support

- Internet Explorer 11+
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (all versions)

## Performance Considerations

1. **Bundle Size**: ~200KB gzipped (includes React, polyfills)
2. **Load Time**: Services load in <100ms, configs in <2s
3. **Memory**: Minimal footprint, services are singletons
4. **Rendering**: React 18 concurrent features disabled for ES5

## Troubleshooting

### IE11 Issues

Ensure polyfills are loaded:
```html
<!-- Before impact-app.js -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=default,fetch,Promise"></script>
```

### Services Not Found

Check load order:
```html
<!-- 1. Legacy globals -->
<script src="legacy-globals.js"></script>

<!-- 2. Impact App -->
<script src="impact-app.js"></script>

<!-- 3. Legacy dependent scripts -->
<script src="legacy-dependent.js"></script>
```

### Build Errors

Clear and rebuild:
```bash
rm -rf node_modules dist
npm install
npm run build
```

## License

Internal use only - part of your application codebase.
