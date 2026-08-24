import { getDocId } from './errorContext.js';

const FIVE_MIN_MS = 5 * 60 * 1000;

function storageKey() {
  return `xmleditor:${getDocId()}:ErrorList`;
}

function loadMap() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return new Map();
    const entries = JSON.parse(raw);
    return new Map(Array.isArray(entries) ? entries : []);
  } catch {
    return new Map();
  }
}

function saveMap(map) {
  localStorage.setItem(storageKey(), JSON.stringify([...map.entries()]));
}

/**
 * Record an error subject timestamp (cap 5, oldest evicted).
 * @param {string} subject
 * @param {number} [now]
 */
export function recordSubject(subject, now = Date.now()) {
  const map = loadMap();
  if (map.has(subject)) map.delete(subject);
  map.set(subject, now);
  while (map.size > 5) {
    const oldest = map.keys().next().value;
    map.delete(oldest);
  }
  saveMap(map);
}

/**
 * Skip send when last key === subject within 5 min, or map has subject within 5 min.
 * @param {string} subject
 * @param {number} [now]
 * @returns {boolean}
 */
export function shouldSkipSubject(subject, now = Date.now()) {
  const map = loadMap();
  if (map.size === 0) return false;

  const keys = [...map.keys()];
  const lastKey = keys[keys.length - 1];
  const lastTs = map.get(lastKey);
  if (lastKey === subject && now - lastTs < FIVE_MIN_MS) return true;

  if (map.has(subject) && now - map.get(subject) < FIVE_MIN_MS) return true;

  return false;
}
