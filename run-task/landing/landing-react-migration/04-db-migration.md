# JSON To Database Migration

## Strategy

Do not move directly from duplicated HTML to database records. First normalize the JSON and React view model. Then store the same model in database tables.

Recommended phases:

1. JSON source of truth.
2. API returns normalized view model from JSON.
3. DB mirrors the JSON model.
4. API returns normalized view model from DB.
5. JSON remains as seed/fallback data.

## Suggested Tables

### landing_clients

```txt
id
client_key
client_title
page_title
favicon
web_url
welcome_heading
instructions_section
disclaimer_section
doi_component
active
created_at
updated_at
```

### landing_client_navbar

```txt
id
client_key
theme
href
logo_src
logo_alt
logo_height
logo_width
created_at
updated_at
```

### landing_client_footer

```txt
id
client_key
row_class
container_class
logo_section
browser_component
created_at
updated_at
```

### landing_themes

```txt
id
theme_key
class_name
icon_variant
icon_size
image_class
guide_image_class
text_class
faq_title
guide_title
created_at
updated_at
```

### landing_sections

```txt
id
section_key
section_type
content_json
html
active
created_at
updated_at
```

## API Contract

React should call an endpoint like:

```txt
GET /api/landing-config/:clientKey
```

The API should return the normalized view model, not raw database rows.

Example:

```json
{
  "clientKey": "intellect",
  "pageTitle": "IMPACT - Landing Page",
  "favicon": "assets/images/client_logo/INTELLECT_FAVICON.svg",
  "navbar": {
    "theme": "dark-blue",
    "className": "navbar-dark bg-blue",
    "href": "https://www.intellectbooks.com/journals",
    "logo": {
      "src": "assets/images/client_logo/INTELLECT.png",
      "alt": "Intellect logo",
      "height": "25"
    },
    "downloads": {
      "textClass": "fw-600 text-light",
      "faqIcon": "assets/images/svg/landing/FAQ_white.svg",
      "guideIcon": "assets/images/svg/landing/UserGuide_white.svg",
      "iconSize": "24"
    }
  },
  "content": {
    "welcomeHeading": "Welcome to IMPACT...",
    "instructionsHtml": "...",
    "disclaimerHtml": "...",
    "extraHtml": ""
  },
  "doi": {
    "component": "doi_info"
  },
  "footer": {
    "rowClass": "text-light bg-blue",
    "containerClass": "container mw-100",
    "logoHtml": "",
    "browserComponent": "browser"
  }
}
```

## Merge Rules

The API should merge data in this order:

```txt
common defaults
shared theme / section definitions
client override
runtime environment values
```

Client overrides should not erase common logo dimensions unless a client changes the logo source. If a client changes `logo_src`, missing `logo_height` or `logo_width` should resolve to empty values rather than inheriting IMPACT logo dimensions.

## Fallback Rules

If a client key is unknown:

1. Return 404 for strict mode, or
2. Return default client config for compatibility mode.

For production migration, strict mode is safer because incorrect branding is worse than a clear loading error.

## Admin/DB Editing Rules

If this config becomes editable through an admin UI:

- Use select controls for theme.
- Use asset pickers for logos.
- Use validated URLs for `href`.
- Avoid free-form navbar/footer HTML fields.
- Store content sections separately from theme/layout settings.
- Keep client keys immutable after creation.

