// Overlay System Exports

// Contexts
export { OverlayProvider, useOverlay, OVERLAY_TYPES } from '../overlay/OverlayProvider';
export { ModuleRegistryProvider, useModuleRegistry, FOOTER_TYPES } from '../modules/ModuleRegistry';
export { ErrorTrackerProvider, useErrorTracker } from '../error/ErrorTrackerProvider';

// Components
export { default as OverlayManager } from '../overlay/OverlayManager';
export { default as Dialog } from '../overlay/Dialog';
export { default as Popout } from '../overlay/Popout';
export { default as Sidebar } from '../overlay/Sidebar';
export { default as Header } from '../overlay/Header';
export { default as Footer } from '../overlay/Footer';
export { default as Dock } from '../overlay/Dock';
export { default as ErrorBoundary } from '../error/ErrorBoundary';
export { default as ErrorPanel } from '../error/ErrorPanel';

// Example
export { default as ExampleUsage } from '../ExampleUsage';
