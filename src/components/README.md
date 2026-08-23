# `src/components/`

Shared **View** kit for IMPACT React. Product flows and feature-owned component groups live in `src/features/`.

Index of all folder skills: [docs/SKILLS_AND_WORKFLOWS.md](../../docs/SKILLS_AND_WORKFLOWS.md).  
Workflows for this tree: [skills.md](./skills.md).

## Subfolders

| Folder | Purpose | Status |
|--------|---------|--------|
| [alerts](./alerts/) | Alert / collection-grid experiments | placeholder / sparse |
| [charts](./charts/) | Reusable chart widgets (area, bar, line, pie) | active |
| [common](./common/) | Shared primitives (reserved) | placeholder |
| [dashboard](./dashboard/) | Dashboard widgets (stats, notifications, charts) | active · often used by `features/dashboard` |
| [editor](./editor/) | CKEditor chrome (navbars, panels, footer, TOC) | active · consumed by `features/editor` |
| [grid](./grid/) | AG Grid wrapper | active |
| [layout](./layout/) | App shell layout pieces (header, sidebar, footer) | active · overlaps `core/layout` |
| [loading](./loading/) | Loading / progress exports | active |
| [ollama](./ollama/) | Ollama UI hooks (reserved) | placeholder |
| [overlay](./overlay/) | Popout overlay UI | active |
| [sidebar](./sidebar/) | Sidebar extras (reserved) | placeholder |
| [supabase](./supabase/) | Supabase auth / file / search demos | active |

## Rules

- Prefer presentational, reusable components here.
- Feature-owned pages and orchestration belong in `features/<name>/`.
- Do not add feature-owned implementation folders under top-level `components/`.
