import { describe, it, expect } from 'vitest';
import envLocal from '../../../env/env.local.js';

describe('env.local.js BUCKET_URL', () => {
  it('matches the local xmleditor bucket the app code expects', () => {
    expect(envLocal.BUCKET_URL).toBe('/xmleditor/');
  });
});
