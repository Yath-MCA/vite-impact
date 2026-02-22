/**
 * Legacy Refactor Main Entry Point
 * Exports all components and services for the React + Vite ES5 refactor
 */

// Services (Core)
export { default as URLService } from './services/core/URLService';
export { default as StorageService } from './services/core/StorageService';
export { default as SharedKeyService } from './services/core/SharedKeyService';
export { default as InitService } from './services/core/InitService';
export { default as LoadingService } from './services/core/LoadingService';
export { default as EditorInitService } from './services/core/EditorInitService';

// Bridge
export { default as GlobalBridge } from './services/bridge/GlobalBridge';

// Events
export { EventEmitter, eventBus } from './events/EventEmitter';

// Components
export { default as ProgressCircle } from './components/loading/ProgressCircle';
export { default as InitialLoadDialog } from './components/loading/InitialLoadDialog';
export { default as AppInitializer } from './components/loading/AppInitializer';
export { default as ImpactRoot } from './components/loading/ImpactRoot';

// Version
export const VERSION = '2.0.0';
