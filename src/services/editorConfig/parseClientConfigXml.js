export const CLIENT_CONFIG_DEFAULTS = Object.freeze({
  layoutMode: 'default',
  readOnlyLayoutMode: 'default',
  figCap: null,
  tabCap: null
});

/**
 * Mirrors impactweb's SET_EDITOR_LAYOUT_CONFIG + Generate_Items reads
 * (src/js/_initialScriptLoader.js MetaConfig.handleResponse) against
 * this project's fetched config.xml. Never throws — always returns a
 * usable toggles object, defaulting whatever it can't find.
 */
export function parseClientConfigXml(xmlDoc) {
  const result = { ...CLIENT_CONFIG_DEFAULTS };

  if (!xmlDoc || typeof xmlDoc.querySelector !== 'function') {
    return result;
  }

  try {
    const layoutNode = xmlDoc.querySelector('[name="editor6Layout"]');
    if (layoutNode) {
      if (layoutNode.getAttribute('editor6') === 'three-column') {
        result.layoutMode = 'three-column';
      }
      const readOnly = layoutNode.getAttribute('read-only') || layoutNode.getAttribute('readOnly');
      if (readOnly) {
        result.readOnlyLayoutMode = readOnly;
      }
    }

    const generateNode = xmlDoc.querySelector('[name="Generate_Items"]');
    if (generateNode) {
      result.figCap = generateNode.getAttribute('figCap') || null;
      result.tabCap = generateNode.getAttribute('tabCap') || null;
    }
  } catch {
    return { ...CLIENT_CONFIG_DEFAULTS };
  }

  return result;
}
