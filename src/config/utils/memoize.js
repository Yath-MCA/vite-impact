/**
 * Memoization Utility
 * 
 * Provides performance optimization through memoization.
 * Supports custom key generation and cache management.
 */

/**
 * Simple memoization function
 * @param {Function} fn - Function to memoize
 * @param {Function} keyGenerator - Function to generate cache key
 * @param {Object} options - Memoization options
 * @returns {Function} Memoized function
 */
export const memoize = (fn, keyGenerator = JSON.stringify, options = {}) => {
  const cache = new Map();
  const { maxSize = 1000, ttl = null } = options;

  const memoized = function(...args) {
    const key = keyGenerator(...args);
    
    // Check cache
    if (cache.has(key)) {
      const cached = cache.get(key);
      
      // Check TTL if set
      if (ttl && Date.now() - cached.timestamp > ttl) {
        cache.delete(key);
      } else {
        return cached.value;
      }
    }

    // Execute function
    const result = fn.apply(this, args);
    
    // Store in cache
    cache.set(key, {
      value: result,
      timestamp: Date.now()
    });

    // Enforce max size (LRU eviction)
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  };

  // Expose cache for debugging/clearing
  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  memoized.size = () => cache.size;
  memoized.delete = (key) => cache.delete(key);

  return memoized;
};

/**
 * Create a memoized resolver
 * Specifically for configuration resolution
 * @param {Function} resolver - Resolver function
 * @returns {Function} Memoized resolver
 */
export const createMemoizedResolver = (resolver) => {
  // Custom key generator for config resolution
  const keyGenerator = (collectionConfig, context = {}) => {
    return JSON.stringify({
      collection: collectionConfig.collection,
      fields: collectionConfig.fields?.map(f => f.field),
      context: {
        role: context.role,
        client: context.client,
        userId: context.userId
      }
    });
  };

  return memoize(resolver, keyGenerator, {
    maxSize: 500,
    ttl: 5 * 60 * 1000 // 5 minutes TTL
  });
};

/**
 * WeakMap-based memoization for object arguments
 * Better for functions that receive large objects
 * @param {Function} fn - Function to memoize
 * @returns {Function} Memoized function
 */
export const weakMemoize = (fn) => {
  const cache = new WeakMap();

  return function(...args) {
    // Use first argument as key (must be object)
    const key = args[0];
    
    if (!key || typeof key !== 'object') {
      return fn.apply(this, args);
    }

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    
    return result;
  };
};

export default memoize;
