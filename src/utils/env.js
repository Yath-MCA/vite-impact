/**
 * Environment Helper
 * 
 * Safe access to window.ENV with fallbacks and TypeScript-like safety
 */

// Default environment for SSR/build time
const DEFAULT_ENV = {
  VERSION: '1.0.0',
  TIMESTAMP: new Date().toISOString(),
  BASE_VERSION: '1.0',
  APP_KEY: 'default',
  FEATURE_FLAGS: {
    DARK_MODE: true,
    BETA_FEATURES: false,
    ANALYTICS: true,
    CACHE_ENABLED: true,
    SERVICE_WORKER: false
  },
  API_KEY: '',
  User_API_KEY: '',
  DEBUG: false,
  LOG_LEVEL: 'error',
  IS_LIVE_DOMAIN: false,
  IS_UAT_DOMAIN: false,
  IS_DEV_DOMAIN: true,
  DOMAIN: 'localhost',
  DOMAIN_ROOT: 'localhost:3000',
  BACKEND_DOMAIN: 'http://localhost:8080',
  BUCKET_URL: '',
  API_PATH: '/api/v1',
  SPELLCHECK_HOST: '',
  KIT_CLOSE_TASK_URL: '',
  KIT_CLOSE_TASK_TOKEN: '',
  ENVIRONMENT: 'local',
  BUILD_HASH: 'dev',
  GIT_BRANCH: 'main'
};

/**
 * Get environment variable with type safety
 * @param {string} key - Environment key
 * @param {any} defaultValue - Default value if not found
 * @returns {any} Environment value or default
 */
export function getEnv(key, defaultValue = undefined) {
  if (typeof window !== 'undefined' && window.ENV) {
    return window.ENV[key] !== undefined ? window.ENV[key] : defaultValue;
  }
  return DEFAULT_ENV[key] !== undefined ? DEFAULT_ENV[key] : defaultValue;
}

/**
 * Get all environment config
 * @returns {Object} Complete environment object
 */
export function getAllEnv() {
  if (typeof window !== 'undefined' && window.ENV) {
    return window.ENV;
  }
  return DEFAULT_ENV;
}

/**
 * Check if feature flag is enabled
 * @param {string} flagName - Feature flag name
 * @returns {boolean} True if enabled
 */
export function isFeatureEnabled(flagName) {
  const flags = getEnv('FEATURE_FLAGS', DEFAULT_ENV.FEATURE_FLAGS);
  return flags[flagName] === true;
}

/**
 * Check current environment
 * @returns {Object} Environment checks
 */
export function getEnvironment() {
  return {
    isLocal: getEnv('ENVIRONMENT') === 'local',
    isDev: getEnv('ENVIRONMENT') === 'dev',
    isUat: getEnv('ENVIRONMENT') === 'uat',
    isStage: getEnv('ENVIRONMENT') === 'stage',
    isProd: getEnv('ENVIRONMENT') === 'prod',
    isLive: getEnv('IS_LIVE_DOMAIN', false),
    name: getEnv('ENVIRONMENT', 'local')
  };
}

/**
 * Check if running in debug mode
 * @returns {boolean} True if debug mode
 */
export function isDebug() {
  return getEnv('DEBUG', false) === true;
}

/**
 * Log message if debug mode is enabled
 * @param {string} message - Message to log
 * @param {...any} args - Additional arguments
 */
export function debugLog(message, ...args) {
  if (isDebug()) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Get API configuration
 * @returns {Object} API config
 */
export function getApiConfig() {
  return {
    key: getEnv('API_KEY'),
    userKey: getEnv('User_API_KEY'),
    baseUrl: getEnv('BACKEND_DOMAIN'),
    path: getEnv('API_PATH'),
    fullUrl: `${getEnv('BACKEND_DOMAIN')}${getEnv('API_PATH')}`
  };
}

/**
 * Initialize environment logging
 * Call this in your app's entry point
 */
export function initEnvLogging() {
  if (typeof window !== 'undefined' && window.ENV) {
    const env = getEnvironment();
    
    console.log(`
╔════════════════════════════════════╗
║    Environment Configuration       ║
╠════════════════════════════════════╣
║  Environment: ${env.name.padEnd(22)}║
║  Version:    ${getEnv('VERSION', 'unknown').padEnd(22)}║
║  Build:      ${getEnv('BUILD_HASH', 'unknown').slice(0, 8).padEnd(22)}║
║  Debug:      ${String(isDebug()).padEnd(22)}║
╚════════════════════════════════════╝
    `);
    
    if (isDebug()) {
      console.log('[ENV] Full configuration:', getAllEnv());
    }
  }
}

export default {
  getEnv,
  getAllEnv,
  isFeatureEnabled,
  getEnvironment,
  isDebug,
  debugLog,
  getApiConfig,
  initEnvLogging
};
