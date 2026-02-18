export type FieldOverride = Record<string, any>;

export type FieldVisibility = {
  visible?: boolean;
  byRole?: Record<string, boolean>;
  byClient?: Record<string, boolean>;
};

export type FieldConfig = {
  field: string;
  type: string;
  displayType?: string;
  overrides?: FieldOverride;
  visibility?: FieldVisibility;
  headerName?: string;
  hide?: boolean;
};

export type CollectionConfig = {
  collection: string;
  fields: FieldConfig[];
  client?: string;
  role?: string;
  overrides?: any;
};

export type Preset = {
  baseType?: string;
  displayType?: string;
  format?: string;
  filter?: string;
  sortable?: boolean;
  visible?: boolean;
};
