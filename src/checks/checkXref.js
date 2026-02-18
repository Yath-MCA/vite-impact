/**
 * @file checkXref.js
 * @description Check xref/citation restrictions
 * Pure function - no React hooks
 * 
 * @param {Object} context - Check context
 * @param {Function} stageAlert - Alert staging function
 * @returns {boolean|null} true (pass), false (block), null (not applicable)
 */

export const checkXref = (context, stageAlert) => {
  const { keyCode, selection } = context;
  
  // Only check on delete/backspace
  if (keyCode !== 8 && keyCode !== 46) {
    return null;
  }
  
  const { 
    RG_INFO, 
    NODE, 
    PARENT 
  } = selection;
  
  const childrenClasses = RG_INFO?.ChildrenClass || [];
  const hasXrefInChildren = childrenClasses.includes('xref');
  const eLinkCount = RG_INFO?.eLinkCount || 0;
  
  // Check if node or parent is an xref
  const isNodeXref = NODE?.hasClass?.('xref');
  const isParentXref = PARENT?.hasClass?.('xref');
  
  if (isNodeXref || isParentXref || hasXrefInChildren || eLinkCount > 0) {
    // Check if external link vs citation
    const isExternalLink = eLinkCount > 0 && !hasXrefInChildren;
    const alertKey = isExternalLink ? 'Ignore_hyperlink_text' : 'Ignore_KeyEvent_XREFS';
    
    // Stage dialog alert for xrefs
    stageAlert('dialog', alertKey, { 
      override: false,
      title: 'Warning'
    });
    
    return false;
  }
  
  return null;
};

export default checkXref;
