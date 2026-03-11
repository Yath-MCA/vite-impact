# Prompt: React + Vite CMS Editor Page Layout (Role & Client Aware)

Act as a **Senior Full Stack Developer and UI Architect**.

Design and implement a **CMS Editor Page** using **React + Vite** with a
**modern, scalable component architecture**.\
Follow **best practices for maintainability, modularity, and responsive
design**.

------------------------------------------------------------------------

# Technology Requirements

- React (functional components + hooks)
- Vite project structure
- Modular component architecture
- Clean CSS (CSS modules or separate stylesheet)
- Responsive layout
- Role-based and client-based UI behavior
- Accessible UI

------------------------------------------------------------------------

# Editor Page Layout

The **Editor Page** must contain:

Header ├── Navbar 1 ├── Navbar 2 └── Main Content (3 column layout)

------------------------------------------------------------------------

# Navbar 1 Layout

Navbar 1 must contain **3 columns**.

| Left Section \| Center Section \| Right Section \|

## Navbar1 -- Column 1 (Left)

Contains action buttons:

- 
- Proof PDF
- CE Track PDF
- Generate Track PDF

### Behavior Rules

Buttons should be **enabled or disabled based on**:

- Client
- User Role

Example logic:
    if(client === "PLOS" && role === "Author")
       disable CE Track PDF

    if(role !== "Editor")
       disable Generate Track PDF

Icons should visually show **disabled state**.

------------------------------------------------------------------------

## Navbar1 -- Column 2 (Center)

This section contains **center-aligned icons or components**.

### Responsive Behavior

- On **md and larger screens**
  - Content must be **perfectly centered between Navbar 1 and Navbar
    2**
- On **small screens**
  - Display normally without forced centering

------------------------------------------------------------------------

## Navbar1 -- Column 3 (Right)

Contains:

- Guided Tour button
- FAQ (download PDF)
- Profile icon dropdown
- Finalize button

------------------------------------------------------------------------

# Navbar 2 Layout

Navbar 2 also contains **3 columns**.

| Left Section \| Center Section \| Right Section \|

------------------------------------------------------------------------

## Navbar2 -- Column 1 (Left)

Split into **two sections**.

### Section 1

Hamburger icon to toggle:

TOC Panel

### Section 2

Displays a **title aligned to the right**.

Prefix label depends on configuration:

Journal Title / Book Title

------------------------------------------------------------------------

## Navbar2 -- Column 2 (Center)

Center-aligned toolbar containing:

- Share Invite
- Save
- View Option
- Show Revision
- Online / Offline toggle button

### Alignment Rule

Must remain **perfectly centered with Navbar1 center section**.

------------------------------------------------------------------------

## Navbar2 -- Column 3 (Right)

Split into **two sections**.

### Section 1

Hamburger icon to toggle:

Thumbnail panel

### Section 2

Displays title aligned **to the left**.

Prefix label based on configuration:

Article Title / Chapter

------------------------------------------------------------------------

# Main Editor Layout

Below the navbars, create a **3-column editor layout**.

| TOC Panel \| Editor Area \| Thumbnail Panel \|

### Behavior

- **TOC Panel**
  - Toggle using Navbar2 left hamburger
- **Thumbnail Panel**
  - Toggle using Navbar2 right hamburger
- **Editor Area**
  - Main editing workspace

------------------------------------------------------------------------

# Component Architecture

Example structure:
    src
     ├── components
     │    ├── Header
     │    │    ├── NavbarOne
     │    │    ├── NavbarTwo
     │    ├── EditorLayout
     │    │    ├── TocPanel
     │    │    ├── EditorWorkspace
     │    │    ├── ThumbnailPanel
     │    ├── Toolbar
     │    ├── ProfileMenu
     │    ├── GuidedTour
     │
     ├── hooks
     │    ├── useClientConfig
     │    ├── useRolePermissions
     │
     ├── config
     │    ├── clientConfig.js
     │
     ├── pages
     │    ├── EditorPage.jsx

------------------------------------------------------------------------

# State Management

Use React state/hooks for:

- isTocOpen
- isThumbnailOpen
- isOnline
- client
- userRole
- permissions

------------------------------------------------------------------------

# Client Configuration

Example:
    clientConfig = {
      client: "PLOS",
      titlePrefixLeft: "Journal Title",
      titlePrefixRight: "Article Title"
    }

------------------------------------------------------------------------

# Responsive Behavior

Breakpoints:

- mobile
- tablet
- md
- lg
- xl

Requirements:

- Center sections remain aligned
- Buttons collapse properly
- Icons adapt to small screens

------------------------------------------------------------------------

# UI/UX Requirements

- Clean modern layout
- Minimal spacing
- Icon-based actions
- Hover states
- Disabled states
- Responsive alignment

------------------------------------------------------------------------

# Expected Output

Provide:

1. React component structure
2. EditorPage layout implementation
3. Navbar components
4. Responsive CSS
5. Role/client-based permission logic
6. Example configuration
7. Clean maintainable code
