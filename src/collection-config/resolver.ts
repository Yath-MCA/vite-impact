import { getValueByPath, mergeDeep } from './utils';
import { UNIQUE_FORMAT_CONFIG } from './presets';
/** Basic field config for resolver */
type FieldConfig = {
  field: string;
  type: string;
  displayType?: string;
  overrides?: any;
  visibility?: {
    visible?: boolean;
    byRole?: Record<string, boolean>;
    byClient?: Record<string, boolean>;
  };
  headerName?: string;
};

type CollectionConfig = {
  collection: string;
  fields: FieldConfig[];
  client?: string;
  role?: string;
  overrides?: any;
};

type ResolvedColumn = any;

export function resolveCollectionConfig(
  collectionConfig: CollectionConfig,
  options: {
    presets?: Record<string, any>;
    globalDefaults?: any;
    client?: string;
    role?: string;
  } = {}
): ResolvedColumn[] {
  const { presets = UNIQUE_FORMAT_CONFIG, globalDefaults = { sortable: true, resizable: true, filter: true }, client, role } = options;
  const fields = collectionConfig.fields ?? [];

  // Simple in-memory memoization
  const cacheKey = JSON.stringify({ collection: collectionConfig.collection, client, role, fields });
  const cache = (resolveCollectionConfig as any)._cache ?? new Map<string, ResolvedColumn[]>();
  (resolveCollectionConfig as any)._cache = cache;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const presetsCtx = { ...presets };
  const finalColumns = fields.map((f) => {
    const preset = presetsCtx?.[f.type] ?? {};
    let column: any = {
      field: f.field,
      headerName: f.headerName ?? f.field.split('.').slice(-1)[0],
      filter: preset.filter ?? globalDefaults.filter,
      sortable: preset.sortable ?? globalDefaults.sortable,
      resizable: globalDefaults.resizable,
      hide: false,
      valueGetter: (params: any) => {
        return f.field ? getValueByPath(params.data, f.field) : undefined;
      }
    };

    // Display type
    if (f.displayType) {
      if (f.displayType === 'badge') column.cellRenderer = 'StatusBadgeRenderer';
      if (f.displayType === 'chip-list') column.cellRenderer = 'ChipRenderer';
    }

    // Merge overrides
    if (f.overrides) {
      column = mergeDeep({}, column, f.overrides);
    }

    // Visibility by client/role
    const vis = f.visibility ?? {};
    if (typeof vis.visible === 'boolean') column.hide = !vis.visible;
    if (client && vis.byClient && Object.prototype.hasOwnProperty.call(vis.byClient, client)) {
      column.hide = !vis.byClient[client];
    }
    if (role && vis.byRole && Object.prototype.hasOwnProperty.call(vis.byRole, role)) {
      column.hide = !vis.byRole[role];
    }

    // Date handling: if preset is date, apply date formatter
    if (preset.baseType === 'date' || preset.displayType === 'datetime') {
      column.filter = column.filter ?? 'agDateColumnFilter';
      if (!column.valueGetter) column.valueGetter = (p: any) => getValueByPath(p.data, f.field);
      // A simple date formatter can be applied by a valueFormatter if needed
      column.valueFormatter = (p: any) => {
        const v = p.value;
        if (!v) return '';
        const date = new Date(v);
        if (isNaN(date.getTime())) return v;
        const day = String(date.getDate()).padStart(2, '0');
        const month = date.toLocaleString('en-US', { month: 'short' });
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}`;
      };
    }

    // Support nested path like 'titleinfo.doctitle'
    return column;
  });

  cache.set(cacheKey, finalColumns);
  return finalColumns;
}

export default resolveCollectionConfig;
