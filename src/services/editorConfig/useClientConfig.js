import { useEffect, useRef, useState } from 'react';
import { buildClientConfigBasePath } from './editorConfigConstants.js';
import { parseClientConfigXml, CLIENT_CONFIG_DEFAULTS } from './parseClientConfigXml.js';

async function fetchXmlDoc(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${url}`);
  }
  const text = await response.text();
  return new DOMParser().parseFromString(text, 'application/xml');
}

/**
 * Loads a client's config.xml + split override + ceg refStyling in
 * parallel, mirroring impactweb's LoadingConfig (_initialScriptLoader.js).
 * Only config.xml's editor6Layout/Generate_Items feed `toggles` in this
 * sub-project — the split doc is fetched (proving it loads) but not yet
 * parsed further; `refStyleRules` exposes the raw ceg XML Document for
 * future reference-styling work.
 */
export function useClientConfig({ client, dtd, journalCode, refStyle, isJournal }) {
  const [state, setState] = useState({
    toggles: { ...CLIENT_CONFIG_DEFAULTS },
    refStyleRules: null,
    loading: true,
    error: null
  });
  const requestKeyRef = useRef('');

  useEffect(() => {
    if (!client || !dtd) {
      setState({
        toggles: { ...CLIENT_CONFIG_DEFAULTS },
        refStyleRules: null,
        loading: false,
        error: null
      });
      return undefined;
    }

    const requestKey = `${client}|${dtd}|${journalCode}|${refStyle}`;
    requestKeyRef.current = requestKey;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const basePath = buildClientConfigBasePath({ dtd, client });
    const cegFileBase = !isJournal && refStyle ? refStyle : journalCode;

    const configUrl = `${basePath}config.xml`;
    const splitUrl = journalCode ? `${basePath}split/${journalCode}.xml` : null;
    const cegUrl = cegFileBase ? `${basePath}ceg/refStyling_${encodeURIComponent(cegFileBase)}.xml` : null;

    Promise.allSettled([
      fetchXmlDoc(configUrl),
      splitUrl ? fetchXmlDoc(splitUrl) : Promise.resolve(null),
      cegUrl ? fetchXmlDoc(cegUrl) : Promise.resolve(null)
    ]).then(([configResult, splitResult, cegResult]) => {
      if (cancelled || requestKeyRef.current !== requestKey) return;

      const configDoc = configResult.status === 'fulfilled' ? configResult.value : null;
      const cegDoc = cegResult.status === 'fulfilled' ? cegResult.value : null;
      const anyFailed = [configResult, splitResult, cegResult].some((r) => r.status === 'rejected');

      setState({
        toggles: parseClientConfigXml(configDoc),
        refStyleRules: cegDoc,
        loading: false,
        error: anyFailed ? { message: 'One or more client config resources failed to load' } : null
      });
    });

    return () => {
      cancelled = true;
    };
  }, [client, dtd, journalCode, refStyle, isJournal]);

  return state;
}
