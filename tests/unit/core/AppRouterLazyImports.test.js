import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../../src/core/router/AppRouter.jsx'),
  'utf8'
);

describe('AppRouter lazy imports', () => {
  it('does not statically import dashboard routes or editor providers', () => {
    expect(source).not.toMatch(/import DashboardRoutes from/);
    expect(source).not.toMatch(/import \{ DashboardProvider \}/);
    expect(source).not.toMatch(/from ['"].*EditorContext['"]/);
    expect(source).not.toMatch(/from ['"].*LayoutContext['"]/);
    expect(source).not.toMatch(/from ['"].*ModuleContext['"]/);
  });

  it('lazy-loads marketing landing separately from validateurl', () => {
    expect(source).toMatch(/MarketingLandingPage/);
    expect(source).toMatch(/ValidateUrlPage/);
  });
});
