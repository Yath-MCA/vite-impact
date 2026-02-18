/**
 * @file editorConfig.js
 * @description CKEditor configuration constants and lookup tables
 * Centralized configuration for key event restrictions and editor behavior
 */

export const EDITOR_CONFIG = {
  version: '4.0.0-refactored',
  
  finderXPath: {
    JATS: {
      FM: '.front',
      BM: '.body',
      EM: '.back',
      APP: '.app-group',
      ABS: '.abstract',
      ABS_PARA: '.abstract .p',
      KWD: '.kwd',
      KWD_GROUP: '.kwd-group',
      ABR: '.def,.term',
      ABR_GROUP: '.def-list',
      TBL_CELL: 'td',
      FN_EN: '.fn-group',
      FIG_TAB: '.table-wrap,.fig',
      FIG_TAB_CAP: '.caption',
      TBL_FN: '.fn',
      EXT: '.disp-quote',
      FM_PARA: '.front .p',
      FIND_CHAP: '.FIND_CHAP',
      FIND_PART: '.FIND_PART'
    },
    BITS: {
      FM: '.front-matter',
      BM: '.book-body',
      EM: '.book-back',
      ABS: '.abstract',
      ABS_PARA: '.abstract .p',
      KWD: '.kwd',
      KWD_GROUP: '.kwd-group',
      ABR: '.def,.term',
      ABR_GROUP: '.def-list',
      APP: '.app-group',
      FN_EN: '.fn-group',
      FIG_TAB: '.table-wrap,.fig',
      TBL_CELL: 'td',
      TBL_FN: '.fn',
      FIG_TAB_CAP: '.caption',
      EXT: '.disp-quote',
      FM_PARA: '.named-book-part-body',
      FIND_CHAP: '.book-part[book-part-type]',
      FIND_PART: '.book-part[book-part-type]'
    }
  },

  keyConfig: {
    CUT: 1114200,
    COPY: 1114179,
    PASTE: [1114198, 3342422],
    BKSP_SPACE_DEL: [8, 46, 32],
    ENTER: [13],
    MOVEMENT: ['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'ArrowDown'],
    MOVEMENT_CODES: [33, 34, 36, 35, 38, 39, 37, 40],
    ARROW: ['ArrowUp', 'ArrowRight', 'ArrowLeft', 'ArrowDown'],
    ARROW_CODES: [38, 39, 37, 40],
    COMBINED_ARROW: [1114148, 1114147]
  },

  restrictionClasses: {
    BEG_PARA_BKSPACE: ['title', 'caption', 'p', 'li'],
    DEFAULT_KEY: ['graphic', 'inline-graphic', 'ice-del', 'day', 'month', 'year'],
    FULL_FORMAT: [
      'article-categories', 'title-group', 'title', 'subtitle', 'alt-title',
      'article-title', 'subj-group', 'subject', 'caption', 'p', 'kwd',
      'author-notes', 'corresp', 'aff', 'fn', 'source', 'alt-text',
      'day', 'month', 'year', 'mixed-citation'
    ],
    FORMAT: [
      'surname', 'given-names', 'x', 'institution', 'publisher-name',
      'publisher-loc', 'year', 'volume', 'issue', 'fpage', 'lpage',
      'collab', 'role', 'degrees', 'prefix', 'suffix', 'author-comment',
      'person-group', 'ext-link', 'conf-name', 'ice-del', 'source',
      'alt-text', 'history', 'day', 'month', 'year', 'mixed-citation'
    ],
    TEMPLATE: [
      'title', 'kwd', 'surname', 'given-names', 'corresp', 'alt-text',
      'def-list', 'term', 'def'
    ],
    LINK_FORMULA_IMG: ['formula', 'xref', 'uri', 'email', 'ext-link', 'graphic'],
    TITLE_ARR: [
      'article-categories', 'title-group', 'title', 'subtitle',
      'alt-title', 'article-title', 'subj-group', 'subject'
    ]
  },

  restrictMap: {
    '.fn': '.p',
    '.ref': '.mixed-citation',
    '.contrib': '.name',
    '.title-group': '.article-title',
    '.contrib-group': '.aff',
    '.ref-list': '.title',
    '.sec': '.title',
    '.author-notes': '.corresp',
    '.ack': '.title',
    '.article-categories': '.subj-group',
    '.subj-group': '.subject',
    '.kwd-group': '.kwd',
    '.abstract': '.sec',
    '.caption': '.p',
    '.fig': '.alt-text',
    '.pub-date': '.day'
  },

  allowedKeys: {
    Tab: 9,
    Shift: 16,
    Control: 17,
    CapsLock: 20,
    Escape: 27,
    PageUp: 33,
    PageDown: 34,
    Home: 36,
    End: 35,
    ArrowLeft: 37,
    ArrowRight: 39,
    ArrowUp: 38,
    ArrowDown: 40,
    Meta: 91,
    ctrl: 1114129,
    save: 1114195,
    Alt: 18,
    copy: 1114179,
    refresh: 3342352,
    Undo: 1114202,
    Redo: 1114201,
    Find: 1114182
  },

  disallowedKeys: {
    0: 48, 1: 49, 2: 50, 3: 51, 4: 52, 5: 53, 6: 54, 7: 55, 8: 56, 9: 57,
    a: 65, b: 66, c: 67, d: 68, e: 69, f: 70, g: 71, h: 72, i: 73, j: 74,
    k: 75, l: 76, m: 77, n: 78, o: 79, p: 80, q: 81, r: 82, s: 83, t: 84,
    u: 85, v: 86, w: 87, x: 88, y: 89, z: 90,
    'numpad 0': 96, 'numpad 1': 97, 'numpad 2': 98, 'numpad 3': 99,
    'numpad 4': 100, 'numpad 5': 101, 'numpad 6': 102, 'numpad 7': 103,
    'numpad 8': 104, 'numpad 9': 105,
    multiply: 106, add: 107, subtract: 109, 'decimal point': 110, divide: 111,
    'semi-colon': 186, 'equal sign': 187, comma: 188, dash: 189, period: 190,
    'forward slash': 191, 'grave accent': 192, 'open bracket': 219,
    'back slash': 220, 'close braket': 221, 'single quote': 222
  },

  shortcutKeys: {
    1114182: 'find',
    1114184: 'replace'
  },

  formatKeys: {
    chrome: {
      BOLD: 1114178,
      ITALICS: 1114185,
      UNDERLINE: 1114197,
      SUP: 1114299,
      SUB: 3342523
    },
    firefox: {
      BOLD: 1114178,
      ITALICS: 1114185,
      UNDERLINE: 1114197,
      SUP: 1114173,
      SUB: 3342397
    }
  },

  alertMessages: [
    'deleteMutliPara',
    'curOptRevertError',
    'Ignore_KeyEvent_Math',
    'Ignore_KeyEvent_FM',
    'Ignore_KeyEvent_NoteQry',
    'Ignore_KeyEvent_XREFS',
    'Ignore_Full_Format',
    'Last_char',
    'Ignore_ref_action',
    'Ignore_KeyEvent_Link'
  ],

  tagConfig: {
    span: {
      IGNORE_CLASS: ['inline-formula', 'ckcommentsfull', 'para-merge']
    },
    div: {
      IGNORE_CLASS: ['disp-formula']
    },
    ERROR_CLASS: {
      'inline-formula': 'Ignore_KeyEvent_Math_Retain',
      'disp-formula': 'Ignore_KeyEvent_Math_Retain',
      ckcommentsfull: 'Ignore_KeyEvent_NoteQry',
      'para-merge': 'Ignore_KeyEvent_PMerge',
      default: 'Ignore_KeyEvent_FM'
    },
    SELECTOR_QRY: '.inline-formula,.disp-formula,[data-class=ckcommentsfull], [data-class=para-merge]'
  }
};

// Create lookup sets for performance
export const createLookupSets = () => {
  const sets = {};
  
  sets.FULL_FORMAT_RESTRICT = new Set(EDITOR_CONFIG.restrictionClasses.FULL_FORMAT);
  sets.DEFAULT_KEY_RESTRICT = new Set(EDITOR_CONFIG.restrictionClasses.DEFAULT_KEY);
  sets.FORMAT_RESTRICT = new Set(EDITOR_CONFIG.restrictionClasses.FORMAT);
  sets.TEMPLATE_RESTRICT = new Set(EDITOR_CONFIG.restrictionClasses.TEMPLATE);
  sets.LINK_FORMULA_IMG = new Set(EDITOR_CONFIG.restrictionClasses.LINK_FORMULA_IMG);
  sets.ALLOWED_KEYS = new Set(Object.values(EDITOR_CONFIG.allowedKeys));
  sets.DISALLOWED_KEYS = new Set(Object.values(EDITOR_CONFIG.disallowedKeys));
  sets.BKSP_SPACE_DEL = new Set(EDITOR_CONFIG.keyConfig.BKSP_SPACE_DEL);
  sets.ENTER_CODES = new Set(EDITOR_CONFIG.keyConfig.ENTER);
  
  return sets;
};

export const LOOKUP_SETS = createLookupSets();

export default EDITOR_CONFIG;
