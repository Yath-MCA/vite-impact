/**
 * @file checkDeleteBackspace.js
 * @description Check delete and backspace key restrictions
 * Pure function - no React hooks
 * 
 * @param {Object} context - Check context
 * @param {Function} stageAlert - Alert staging function
 * @returns {boolean|null} true (pass), false (block), null (not applicable)
 */

import { EDITOR_CONFIG } from '../config/editor/editorConfig';

export const checkDeleteBackspace = (context, stageAlert) => {
  const { 
    keyCode, 
    selection,
    cursor,
    utils
  } = context;
  
  const isDelete = keyCode === 46;
  const isBackspace = keyCode === 8;
  const isEnter = keyCode === 13;
  
  // Only check delete/backspace/enter keys
  if (!isDelete && !isBackspace && !isEnter) {
    return null;
  }
  
  const { 
    NODE, 
    NODE_CLAS, 
    PARENT, 
    PARENT_CLAS, 
    PARENTS_CLAS_LIST,
    ISstartOfBlock,
    ISEndOfBlock,
    IsList
  } = selection;
  
  // Check for special classes
  if (NODE_CLAS === 'pistart' || NODE_CLAS === 'delimt') {
    return false;
  }
  
  // Check start/end of block for backspace/delete
  if ((ISEndOfBlock || ISstartOfBlock) && !selection.NODE_FULL_SELECT) {
    const parentsList = PARENTS_CLAS_LIST || [];
    
    // Handle end of block (delete key)
    if (ISEndOfBlock && isDelete) {
      // Check for ice-ins class
      if (/ice-ins/gi.test(NODE_CLAS)) {
        // Special handling for insert/delete elements
        return null; // Let through with special handling
      }
      
      // Check if last element
      const hasNext = NODE?.getNext?.();
      const hasPrev = NODE?.getPrevious?.();
      
      if ((!hasNext || !hasPrev) && !IsList) {
        if (NODE_CLAS === 'p' && NODE?.$?.textContent === '') {
          NODE.remove?.();
          return false;
        }
        return false;
      }
      
      // Enter key in title with section after
      if (isEnter) {
        const hasNextSec = NODE?.hasNext?.() && 
          NODE.getNext?.()?.hasClass?.('sec');
        
        if (NODE_CLAS === 'title' && hasNextSec) {
          // Allow paragraph insert after
          return null; // Allow with special handling
        }
      }
    }
    
    // Handle start of block (backspace key)
    if (ISstartOfBlock && isBackspace) {
      // Check for ice-del restrictions
      const parentsClasses = parentsList.join(' ');
      if (/ice-del.*p.*body/gi.test(parentsClasses) && isBackspace) {
        return false;
      }
      
      // Check if last element
      const hasNext = NODE?.getNext?.();
      const hasPrev = NODE?.getPrevious?.();
      const isTemplateRestrict = EDITOR_CONFIG.restrictionClasses.TEMPLATE.includes(NODE_CLAS);
      
      if ((!hasNext || !hasPrev || isTemplateRestrict) && !IsList) {
        if (isBackspace) {
          if (NODE_CLAS === 'p' && NODE?.$?.textContent === '') {
            NODE.remove?.();
            return false;
          }
          return false;
        }
        
        // Delete on alt-text
        if (isDelete && /alt-text/gi.test(NODE_CLAS)) {
          return false;
        }
      }
      
      // Section title with previous section
      if (PARENT_CLAS === 'sec' && NODE_CLAS === 'title' && PARENT) {
        const prevSec = PARENT?.getPrevious?.();
        if (prevSec?.hasClass?.('sec')) {
          // Allow paragraph insert before
          return null;
        }
      }
    }
  }
  
  // Full node selection restrictions
  if (selection.NODE_FULL_SELECT) {
    const isInsertTag = NODE_TAG => NODE_TAG === 'INSERT';
    const restrictedSet = new Set([
      'p', 'title', 'caption', 'article-title', 'subject',
      'alt-title', 'name', 'contrib', 'degrees',
      'surname', 'given-names', 'aff', 'corresp',
      'abstract', 'title-group', 'sec'
    ]);
    
    const isCaption = PARENT_CLAS === 'caption';
    const isInRestricted = restrictedSet.has(NODE_CLAS);
    const isFullSelect = !isInsertTag(selection.NODE_TAG) && isInRestricted;
    const isClientOSO = window.DOC_INFO?.get?.('CLIENT')?.toUpperCase() === 'OSO';
    
    if ((isFullSelect || isCaption) && (!isCaption || !isClientOSO)) {
      stageAlert('toaster', 'Ignore_Full_Format', { type: 'warning' });
      return false;
    }
  }
  
  // Math, comment, multi-para restrictions
  if (selection.IsMath || selection.IsComment || 
      selection.IsMultiPara || 
      (selection.IsRef && selection.IsMultiElm) ||
      selection.IsFullTable ||
      (selection.RESTRICT_CLIENT_IS && 
       !parentsList.toLocaleString().match('table-wrap-foot'))) {
    
    // Clean up comments with del elements
    if (selection.IsComment) {
      const delElements = NODE?.$?.querySelectorAll?.('del');
      delElements?.forEach?.(del => {
        // unwrap logic here
      });
    }
    
    return utils.cancelEvent({ stop: () => {}, preventDefault: () => {} });
  }
  
  return null;
};

export default checkDeleteBackspace;
