import { describe, expect, it } from 'vitest';

describe('shared imports', () => {
  it('exposes common hooks, providers, utilities, constants, and plugins from shared folders', async () => {
    const hooks = await import('../../../src/shared/hooks/useOnlineStatus.js');
    const auth = await import('../../../src/shared/providers/AuthProvider.jsx');
    const client = await import('../../../src/shared/providers/ClientProvider.jsx');
    const sanitize = await import('../../../src/shared/utils/sanitizeHtml.js');
    const normalize = await import('../../../src/shared/utils/normalizeValidateResponse.js');
    const collections = await import('../../../src/shared/constants/docCollections.js');
    const sweetalert = await import('../../../src/shared/plugins/sweetalert/index.js');

    expect(hooks.useOnlineStatus).toBeTypeOf('function');
    expect(auth.AuthProvider).toBeTypeOf('function');
    expect(auth.useAuth).toBeTypeOf('function');
    expect(client.ClientProvider).toBeTypeOf('function');
    expect(client.useClient).toBeTypeOf('function');
    expect(sanitize.sanitizeHtml).toBeTypeOf('function');
    expect(normalize.normalizeValidateResponse).toBeTypeOf('function');
    expect(collections.DOC_COLLECTIONS).toBeDefined();
    expect(sweetalert.Swal).toBeDefined();
  });
});
