create a React + Vite CMS Editor Page, based on the uploaded WYSWUG layout. It’s designed to produce modular components, respect permissions, and include the three overlay types.

Prompt to generate CMS Editor Page (React + Vite)

Objective:
Build a production-ready CMS Editor Page using React and Vite that matches the WYSWUG layout concept:
two stacked navbars with centered alignment, a dynamic three-panel main workspace (TOC, Editor, PDF/Preview), an overlay system (Dialog, Popout, Sidebar), a fixed footer, and responsive, accessible UI with role-based permissions.

Context:
You are an expert front-end architect. Create a scalable, maintainable codebase with modular components, hooks for state, and clear configuration-driven behavior. Focus on clean architecture, accessibility (ARIA), responsive CSS, and developer-friendly prompts for automatic UI code generation.

Requirements and features:

Layout and Navbars
Implement two stacked navbars that visually form a single toolbar across the two bars.
Navbar 1 (Left): document actions (Download, Proof PDF, CE Track PDF, Generate Track PDF) with enable/disable based on userRole and client config.
Navbar 1 (Center): a center-aligned toolbar that remains visually centered across breakpoints (md and smaller).
Navbar 1 (Right): Guided Tour, FAQ PDF, Profile, Finalize actions.
Navbar 2 (Left): a hamburger to toggle TOC; a right-aligned title prefix configured via props.
Navbar 2 (Center): a centered toolbar (Share Invite, Save, View Option, Show Revision, Online/Offline) that stays perfectly centered relative to Navbar 1 center.
Navbar 2 (Right): a left-aligned title prefix (Article Title / Chapter) and a hamburger to toggle the Thumbnail Panel.
Main Editor Layout
Three resizable panels: TOC (left), Editor (center), PDF/Preview (right).
Toggles to show/hide TOC and Thumbnail Panel; Editor remains primary area with contenteditable or rich text editor placeholder.
Responsive behavior: maintain centered alignment for mid+ screens; collapse gracefully on small devices.
Overlays
Overlay system with three types:
Dialog: modal centered in viewport with backdrop.
Popout: draggable floating panel.
Sidebar: right-drawer overlay that can slide in/out.
Overlays operate within the editor context and respect focus management and accessibility.
Footer
Fixed footer showing document status, word count, connection state, and version information.
State and permissions
Use React hooks to manage: isTocOpen, isThumbnailOpen, isOnline, client, userRole, and permissions.
Permission logic controls visibility and enabled state of action buttons across both navbars.
Accessibility and UX
Keyboard navigable buttons, proper ARIA labels, focus traps in dialogs, and logical tab order.
Clear visual affordances for toggles and overlays.
Configuration and prompts
Include an example configuration object (roles, permissions, feature flags) and prompts that drive AI-generated starter code for the UI.
Output structure:

src/
components/
Navbar.tsx (handles both navbars with props for sections, actions, alignment)
EditorLayout.tsx (three-panel layout with resizable panels)
TOCPanel.tsx, EditorPanel.tsx, PDFPreviewPanel.tsx
Overlays/
DialogOverlay.tsx, PopoutOverlay.tsx, SidebarOverlay.tsx
Footer.tsx
PermissionProvider.tsx (context for userRole, client, permissions)
Hooks/
useToggle.ts, usePermissions.ts, useOnlineStatus.ts
pages/
CMSEditorPage.tsx (page assembly)
styles/
global.css, components.css, responsive.css
config/
defaultConfig.ts
package.json (with React, Vite, and necessary libs)
README.md (how to run and customize)
prompts/
starter-kits.md (ready-made prompts for generating code)
advanced-docking-prompts.md (prompts for docking layouts and overlays)
Data and props examples:

config example:
const config = {
roles: {
editor: { canDownload: true, canFinalize: true, canShare: true },
viewer: { canDownload: false, canFinalize: false, canShare: false },
},
features: {
showTOC: true,
showThumbnails: true,
onlineStatus: true,
},
labels: {
titlePrefix: "Untitled Document",
articleTitlePrefix: "Article",
},
};
CMSEditorPage usage:
<CMSEditorPage config={config} userRole="editor" client={{ id: 'client-a' }} />
Implementation notes:

Use a responsive grid/flex approach to ensure the center column remains visually centered across both navbars.
Build accessible modal/dialog with aria-modal, focus trap, and return focus behavior on close.
Implement a lightweight draggable Popout with pointer events for repositioning; preserve position in state.
Implement a right-drawer Sidebar that slides in/out without layout shift.
Use a minimal rich text placeholder in EditorPanel (contenteditable div or simple textarea) with a WYSIWYG-friendly surface if desired later.
Ensure the three-panel workspace can be toggled through UI controls and keyboard shortcuts (optional: Ctrl/Cmd+Shift+S for Save, etc.).
The code should be clean, modular, and well-commented to facilitate AI-driven extension.
Deliverables:

A complete, self-contained React + Vite project skeleton that compiles.
Typescript preferred; if not, provide strong PropTypes and JSDoc.
All components exportable for reuse, with default exports where appropriate.
Inline documentation and comments explaining the permission logic and overlay behaviors.