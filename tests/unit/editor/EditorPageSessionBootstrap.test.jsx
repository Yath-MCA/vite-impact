import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('ckeditor4-react', () => ({
  CKEditor: () => <div>ckeditor</div>
}));

vi.mock('../../../src/services/session/useEditorSessionBootstrap.js', () => ({
  useEditorSessionBootstrap: vi.fn()
}));

vi.mock('../../../src/services/editorConfig/useClientConfig.js', () => ({
  useClientConfig: vi.fn(() => ({
    toggles: { layoutMode: 'two-column' },
    error: null
  }))
}));

vi.mock('../../../src/services/editorConfig/useEditorContent.js', () => ({
  useEditorContent: vi.fn(() => ({
    loading: false,
    error: null,
    content: '<p>Loaded</p>'
  }))
}));

vi.mock('../../../src/shared/utils/loadCKEditor.js', () => ({
  loadCKEditor: vi.fn(() => Promise.resolve())
}));

vi.mock('../../../src/services/editorConfig/editorCssLoader.js', () => ({
  buildEditorCssUrls: vi.fn(() => []),
  loadEditorCss: vi.fn(() => Promise.resolve())
}));

vi.mock('../../../src/services/editorConfig/proofPreviewAssets.js', () => ({
  createProofPreviewAdapter: vi.fn(() => ({})),
  loadPageMap: vi.fn(() => Promise.resolve({ ok: true, assets: {}, pageMap: { pages: [] } })),
  resolvePageForElement: vi.fn(() => 1)
}));

vi.mock('../../../src/services/session/tabPresence.js', () => ({
  claimValidateTab: vi.fn(() => Promise.resolve({ ok: true })),
  releaseValidateTab: vi.fn(),
  startTabPresenceListener: vi.fn(),
  stopTabPresence: vi.fn()
}));

vi.mock('../../../src/features/editor/messages/registerEditorAlertBridge.js', () => ({
  registerEditorAlertBridge: vi.fn()
}));

vi.mock('../../../src/services/download/index.js', () => ({
  initDownloadService: vi.fn()
}));

vi.mock('../../../src/services/error/index.js', () => ({
  initErrorOps: vi.fn(),
  errorLogTrace: vi.fn()
}));

vi.mock('../../../src/features/editor/tour/useGuidedTour.js', () => ({
  useGuidedTour: () => ({
    steps: [],
    run: false,
    stepIndex: 0,
    handleJoyrideCallback: vi.fn(),
    startTour: vi.fn()
  })
}));

vi.mock('react-joyride', () => ({
  Joyride: () => null
}));

vi.mock('../../../src/features/editor/components/Navbar1', () => ({ default: () => <div>navbar1</div> }));
vi.mock('../../../src/features/editor/components/Navbar2', () => ({ default: ({ titleParent }) => <div>{titleParent}</div> }));
vi.mock('../../../src/features/editor/components/SharedMiddleColumn', () => ({ default: () => null }));
vi.mock('../../../src/features/editor/components/EditorFooter', () => ({ default: () => null }));
vi.mock('../../../src/features/editor/modules/ModuleManager', () => ({ default: () => null }));
vi.mock('../../../src/features/editor/components/NavigationPanel', () => ({ default: () => null }));
vi.mock('../../../src/features/editor/components/ThumbnailPanel', () => ({ default: () => null }));
vi.mock('../../../src/features/editor/components/PdfPreview', () => ({ default: () => null }));

import { useEditorSessionBootstrap } from '../../../src/services/session/useEditorSessionBootstrap.js';
import { useEditorContent } from '../../../src/services/editorConfig/useEditorContent.js';
import EditorPage from '../../../src/features/editor/pages/EditorPage.jsx';
import { EditorProvider } from '../../../src/context/EditorContext.jsx';
import { LayoutProvider } from '../../../src/context/LayoutContext.jsx';
import { ModuleProvider } from '../../../src/context/ModuleContext.jsx';

function renderEditor() {
  return render(
    <LayoutProvider>
      <ModuleProvider>
        <EditorProvider>
          <EditorPage />
        </EditorProvider>
      </ModuleProvider>
    </LayoutProvider>
  );
}

describe('EditorPage session bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/editor?docid=DOC1');
  });

  it('blocks editor content load while session bootstrap is loading', () => {
    useEditorSessionBootstrap.mockReturnValue({
      loading: true,
      ready: false,
      error: null,
      session: null
    });

    renderEditor();

    expect(screen.getByText('Initializing editor session...')).toBeInTheDocument();
    expect(useEditorContent).not.toHaveBeenCalledWith('DOC1');
  });

  it('shows session error when bootstrap fails', () => {
    useEditorSessionBootstrap.mockReturnValue({
      loading: false,
      ready: false,
      error: { reason: 'verify_failed', message: 'Your editor session is no longer active.' },
      session: null
    });

    renderEditor();

    expect(screen.getByText('Unable to open editor session.')).toBeInTheDocument();
    expect(screen.getByText('Your editor session is no longer active.')).toBeInTheDocument();
  });

  it('loads editor content after bootstrap is ready', () => {
    useEditorSessionBootstrap.mockReturnValue({
      loading: false,
      ready: true,
      error: null,
      session: {
        docId: 'DOC1',
        validateKey: 'KEY1',
        sessionSource: {
          client: 'LWW',
          dtd: 'JATS',
          type: 'journals',
          shorttitle: 'Journal',
          roleId: '1',
          roleName: 'Author',
          projecttitle: 'Project',
          raw: {}
        }
      }
    });

    renderEditor();

    expect(useEditorContent).toHaveBeenCalledWith('DOC1');
    expect(screen.getByText('Project')).toBeInTheDocument();
  });
});
