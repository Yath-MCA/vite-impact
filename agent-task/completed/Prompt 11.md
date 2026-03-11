Prompt 11 — CMS Dashboard System

Act as a Senior Full Stack Developer.

Extend the CMS platform to include a Dashboard system for users.

Create a Dashboard Page showing:

document statistics

active editing sessions

pending queries

user activity

publishing progress

Dashboard layout:

Dashboard
 ├── Statistics Cards
 ├── Document Activity Chart
 ├── Query Status Chart
 ├── Recent Documents Table
 └── Notifications Panel

Use:

AG-Grid Enterprise for tables

Chart library (Recharts or Chart.js) for charts

Generate:

src/pages/DashboardPage.jsx
src/components/Dashboard/StatsCards.jsx
src/components/Dashboard/RecentDocumentsGrid.jsx
src/components/Dashboard/ActivityChart.jsx
src/components/Dashboard/QueryChart.jsx
src/components/Dashboard/Notifications.jsx