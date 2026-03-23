# AI Agent Task — Configuration Manager Migration

Existing module located in:

_vanilaProject/queue/config-manager/

## Goal

Migrate this **Vanilla JS module** into React.

## Target Folder

src/modules/config-manager/

## Required Components

ConfigManagerPage.jsx
ConfigList.jsx
ConfigEditor.jsx
ConfigHistory.jsx

## Migration Rules

- Remove direct DOM manipulation
- Convert logic to React state/hooks
- Split UI into components
- Keep business logic intact
- Follow current project architecture

## Integration

Add sidebar entry:

Configuration Manager

Add route:

/config-manager