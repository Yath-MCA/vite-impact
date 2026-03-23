
# AI Agent Task
## Refactor IMPACT React + Vite Project — Dashboard Consolidation Architecture

You are working inside an **existing React + Vite application** called **IMPACT CMS**.

The project currently has **dashboard-related code scattered across multiple folders**, including:

- src/components/dashboard
- src/components/sidebar
- src/pages
- src/routes
- src/context
- src/modules

This makes the system **hard to maintain, extend, and refactor**.

Your task is to **consolidate all dashboard-related functionality into a single feature module**.

Do NOT break existing functionality.

---

# Objective

Move **all dashboard related code** into a unified module:

```
src/features/dashboard/
```

This module must contain:

- dashboard pages
- dashboard layout
- dashboard sidebar
- dashboard components
- dashboard configuration
- dashboard routes
- dashboard context
- dashboard hooks

---

# Target Architecture

Refactor the project to follow **feature-first architecture**.

```
src
 ├ core
 │   ├ layout
 │   │   ├ Header.jsx
 │   │   ├ Footer.jsx
 │
 ├ features
 │   ├ dashboard
 │   │   ├ pages
 │   │   │   ├ DevDashboard.jsx
 │   │   │   ├ AdminDashboard.jsx
 │   │   │   ├ DocDashboard.jsx
 │   │   │
 │   │   ├ layout
 │   │   │   ├ DashboardLayout.jsx
 │   │   │   ├ DashboardSidebar.jsx
 │   │   │
 │   │   ├ components
 │   │   │   ├ DashboardCards.jsx
 │   │   │   ├ DashboardStats.jsx
 │   │   │   ├ DashboardWidgets.jsx
 │   │   │
 │   │   ├ context
 │   │   │   ├ DashboardContext.jsx
 │   │   │
 │   │   ├ config
 │   │   │   ├ dashboardMenuConfig.js
 │   │   │
 │   │   ├ hooks
 │   │   │   ├ useDashboard.js
 │   │   │
 │   │   ├ routes
 │   │   │   ├ dashboardRoutes.js
 │   │   │
 │   │   └ index.js
 │
 │   ├ reports
 │   ├ history
 │   ├ activity
 │   ├ config-manager
 │
 ├ components
 │   ├ table
 │   ├ filters
 │   ├ modal
 │
 ├ services
 ├ hooks
 ├ utils
```

---

# Migration Tasks

## 1 Move Dashboard Components

Move everything from:

```
src/components/dashboard
```

to

```
src/features/dashboard/components
```

---

## 2 Move Sidebar

Move:

```
src/components/sidebar
```

into:

```
src/features/dashboard/layout/DashboardSidebar.jsx
```

The sidebar should now be controlled by dashboard configuration.

---

## 3 Move Dashboard Pages

Move pages such as:

```
DevDashboard
AdminDashboard
DocDashboard
```

into:

```
src/features/dashboard/pages
```

---

## 4 Create Dashboard Layout

Create a layout:

```
src/features/dashboard/layout/DashboardLayout.jsx
```

Structure:

```
DashboardLayout
   ├ Header
   ├ DashboardSidebar
   └ MainContent
```

---

## 5 Create Dashboard Context

Create:

```
src/features/dashboard/context/DashboardContext.jsx
```

Responsibilities:

- detect dashboard type
- manage sidebar menus
- provide role-based access
- provide dashboard configuration

Example state:

```
{
  dashboardType: "admin",
  menus: [],
  permissions: []
}
```

---

## 6 Centralize Menu Configuration

Create:

```
src/features/dashboard/config/dashboardMenuConfig.js
```

Example:

```javascript
export const dashboardMenuConfig = {

  admin: [
    { label: "Reports", path: "/reports" },
    { label: "Configuration Manager", path: "/config-manager" },
    { label: "Document History", path: "/history" }
  ],

  developer: [
    { label: "Package Failure", path: "/reports/package-failure" },
    { label: "XML Failure", path: "/reports/xml-failure" },
    { label: "Compare", path: "/reports/compare" }
  ]

}
```

---

## 7 Dashboard Routes

Create:

```
src/features/dashboard/routes/dashboardRoutes.js
```

Routes example:

```
/dashboard/admin
/dashboard/dev
/doc-dashboard
```

Each should use:

```
DashboardLayout
```

---

# Refactor Rules

During the refactor:

1. Preserve existing functionality
2. Update all imports after moving files
3. Avoid duplicate components
4. Keep reusable UI in `src/components`
5. Ensure sidebar uses DashboardContext

---

# Expected Result

After refactor:

- Dashboard logic isolated in `features/dashboard`
- Sidebar driven by configuration
- Dashboard architecture modular
- Clear separation of features
- Easier maintenance and scaling

---

# Important

This project is a **large CMS-like application**, so the architecture must remain:

- modular
- feature-based
- scalable
- easy for AI agents to extend

Do NOT remove existing working modules.
