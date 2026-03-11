Prompt 12 — Admin Dashboard

Act as a Senior CMS Platform Architect.

Create an Admin Dashboard.

Admin users can manage:

users

clients

projects

roles

permissions

system metrics

Admin dashboard layout:

Admin Dashboard
 ├── System Overview
 ├── User Management
 ├── Client Management
 ├── Project Management
 ├── Role Permission Manager
 └── System Health Metrics

Use AG-Grid Enterprise for:

user table

client table

project table

Features required:

sorting
filtering
pagination
column resizing
export to excel
row grouping

Generate:

src/pages/AdminDashboard.jsx
src/components/Admin/UserManagementGrid.jsx
src/components/Admin/ClientManagementGrid.jsx
src/components/Admin/ProjectGrid.jsx
src/components/Admin/SystemMetrics.jsx