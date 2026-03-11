Prompt 15 — Reporting Module

Act as a Senior Data Visualization Engineer.

Create a Reporting Module for the CMS system.

Reports include:

Article Processing Report
Author Query Report
Editing Activity Report
User Activity Report
Production Timeline Report

Report page layout:

Reports
 ├── Filters Panel
 ├── Chart Section
 ├── Data Grid
 └── Export Panel

Features:

date range filter
client filter
journal filter
export PDF
export Excel

Generate:

src/pages/ReportsPage.jsx
src/components/Reports/ReportFilters.jsx
src/components/Reports/ReportCharts.jsx
src/components/Reports/ReportGrid.jsx
Prompt 16 — Charts System

Act as a Senior Data Visualization Developer.

Create a reusable Charts module.

Supported charts:

Line Chart
Bar Chart
Pie Chart
Area Chart
Stacked Bar Chart

Use:

Recharts
or
Chart.js

Charts must support:

dynamic datasets
responsive resizing
tooltip
legend
export image

Generate:

src/components/Charts/LineChart.jsx
src/components/Charts/BarChart.jsx
src/components/Charts/PieChart.jsx
src/components/Charts/AreaChart.jsx