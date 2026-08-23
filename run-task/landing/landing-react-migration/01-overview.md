# Landing Page React Migration Overview

## Purpose

The existing IMPACT landing pages are generated from a shared HTML template and client-specific JSON. The React migration should preserve that model:

- One shared layout.
- Shared theme and section definitions.
- Small client-specific overrides.
- No duplicated navbar/footer HTML per client.
- Same runtime behavior for FAQ download, User Guide download, validation, session checks, and redirect.

The new React application should render the actual landing experience immediately. It should not introduce a marketing-style page before the workflow.

## Current Landing Page Regions

The existing page has six major regions:

1. Header navbar.
2. Welcome heading.
3. Instructions and disclaimer panel.
4. DOI/article/book metadata panel.
5. Footer browser-support area.
6. Runtime actions for validation and session redirection.

## Current Template Tokens

The current HTML template depends on token replacement. Important header/footer tokens include:

```txt
navbar_class
navbar_href
navbar_logo_src
navbar_logo_alt
navbar_logo_height
navbar_logo_width
textStyle
faq_src
faq_height
faq_width
user_guide_src
user_guide_height
user_guide_width
footer_row_class
footer_container_class
footer_logo
```

Content/layout tokens include:

```txt
welcome_heading
instructions_body
disclaimer_body
extra_content
left_side_col_class
right_side_col_class
doi_component
authenticator_script
```

## Migration Principle

React should not receive raw per-client navbar or footer HTML. It should receive a normalized client view model.

The existing config can be treated as the first data source. Later, the same normalized model can be returned from an API backed by database tables.

## Client Resolution

The React app should resolve the client key from route, query string, or server response.

Examples:

```txt
/landing/default
/landing/acs
/landing/oup
/landing/lse
/landing?client=oup&key=...
```

Recommended load flow:

```txt
1. Read client key.
2. Load common defaults.
3. Load shared sections and themes.
4. Load client override.
5. Merge and normalize config.
6. Render React layout.
7. Validate session key and enable action buttons.
```

## Migration Boundaries

Keep the first migration focused on layout and configuration.

Do migrate:

- Header navbar.
- Navbar theme handling.
- FAQ/User Guide download controls.
- Welcome/content/DOI/footer layout.
- Multi-client JSON resolution.

Do not change during first pass:

- Existing session validation semantics.
- Existing download API names.
- Existing client keys.
- Existing sign-off URL conventions.
- Editor redirect behavior.

