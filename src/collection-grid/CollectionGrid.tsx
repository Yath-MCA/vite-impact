import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { resolveCollectionConfig } from '../collection-config/resolver';
import { UNIQUE_FORMAT_CONFIG } from '../collection-config/presets';

type Props = {
  collectionConfig: any;
  rowData: any[];
  client?: string;
  role?: string;
};

export const CollectionGrid: React.FC<Props> = ({ collectionConfig, rowData, client, role }) => {
  const columnDefs = useMemo(() =>
    resolveCollectionConfig(collectionConfig, { presets: UNIQUE_FORMAT_CONFIG, client, role }),
    [collectionConfig, client, role]
  );

  const gridOptions = {
    defaultColDef: { sortable: true, filter: true, resizable: true, floatingFilter: true },
    columnDefs,
    rowData,
    pagination: true,
    paginationPageSize: 20
  } as any;

  return (
    <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
      <AgGridReact {...gridOptions} />
    </div>
  );
};

export default CollectionGrid;
