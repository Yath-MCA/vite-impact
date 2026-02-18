/**
 * Font Configuration
 * Source Sans Pro from @fontsource
 */

// Import all weights of Source Sans Pro
import '@fontsource/source-sans-pro/200.css';
import '@fontsource/source-sans-pro/300.css';
import '@fontsource/source-sans-pro/400.css';
import '@fontsource/source-sans-pro/600.css';
import '@fontsource/source-sans-pro/700.css';
import '@fontsource/source-sans-pro/900.css';

// Import italic variants
import '@fontsource/source-sans-pro/200-italic.css';
import '@fontsource/source-sans-pro/300-italic.css';
import '@fontsource/source-sans-pro/400-italic.css';
import '@fontsource/source-sans-pro/600-italic.css';
import '@fontsource/source-sans-pro/700-italic.css';
import '@fontsource/source-sans-pro/900-italic.css';

// CSS Custom Properties for consistent font usage
const fontStyles = `
  :root {
    --font-family-primary: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    --font-weight-light: 300;
    --font-weight-regular: 400;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
  }

  body {
    font-family: var(--font-family-primary);
    font-weight: var(--font-weight-regular);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-family-primary);
    font-weight: var(--font-weight-semibold);
  }

  strong, b {
    font-weight: var(--font-weight-bold);
  }

  .font-light {
    font-weight: var(--font-weight-light) !important;
  }

  .font-regular {
    font-weight: var(--font-weight-regular) !important;
  }

  .font-semibold {
    font-weight: var(--font-weight-semibold) !important;
  }

  .font-bold {
    font-weight: var(--font-weight-bold) !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = fontStyles;
  document.head.appendChild(styleElement);
}

export default fontStyles;
