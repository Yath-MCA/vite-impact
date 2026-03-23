# AI Agent Task — Dashboard Refactor

You are working inside an **existing React + Vite application**.

Refactor dashboard pages so they reuse the same layout used by:

/doc-dashboard

## Pages to Refactor
- DevDashboard
- AdminDashboard

## Layout Structure

<AppLayout>
  <Header />
  <Sidebar />
  <MainContent />
  <Footer />
</AppLayout>

## Requirements

- Reuse header/footer from `/doc-dashboard`
- Remove duplicated layout code
- Create reusable `AppLayout` component if missing
- Support context-based menus
- Ensure responsive layout
- Keep existing features working

## Context Menu Example

```js
dashboardMenuConfig = {
  admin: ["Reports","Configuration Manager","System Logs"],
  developer: ["Package Reports","XML Failure","Compare","Debug Logs"]
}
```

Use role/context to render menu items.