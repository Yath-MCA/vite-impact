import React, { useState, useEffect, useMemo } from 'react';
import QueryBuilder from '../dashboard/doc-finder/QueryBuilder';
import DocsGrid from '../dashboard/doc-finder/DocsGrid';
import FetchToolbar from '../dashboard/doc-finder/FetchToolbar';
import { fetchDocs } from '../../services/docsApi';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '../../components/layout/AppLayout';

const DEFAULT_FIND = { "key": { "$exists": true } };

export default function DocFinderDashboard() {
  const [fetchedIds, setFetchedIds] = useState([]);
  const [cache, setCache] = useState({});
  const [find, setFind] = useState(DEFAULT_FIND);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  // load local config docids if present
  useEffect(() => {
    fetch('/config/docids.json').then(r => {
      if (!r.ok) throw new Error('no local config');
      return r.json();
    }).then(json => {
      if (json?.docids?.length) {
        setFind(f => ({ ...f, docid: { $in: json.docids } }));
      }
    }).catch(() => { });
  }, []);

  // stringify find for stable query key
  const findKey = useMemo(() => JSON.stringify(find || {}), [find]);

  const { data: rows = [], error, isLoading, refetch, isFetching } = useQuery(
    {
      queryKey: ['docs', findKey, page, limit, fetchedIds.join(',')],
      queryFn: async () => {
        // Exclude already fetched IDs for next page
        let findWithExclusion = { ...find };
        if (fetchedIds.length > 0 && page > 0) {
          findWithExclusion._id = { $nin: fetchedIds };
        }
        if (Object.keys(findWithExclusion).length == 0) {
          findWithExclusion = { ...DEFAULT_FIND };
        }
        const payload = {
          tbl: 'Shareandinvite',
          find: findWithExclusion,
          length: limit,
          // skip: 0, // skip is not needed with $nin
          sort: { time_c: -1 }
        };
        const res = await fetchDocs(payload);
        const d = res?.docs ?? res?.data ?? res ?? [];
        // Update fetchedIds and cache
        if (Array.isArray(d)) {
          setFetchedIds(prev => [...prev, ...d.map(r => r._id)]);
          setCache(prev => ({ ...prev, [page]: d }));
        }
        return Array.isArray(d) ? d : (d.docs || []);
      },
      keepPreviousData: true,
      staleTime: 60 * 1000
    }
  );

  const loading = isLoading || isFetching;

  const handleOpen = (rec) => {
    try {
      const base = location.href.split('/');
      base.pop();
      const url = base.join('/') + '/' + (rec.editor || '');
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Document Finder Dashboard</h2>
        <QueryBuilder value={find} onChange={(newFind) => {
          setPage(0);
          setFind(newFind);
          setFetchedIds([]);
          setCache({});
        }} />
        <FetchToolbar
          page={page}
          setPage={setPage}
          limit={limit}
          setLimit={setLimit}
          loading={loading}
        />
        {error && <div className="text-red-600 dark:text-red-400 mt-4">{error.message || String(error)}</div>}
        <DocsGrid rowData={cache[page] || rows} onOpen={handleOpen} />
      </div>
    </AppLayout>
  );
}
