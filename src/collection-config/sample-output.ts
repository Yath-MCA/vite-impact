import { resolveCollectionConfig } from './resolver';
import { UNIQUE_FORMAT_CONFIG } from './presets';

type FieldConfig = { field: string; type: string; displayType?: string; overrides?: any; visibility?: any; headerName?: string };
export type CollectionConfig = {
  collection: string;
  fields: FieldConfig[];
  client?: string;
  role?: string;
};

export function resolveForShareAndInvite(client: string, role: string) {
  const collectionConfig = {
    collection: 'Shareandinvite',
    fields: [
      { field: 'status', type: 'string-format-1', displayType: 'badge' },
      { field: 'timeiso_c', type: 'date-format-1' },
      { field: 'allroles', type: 'array-chip' }
    ],
  } as any;

  return resolveCollectionConfig(collectionConfig, {
    presets: UNIQUE_FORMAT_CONFIG,
    client,
    role
  });
}

export default resolveForShareAndInvite;
