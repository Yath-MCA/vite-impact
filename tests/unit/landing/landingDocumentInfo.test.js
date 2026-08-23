import { describe, expect, it } from 'vitest';
import {
  buildCoverImageUrl,
  getPublicationTitleLabel
} from '../../../src/features/landing/landingDocumentInfo.js';

describe('landing document info', () => {
  it('labels journal validity data as Journal Title', () => {
    expect(getPublicationTitleLabel({ dtd: 'JATS-journalpublishing', journaltitle: 'PLOS One' })).toBe('Journal Title');
    expect(getPublicationTitleLabel({ type: 'journal', journaltitle: 'PLOS One' })).toBe('Journal Title');
  });

  it('labels book validity data as Book Title', () => {
    expect(getPublicationTitleLabel({ dtd: 'book', booktitle: 'Clinical Handbook' })).toBe('Book Title');
  });

  it('builds cover image URLs from bucket, client, and cover name', () => {
    expect(buildCoverImageUrl('abc123', 'lww', 'https://cdn.example/xmleditor/')).toBe(
      'https://cdn.example/xmleditor/_SUPPORT_FILES/LWW/cover/abc123.png'
    );
  });

  it('does not build cover URLs without a cover name or client', () => {
    expect(buildCoverImageUrl('', 'lww', 'https://cdn.example/xmleditor/')).toBeNull();
    expect(buildCoverImageUrl('abc123', '', 'https://cdn.example/xmleditor/')).toBeNull();
  });
});
