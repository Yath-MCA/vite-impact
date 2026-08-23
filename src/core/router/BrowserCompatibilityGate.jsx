import { useEffect, useState } from 'react';

import { checkBrowserCompatibility } from '../../services/core/browserCompatibility.js';
import { showLandingMessage } from '../../features/landing/messages/index.js';
import { LandingMessageKey } from '../../features/landing/messages/landingMessageKeys.js';

function BrowserCompatibilityGate({ children }) {
  const [isSupported, setIsSupported] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function validateBrowser() {
      const browserInfo = checkBrowserCompatibility();

      if (typeof window !== 'undefined') {
        window.browserInfo = browserInfo;
      }

      const supported = Boolean(browserInfo.isAllowed && browserInfo.isCompatible);
      if (!supported) {
        await showLandingMessage(LandingMessageKey.UNSUPPORTED_BROWSER);
      }

      if (!cancelled) {
        setIsSupported(supported);
      }
    }

    validateBrowser();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isSupported !== true) {
    return null;
  }

  return children;
}

export default BrowserCompatibilityGate;
