import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const landingUiSource = () =>
  readFileSync(resolve(process.cwd(), 'src/features/landing/pages/LandingUI.jsx'), 'utf8');

describe('LandingUI layout', () => {
  it('gives instructions more desktop reading width than document details', () => {
    const source = landingUiSource();

    expect(source).toContain('lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]');
    expect(source).not.toContain('lg:grid-cols-2');
  });

  it('applies white-nav accent hover to header help icons', () => {
    const source = landingUiSource();

    expect(source).toContain('`${navTheme.linkClass} group`');
    expect(source).toContain("navTheme.isDarkNav ? 'w-4 h-4' : 'w-4 h-4 group-hover:text-primary-700'");
  });
});
