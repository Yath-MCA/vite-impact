export function createStorageMock() {
  const store = new Map();

  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    }
  };
}

export function installBrowserStorageMocks() {
  const sessionStorage = createStorageMock();
  const localStorage = createStorageMock();

  globalThis.sessionStorage = sessionStorage;
  globalThis.localStorage = localStorage;

  return { sessionStorage, localStorage };
}
