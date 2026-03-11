Prompt — Temporary Migration Cleanup (Unused JS/JSX Files)

Act as a Senior Full Stack Developer responsible for a large React + Vite CMS migration.

During the migration process, several legacy .js and .jsx files may no longer be referenced by the application.

Implement a safe cleanup strategy by moving unused files into a temporary folder instead of deleting them.

Objective

Detect unused React/JS files and move them to a temporary directory until the migration is fully validated.

This ensures:

no accidental deletion of required code

rollback capability

easier debugging

Temporary Folder Structure

Create a temporary folder inside the project root.

temp_migration/
 ├── unused_components/
 ├── unused_pages/
 ├── unused_hooks/
 ├── unused_utils/
 ├── unused_styles/
 └── archived_files/
Detection Rules

A file is considered unused if:

It is not imported anywhere in the project

It is not referenced in routing

It is not dynamically loaded

It is not referenced by configuration files

Check usage across:

src/
routes/
components/
pages/
hooks/
utils/
config/
Migration Process

Steps:

Scan all .js and .jsx files.

Detect files without imports or references.

Move those files to the temp_migration directory.

Preserve the original folder structure where possible.

Example:

src/components/OldEditor.jsx

Move to:

temp_migration/unused_components/OldEditor.jsx
Safety Requirements

Do NOT move files if they are used by:

React Router
dynamic imports
lazy loading
context providers
custom hooks
API modules

Also exclude:

index.js
main.jsx
App.jsx
router files
config files
Reporting

Generate a migration report listing:

Moved files
Original location
New temporary location
Reason (unused/import not found)

Example report:

migration-report.json