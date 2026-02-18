// Central unique-format-config presets used by the resolver
export const UNIQUE_FORMAT_CONFIG = {
  "string-format-1": {
    baseType: "string",
    filter: "setFilter",
    sortable: true,
    visible: true
  },
  "date-format-1": {
    baseType: "date",
    displayType: "datetime",
    format: "DD-MMM-YYYY HH:mm",
    filter: "agDateColumnFilter",
    sortable: true
  },
  "array-chip": {
    baseType: "array",
    displayType: "chip-list",
    filter: "textFilter",
    sortable: false
  }
};

export default UNIQUE_FORMAT_CONFIG;
