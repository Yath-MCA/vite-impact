let loadPromise;

export function loadCKEditor() {
  if (typeof window !== 'undefined' && window.CKEDITOR) {
    return Promise.resolve(window.CKEDITOR);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-ckeditor4]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.CKEDITOR), { once: true });
      existing.addEventListener('error', () => {
        loadPromise = null;
        reject(new Error('Failed to load CKEditor'));
      }, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = '/ckeditor4/ckeditor.js';
    script.async = true;
    script.dataset.ckeditor4 = 'true';
    script.onload = () => resolve(window.CKEDITOR);
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load CKEditor'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
