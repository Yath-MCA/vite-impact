import { describe, it, expect } from 'vitest';
import {
  shouldValidateMultiUser,
  validateEmailInput,
  resolveEmailId,
  applySelectedEmailToResData
} from '../../../src/services/session/sessionSource.js';

describe('multi-user email validation', () => {
  it('shouldValidateMultiUser when active and multiple emails', () => {
    expect(
      shouldValidateMultiUser({
        status: 'active',
        emailto: ['a@b.com', 'c@d.com']
      })
    ).toBe(true);
  });

  it('shouldValidateMultiUser is false for single email', () => {
    expect(
      shouldValidateMultiUser({
        status: 'active',
        emailto: ['a@b.com']
      })
    ).toBe(false);
  });

  it('shouldValidateMultiUser is false when not active', () => {
    expect(
      shouldValidateMultiUser({
        status: 'expired',
        emailto: ['a@b.com', 'c@d.com']
      })
    ).toBe(false);
  });

  it('validateEmailInput accepts configured email', async () => {
    const result = await validateEmailInput('A@B.COM', ['a@b.com', 'c@d.com']);
    expect(result).toBeUndefined();
  });

  it('validateEmailInput rejects unknown email', async () => {
    const result = await validateEmailInput('x@y.com', ['a@b.com']);
    expect(result).toContain('not valid');
  });

  it('resolveEmailId prefers selectedEmail', () => {
    expect(
      resolveEmailId(
        { emailto: ['a@b.com', 'c@d.com'], username: 'a@b.com' },
        { selectedEmail: 'c@d.com' }
      )
    ).toBe('c@d.com');
  });

  it('shouldValidateMultiUser reads status from raw when flat status missing', () => {
    expect(
      shouldValidateMultiUser({
        emailto: ['a@b.com', 'c@d.com'],
        raw: { status: 'active' }
      })
    ).toBe(true);
  });

  it('applySelectedEmailToResData merges email fields', () => {
    const merged = applySelectedEmailToResData(
      { docid: 'D1', emailto: ['a@b.com', 'c@d.com'] },
      'c@d.com'
    );
    expect(merged.emailto).toBe('c@d.com');
    expect(merged.username).toBe('c@d.com');
    expect(merged.MAIL_ID).toBe('c@d.com');
  });
});
