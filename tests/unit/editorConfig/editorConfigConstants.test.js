import { describe, it, expect, beforeEach } from 'vitest';
import {
  editorConfigEnv,
  buildDocumentContentUrl,
  buildClientConfigBasePath
} from '../../../src/services/editorConfig/editorConfigConstants.js';

describe('editorConfigConstants', () => {
  const originalBucketUrl = editorConfigEnv.bucketUrl;
  const originalAssetsBase = editorConfigEnv.assetsBase;
  const originalConfigVersion = editorConfigEnv.configVersion;

  beforeEach(() => {
    editorConfigEnv.bucketUrl = originalBucketUrl;
    editorConfigEnv.assetsBase = originalAssetsBase;
    editorConfigEnv.configVersion = originalConfigVersion;
  });

  describe('buildDocumentContentUrl', () => {
    it('builds a bucket/docId/docId.html URL when bucketUrl has a trailing slash', () => {
      editorConfigEnv.bucketUrl = 'http://localhost/xmleditor/';
      expect(buildDocumentContentUrl('DOC123')).toBe('http://localhost/xmleditor/DOC123/DOC123.html');
    });

    it('normalizes a bucketUrl without a trailing slash', () => {
      editorConfigEnv.bucketUrl = 'http://localhost/xmleditor';
      expect(buildDocumentContentUrl('DOC123')).toBe('http://localhost/xmleditor/DOC123/DOC123.html');
    });
  });

  describe('buildClientConfigBasePath', () => {
    beforeEach(() => {
      editorConfigEnv.assetsBase = '/assets';
      editorConfigEnv.configVersion = 'v1';
    });

    it('maps BITS dtd to the books folder', () => {
      expect(buildClientConfigBasePath({ dtd: 'BITS', client: 'OXMEDO' }))
        .toBe('/assets/v1/config/books/oxmedo/');
    });

    it('maps any non-BITS dtd (e.g. JATS) to the journals folder', () => {
      expect(buildClientConfigBasePath({ dtd: 'JATS', client: 'PLOS' }))
        .toBe('/assets/v1/config/journals/plos/');
    });

    it('lowercases the client name regardless of input case', () => {
      expect(buildClientConfigBasePath({ dtd: 'JATS', client: 'AcS' }))
        .toBe('/assets/v1/config/journals/acs/');
    });
  });
});
