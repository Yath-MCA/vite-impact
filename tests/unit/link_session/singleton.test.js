import { describe, it, expect } from 'vitest';
import { loadLinkSessionModule } from './loadCore.mjs';

describe('LinkSessionModule singleton', () => {
  it('returns the same instance across getInstance calls', () => {
    const LinkSessionModule = loadLinkSessionModule();
    const first = LinkSessionModule.getInstance();
    const second = LinkSessionModule.getInstance();
    expect(first).toBe(second);
  });
});
