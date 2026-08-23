# Landing Config Model

## Goal

The config should keep only relevant client details. Shared structure, shared links, shared footer browser support, and repeated markup should live in reusable definitions.

## Config Layers

Use three layers:

1. Common defaults.
2. Shared sections and themes.
3. Client overrides.

## Common Defaults

Common config should define the default landing page behavior.

```json
{
  "page_title": "IMPACT - Landing Page",
  "client_favicon": "Newgen",
  "navbar": {
    "theme": "white",
    "logo_src": "assets/images/svg/logo/IMPACT_5_4.svg",
    "logo_alt": "IMPACT Logo",
    "logo_height": "30",
    "logo_width": "150"
  },
  "footer": {
    "row_class": "text-light bg-blue",
    "container_class": "container",
    "logo_section": "footer_empty_brand",
    "browser": "browser"
  },
  "instructions_section": "instructions_default_journal",
  "disclaimer_section": "disclaimer_standard",
  "doi_component": "doi_info"
}
```

## Shared Navbar Themes

Navbar styling should be defined once.

```json
{
  "navbar_themes": {
    "white": {
      "class": "bt-border-color",
      "icon_variant": "dark",
      "icon_size": "18",
      "image_class": "menu-icon mr-2",
      "text_class": "fw-600",
      "faq_title": "Frequently Asked Questions",
      "guide_title": "User Guide"
    },
    "dark-blue": {
      "class": "navbar-dark bg-blue",
      "icon_variant": "white",
      "icon_size": "24",
      "image_class": "menu-icon mr-1",
      "text_class": "fw-600 text-light",
      "faq_title": "Click to download the FAQs",
      "guide_title": "Click to download the User Guide"
    },
    "crimson-red": {
      "class": "bg-crimson-red",
      "icon_variant": "white",
      "icon_size": "18",
      "image_class": "menu-icon mr-1",
      "guide_image_class": "menu-icon icon-ug",
      "text_class": "text-light",
      "faq_title": "Click to download the FAQs",
      "guide_title": "Click to download the User Guide"
    }
  }
}
```

## Client Override Shape

Each client should store only what differs from common config.

```json
{
  "intellect": {
    "client_favicon": "INTELLECT",
    "client_web_url": "https://www.intellectbooks.com/journals",
    "welcome_heading": "Welcome to IMPACT, the online proofing tool for INTELLECT.",
    "navbar": {
      "theme": "dark-blue",
      "logo_src": "INTELLECT.png",
      "logo_alt": "Intellect logo",
      "logo_height": "25"
    },
    "footer": {
      "container_class": "container mw-100",
      "logo_section": "footer_empty_brand"
    }
  }
}
```

## Avoid In Client JSON

Avoid these fields in client overrides:

```txt
navbar_links
raw navbar HTML
raw FAQ/User Guide HTML
full repeated footer HTML
empty logo_alt/logo_height/logo_width fields
duplicate theme classes when theme is already set
```

## Normalized React View Model

After merging common defaults, shared sections, and client overrides, React should receive:

```ts
type LandingClientViewModel = {
  pageTitle: string;
  favicon: string;
  clientKey: string;
  navbar: {
    theme: "white" | "dark-blue" | "crimson-red";
    className: string;
    href: string;
    logo: {
      src: string;
      alt: string;
      height?: string;
      width?: string;
    };
    downloads: {
      textClass: string;
      faqIcon: string;
      guideIcon: string;
      iconSize: string;
    };
  };
  content: {
    welcomeHeading: string;
    instructionsHtml: string;
    disclaimerHtml: string;
    extraHtml?: string;
  };
  doi: {
    component: "doi_info" | "doi_info_books";
  };
  footer: {
    rowClass: string;
    containerClass: string;
    logoHtml?: string;
    browserComponent: string;
  };
};
```

