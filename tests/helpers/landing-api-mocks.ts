import type { Page, Route } from '@playwright/test';

export const TEST_VALIDATE_KEY = 'test-validate-key-001';

export const defaultValidatePayload = {
  docid: 'DOC-E2E-001',
  status: 'active',
  client: 'oup',
  username: 'author@example.com',
  role: '1',
  rolename: 'Author',
  projecttitle: 'E2E Test Project',
  xmltohtmlres: {
    articletitle: 'E2E Test Article',
    journaltitle: 'E2E Test Journal',
    authorgroup: 'Test Author',
    figcount: 2,
    tablecount: 1,
    Query: 0
  }
};

function parseJsonData(postData: string | null): Record<string, unknown> {
  if (!postData) return {};
  const match = postData.match(/jsondata=([^&]+)/);
  if (!match) return {};
  try {
    return JSON.parse(decodeURIComponent(match[1])) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Mock urlvalidity success for validateurl landing flow. */
export async function mockUrlValiditySuccess(
  page: Page,
  dataOverrides: Record<string, unknown> = {}
) {
  await page.route('**/urlvalidity**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        r: 1,
        data: { ...defaultValidatePayload, ...dataOverrides }
      })
    });
  });
}

/** Mock linksharing check/grant for AGREE & CONTINUE session start. */
export async function mockLinkShareSessionGrant(page: Page) {
  await page.route('**/linksharing**', async (route: Route) => {
    const payload = parseJsonData(route.request().postData());
    const process = String(payload.process || '');

    if (process === 'check') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ r: 1 })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ r: 1 })
    });
  });

  await page.route('**/getdocs**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [{
          docid: defaultValidatePayload.docid,
          session_id: '48291037',
          session_start_time: String(Date.now()),
          session_end_time: '0',
          docstatus: '1'
        }]
      })
    });
  });
}

/** Mock userlogin for dashboard login flow. */
export async function mockUserLoginSuccess(page: Page) {
  await page.route('**/userlogin**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        username: 'author@example.com',
        userId: 'user-e2e-001',
        cred: 1,
        apikey: 'e2e-api-key'
      })
    });
  });
}

export async function mockUserLoginFailure(page: Page) {
  await page.route('**/userlogin**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        username: 'author@example.com',
        cred: 0
      })
    });
  });
}

/** Clear validateurl tab lock / session handshake keys between tests. */
export async function clearLandingStorage(page: Page) {
  await page.addInitScript(() => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith('xmleditor:')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();
  });
}
