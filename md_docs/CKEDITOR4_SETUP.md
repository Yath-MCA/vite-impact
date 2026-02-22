# CKEditor 4 Local Build Setup

This project uses CKEditor 4 with a local build (no CDN).

## Setup Instructions

### 1. Download CKEditor 4

Download CKEditor 4 Full Package (Standard or Full) from:
- https://ckeditor.com/ckeditor-4/download/

Or use the CKEditor 4 Presets Builder:
- https://ckeditor.com/cke4/presets

### 2. Extract Files

Extract the downloaded CKEditor 4 package to:
```
public/ckeditor4/
```

Your folder structure should look like:
```
public/
  ckeditor4/
    ckeditor.js          (main entry point)
    config.js            (configuration)
    contents.css         (content styles)
    lang/                (language files)
    plugins/             (plugin directory)
    skins/               (skin directory)
    ...
```

### 3. Build Custom Package (Optional)

To create a custom build with specific plugins:

1. Go to https://ckeditor.com/cke4/builder
2. Select desired plugins
3. Download your custom build
4. Extract to `public/ckeditor4/`

### 4. Verify Installation

Run the development server:
```bash
npm run dev
```

Navigate to `/editor` and verify the CKEditor 4 instance loads correctly.

## Configuration

The CKEditor 4 configuration is in two places:

### 1. Component Configuration (`src/pages/EditorPage.jsx`)
Runtime toolbar and UI settings

### 2. Global Configuration (`public/ckeditor4/config.js`)
Global CKEditor 4 settings (if the file exists)

## Default Toolbar Configuration

The editor is configured with a full toolbar including:
- Document operations (Source, Save, Preview, Print, Templates)
- Clipboard operations (Cut, Copy, Paste, Undo, Redo)
- Basic formatting (Bold, Italic, Underline, Strike)
- Paragraph formatting (Lists, Indent, Alignment)
- Insert operations (Links, Images, Tables, Media)
- Styles (Format, Font, Colors)
- Tools (Maximize, Show Blocks)

## Plugins Enabled

The configuration includes these extra plugins:
- `autogrow` - Auto-expanding editor height
- `image2` - Enhanced image plugin
- `embed` and `autoembed` - Media embedding
- `uploadimage` - Image upload support
- `uploadfile` - File upload support
- `copyformatting` - Format painter
- `div` - Div containers
- `find` - Find and replace
- `forms` - Form elements
- `iframe` - IFrame insertion
- `link` - Enhanced linking
- `liststyle` - List styling
- `magicline` - Magic line for insertion
- `pagebreak` - Page breaks
- `pastefromword` - Word paste cleanup
- `preview` - Preview mode
- `print` - Print functionality
- `save` - Save button
- `scayt` - Spell check
- `showblocks` - Show block elements
- `smiley` - Smiley insertion
- `sourcedialog` - Source code dialog
- `tableresize` - Table resizing
- `tableselection` - Table selection
- `tabletools` - Table tools
- `templates` - Content templates
- `uicolor` - UI color picker
- `widget` - Widget support
- `wsc` - WebSpellChecker

## Document Templates

The editor includes 4 document section templates:
1. Introduction Section
2. Section 1
3. Section 2
4. Conclusion Section

Access these via the "Templates" button in the toolbar.

## Troubleshooting

### CKEditor not loading
- Verify `public/ckeditor4/ckeditor.js` exists
- Check browser console for 404 errors
- Ensure the script tag in `index.html` points to the correct path

### Plugins not working
- Verify plugins exist in `public/ckeditor4/plugins/`
- Check browser console for plugin load errors
- Rebuild CKEditor with required plugins

### Styling issues
- Check `src/index.css` for CKEditor 4 custom styles
- Verify CSS specificity isn't overriding editor styles
- Check for dark mode compatibility

## Build Notes

When building for production:
- Ensure `public/ckeditor4/` is included in the build output
- The directory should be copied as-is to `dist/ckeditor4/`
- No bundling is performed on CKEditor 4 files

## License

CKEditor 4 is licensed under GPL, LGPL, and MPL. See CKEditor's license for details.
