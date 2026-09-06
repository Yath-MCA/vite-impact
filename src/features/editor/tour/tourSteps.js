/**
 * Step content adapted from impactweb's GuidedTour.InitalSteps where it
 * still applies to this app's real feature set. The legacy "File Saving...
 * autosaved every 30 seconds" copy for its #filesaving step is NOT carried
 * over here — this app has no save functionality yet (see the SaveModule
 * Core Flow spec). Once that ships, updating the "footer" step's content to
 * mention autosave is a one-line follow-up, not part of this plan.
 */
export const tourSteps = [
  {
    target: '[data-tour="toc"]',
    title: 'Navigation',
    content: 'Use this panel to jump between sections of the document.'
  },
  {
    target: '[data-tour="editor-canvas"]',
    title: 'Editor Section',
    content: 'Make your corrections here. Place the cursor where you want to edit and start typing.'
  },
  {
    target: '[data-tour="pdf-preview"]',
    title: 'Proof Section',
    content: 'This is a read-only preview of the typeset proof, provided for reference while you edit.'
  },
  {
    target: '[data-tour="thumbnails"]',
    title: 'Thumbnails',
    content: 'Use these thumbnails to jump to a specific page of the proof.'
  },
  {
    target: '[data-tour="footer"]',
    title: 'Document Controls',
    content: 'Document-level controls and status are shown here.'
  }
];
