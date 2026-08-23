# shared

## Purpose / ownership
Reusable code used by more than one feature: common providers, hooks, utilities, constants, and third-party wrappers.

## Folders
- `providers/` - shared React providers and hooks such as auth/client state
- `hooks/` - cross-feature hooks
- `utils/` - pure helpers and shared utility functions
- `constants/` - shared constants
- `plugins/` - thin wrappers around third-party libraries

## Rule
If only one feature uses it, keep it under `features/<name>/`. If two or more features use it, put it here.
