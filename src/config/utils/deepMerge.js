/**
 * Deep Merge Utility
 * 
 * Performs deep merging of objects with configurable options.
 * Supports arrays, nested objects, and special merge strategies.
 */

/**
 * Default merge options
 */
const DEFAULT_MERGE_OPTIONS = {
  // How to handle arrays: 'concat', 'replace', 'merge'
  arrayStrategy: 'replace',
  
  // How to handle null values: 'keep', 'skip', 'merge'
  nullStrategy: 'keep',
  
  // Maximum recursion depth
  maxDepth: 10,
  
  // Whether to clone objects (prevent reference sharing)
  clone: true,
  
  // Custom merge strategies for specific keys
  customStrategies: {}
};

/**
 * Check if value is a plain object
 * @param {*} value - Value to check
 * @returns {boolean} Whether value is a plain object
 */
const isPlainObject = (value) => {
  return value !== null && 
         typeof value === 'object' && 
         Object.prototype.toString.call(value) === '[object Object]';
};

/**
 * Check if value is an array
 * @param {*} value - Value to check
 * @returns {boolean} Whether value is an array
 */
const isArray = (value) => {
  return Array.isArray(value);
};

/**
 * Deep clone an object or array
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (isArray(obj)) {
    return obj.map(item => deepClone(item));
  }

  if (isPlainObject(obj)) {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }

  return obj;
};

/**
 * Deep merge multiple objects
 * @param {...Object} sources - Objects to merge
 * @returns {Object} Merged object
 */
export const deepMerge = (...sources) => {
  return deepMergeWithOptions(DEFAULT_MERGE_OPTIONS, ...sources);
};

/**
 * Deep merge with custom options
 * @param {Object} options - Merge options
 * @param {...Object} sources - Objects to merge
 * @returns {Object} Merged object
 */
export const deepMergeWithOptions = (options = {}, ...sources) => {
  const config = { ...DEFAULT_MERGE_OPTIONS, ...options };
  
  if (sources.length === 0) return {};
  if (sources.length === 1) return config.clone ? deepClone(sources[0]) : sources[0];

  const target = config.clone ? deepClone(sources[0]) : { ...sources[0] };

  for (let i = 1; i < sources.length; i++) {
    const source = sources[i];
    if (!source) continue;

    mergeObjects(target, source, config, 0);
  }

  return target;
};

/**
 * Recursively merge objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @param {Object} config - Merge configuration
 * @param {number} depth - Current recursion depth
 */
const mergeObjects = (target, source, config, depth) => {
  if (depth > config.maxDepth) {
    console.warn('Deep merge exceeded maximum depth');
    return;
  }

  Object.keys(source).forEach(key => {
    // Check for custom strategy
    if (config.customStrategies[key]) {
      target[key] = config.customStrategies[key](target[key], source[key]);
      return;
    }

    const sourceValue = source[key];
    const targetValue = target[key];

    // Handle null values
    if (sourceValue === null) {
      if (config.nullStrategy === 'keep') {
        target[key] = null;
      } else if (config.nullStrategy === 'merge' && targetValue !== undefined) {
        // Keep target value
      }
      return;
    }

    // Handle arrays
    if (isArray(sourceValue)) {
      target[key] = mergeArrays(targetValue, sourceValue, config, depth);
      return;
    }

    // Handle nested objects
    if (isPlainObject(sourceValue)) {
      if (!isPlainObject(targetValue)) {
        target[key] = config.clone ? deepClone(sourceValue) : { ...sourceValue };
      } else {
        target[key] = { ...targetValue };
        mergeObjects(target[key], sourceValue, config, depth + 1);
      }
      return;
    }

    // Handle primitive values (override)
    target[key] = sourceValue;
  });
};

/**
 * Merge arrays based on strategy
 * @param {*} targetValue - Target array or value
 * @param {Array} sourceValue - Source array
 * @param {Object} config - Merge configuration
 * @param {number} depth - Current depth
 * @returns {Array} Merged array
 */
const mergeArrays = (targetValue, sourceValue, config, depth) => {
  const strategy = config.arrayStrategy;

  switch (strategy) {
    case 'concat':
      const targetArray = isArray(targetValue) ? targetValue : [];
      return [...targetArray, ...sourceValue];

    case 'merge':
      if (!isArray(targetValue)) {
        return config.clone ? deepClone(sourceValue) : [...sourceValue];
      }
      // Merge arrays by index
      const merged = [...targetValue];
      sourceValue.forEach((item, index) => {
        if (index < merged.length && isPlainObject(merged[index]) && isPlainObject(item)) {
          merged[index] = { ...merged[index] };
          mergeObjects(merged[index], item, config, depth + 1);
        } else {
          merged[index] = config.clone ? deepClone(item) : item;
        }
      });
      return merged;

    case 'replace':
    default:
      return config.clone ? deepClone(sourceValue) : [...sourceValue];
  }
};

/**
 * Merge with field-level overrides priority
 * Priority: overrides > preset > global
 * @param {Object} globalDefaults - Global default configuration
 * @param {Object} presetConfig - Preset configuration
 * @param {Object} fieldOverrides - Field-level overrides
 * @returns {Object} Merged configuration
 */
export const mergeWithPriority = (globalDefaults, presetConfig, fieldOverrides) => {
  return deepMergeWithOptions(
    {
      arrayStrategy: 'replace',
      clone: true,
      customStrategies: {
        // Special handling for filterParams - merge instead of replace
        filterParams: (target, source) => {
          if (!target) return source;
          if (!source) return target;
          return { ...target, ...source };
        },
        // Special handling for cellStyle - merge instead of replace
        cellStyle: (target, source) => {
          if (!target) return source;
          if (!source) return target;
          return { ...target, ...source };
        }
      }
    },
    globalDefaults,
    presetConfig,
    fieldOverrides
  );
};

/**
 * Shallow merge (faster, one level only)
 * @param {...Object} sources - Objects to merge
 * @returns {Object} Shallow merged object
 */
export const shallowMerge = (...sources) => {
  return Object.assign({}, ...sources);
};

/**
 * Merge with condition
 * Only merge properties that pass the condition function
 * @param {Function} condition - (key, targetValue, sourceValue) => boolean
 * @param {...Object} sources - Objects to merge
 * @returns {Object} Conditionally merged object
 */
export const mergeWithCondition = (condition, ...sources) => {
  if (sources.length === 0) return {};
  
  const target = { ...sources[0] };
  
  for (let i = 1; i < sources.length; i++) {
    const source = sources[i];
    if (!source) continue;

    Object.keys(source).forEach(key => {
      if (condition(key, target[key], source[key])) {
        target[key] = source[key];
      }
    });
  }

  return target;
};

/**
 * Pick properties from object
 * @param {Object} obj - Source object
 * @param {Array} keys - Keys to pick
 * @returns {Object} Object with picked keys
 */
export const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (obj.hasOwnProperty(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Omit properties from object
 * @param {Object} obj - Source object
 * @param {Array} keys - Keys to omit
 * @returns {Object} Object without omitted keys
 */
export const omit = (obj, keys) => {
  const keysSet = new Set(keys);
  return Object.keys(obj).reduce((acc, key) => {
    if (!keysSet.has(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

export default deepMerge;
