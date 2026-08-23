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

  it('renders configured welcome subtitle below the IMPACT title', () => {
    const source = landingUiSource();

    expect(source).toContain('metaInfo.subtitle');
  });

  it('uses accessible 13px Inter UI styling for landing body sections', () => {
    const source = landingUiSource();

    expect(source).toContain("fontFamily: 'Inter UI, sans-serif'");
    expect(source).toContain("fontSize: '13px'");
    expect(source).toContain('text-gray-800 dark:text-gray-200 flex gap-2.5 leading-relaxed');
    expect(source).toContain('text-gray-700 dark:text-gray-300 leading-relaxed');
    expect(source).toContain('text-amber-950 dark:text-amber-100 leading-relaxed');
    expect(source).toContain('text-primary-700 hover:underline font-semibold');
  });
});
