# Client Editor Application

A production-ready React 18 + Vite CMS platform with modular editor overlays, dashboards, reporting modules, and role/client permission controls.

## Features

- **Dynamic Client Configuration**: Load different client configs via URL
- **Document Editor**: CKEditor 4 integration with TOC, preview, thumbnail rail, and module overlays
- **Overlay System**: Dialog, right sidebar, and draggable popout modules
- **Dashboard Suite**: Operations, admin, client, and reporting pages
- **AG Grid Integration**: Advanced data tables with enterprise-aware wrapper support
- **Modular Module System**: Register and open modules as modal/sidebar/popout
- **Dark/Light Theme**: Full theme support with system preference detection
- **Responsive Layout**: Mobile-friendly design
- **Context API State Management**: Clean state management without prop drilling

## Tech Stack

- React 18
- Vite
- React Router v6
- TailwindCSS
- AG Grid Community
- CKEditor 4 (local build)
- Lucide React Icons
- Environment Configuration System (runtime injection)

## Project Structure

```
src/
  components/
    editor/          # Editor-specific components
    dashboard/       # Dashboard widgets
    admin/           # Admin dashboard widgets
    client/          # Client dashboard widgets
    reports/         # Reporting widgets
    charts/          # Reusable chart components
    grid/            # AG Grid wrapper
    overlay/         # Overlay/popup components
  modules/           # Overlay runtime manager
  pages/             # Route pages
  context/           # React Context providers
  routes/            # Routing configuration
  config/            # Permissions/client config
```

## Getting Started

### Installation

```bash
npm install
```

### CKEditor 4 Setup

This project requires CKEditor 4 to be placed locally:

1. Download CKEditor 4 Full Package from https://ckeditor.com/ckeditor-4/download/
2. Extract to `public/ckeditor4/`
3. See `CKEDITOR4_SETUP.md` for detailed instructions

### Development

```bash
npm run dev              # Local development
npm run dev:frontend     # Frontend only (same as dev)
npm run dev:backend      # Lightweight backend wrapper only (port 4000)
npm run dev:fullstack    # Run frontend + backend together
npm run build:local      # Build for local
npm run build:dev        # Build for dev environment
npm run build:uat        # Build for UAT environment
npm run build:stage      # Build for staging
npm run build:prod       # Build for production
```

### Fullstack (Frontend + Backend)

Use one command from the main project root:

```bash
npm run dev:fullstack
```

Defaults:

- Frontend: Vite dev server (`npm run dev`)
- Backend wrapper: `graphql-wrapper/server.js`
- `BACKEND_URL=http://localhost:3333`
- `WRAPPER_PORT=4000`

Optional overrides:

```bash
BACKEND_URL=http://localhost:8080 WRAPPER_PORT=4100 npm run dev:fullstack
```

See [ENVIRONMENT_README.md](ENVIRONMENT_README.md) for detailed environment configuration.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Available Clients

The application supports multiple client configurations:

- `default-client`: Standard features
- `enterprise-client`: All features including admin dashboard
- `basic-client`: Limited features for basic users

Access via: `/validateurl/{client-id}`

## Routes

- `/` - Landing page (redirects to validateurl)
- `/dashboard` - Operations dashboard
- `/admindashboard` - Admin dashboard
- `/client` - Client production dashboard
- `/reports` - Reports and exports
- `/settings` - App settings
- `/validateurl/:client` - Load client configuration
- `/editor` - Document editor with CKEditor

## Module System

Register custom modules:

```javascript
const { registerModule, openModule } = useModule();

// Register a module
registerModule('myModule', MyComponent, MODULE_TYPES.MODAL, { title: 'My Module' });

// Open the module
openModule('myModule', { customProp: 'value' });
```

Supported module types:

- `MODULE_TYPES.MODAL`
- `MODULE_TYPES.RIGHT_SIDEBAR`
- `MODULE_TYPES.POPOUT`

## New Documentation

- Root overview: `README.md`
- Developer guide: `docs/DEVELOPER_GUIDE.md`
- Overlay details: `docs/OVERLAY_SYSTEM_README.md`
- Environment/build docs: `docs/ENVIRONMENT_README.md`

## License

MIT
