# Test IDs Reference

This document lists all `data-testid` attributes that must be added to React components for the test suite to work properly.

## Required Data Attributes

### Overlay Components

#### Dialog.jsx
```jsx
<div
  data-testid="overlay-dialog"
  data-overlay-id={overlay.id}
  data-overlay-type={overlay.type}
  data-fullscreen={overlay.isFullscreen}
  data-module-name={overlay.moduleName}
  role="dialog"
  aria-modal={overlay.dropOver ? 'true' : 'false'}
  aria-labelledby={`overlay-title-${overlay.id}`}
>
```

#### Popout.jsx
```jsx
<div
  data-testid="overlay-popout"
  data-overlay-id={overlay.id}
  data-overlay-type={overlay.type}
  data-fullscreen={overlay.isFullscreen}
  data-module-name={overlay.moduleName}
  role="dialog"
  aria-modal="false"
  aria-labelledby={`overlay-title-${overlay.id}`}
>
```

#### Sidebar.jsx
```jsx
<div
  data-testid="overlay-sidebar"
  data-overlay-id={overlay.id}
  data-overlay-type={overlay.type}
  data-fullscreen={overlay.isFullscreen}
  data-module-name={overlay.moduleName}
  role="dialog"
  aria-modal={overlay.dropOver ? 'true' : 'false'}
  aria-labelledby={`overlay-title-${overlay.id}`}
>
```

### Backdrop

```jsx
<div
  data-testid="overlay-backdrop"
  className="..."
  onClick={handleBackdropClick}
/>
```

### Header.jsx

```jsx
<div data-testid="overlay-header" className="...">
  <span 
    data-testid="overlay-title"
    id={`overlay-title-${overlayId}`}
  >
    {title}
  </span>
  
  <button
    data-testid="overlay-type-switcher"
    aria-expanded={showTypeMenu}
    aria-haspopup="true"
    title="Switch Type"
  >
    <Type className="w-4 h-4" aria-hidden="true" />
  </button>
  
  <div data-testid="overlay-type-menu">
    <button data-testid="overlay-type-option-dialog">Dialog</button>
    <button data-testid="overlay-type-option-popout">Popout</button>
    <button data-testid="overlay-type-option-sidebar">Sidebar</button>
  </div>
  
  <button
    data-testid="overlay-minimize-btn"
    title="Minimize"
    aria-label="Minimize overlay"
  >
    <Minus className="w-4 h-4" aria-hidden="true" />
  </button>
  
  <button
    data-testid="overlay-fullscreen-btn"
    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
  >
    {isFullscreen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
  </button>
  
  <button
    data-testid="overlay-close-btn"
    title="Close"
    aria-label="Close overlay"
  >
    <X className="w-4 h-4" aria-hidden="true" />
  </button>
</div>
```

### Footer.jsx

```jsx
<div data-testid="overlay-footer" className="...">
  <button data-testid="overlay-action-btn">Action</button>
</div>
```

### Content Area

```jsx
<div data-testid="overlay-content" className="flex-1 overflow-auto p-6">
  <overlay.component {...overlay.props} />
</div>
```

### Dock.jsx

```jsx
<div data-testid="dock-container" className="...">
  <button data-testid="dock-item" key={overlay.id}>
    <span>{overlay.title}</span>
    <Maximize2 aria-hidden="true" />
  </button>
</div>
```

### Generic Container (all overlay types)

```jsx
<div
  data-testid="overlay-container"
  data-overlay-id={overlay.id}
  data-overlay-type={overlay.type}
  data-fullscreen={overlay.isFullscreen}
  data-module-name={overlay.moduleName}
  style={{ zIndex: overlay.zIndex }}
>
```

## Error Components

### ErrorBoundary.jsx

```jsx
<div data-testid="error-boundary" className="p-4 bg-red-50...">
  <h3 className="text-red-800...">Something went wrong</h3>
  <p data-testid="error-message" className="text-red-600...">
    {error.message}
  </p>
</div>
```

### ErrorPanel.jsx (if exists)

```jsx
<div data-testid="error-panel" className="...">
  <div data-testid="error-list">
    {errors.map(error => (
      <div key={error.id} data-testid="error-item">
        {error.message}
      </div>
    ))}
  </div>
</div>
```

## Implementation Example

### Updating Dialog.jsx

```jsx
// Before
<div
  className={`fixed inset-0 flex items-center justify-center...`}
  style={{ zIndex: overlay.zIndex }}
  onClick={handleBackdropClick}
>

// After
<div
  data-testid="overlay-backdrop"
  className={`fixed inset-0 flex items-center justify-center...`}
  style={{ zIndex: overlay.zIndex }}
  onClick={handleBackdropClick}
>
  <div
    data-testid="overlay-container"
    data-testid="overlay-dialog"
    data-overlay-id={overlay.id}
    data-overlay-type="dialog"
    data-fullscreen={overlay.isFullscreen}
    data-module-name={overlay.moduleName}
    role="dialog"
    aria-modal={overlay.dropOver ? 'true' : 'false'}
    aria-labelledby={`overlay-title-${overlay.id}`}
    className={`bg-white...`}
    onClick={onFocus}
  >
    {/* Content */}
  </div>
</div>
```

### Updating Header.jsx

```jsx
// Title
<span 
  data-testid="overlay-title"
  id={`overlay-title-${overlayId}`}
  className="font-semibold..."
>
  {title}
</span>

// Type switcher
<div className="relative" ref={menuRef}>
  <button
    data-testid="overlay-type-switcher"
    onClick={() => setShowTypeMenu(!showTypeMenu)}
    aria-expanded={showTypeMenu}
    aria-haspopup="true"
    title="Switch Type"
  >
    <Type className="w-4 h-4" aria-hidden="true" />
  </button>

  {showTypeMenu && (
    <div data-testid="overlay-type-menu" className="absolute...">
      {typeOptions.map(({ type: optionType, icon: Icon, label }) => (
        <button
          key={optionType}
          data-testid={`overlay-type-option-${optionType}`}
          onClick={() => handleTypeSwitch(optionType)}
        >
          <Icon className="w-4 h-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )}
</div>

// Action buttons
<button
  data-testid="overlay-minimize-btn"
  onClick={onMinimize}
  title="Minimize"
  aria-label="Minimize overlay"
>
  <Minus className="w-4 h-4" aria-hidden="true" />
</button>

<button
  data-testid="overlay-fullscreen-btn"
  onClick={onToggleFullscreen}
  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
>
  {isFullscreen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
</button>

<button
  data-testid="overlay-close-btn"
  onClick={onClose}
  title="Close"
  aria-label="Close overlay"
>
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

## Quick Checklist

Add these attributes to your components:

- [ ] `data-testid="overlay-container"` - All overlay wrappers
- [ ] `data-testid="overlay-dialog"` - Dialog component
- [ ] `data-testid="overlay-popout"` - Popout component
- [ ] `data-testid="overlay-sidebar"` - Sidebar component
- [ ] `data-testid="overlay-backdrop"` - Backdrop layer
- [ ] `data-testid="overlay-header"` - Header section
- [ ] `data-testid="overlay-title"` - Title element
- [ ] `data-testid="overlay-content"` - Content area
- [ ] `data-testid="overlay-footer"` - Footer section
- [ ] `data-testid="overlay-minimize-btn"` - Minimize button
- [ ] `data-testid="overlay-fullscreen-btn"` - Fullscreen button
- [ ] `data-testid="overlay-close-btn"` - Close button
- [ ] `data-testid="overlay-type-switcher"` - Type switcher trigger
- [ ] `data-testid="overlay-type-menu"` - Type switcher menu
- [ ] `data-testid="overlay-type-option-{type}"` - Type options
- [ ] `data-testid="dock-container"` - Dock container
- [ ] `data-testid="dock-item"` - Dock items
- [ ] `data-testid="error-boundary"` - Error boundary
- [ ] `data-testid="error-message"` - Error message
- [ ] `data-overlay-id` - Unique overlay ID
- [ ] `data-overlay-type` - Current overlay type
- [ ] `data-fullscreen` - Fullscreen state
- [ ] `data-module-name` - Module name (if from registry)

## Running Tests After Updates

Once you've added all data-testid attributes:

```bash
# Run all overlay tests
npm run test:e2e:overlay

# Run specific test
npx playwright test tests/overlay/overlay.spec.ts --headed

# Debug mode
npx playwright test --debug
```
