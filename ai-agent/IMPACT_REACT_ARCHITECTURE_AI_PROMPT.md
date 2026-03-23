
# IMPACT CMS — Master AI Agent Architecture Prompt

## Goal
Refactor and maintain the IMPACT React + Vite CMS using a **feature-first architecture** that is scalable, modular, and AI-agent friendly.

The system already contains a partially refactored dashboard module located at:

src/features/dashboard

Your task is to **scan the existing project structure and enforce a clean architecture across the entire project**.

Do NOT break existing functionality.

---

# Project Context

The project is a large CMS-style React application that includes:

- Dashboard system
- Reports
- Config Manager
- Document History
- User Activity
- Editor integration
- Overlay systems
- Supabase services
- GraphQL wrapper

The project currently contains mixed architecture:

src/components
src/modules
src/pages
src/context
src/routes

Your job is to standardize this.

---

# Target Architecture

Refactor the project to follow **feature-first architecture**.

```
src
 ├ core
 │   ├ layout
 │   │   ├ Header.jsx
 │   │   ├ Footer.jsx
 │   │   ├ AppLayout.jsx
 │   │
 │   ├ router
 │   │   ├ AppRouter.jsx
 │   │
 │   ├ providers
 │   │   ├ AuthProvider.jsx
 │   │   ├ DashboardProvider.jsx
 │
 ├ features
 │   ├ dashboard
 │   ├ reports
 │   ├ history
 │   ├ activity
 │   ├ config-manager
 │   ├ editor
 │
 ├ components
 │   ├ table
 │   ├ modal
 │   ├ form
 │   ├ buttons
 │
 ├ hooks
 ├ services
 ├ utils
```

---

# Dashboard Rules

The dashboard feature must remain the central UI system.

Location:

```
src/features/dashboard
```

Structure:

```
dashboard
 ├ pages
 ├ layout
 ├ components
 ├ context
 ├ config
 ├ hooks
 ├ routes
```

Sidebar and layout must come from:

```
DashboardLayout
DashboardSidebar
```

Menus must come from:

```
dashboardMenuConfig.js
```

Routes must come from:

```
dashboardRoutes.js
```

---

# Feature Module Rules

Each feature must follow this structure:

```
feature-name
 ├ pages
 ├ components
 ├ services
 ├ hooks
 ├ routes
 └ index.js
```

Example:

```
features/reports
 ├ pages
 │   ├ XmlFailure.jsx
 │   ├ CompareReports.jsx
 │
 ├ components
 │   ├ ReportsTable.jsx
 │
 ├ services
 │   ├ reportsService.js
 │
 ├ routes
 │   ├ reportsRoutes.js
```

---

# Component Rules

Global reusable components go here:

```
src/components
```

Examples:

- DataTable
- Modal
- Form components
- Buttons
- Layout helpers

Feature-specific components must stay inside their feature module.

---

# Migration Tasks

The AI agent must perform the following tasks.

### 1 Scan Existing Project

Analyze:

```
src/modules
src/pages
src/components
src/context
```

Detect feature ownership.

---

### 2 Move Feature Code

Move code into appropriate feature modules.

Examples:

```
modules/reports → features/reports
modules/history → features/history
modules/activity → features/activity
```

---

### 3 Fix Imports

After moving files:

- update all imports
- remove broken paths
- ensure build passes

---

### 4 Centralize Routing

Routes must be defined inside each feature.

Example:

```
features/dashboard/routes/dashboardRoutes.js
features/reports/routes/reportsRoutes.js
```

Main router:

```
core/router/AppRouter.jsx
```

This router should combine feature routes.

---

### 5 Lazy Load Features

Use React lazy loading.

Example:

```
const AdminDashboard = lazy(() =>
  import('../features/dashboard/pages/AdminDashboard')
)
```

---

### 6 Preserve Backward Compatibility

If routes previously existed like:

```
/doc-dashboard
/admin-dashboard
```

Redirect them to new routes.

---

# Expected Result

The final project architecture should look like:

```
src
 ├ core
 ├ features
 │   ├ dashboard
 │   ├ reports
 │   ├ history
 │   ├ activity
 │   ├ config-manager
 │   ├ editor
 │
 ├ components
 ├ hooks
 ├ services
 ├ utils
```

Benefits:

- modular architecture
- clear ownership
- easier maintenance
- scalable CMS structure
- AI-agent friendly codebase

---

# Important Constraints

The AI agent must:

- NOT delete working code
- NOT break routes
- update imports carefully
- maintain build stability
- maintain styling and layout consistency

---

# End Goal

Transform the IMPACT CMS codebase into a **clean, feature-based architecture suitable for large enterprise React applications**.
