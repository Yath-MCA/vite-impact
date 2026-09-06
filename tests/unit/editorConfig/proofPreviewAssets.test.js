import { describe, expect, it, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  createProofPreviewAdapter,
  loadPageMap,
  normalizePageMap,
  resolvePageForElement,
  resolveProofAssets
} from '../../../src/services/editorConfig/proofPreviewAssets.js';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    isCancel: vi.fn(() => false)
  }
}));

describe('proofPreviewAssets', () => {
  beforeEach(() => {
    axios.get.mockReset();
  });

  it('derives pagemap and proof page URLs from the editor content path', () => {
    const assets = resolveProofAssets({
      docId: 'DOC123',
      contentUrl: 'http://localhost/xmleditor/DOC123/DOC123.html'
    });

    expect(assets.pageMapUrl).toBe('http://localhost/xmleditor/DOC123/pagemap.json');
    expect(assets.supportingBaseUrl).toBe('http://localhost/xmleditor/DOC123/supporting/');
    expect(assets.imageUrlForPage(3)).toBe('http://localhost/xmleditor/DOC123/supporting/page3.png');
  });

  it('normalizes page lists and element mappings from nested pagemap data', () => {
    const assets = resolveProofAssets({
      docId: 'DOC123',
      contentUrl: 'http://localhost/xmleditor/DOC123/DOC123.html'
    });

    const pageMap = normalizePageMap({
      entries: [
        { elementId: 'sec-1', page: 2 },
        { element_id: 'sec-2', pageNumber: 4 }
      ]
    }, assets);

    expect(pageMap.pages).toHaveLength(4);
    expect(pageMap.pages[3].imageUrl).toBe('http://localhost/xmleditor/DOC123/supporting/page4.png');
    expect(pageMap.elementToPage).toEqual({ 'sec-1': 2, 'sec-2': 4 });
    expect(pageMap.pageToElement).toEqual({ 2: 'sec-1', 4: 'sec-2' });
  });

  it('loads pagemap JSON and returns normalized proof pages', async () => {
    axios.get.mockResolvedValue({
      status: 200,
      data: { pages: [{ elementId: 'p1', page: 1 }, { elementId: 'p2', page: 2 }] }
    });

    const result = await loadPageMap({
      docId: 'DOC123',
      contentUrl: 'http://localhost/xmleditor/DOC123/DOC123.html'
    });

    expect(axios.get).toHaveBeenCalledWith('http://localhost/xmleditor/DOC123/pagemap.json', expect.objectContaining({
      responseType: 'json',
      validateStatus: expect.any(Function)
    }));
    expect(result.ok).toBe(true);
    expect(result.pageMap.pages).toHaveLength(2);
  });

  it('returns fallback page paths when pagemap is missing', async () => {
    axios.get.mockResolvedValue({ status: 404, data: '' });

    const result = await loadPageMap({
      docId: 'DOC123',
      contentUrl: 'http://localhost/xmleditor/DOC123/DOC123.html'
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.pageMap.pages).toHaveLength(4);
    expect(result.pageMap.pages[0].imageUrl).toBe('http://localhost/xmleditor/DOC123/supporting/page1.png');
  });

  it('resolves exact and nearest element page mappings', () => {
    const pageMap = {
      elementToPage: {
        sec1: 1,
        sec3: 3
      }
    };

    expect(resolvePageForElement('sec3', pageMap, 1)).toBe(3);
    expect(resolvePageForElement('sec4', pageMap, 1)).toBe(3);
    expect(resolvePageForElement('abstract', pageMap, 2)).toBe(2);
  });

  it('creates a page-image adapter', () => {
    const adapter = createProofPreviewAdapter();
    const page = { imageUrl: '/supporting/page1.png', thumbnailUrl: '/supporting/thumb1.png' };

    expect(adapter.mode).toBe('page-image');
    expect(adapter.getPageSource(page)).toBe('/supporting/page1.png');
    expect(adapter.getThumbnailSource(page)).toBe('/supporting/thumb1.png');
  });
});
