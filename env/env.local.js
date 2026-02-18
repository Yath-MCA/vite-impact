/**
 * Local Development Environment
 * Used for: localhost development
 */

export default {
  // App Configuration
  APP_KEY: 'impact-local-app',
  
  // API Configuration
  API_KEY: 'local-api-key-placeholder',
  User_API_KEY: 'local-user-api-key',
  API_PATH: '/api/v1',
  
  // Domain Configuration
  DOMAIN: 'localhost',
  DOMAIN_ROOT: 'localhost:3000',
  BACKEND_DOMAIN: 'http://localhost:8080',
  BUCKET_URL: 'http://localhost:9000/bucket',
  
  // Feature Flags
  FEATURE_FLAGS: {
    DARK_MODE: true,
    BETA_FEATURES: true,
    ANALYTICS: false,
    CACHE_ENABLED: false,
    SERVICE_WORKER: false
  },
  
  // Debugging
  DEBUG: true,
  LOG_LEVEL: 'debug',
  
  // Third-party Services
  SPELLCHECK_HOST: 'http://localhost:5000',
  KIT_CLOSE_TASK_URL: 'http://localhost:7000/close',
  KIT_CLOSE_TASK_TOKEN: 'local-kit-token',
  
  // Security (relaxed for local)
  IS_LIVE_DOMAIN: false,
  IS_UAT_DOMAIN: false,
  IS_DEV_DOMAIN: true
};
