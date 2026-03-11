import React, { useMemo, useState, useEffect } from 'react';
import CollectionGrid from './CollectionGrid';
import { resolveCollectionConfig } from '../../../collection-config/resolver';
import { UNIQUE_FORMAT_CONFIG } from '../../../collection-config/presets';

// Simple demo using mock data (replace with API fetch in production)
export default function DemoApp() {
  const [rows, setRows] = useState<any[]>([]);
  const collectionConfig = {
    collection: 'Shareandinvite',
    fields: [
      { field: 'status', type: 'string-format-1', displayType: 'badge' },
      { field: 'timeiso_c', type: 'date-format-1' },
      { field: 'allroles', type: 'array-chip' }
    ]
  };

  useEffect(() => {
    // mock data
    setRows([
      { _id: 1, status: 'Active', timeiso_c: new Date().toISOString(), allroles: ['Editor', 'Reviewer'] },
      { _id: 2, status: 'Pending', timeiso_c: new Date().toISOString(), allroles: ['Author'] }
    ]);
  }, []);

  const columns = useMemo(() => resolveCollectionConfig(collectionConfig, { presets: UNIQUE_FORMAT_CONFIG }), [collectionConfig]);

  // We pass collectionConfig + rows directly to grid for demo
  return (
    <CollectionGrid collectionConfig={collectionConfig} rowData={rows} />
  );
}

export { DemoApp };
