import { describe, it, expect } from 'vitest';
import {
  LandingMessageKey,
  getLandingMessage
} from '../../../src/features/landing/messages/index.js';

describe('getLandingMessage', () => {
  it('returns SEND_REQUEST with Send Request / Cancel buttons', () => {
    const msg = getLandingMessage(LandingMessageKey.SEND_REQUEST);
    expect(msg).not.toBeNull();
    expect(msg.button1).toBe('Send Request');
    expect(msg.button2).toBe('Cancel');
    expect(msg.text).toContain('Send Request');
  });

  it('fills ACCESS_DENIED %1% via find/replace', () => {
    const msg = getLandingMessage(LandingMessageKey.ACCESS_DENIED, {
      find: '%1%',
      replace: 'owner rejected'
    });
    expect(msg.text).toContain('owner rejected');
    expect(msg.text).not.toContain('%1%');
  });

  it('interpolates FILE_DELETED mail tokens', () => {
    const msg = getLandingMessage(LandingMessageKey.FILE_DELETED, {
      MAIL: 'help@example.com',
      TEXT: 'Support'
    });
    expect(msg.text).toContain('mailto:help@example.com');
    expect(msg.text).toContain('>Support<');
  });

  it('returns null for unknown keys', () => {
    expect(getLandingMessage('NOT_A_REAL_KEY')).toBeNull();
  });
});
