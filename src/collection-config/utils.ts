/** Deep merge two or more objects. Arrays are replaced. Objects are merged. */
export function mergeDeep<T>(target: T, ...sources: any[]): T {
  if (!sources.length) return target;
  const source = sources.shift();
  if (isPlainObject(target) && isPlainObject(source)) {
    for (const key in source) {
      if (source[key] === undefined) continue;
      if (isPlainObject(source[key])) {
        if (!((target as any)[key] && isPlainObject((target as any)[key]))) {
          (target as any)[key] = {};
        }
        (target as any)[key] = mergeDeep((target as any)[key], source[key]);
      } else {
        (target as any)[key] = source[key];
      }
    }
  } else {
    Object.assign(target as any, source);
  }
  return mergeDeep(target, ...sources);
}

export function isPlainObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === 'object' && v.constructor === Object;
}

/** Get nested field value by path like 'titleinfo.doctitle' */
export function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

/** Header display name for a field path (capitalize last token) */
export function headerFromPath(path: string): string {
  const parts = path.split('.');
  const last = parts[parts.length - 1] || path;
  return last.charAt(0).toUpperCase() + last.slice(1);
}
