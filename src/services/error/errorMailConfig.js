import { isLiveDomain } from './errorContext.js';

/** Both ErrorShareMail and meta ErrorLogTrace paths (impactweb ErrorMail_Module.js). */
export const MAIL_TEMPLATE_ID = '610a4cd05e311ebaf978ef78';

/**
 * Encoded MAIL_DETAIL.Error_Mail from impactweb src/js/index.js.
 * Decode with atob at runtime — do not hard-code plaintext addresses.
 */
export const ERROR_MAIL_ENCODED = {
  from: {
    live: 'aW1wYWN0Lm5vdGlmaWNhdGlvbkBuZXdnZW4uY28=',
    default: 'aW1wYWN0Lm5vdGlmaWNhdGlvbkBuZXdnZW4uY28='
  },
  to: {
    live: 'c2l2YWt1bWFyc0BuZXdnZW4uY28=',
    default: 'c2l2YWt1bWFyc0BuZXdnZW4uY28='
  },
  bcc: {
    live: 'eWFzYXIubW9oaWRlZW5Abmt3LnB1YixkdXJhaXJhamFuLmduYW5hbUBua3cucHVi',
    default: 'eWFzYXIubW9oaWRlZW5Abmt3LnB1YixkdXJhaXJhamFuLmduYW5hbUBua3cucHVi'
  }
};

/**
 * @returns {{ from: string, to: string, bcc: string }}
 */
export function getSenderReceiverIds() {
  const encoded = ERROR_MAIL_ENCODED;
  return {
    from: atob(encoded.from.default),
    to: atob(isLiveDomain() ? encoded.to.live : encoded.to.default),
    bcc: atob(isLiveDomain() ? encoded.bcc.live : encoded.bcc.default)
  };
}
