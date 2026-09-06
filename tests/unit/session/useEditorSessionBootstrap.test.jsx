import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('../../../src/services/session/editorSessionBootstrap.js', () => ({
  bootstrapEditorSession: vi.fn()
}));

import { bootstrapEditorSession } from '../../../src/services/session/editorSessionBootstrap.js';
import { useEditorSessionBootstrap } from '../../../src/services/session/useEditorSessionBootstrap.js';

function Probe({ options }) {
  const state = useEditorSessionBootstrap(options);
  if (state.loading) return <div>loading</div>;
  if (state.error) return <div>error:{state.error.reason}</div>;
  return <div>ready:{state.session.docId}</div>;
}

describe('useEditorSessionBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes ready state after successful bootstrap', async () => {
    bootstrapEditorSession.mockResolvedValueOnce({
      ok: true,
      docId: 'DOC1',
      sessionId: 'SID1'
    });

    render(<Probe options={{ docId: 'DOC1' }} />);

    expect(screen.getByText('loading')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('ready:DOC1')).toBeInTheDocument());
  });

  it('exposes error state after failed bootstrap', async () => {
    bootstrapEditorSession.mockResolvedValueOnce({
      ok: false,
      reason: 'verify_failed',
      message: 'Your editor session is no longer active.',
      redirectTo: '/validateurl'
    });

    render(<Probe options={{ docId: 'DOC1' }} />);

    await waitFor(() => expect(screen.getByText('error:verify_failed')).toBeInTheDocument());
  });
});
