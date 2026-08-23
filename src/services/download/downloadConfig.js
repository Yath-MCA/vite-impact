/**
 * Port of legacy DOWNLOAD_PDF_ACTIONS / DOWNLOAD_FILES from
 * impactweb dialogModules/Download_Module.js
 */

export const I_RGEN_PDF = 'i_track_pdf';
export const I_RGEN_XML = 'xml';
export const DOWNLOAD_CACHE_NAMESPACE = 'workflow-download';
export const DOWNLOAD_APP_KEY = 'xmleditor';
export const SUPPORT_FILES_FOLDER = '_SUPPORT_FILES';
export const PARSE_ERROR_TOKEN = '_parsingerror.';
export const PROJECT_NAME_TIMEOUT_MS = 30000;
export const INIT_RETRY_MS = 500;
export const SPINNER_WATCH_MS = 300000;
export const SPINNER_TIMEOUT_SEC = 64;
export const LANDING_POPUP_CLOSE_MS = 7500;

export const DOWNLOAD_PDF_ACTIONS = Object.freeze({
  Help_Guide_pdf: {
    kind: 'help',
    preload: true,
    menu_id: null,
    file_suffix: '',
    roleBased: true,
    clienBased: true,
    alert: {
      error: 'fileDownloadFail',
      pass: 'fileDownloadSuccess'
    },
    default: 'IMPACT_Help_Guide.pdf',
    'impact-ops-dev.newgen.co:8081': 'IMPACT_Help_Guide_UAT.pdf'
  },
  Help_FAQ_pdf: {
    kind: 'help',
    preload: true,
    menu_id: null,
    file_suffix: '',
    roleBased: false,
    clienBased: true,
    alert: {
      error: 'fileDownloadFail',
      pass: 'fileDownloadSuccess'
    },
    default: 'IMPACT_FAQ.pdf',
    'impact-ops-dev.newgen.co:8081': 'IMPACT_FAQ_UAT.pdf'
  },
  Equation_Help_pdf: {
    kind: 'help',
    preload: true,
    menu_id: null,
    file_suffix: '',
    roleBased: false,
    clienBased: false,
    alert: {
      error: 'fileDownloadFail',
      pass: 'fileDownloadSuccess'
    },
    default: 'IMPACT_Equation_Help_Guide.pdf',
    'impact-ops-dev.newgen.co:8081': 'IMPACT_Equation_Help_Guide_UAT.pdf'
  },
  Help_Guide_Cleanup_pdf: {
    kind: 'help',
    ignore: true,
    preload: true,
    menu_id: null,
    file_suffix: '',
    roleBased: false,
    clienBased: false,
    alert: {
      error: 'fileDownloadFail',
      pass: 'fileDownloadSuccess'
    },
    default: 'IMPACT_Help_Guide_Cleanup.pdf',
    'impact-ops-dev.newgen.co:8081': 'IMPACT_Help_Guide_Cleanup_UAT.pdf'
  },
  tips_tricks_pdf: {
    kind: 'help',
    preload: true,
    menu_id: null,
    file_suffix: '',
    roleBased: false,
    clienBased: ['LWW'],
    alert: {
      error: 'fileDownloadFail',
      pass: 'fileDownloadSuccess',
      type: 'TOASTER'
    },
    default: 'IMPACT_Tips_and_Tricks.pdf',
    'impact-ops-dev.newgen.co:8081': 'IMPACT_Tips_and_Tricks_UAT.pdf'
  },
  i_track_pdf: {
    kind: 'workflow',
    preload: false,
    menu_id: 'i_track_pdf',
    file_suffix: '_updated_correction.pdf',
    alert: {
      error: 'GeneratePDF_Error',
      pass: 'fileDownloadSuccess',
      pre_warn: 'track_pdf_pre_warn'
    }
  },
  track_pdf: {
    kind: 'workflow',
    preload: true,
    menu_id: 'track_pdf',
    file_suffix: '_updated_correction.pdf',
    alert: {
      error: 'GeneratePDF_Error',
      pass: 'fileDownloadSuccess'
    }
  },
  proof_pdf: {
    kind: 'workflow',
    preload: true,
    menu_id: 'proof_pdf',
    file_suffix: '',
    alert: {
      error: 'fileDownloadFail',
      pass: 'fileDownloadSuccess',
      type: 'TOASTER',
      pass_2: 'DownloadSuccess_proof_pdf',
      pass_2_type: 'warning',
      type_2: 'module'
    }
  },
  ce_track_pdf: {
    kind: 'workflow',
    preload: true,
    menu_id: 'ce_track_pdf',
    file_suffix: '',
    alert: {
      error: 'fileDownloadFail',
      pass: 'fileDownloadSuccess',
      type: 'TOASTER'
    }
  },
  xml: {
    kind: 'workflow',
    preload: false,
    menu_id: 'Generate_XML',
    file_suffix: '_updated.xml',
    alert: {
      error: 'GenerateXML_Error',
      pass: 'fileDownloadSuccess',
      type: 'TOASTER'
    }
  },
  Generate_XML: {
    kind: 'workflow',
    preload: false,
    menu_id: 'Generate_XML',
    file_suffix: '_updated.xml',
    alert: {
      error: 'GenerateXML_Error',
      pass: 'fileDownloadSuccess',
      type: 'TOASTER'
    }
  },
  package: {
    kind: 'workflow',
    preload: false,
    menu_id: '',
    file_suffix: '.zip',
    alert: {
      error: 'fileDownloadFail',
      pass: 'fileDownloadSuccess',
      type: 'TOASTER'
    }
  }
});
