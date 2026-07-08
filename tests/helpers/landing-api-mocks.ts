import type { Page, Route, Request } from '@playwright/test';

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

export function parseJsonData(postData: string | null): Record<string, unknown> {
  if (!postData) return {};
  const match = postData.match(/jsondata=([^&]+)/);
  if (!match) return {};
  try {
    return JSON.parse(decodeURIComponent(match[1])) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function parseLinkSharePayload(request: Request): Record<string, unknown> {
  return parseJsonData(request.postData());
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

/** Pre-seed tab lock so claimValidateTab fails (duplicate tab). */
export async function seedDuplicateTabLock(page: Page, docId = defaultValidatePayload.docid) {
  await page.addInitScript((id) => {
    localStorage.setItem(
      `xmleditor:tablock:${id}`,
      JSON.stringify({ tabId: 'other-tab-id', heartbeat: Date.now() })
    );
  }, docId);
}

/** Stub reCAPTCHA enterprise for PLOS IP auth flow. */
export async function stubRecaptchaEnterprise(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { grecaptcha: unknown }).grecaptcha = {
      enterprise: {
        ready: (cb: () => void) => cb(),
        execute: async () => 'test-recaptcha-token'
      }
    };
  });
}

/** Mock urlvalidity success for validateurl landing flow. */
export async function mockUrlValiditySuccess(
  page: Page,
  dataOverrides: Record<string, unknown> = {},
  responseOverrides: Record<string, unknown> = {}
) {
  await page.route('**/urlvalidity**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        r: 1,
        ...responseOverrides,
        data: { ...defaultValidatePayload, ...dataOverrides }
      })
    });
  });
}

/** Mock urlvalidity failure (expired, denied, etc.). */
export async function mockUrlValidityFailure(
  page: Page,
  {
    r = 1,
    status,
    message
  }: { r?: number; status?: string; message?: string } = {}
) {
  await page.route('**/urlvalidity**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        r,
        message,
        data: {
          ...defaultValidatePayload,
          ...(status ? { status } : {})
        }
      })
    });
  });
}

export async function mockUrlValidityIpDenied(page: Page) {
  await mockUrlValidityFailure(page, { r: 4 });
}

/** Mock linksharing check/grant for AGREE & CONTINUE session start. */
export async function mockLinkShareSessionGrant(page: Page) {
  let lastSessionId = '48291037';
  let lastSessionStartTime = String(Date.now());

  await page.route('**/linksharing**', async (route: Route) => {
    const payload = parseJsonData(route.request().postData());
    const process = String(payload.process || '');

    if (payload.session_id) {
      lastSessionId = String(payload.session_id);
    }
    if (payload.session_start_time) {
      lastSessionStartTime = String(payload.session_start_time);
    }

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
          session_id: lastSessionId,
          session_start_time: lastSessionStartTime,
          session_end_time: '0',
          docstatus: '1'
        }]
      })
    });
  });
}

/** Mock blocked session (r: 0) on check. */
export async function mockLinkShareBlocked(page: Page) {
  await page.route('**/linksharing**', async (route: Route) => {
    const payload = parseJsonData(route.request().postData());
    if (String(payload.process) === 'check') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          r: 0,
          requeststatus: 0,
          requestid: 0,
          request_send_time: 0
        })
      });
      return;
    }
    await route.continue();
  });
}

/** Mock denied access (r: 2) on check. */
export async function mockLinkShareDenied(page: Page) {
  await page.route('**/linksharing**', async (route: Route) => {
    const payload = parseJsonData(route.request().postData());
    if (String(payload.process) === 'check') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ r: 2, remarks: 'Not allowed' })
      });
      return;
    }
    await route.continue();
  });
}

/** Mock poll request status process. */
export async function mockPollRequestStatus(page: Page, result: Record<string, unknown> = { r: 1 }) {
  await page.route('**/linksharing**', async (route: Route) => {
    const payload = parseJsonData(route.request().postData());
    if (String(payload.process) === 'getrequeststatus_process') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(result)
      });
      return;
    }
    await route.continue();
  });
}

export async function mockPlosCaptchaSuccess(page: Page) {
  await page.route('**/verifycaptcha**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ r: 1 })
    });
  });
}

export async function mockPlosOtpFlow(page: Page, { verifySuccess = true } = {}) {
  await page.route('**/generatetokenotpandsendemail**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ r: 1, id: 'otp-gen-id-001' })
    });
  });

  await page.route('**/verifyaccesscode**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(verifySuccess ? { r: 1 } : { r: 0 })
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

export async function mockUserLoginInvalidEmail(page: Page) {
  await page.route('**/userlogin**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ cred: 1 })
    });
  });
}

/** Track whether urlvalidity was called (for browser gate tests). */
export async function trackUrlValidityCalls(page: Page) {
  const state = { count: 0 };
  await page.route('**/urlvalidity**', async (route: Route) => {
    state.count += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ r: 1, data: defaultValidatePayload })
    });
  });
  return state;
}
