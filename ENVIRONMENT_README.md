# Environment Configuration System

A production-ready environment configuration system for React 18 + Vite supporting multiple environments with runtime injection.

## Features

- **5 Environments**: local, dev, uat, stage, prod
- **Runtime Injection**: `window.ENV` generated at build time
- **Security**: Sensitive keys only via environment variables in production
- **Feature Flags**: Runtime toggle support
- **CI/CD Ready**: GitHub Actions, Azure DevOps, Jenkins compatible
- **Validation**: Schema validation with build-time errors
- **Domain Detection**: Automatic IS_LIVE_DOMAIN, IS_UAT_DOMAIN, IS_DEV_DOMAIN

## Quick Start

### Local Development

```bash
npm install
npm run dev              # Starts with local env
```

### Build for Specific Environment

```bash
npm run build:local      # Local environment
npm run build:dev        # Development environment
npm run build:uat        # UAT environment
npm run build:stage      # Staging environment
npm run build:prod       # Production environment
```

### Using ENV_NAME Variable

```bash
ENV_NAME=uat npm run build
```

## Environment Files

```
env/
  schema.js              # Validation schema
  env.local.js          # Local development
  env.dev.js            # Development server
  env.uat.js            # User Acceptance Testing
  env.stage.js          # Staging/Pre-prod
  env.prod.js           # Production (live)
```

## Configuration Structure

Each environment file exports:

```javascript
export default {
  APP_KEY: 'impact-app',
  API_KEY: process.env.API_KEY || 'placeholder',
  API_PATH: '/api/v1',
  DOMAIN: 'example.com',
  BACKEND_DOMAIN: 'https://api.example.com',
  FEATURE_FLAGS: {
    DARK_MODE: true,
    BETA_FEATURES: false
  },
  DEBUG: false,
  LOG_LEVEL: 'info'
};
```

## Generated Output

The build process generates `public/env.js`:

```javascript
window.ENV = {
  VERSION: "1.0.0",
  TIMESTAMP: "2024-01-15T10:30:00.000Z",
  BASE_VERSION: "1.0",
  BUILD_HASH: "abc1234",
  GIT_BRANCH: "main",
  ENVIRONMENT: "uat",
  APP_KEY: "impact-uat-app",
  API_KEY: "***",
  FEATURE_FLAGS: { DARK_MODE: true, ... },
  // ... all other config
};
```

## Usage in React

```jsx
import { getEnv, isFeatureEnabled, getEnvironment } from './utils/env';

// Get single value
const apiKey = getEnv('API_KEY');

// Get with default
const logLevel = getEnv('LOG_LEVEL', 'info');

// Check feature flag
if (isFeatureEnabled('DARK_MODE')) {
  // Enable dark mode
}

// Environment checks
const { isProd, isLive } = getEnvironment();
```

Initialize logging in your app entry:

```jsx
import { initEnvLogging } from './utils/env';

// In main.jsx or App.jsx
initEnvLogging();
```

## Security

### Production Requirements

Production builds require actual secrets:

```bash
# Set environment variables
export PROD_API_KEY="your-real-api-key"
export PROD_USER_API_KEY="your-user-api-key"
export PROD_KIT_TOKEN="your-kit-token"

# Then build
npm run build:prod
```

### Security Rules

1. **Never commit** `env.prod.js` with real keys
2. **Use placeholders** in repo (like `'prod-api-key-placeholder'`)
3. **CI/CD injection** for production secrets
4. **Empty checks** in prod build fail if secrets missing

## CI/CD Integration

### GitHub Actions

```yaml
name: Build UAT
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - name: Build UAT
        env:
          ENV_NAME: uat
          UAT_API_KEY: ${{ secrets.UAT_API_KEY }}
        run: npm run build:uat
```

### Azure DevOps

```yaml
steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  
- script: npm ci
  displayName: 'Install dependencies'

- script: npm run build:$(BuildEnvironment)
  displayName: 'Build application'
  env:
    ENV_NAME: $(BuildEnvironment)
    $(BuildEnvironment)_API_KEY: $(API_KEY)
```

### Jenkins

```groovy
pipeline {
  environment {
    ENV_NAME = 'prod'
    PROD_API_KEY = credentials('prod-api-key')
  }
  stages {
    stage('Build') {
      steps {
        sh 'npm ci'
        sh 'npm run build:prod'
      }
    }
  }
}
```

## Feature Flags

### Override via Environment Variables

```bash
# Enable dark mode for this build
FEATURE_DARK_MODE=true npm run build:dev

# Disable beta features
FEATURE_BETA_FEATURES=false npm run build:uat
```

### Available Flags

- `DARK_MODE` - Enable dark theme
- `BETA_FEATURES` - Show beta functionality
- `ANALYTICS` - Enable analytics tracking
- `CACHE_ENABLED` - Enable service worker caching
- `SERVICE_WORKER` - Enable PWA service worker

## Scripts Reference

```bash
# Environment generation
npm run env:local      # Generate local env.js
npm run env:dev        # Generate dev env.js
npm run env:uat        # Generate uat env.js
npm run env:stage      # Generate stage env.js
npm run env:prod       # Generate prod env.js

# Build commands
npm run build:local    # Build for local
npm run build:dev      # Build for dev
npm run build:uat      # Build for uat
npm run build:stage    # Build for stage
npm run build:prod     # Build for production

# Validation
npm run env:validate   # Validate current env config
```

## Validation

Schema validation ensures required fields exist:

```javascript
// Required fields must be present
const REQUIRED_FIELDS = [
  'APP_KEY',
  'API_KEY',
  'API_PATH'
];

// Invalid builds will fail
npm run env:validate
```

## Domain Detection

Automatic detection based on environment:

```javascript
window.ENV = {
  IS_LIVE_DOMAIN: true,   // Production only
  IS_UAT_DOMAIN: false,   // UAT environment
  IS_DEV_DOMAIN: false    // Local/dev environment
};
```

## Advanced Configuration

### Custom Output Directory

```bash
ENV_OUTPUT_DIR=./custom/path node scripts/generate-env.js
```

### Build Hash Injection

Automatically includes:
- Git commit hash
- Git branch name
- Build timestamp

### Post-Build Copy

After `npm run build`, env.js is automatically copied to `dist/` folder.

## Troubleshooting

### Missing env.js

```bash
# Generate before building
npm run env:uat
npm run build:uat
```

### Production Build Fails

```bash
# Missing required secrets
export PROD_API_KEY="your-key"
npm run build:prod
```

### Invalid Environment

```bash
# Use valid environment name
npm run build:uat    # ✓ Valid
npm run build:test   # ✗ Invalid
```

## Architecture

```
Build Process:
┌─────────────────────────────────────────┐
│  1. Read package.json (VERSION)         │
│  2. Get git info (commit, branch)       │
│  3. Load env/env.<name>.js              │
│  4. Apply environment overrides         │
│  5. Validate configuration              │
│  6. Generate public/env.js              │
│  7. Vite build includes env.js          │
└─────────────────────────────────────────┘

Runtime:
┌─────────────────────────────────────────┐
│  index.html loads env.js                │
│  ↓                                      │
│  window.ENV available globally          │
│  ↓                                      │
│  React app accesses via utils/env.js    │
└─────────────────────────────────────────┘
```

## License

MIT
