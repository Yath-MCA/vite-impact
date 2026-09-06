import axios from 'axios';
import { buildDocumentContentUrl } from './editorConfigConstants.js';

export const PROOF_PREVIEW_MODES = {
  PAGE_IMAGE: 'page-image'
};

const DEFAULT_PAGE_COUNT = 4;

function ensureTrailingSlash(value) {
  return String(value || '').replace(/\/?$/, '/');
}

export function resolveProofAssets({ docId, contentUrl } = {}) {
  const sourceUrl = contentUrl || (docId ? buildDocumentContentUrl(docId) : '');
  const normalizedDocId = String(docId || '').trim();
  const fallbackBase = normalizedDocId ? sourceUrl.replace(new RegExp(`${normalizedDocId}\\.html$`), '') : sourceUrl;
  const baseUrl = ensureTrailingSlash(fallbackBase.replace(/[^/]*$/, ''));

  return {
    mode: PROOF_PREVIEW_MODES.PAGE_IMAGE,
    docId: normalizedDocId,
    baseUrl,
    pageMapUrl: `${baseUrl}pagemap.json`,
    supportingBaseUrl: `${baseUrl}supporting/`,
    imageUrlForPage: (pageNumber) => `${baseUrl}supporting/page${pageNumber}.png`
  };
}

function normalizePageNumber(value) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function collectPageNumbers(value, pages = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectPageNumbers(item, pages));
    return pages;
  }

  if (!value || typeof value !== 'object') return pages;

  const page = normalizePageNumber(
    value.page ?? value.pageNo ?? value.pageNumber ?? value.pdfId ?? value.pdfpage ?? value.id
  );
  if (page) pages.add(page);

  Object.values(value).forEach((item) => {
    if (item && typeof item === 'object') collectPageNumbers(item, pages);
  });

  return pages;
}

function collectElementMappings(value, mappings = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectElementMappings(item, mappings));
    return mappings;
  }

  if (!value || typeof value !== 'object') return mappings;

  const elementId = value.elementId ?? value.element_id ?? value.elId ?? value.id ?? value.xid;
  const page = normalizePageNumber(
    value.page ?? value.pageNo ?? value.pageNumber ?? value.pdfId ?? value.pdfpage
  );

  if (elementId && page) {
    mappings.push({ elementId: String(elementId), page });
  }

  Object.values(value).forEach((item) => {
    if (item && typeof item === 'object') collectElementMappings(item, mappings);
  });

  return mappings;
}

export function normalizePageMap(rawMap, assets = resolveProofAssets()) {
  const pageNumbers = Array.from(collectPageNumbers(rawMap)).sort((a, b) => a - b);
  const fallbackPageCount = pageNumbers.length ? Math.max(...pageNumbers) : DEFAULT_PAGE_COUNT;
  const pages = Array.from({ length: fallbackPageCount }, (_, index) => {
    const number = index + 1;
    return {
      id: `page-${number}`,
      pageNumber: number,
      label: `Page ${number}`,
      imageUrl: assets.imageUrlForPage(number),
      thumbnailUrl: assets.imageUrlForPage(number)
    };
  });

  const elementToPage = {};
  const pageToElement = {};
  collectElementMappings(rawMap).forEach(({ elementId, page }) => {
    elementToPage[elementId] = page;
    if (!pageToElement[page]) pageToElement[page] = elementId;
  });

  return {
    raw: rawMap || null,
    pages,
    elementToPage,
    pageToElement
  };
}

export async function loadPageMap({ docId, contentUrl, signal } = {}) {
  const assets = resolveProofAssets({ docId, contentUrl });
  try {
    const response = await axios.get(assets.pageMapUrl, {
      responseType: 'json',
      signal,
      validateStatus: () => true
    });

    if (response.status < 200 || response.status >= 300) {
      return {
        ok: false,
        status: response.status,
        assets,
        pageMap: normalizePageMap(null, assets)
      };
    }

    return {
      ok: true,
      status: response.status,
      assets,
      pageMap: normalizePageMap(response.data, assets)
    };
  } catch (error) {
    if (axios.isCancel?.(error) || error.name === 'CanceledError' || error.name === 'AbortError') {
      throw error;
    }

    return {
      ok: false,
      status: 0,
      assets,
      pageMap: normalizePageMap(null, assets),
      error
    };
  }
}

export function createProofPreviewAdapter({ mode = PROOF_PREVIEW_MODES.PAGE_IMAGE } = {}) {
  if (mode !== PROOF_PREVIEW_MODES.PAGE_IMAGE) {
    throw new Error(`Unsupported proof preview mode: ${mode}`);
  }

  return {
    mode,
    getPageSource(page) {
      return page?.imageUrl || '';
    },
    getThumbnailSource(page) {
      return page?.thumbnailUrl || page?.imageUrl || '';
    }
  };
}

export function resolvePageForElement(elementId, pageMap, fallbackPage = 1) {
  if (!elementId || !pageMap?.elementToPage) return fallbackPage;
  if (pageMap.elementToPage[elementId]) return pageMap.elementToPage[elementId];

  const keys = Object.keys(pageMap.elementToPage);
  const numericSuffix = Number.parseInt(String(elementId).match(/\d+/)?.[0], 10);
  if (!Number.isFinite(numericSuffix)) return fallbackPage;

  let nearest = null;
  keys.forEach((key) => {
    const keyNumber = Number.parseInt(String(key).match(/\d+/)?.[0], 10);
    if (!Number.isFinite(keyNumber) || keyNumber > numericSuffix) return;
    if (!nearest || keyNumber > nearest.keyNumber) {
      nearest = { keyNumber, page: pageMap.elementToPage[key] };
    }
  });

  return nearest?.page || fallbackPage;
}
