/**
 * @file checkFormatting.js
 * @description Check formatting restrictions for key events
 * Pure function - no React hooks
 * 
 * @param {Object} context - Check context
 * @param {Function} stageAlert - Alert staging function
 * @returns {boolean|null} true (pass), false (block), null (not applicable)
 */

export const checkFormatting = (context, stageAlert) => {
  const { 
    keyState, 
    selection, 
    cursor, 
    lookupSets,
    utils 
  } = context;
  
  // Get range info
  const rangeInfo = selection.RG_INFO || {};
  const childrenClasses = rangeInfo.ChildrenClass || [];
  
  // Check for restricted classes
  const isFullFormatRestrict = utils.hasRestrictedClass(
    childrenClasses, 
    lookupSets.FULL_FORMAT_RESTRICT
  );
  
  const isFormatRestrict = utils.hasRestrictedClass(
    childrenClasses,
    lookupSets.FORMAT_RESTRICT
  );
  
  const isDefaultKeyRestrict = utils.hasRestrictedClass(
    childrenClasses,
    lookupSets.DEFAULT_KEY_RESTRICT
  );
  
  // Check keyword restriction
  const isKwdRestrict = () => {
    const nodeClas = selection.NODE_CLAS;
    const parentClas = selection.PARENT_CLAS;
    const isKwd = [nodeClas, parentClas].includes('kwd');
    const isInClone = [
      selection.NODE_CLONE_TEXT,
      selection.PARENT_CLONE_TEXT
    ].includes(selection.SEL_TEXT_CLONE);
    
    return isKwd && isInClone && !selection.IsFormat_Range;
  };
  
  // Check template placeholder
  const templatePlaceholders = [
    'GivenName SurName',
    'SurName GivenName',
    'keyword',
    'Degree',
    'GivenName',
    'SurName'
  ];
  
  const isTemplateWord = templatePlaceholders.includes(selection.NODE_CLONE_TEXT);
  
  // Check if full node
  const isFullNode = () => {
    if (selection.IsFullNode) return true;
    
    const hasChildRestrict = childrenClasses.some(cls =>
      lookupSets.FULL_FORMAT_RESTRICT.has(cls)
    );
    
    const isEqual = !selection.SEL_TEXT_CLONE ||
      selection.SEL_TEXT_CLONE === selection.NODE_CLONE_TEXT ||
      selection.SEL_TEXT_CLONE === selection.PARENT_CLONE_TEXT ||
      selection.SEL_TEXT_CLONE === selection.PARENT?.$?.textContent;
    
    return hasChildRestrict && isEqual;
  };
  
  // Check format key
  if (keyState.isFormatKey || keyState.isFormatButton) {
    // Allow in format range at start
    if (selection.IsFormat_Range && selection.NODE_IDX === 0 && isFullNode()) {
      selection.IsFormat_Range = false;
    }
    
    // Check for restrictions
    const isRefPlainText = selection.IsRef &&
      selection.IsRef.hasAttribute?.('data-ins-type') &&
      selection.IsRef.getAttribute('data-ins-type') === 'plain_text' &&
      selection.IsRef.hasAttribute?.('data-new');
    
    const isRestricted = isDefaultKeyRestrict ||
      isKwdRestrict() ||
      selection.IsTableMultiCell ||
      selection.IsMultiPara ||
      selection.IsXref ||
      isFullFormatRestrict ||
      (isFormatRestrict && isFullNode());
    
    if (isRestricted && !isRefPlainText) {
      stageAlert('toaster', 'Ignore_Full_Format', { type: 'warning' });
      return false;
    }
  }
  
  // Not a formatting key or no restrictions
  return null;
};

export default checkFormatting;
