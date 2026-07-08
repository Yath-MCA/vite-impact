# `src/components/`

Shared **View** kit for IMPACT React. Product flows live in `src/features/`. Domain screens that are really features (ConfigManager, DocFinder) may still appear here as **thin re-exports**.

Index of all folder skills: [docs/SKILLS_AND_WORKFLOWS.md](../../docs/SKILLS_AND_WORKFLOWS.md).  
Workflows for this tree: [skills.md](./skills.md).

## Subfolders

| Folder | Purpose | Status |
|--------|---------|--------|
| [admin](./admin/) | Admin grids (users, clients, projects, metrics) | active |
| [alerts](./alerts/) | Alert / collection-grid experiments | placeholder / sparse |
| [charts](./charts/) | Reusable chart widgets (area, bar, line, pie) | active |
| [client](./client/) | Client dashboard widgets (articles, production, queries) | active · consider feature later |
| [common](./common/) | Shared primitives (reserved) | placeholder |
| [ConfigManager](./ConfigManager/) | Re-export → `features/config-manager` | thin re-export |
| [dashboard](./dashboard/) | Dashboard widgets (stats, notifications, charts) | active · often used by `features/dashboard` |
| [DocFinder](./DocFinder/) | Re-export → `features/doc-finder` | thin re-export |
| [editor](./editor/) | CKEditor chrome (navbars, panels, footer, TOC) | active · consumed by `features/editor` |
| [grid](./grid/) | AG Grid wrapper | active |
| [layout](./layout/) | App shell layout pieces (header, sidebar, footer) | active · overlaps `core/layout` |
| [loading](./loading/) | Loading / progress exports | active |
| [ollama](./ollama/) | Ollama UI hooks (reserved) | placeholder |
| [overlay](./overlay/) | Popout overlay UI | active |
| [reports](./reports/) | Report filters/charts/grid UI | active · migrate-to-feature |
| [sidebar](./sidebar/) | Sidebar extras (reserved) | placeholder |
| [supabase](./supabase/) | Supabase auth / file / search demos | active |

## Rules

- Prefer presentational, reusable components here.
- Feature-owned pages and orchestration belong in `features/<name>/`.
- Do not grow `ConfigManager` or `DocFinder` implementations under `components/` — edit `features/` instead.
