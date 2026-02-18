/**
 * Configuration System Index
 * 
 * Centralized exports for the collection table configuration system.
 */

// Presets
export {
  presetRegistry,
  getPreset,
  getPresetWithInheritance,
  UNIQUE_FORMAT_CONFIG
} from './presets/presetRegistry';

// Resolvers
export {
  resolveCollectionConfig,
  resolveCollectionConfigMemoized,
  resolveMultipleCollections,
  getConfigDiff,
  exportConfigToJSON,
  DEFAULT_GLOBAL_CONFIG
} from './resolvers/configResolver';

// Utilities
export {
  deepMerge,
  deepMergeWithOptions,
  mergeWithPriority,
  deepClone,
  shallowMerge,
  mergeWithCondition,
  pick,
  omit
} from './utils/deepMerge';

export {
  memoize,
  createMemoizedResolver,
  weakMemoize
} from './utils/memoize';

export {
  validatePresetId,
  validateFieldConfig,
  validateCollectionConfig,
  validateGlobalDefaults,
  validateColumnDefinition,
  validateConfiguration,
  assertValid
} from './utils/typeValidation';

// Collection Configurations
export { ShareandinviteCollectionConfig } from './collections/Shareandinvite';

// Default export - main resolver function
export { resolveCollectionConfig as default } from './resolvers/configResolver';
