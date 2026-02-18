/**
 * CKEditor 4 Custom Build Configuration
 * This file defines the editor configuration for local use
 */

window.CKEDITOR_CONFIG = {
  // Basic toolbar configuration
  toolbar: [
    { name: 'document', items: ['Source', '-', 'Save', 'NewPage', 'Preview', 'Print', '-', 'Templates'] },
    { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'] },
    { name: 'editing', items: ['Find', 'Replace', '-', 'SelectAll', '-', 'Scayt'] },
    { name: 'forms', items: ['Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField'] },
    '/',
    { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat'] },
    { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl', 'Language'] },
    { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
    { name: 'insert', items: ['Image', 'Flash', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe'] },
    '/',
    { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
    { name: 'colors', items: ['TextColor', 'BGColor'] },
    { name: 'tools', items: ['Maximize', 'ShowBlocks'] },
    { name: 'about', items: ['About'] }
  ],

  // Enable all plugins locally
  extraPlugins: 'autogrow,image2,embed,autoembed,mentions,emoji,uploadimage,uploadfile,balloonpanel,balloontoolbar,copyformatting,div,find,flash,forms,iframe,link,liststyle,magicline,pagebreak,pastefromword,preview,print,save,scayt,selectall,showblocks,smiley,sourcedialog,tableresize,tableselection,tabletools,templates,uicolor,widget,wsc',

  // File upload configuration
  filebrowserUploadUrl: '/upload',
  filebrowserImageUploadUrl: '/upload/image',
  
  // Height and auto-grow
  height: 600,
  autoGrow_minHeight: 400,
  autoGrow_maxHeight: 800,
  autoGrow_onStartup: true,

  // Remove plugins that might conflict
  removePlugins: 'elementspath,resize',

  // Allow all content
  allowedContent: true,

  // Enable SCAYT (Spell Check As You Type)
  scayt_autoStartup: true,

  // Language
  language: 'en',

  // Skin
  skin: 'moono-lisa',

  // UI Color
  uiColor: '#f0f0f0',

  // Enter mode (paragraphs)
  enterMode: 2, // CKEDITOR.ENTER_BR
  shiftEnterMode: 1, // CKEDITOR.ENTER_P

  // Entities
  entities: false,
  entities_latin: false,
  entities_greek: false,

  // Disable ACF (Advanced Content Filter) to allow all content
  allowedContent: true,

  // Enable all HTML tags
  extraAllowedContent: '*[*]{*}(*)',

  // Custom styles
  stylesSet: [
    { name: 'Heading 1', element: 'h1' },
    { name: 'Heading 2', element: 'h2' },
    { name: 'Heading 3', element: 'h3' },
    { name: 'Heading 4', element: 'h4' },
    { name: 'Heading 5', element: 'h5' },
    { name: 'Heading 6', element: 'h6' },
    { name: 'Paragraph', element: 'p' },
    { name: 'Document Section', element: 'div', attributes: { 'class': 'document-section' } },
    { name: 'Introduction', element: 'div', attributes: { 'class': 'section-introduction' } },
    { name: 'Section 1', element: 'div', attributes: { 'class': 'section-1' } },
    { name: 'Section 2', element: 'div', attributes: { 'class': 'section-2' } },
    { name: 'Conclusion', element: 'div', attributes: { 'class': 'section-conclusion' } }
  ],

  // Templates for document sections
  templates: 'document_sections',
  templates_files: ['/ckeditor4/templates.js'],
  templates_replaceContent: false,

  // Enable table resize
  tableResize: {
    minWidth: 50,
    minHeight: 20
  }
};

// Define custom templates
if (typeof CKEDITOR !== 'undefined') {
  CKEDITOR.addTemplates('document_sections', {
    imagesPath: '/ckeditor4/images/',
    templates: [
      {
        title: 'Introduction Section',
        image: 'introduction.gif',
        description: 'Document introduction section',
        html: '<div class="section-introduction" data-segment="introduction"><h2>Introduction</h2><p>Add your introduction content here.</p></div>'
      },
      {
        title: 'Section 1',
        image: 'section1.gif',
        description: 'First main section',
        html: '<div class="section-1" data-segment="section-1"><h2>Section 1</h2><p>Add section 1 content here.</p></div>'
      },
      {
        title: 'Section 2',
        image: 'section2.gif',
        description: 'Second main section',
        html: '<div class="section-2" data-segment="section-2"><h2>Section 2</h2><p>Add section 2 content here.</p></div>'
      },
      {
        title: 'Conclusion Section',
        image: 'conclusion.gif',
        description: 'Document conclusion section',
        html: '<div class="section-conclusion" data-segment="conclusion"><h2>Conclusion</h2><p>Add your conclusion content here.</p></div>'
      }
    ]
  });
}
