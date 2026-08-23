# React Landing Layout

## Component Tree

Recommended React component structure:

```txt
LandingPage
├─ LandingHeader
│  ├─ BrandLogo
│  └─ NavDownloadSection
├─ LandingWelcome
├─ LandingMainLayout
│  ├─ ContentPanel
│  │  ├─ InstructionsSection
│  │  ├─ DisclaimerSection
│  │  ├─ ExtraSections
│  │  └─ LandingActions
│  └─ DoiPanel / BookInfoPanel
└─ LandingFooter
   ├─ FooterBrand
   └─ BrowserSupport
```

## LandingPage

Responsibilities:

- Resolve client key.
- Fetch or import config.
- Normalize config into a view model.
- Set document title and favicon.
- Render layout regions.
- Initialize session validation.

## LandingHeader

The header should not store client-specific HTML. It should render from normalized navbar data.

The collapse region should use:

```txt
navDownloadSection
```

This replaces Bootstrap demo naming such as `navbarTogglerDemo03`.

Example shape:

```tsx
function LandingHeader({ navbar, onDownload }) {
  return (
    <nav className={`navbar navbar-expand-lg fixed-top ${navbar.className}`}>
      <div className="container-fluid">
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navDownloadSection"
          aria-controls="navDownloadSection"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <a className="navbar-brand" href={navbar.href} target="_blank" rel="noopener">
          <img
            src={navbar.logo.src}
            alt={navbar.logo.alt}
            height={navbar.logo.height}
            width={navbar.logo.width}
          />
        </a>

        <NavDownloadSection downloads={navbar.downloads} onDownload={onDownload} />
      </div>
    </nav>
  );
}
```

## NavDownloadSection

The FAQ/User Guide content should remain shared.

Required IDs:

```txt
FAQ_UI
User_Guide_UI
```

Required actions:

```txt
Help_FAQ_pdf
Help_Guide_pdf
landing
```

Example:

```tsx
function NavDownloadSection({ downloads, onDownload }) {
  return (
    <div className="collapse navbar-collapse justify-content-end" id="navDownloadSection">
      <ul className="navbar-nav mb-2 mb-lg-0">
        <li className="nav-item" id="FAQ_UI" title="Frequently Asked Questions">
          <button
            type="button"
            className={`nav-link ${downloads.textClass}`}
            onClick={() => onDownload("Help_FAQ_pdf", "landing")}
          >
            <img
              className="menu-icon"
              src={downloads.faqIcon}
              height={downloads.iconSize}
              width={downloads.iconSize}
              alt="FAQIcon"
            />
            FAQs
          </button>
        </li>

        <li className="nav-item" id="User_Guide_UI" title="User Guide">
          <button
            type="button"
            className={`nav-link ${downloads.textClass}`}
            onClick={() => onDownload("Help_Guide_pdf", "landing")}
          >
            <img
              className="menu-icon"
              src={downloads.guideIcon}
              height={downloads.iconSize}
              width={downloads.iconSize}
              alt="User Guide"
            />
            User Guide
          </button>
        </li>
      </ul>
    </div>
  );
}
```

## Main Layout

The current layout has a left content panel and a right DOI/book panel.

Journal-style layout:

```txt
left:  col-sm-12 col-md-6 col-lg-6
right: col-sm-12 col-md-6 col-lg-6
```

Book-style layout:

```txt
left:  col-sm-12 col-md-9 col-lg-9
right: col-sm-12 col-md-3 col-lg-3
```

The normalized config should resolve these classes before rendering.

## ContentPanel

Responsibilities:

- Render Instructions.
- Render Disclaimer.
- Render optional extra sections.
- Render validation/action buttons.

If HTML strings are still used during migration, render them through a controlled component and sanitize where content is not trusted.

Longer term, convert content sections from HTML strings to structured blocks.

## DOI Panel

Use component selection from config:

```txt
doi_info
doi_info_books
```

In React, this should become:

```tsx
const DoiComponent = doi.component === "doi_info_books" ? BookInfoPanel : DoiPanel;
```

## LandingFooter

Footer should use shared browser support data and optional client logo data.

Do not duplicate browser support HTML per client.

