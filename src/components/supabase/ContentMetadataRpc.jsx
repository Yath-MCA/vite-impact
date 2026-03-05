/**
 * @file ContentMetadataRpc.jsx
 * @description Demonstrates calling a Supabase RPC function that internally
 * uses PostgreSQL's xmltable to parse an XML column from the 'content_metadata'
 * table.
 *
 * The expected Supabase/PostgreSQL function signature is:
 *
 *   CREATE OR REPLACE FUNCTION get_content_metadata_parsed(p_limit int DEFAULT 50)
 *   RETURNS TABLE (
 *     id          bigint,
 *     title       text,
 *     author      text,
 *     published   text,
 *     keywords    text
 *   ) LANGUAGE sql AS $$
 *     SELECT
 *       cm.id,
 *       x.title,
 *       x.author,
 *       x.published,
 *       x.keywords
 *     FROM content_metadata cm
 *     CROSS JOIN LATERAL xmltable(
 *       '/metadata'
 *       PASSING cm.xml_data::xml
 *       COLUMNS
 *         title     text PATH 'title',
 *         author    text PATH 'author',
 *         published text PATH 'published',
 *         keywords  text PATH 'keywords'
 *     ) AS x
 *     LIMIT p_limit;
 *   $$;
 */

import React, { useState, useCallback } from 'react';
import supabase from '../../services/supabase/supabaseClient';

const RPC_FUNCTION = 'get_content_metadata_parsed';

/**
 * ContentMetadataRpc component
 *
 * Provides a UI to invoke the `get_content_metadata_parsed` Supabase RPC
 * function and display the parsed XML data returned from the
 * 'content_metadata' table.
 */
const ContentMetadataRpc = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const { data, error: rpcError } = await supabase.rpc(RPC_FUNCTION, {
        p_limit: limit,
      });
      if (rpcError) throw rpcError;
      setResults(data ?? []);
    } catch (err) {
      setError(err.message || 'RPC call failed');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const columns = results && results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Content Metadata — XML Parsed via RPC
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Calls the <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{RPC_FUNCTION}</code>{' '}
        Supabase RPC function which uses PostgreSQL&apos;s{' '}
        <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">xmltable</code> to
        parse the <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">xml_data</code>{' '}
        column from the <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">content_metadata</code>{' '}
        table.
      </p>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="rpc-limit">
          Row limit:
        </label>
        <input
          id="rpc-limit"
          type="number"
          min={1}
          max={200}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Calling RPC…' : 'Call RPC'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {!loading && results !== null && (
        results.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 py-4 text-center">
            No rows returned.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 capitalize"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {results.map((row, idx) => (
                  <tr key={row.id ?? idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap"
                      >
                        {row[col] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default ContentMetadataRpc;
