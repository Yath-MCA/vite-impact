# Client Editor Application

A production-ready React 18 + Vite application with dynamic client configuration, document editing capabilities, and modular architecture.

## Features

- **Dynamic Client Configuration**: Load different client configs via URL
- **Document Editor**: CKEditor 4 (local build) integration with PDF preview
- **AG Grid Integration**: Advanced data tables with sorting, filtering, pagination
- **Modular Plugin System**: Register and open modules as modals or sidebars
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
    layout/          # Header, Footer
    editor/          # Editor-specific components
  modules/           # Module system
  pages/             # Route pages
  context/           # React Context providers
  routes/            # Routing configuration
  utils/             # Utility functions
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
npm run build:local      # Build for local
npm run build:dev        # Build for dev environment
npm run build:uat        # Build for UAT environment
npm run build:stage      # Build for staging
npm run build:prod       # Build for production
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
- `/dashboard` - Document grid (requires dashboard feature)
- `/admindashboard` - Admin panel (requires admin feature)
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

## License

MIT
