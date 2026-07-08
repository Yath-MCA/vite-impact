# IMPACT Vite Project Folder Structure

> **Current target (feature-MVC hybrid):** see [`FEATURE_MVC_STRUCTURE.md`](./FEATURE_MVC_STRUCTURE.md).
> Prefer `src/features/<name>/{pages,hooks,routes}` over adding new domain UI under `src/components/`.

This document provides a comprehensive overview of the folder structure for the IMPACT React Vite application.

## 📁 Root Directory Structure

```
impact_vite/
├── 📄 .env.example                    # Environment variables template
├── 📄 .env.local.example              # Local environment variables template
├── 📁 .git/                         # Git version control directory
├── 📄 .gitignore                    # Git ignore file
├── 📁 .qodo/                        # Qodo AI assistant configuration
├── 📄 README.md                     # Project documentation
├── 📁 _vanilaProject/               # Vanilla project files (legacy)
├── 📁 agent-task/                   # Agent task management
├── 📁 ai-agent/                     # AI agent configurations
├── 📁 backup/                       # Backup files and configurations
├── 📄 dev-server.log                # Development server logs
├── 📁 dist/                         # Build output directory
├── 📁 docs/                         # Project documentation
├── 📁 e2e/                          # End-to-end tests
├── 📁 env/                          # Environment configurations
├── 📁 graphql-wrapper/               # GraphQL wrapper service
├── 📄 impact_react_vite_v2.code-workspace # VS Code workspace
├── 📄 index.html                    # Main HTML entry point
├── 📁 node_modules/                 # Node.js dependencies
├── 📄 package-lock.json             # Dependency lock file
├── 📄 package.json                  # Project metadata and scripts
├── 📁 playwright-report/            # Playwright test reports
├── 📄 playwright.config.ts          # Playwright configuration
├── 📄 postcss.config.js             # PostCSS configuration
├── 📁 public/                       # Static public assets
├── 📁 run-task/                     # Task runner configurations
├── 📁 scripts/                      # Build and utility scripts
├── 📄 server.log                    # Server logs
├── 📄 setup-ckeditor4.js            # CKEditor 4 setup script
├── 📁 src/                          # Source code directory
├── 📁 temp_migration/               # Temporary migration files
├── 📁 tests/                        # Test files
├── 📄 tailwind.config.js            # Tailwind CSS configuration
├── 📄 validate-tests.js             # Test validation script
├── 📄 vite.config.js                # Vite configuration
└── 📄 vite.config.js.timestamp-*    # Timestamped Vite config backups
```

## 📁 Source Directory (`src/`)

```
src/
├── 📄 App.jsx                       # Main React application component
├── 📄 EDITOR_INTEGRATION.md         # Editor integration documentation
├── 📁 assets/                      # Static assets (images, fonts, etc.)
├── 📁 checks/                      # Validation checks
├── 📁 collection-config/            # Collection configuration files
├── 📁 components/                  # React components
├── 📁 config/                      # Application configuration
├── 📁 constants/                   # Application constants
├── 📁 context/                     # React context providers
├── 📁 error/                       # Error handling components
├── 📁 events/                      # Event management
├── 📁 grid/                        # Grid components
├── 📁 hooks/                       # Custom React hooks
├── 📄 index.css                    # Global CSS styles
├── 📁 legacy/                      # Legacy components
├── 📄 main.jsx                     # Application entry point
├── 📁 modules/                     # Application modules
├── 📁 overlay/                     # Overlay components
├── 📁 overlay-system/              # Overlay system components
├── 📁 pages/                       # Page components
├── 📁 plugins/                     # Plugin system
├── 📁 routes/                      # Route definitions
├── 📁 services/                    # API and data services
├── 📁 snippets/                    # Code snippets
├── 📁 styles/                      # Style files
└── 📁 utils/                       # Utility functions
```

## 📁 Components Directory (`src/components/`)

```
src/components/
├── 📁 ConfigManager/               # 🆕 Configuration Manager Module
│   ├── 📄 ConfigManagerPage.jsx     # Main configuration manager page
│   ├── 📄 ConfigList.jsx           # Client/Journal listing component
│   ├── 📄 ConfigEditor.jsx         # XML editor component
│   ├── 📄 ConfigHistory.jsx        # Change history component
│   └── 📄 ConfigManager.css        # Configuration manager styles
├── 📁 DocFinder/                   # Document finder components
├── 📄 ValidateUrlLanding.jsx       # URL validation landing page
├── 📁 admin/                       # Administration components
├── 📁 alerts/                      # Alert/notification components
├── 📁 charts/                      # Chart and graph components
├── 📁 client/                      # Client-specific components
├── 📁 dashboard/                   # Dashboard components
├── 📁 editor/                      # Editor components
├── 📁 grid/                        # Grid/table components
├── 📁 layout/                      # Layout components
├── 📁 loading/                     # Loading components
├── 📁 ollama/                      # Ollama AI components
├── 📁 overlay/                     # Overlay components
├── 📁 reports/                     # Report components
├── 📁 sidebar/                     # Sidebar components
└── 📁 supabase/                    # Supabase integration components
```

## 📁 Key Directories Details

### 📁 Public Directory
```
public/
├── 📁 assets/                      # Static assets
│   ├── 📁 css/                     # CSS files
│   ├── 📁 data/                    # Data files
│   └── 📁 logo/                   # Logo files
├── 📁 ckeditor4/                   # CKEditor 4 files
├── 📁 data_cache/                  # Data cache storage
└── 📁 legacy-editor/               # Legacy editor files
```

### 📁 Documentation (`docs/`)
```
docs/
├── 📄 AUTH_API_GUIDE.md            # Authentication API guide
├── 📄 CKEDITOR4_SETUP.md           # CKEditor 4 setup guide
├── 📄 DEVELOPER_GUIDE.md           # Developer documentation
├── 📄 ENVIRONMENT_README.md        # Environment setup guide
└── 📄 [Additional documentation files]
```

### 📁 Environment (`env/`)
```
env/
├── 📄 env.dev.js                   # Development environment config
├── 📄 env.local.js                 # Local environment config
├── 📄 env.prod.js                  # Production environment config
└── 📄 env.secrets.example.js       # Secrets template
```

### 📁 Scripts (`scripts/`)
```
scripts/
├── 📄 capture_qc_stack.mjs         # QC stack capture script
├── 📄 find_qc_error.mjs            # QC error finder script
├── 📄 generate-backend-env.js      # Backend environment generator
├── 📄 generate-env.js              # Environment generator
└── 📄 [Additional utility scripts]
```

### 📁 Tests (`tests/`)
```
tests/
├── 📁 accessibility/               # Accessibility tests
├── 📁 error/                       # Error handling tests
├── 📁 fixtures/                    # Test fixtures
├── 📁 modules/                     # Module tests
├── 📄 GETTING_STARTED.md           # Test setup guide
├── 📄 README.md                   # Test documentation
├── 📄 SUMMARY.md                  # Test summary
└── 📄 TEST_IDS.md                 # Test ID references
```

## 🆕 ConfigManager Module Details

The newly created ConfigManager module provides comprehensive configuration management capabilities:

### 📁 ConfigManager Structure
```
ConfigManager/
├── 📄 ConfigManagerPage.jsx        # Main page component
│   ├── Dashboard with statistics
│   ├── Sidebar navigation
│   ├── User profile management
│   └── View switching logic
├── 📄 ConfigList.jsx              # Configuration listing
│   ├── Client configuration list
│   ├── Journal configuration list
│   ├── Search and filtering
│   └── CRUD operations
├── 📄 ConfigEditor.jsx            # XML editor
│   ├── File management (load/save/upload/download)
│   ├── Real-time XML validation
│   ├── Syntax highlighting and formatting
│   ├── Search functionality
│   └── Keyboard shortcuts
├── 📄 ConfigHistory.jsx           # Change history
│   ├── Timeline view of changes
│   ├── Grouped by client/batch
│   ├── Event tracking (created/deployed/modified)
│   └── Version restore functionality
└── 📄 ConfigManager.css           # Comprehensive styling
    ├── Responsive design
    ├── Modern UI components
    ├── Animation and transitions
    └── Accessibility features
```

## 📋 Key Features by Directory

### 🎯 ConfigManager Module
- **Dashboard**: Statistics cards, recent activity, quick actions
- **Configuration Management**: Client and journal CRUD operations
- **XML Editor**: Advanced XML editing with validation
- **History Tracking**: Comprehensive change history with user attribution
- **Search & Filter**: Advanced search and filtering capabilities
- **Responsive Design**: Mobile-friendly interface

### 🔧 Development Tools
- **Environment Management**: Multiple environment configurations
- **Testing**: E2E tests with Playwright
- **Build Tools**: Vite for fast development and building
- **Code Quality**: ESLint, Prettier, and validation scripts

### 📚 Documentation
- **API Guides**: Authentication and integration documentation
- **Setup Guides**: Environment and development setup
- **Developer Docs**: Comprehensive development documentation

### 🎨 UI/UX Components
- **Layout System**: Responsive layout components
- **Charts**: Data visualization components
- **Forms**: Form components and validation
- **Alerts**: Notification and alert system
- **Loading**: Loading state components

## 🚀 Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS + Custom CSS
- **Testing**: Playwright for E2E testing
- **Build**: Vite for fast development and optimized builds
- **Code Editor**: CKEditor 4 integration
- **AI Integration**: Ollama AI components
- **Database**: Supabase integration
- **GraphQL**: GraphQL wrapper service

## 📝 Notes

- The project uses a modular architecture with clear separation of concerns
- Configuration management is handled through the new ConfigManager module
- Legacy files are preserved in `_vanilaProject/` for reference
- Environment-specific configurations are managed in the `env/` directory
- Comprehensive testing setup with fixtures and accessibility tests
- Modern development workflow with hot reload and fast builds

---

*This structure document was generated on March 23, 2026 and reflects the current state of the IMPACT Vite project.*
