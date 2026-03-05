/**
 * @file DocumentSearch.jsx
 * @description Provides two types of document search backed by Supabase:
 *
 *  1. **XML node search** – calls the PostgreSQL function
 *     `search_xml_node(node text, value text)` via `supabase.rpc()`.
 *     Expected function signature:
 *
 *       CREATE OR REPLACE FUNCTION search_xml_node(node text, value text)
 *       RETURNS TABLE (
 *         id          bigint,
 *         file_name   text,
 *         file_path   text,
 *         node_name   text,
 *         node_value  text
 *       ) LANGUAGE sql AS $$
 *         SELECT id, file_name, file_path, node_name, node_value
 *         FROM   documents
 *         WHERE  xml_data IS NOT NULL
 *           AND  xpath('//' || node || '/text()', xml_data::xml)::text[] && ARRAY[value];
 *       $$;
 *
 *  2. **Full-text search** – queries the `documents` table using
 *     Supabase's `.textSearch('fts_index', query)` helper which maps to
 *     PostgreSQL's `to_tsvector` / `to_tsquery` full-text search on the
 *     `fts_index` column (type `tsvector`).
 *
 * Both result sets display a list of matching documents with a download
 * button that streams the file from the `publishing` Supabase Storage bucket.
 */

import React, { useState, useCallback } from 'react';
import supabase from '../../services/supabase/supabaseClient';

const BUCKET = 'publishing';
const DOCUMENTS_TABLE = 'documents';
const XML_RPC = 'search_xml_node';

// ─── helpers ─────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex justify-center py-8">
    <div
      role="status"
      aria-label="Loading"
      className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
    />
  </div>
);

const ErrorAlert = ({ message }) => (
  <div
    role="alert"
    className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm"
  >
    {message}
  </div>
);

// ─── main component ───────────────────────────────────────────────────────────

/**
 * DocumentSearch
 *
 * Renders a tabbed interface that lets users run two different kinds of
 * document searches against a Supabase backend and download matched files.
 */
const DocumentSearch = () => {
  // shared
  const [activeMode, setActiveMode] = useState('xml');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);

  // XML search fields
  const [xmlNode, setXmlNode] = useState('');
  const [xmlValue, setXmlValue] = useState('');

  // FTS search field
  const [ftsQuery, setFtsQuery] = useState('');

  // ── XML node search ─────────────────────────────────────────────────────────
  const handleXmlSearch = useCallback(
    async (e) => {
      e.preventDefault();
      if (!xmlNode.trim() || !xmlValue.trim()) return;

      setLoading(true);
      setError(null);
      setResults(null);

      try {
        const { data, error: rpcError } = await supabase.rpc(XML_RPC, {
          node: xmlNode.trim(),
          value: xmlValue.trim(),
        });
        if (rpcError) throw rpcError;
        setResults(data ?? []);
      } catch (err) {
        setError(err.message || 'XML search failed');
      } finally {
        setLoading(false);
      }
    },
    [xmlNode, xmlValue]
  );

  // ── Full-text search ────────────────────────────────────────────────────────
  const handleFtsSearch = useCallback(
    async (e) => {
      e.preventDefault();
      if (!ftsQuery.trim()) return;

      setLoading(true);
      setError(null);
      setResults(null);

      try {
        const { data, error: queryError } = await supabase
          .from(DOCUMENTS_TABLE)
          .select('id, file_name, file_path, title, description')
          .textSearch('fts_index', ftsQuery.trim(), {
            type: 'websearch',
            config: 'english',
          });
        if (queryError) throw queryError;
        setResults(data ?? []);
      } catch (err) {
        setError(err.message || 'Full-text search failed');
      } finally {
        setLoading(false);
      }
    },
    [ftsQuery]
  );

  // ── File download ───────────────────────────────────────────────────────────
  const handleDownload = useCallback(async (filePath, fileName) => {
    const path = filePath || fileName;
    if (!path) return;

    setDownloading(path);
    try {
      const { data, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(path);
      if (downloadError) throw downloadError;

      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName || path;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  }, []);

  // ── mode switch (clear results on tab change) ───────────────────────────────
  const switchMode = (mode) => {
    if (mode === activeMode) return;
    setActiveMode(mode);
    setResults(null);
    setError(null);
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
        Document Search
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Search documents by XML node value or full-text content. Matched files
        can be downloaded directly from the{' '}
        <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
          {BUCKET}
        </code>{' '}
        storage bucket.
      </p>

      {/* Mode tabs */}
      <div className="flex space-x-0 border-b border-gray-200 dark:border-gray-700 mb-5">
        {[
          { id: 'xml', label: '🏷 XML Node Search' },
          { id: 'fts', label: '🔍 Full-Text Search (PDF)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchMode(tab.id)}
            className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeMode === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── XML search form ── */}
      {activeMode === 'xml' && (
        <form
          onSubmit={handleXmlSearch}
          className="flex flex-wrap items-end gap-3 mb-5"
          aria-label="XML node search form"
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="xml-node"
              className="text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              XML node name
            </label>
            <input
              id="xml-node"
              type="text"
              placeholder="e.g. author"
              value={xmlNode}
              onChange={(e) => setXmlNode(e.target.value)}
              required
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white w-44"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="xml-value"
              className="text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Node value
            </label>
            <input
              id="xml-value"
              type="text"
              placeholder="e.g. Jane Doe"
              value={xmlValue}
              onChange={(e) => setXmlValue(e.target.value)}
              required
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white w-52"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !xmlNode.trim() || !xmlValue.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
      )}

      {/* ── FTS search form ── */}
      {activeMode === 'fts' && (
        <form
          onSubmit={handleFtsSearch}
          className="flex flex-wrap items-end gap-3 mb-5"
          aria-label="Full-text search form"
        >
          <div className="flex flex-col gap-1 flex-1 min-w-[260px]">
            <label
              htmlFor="fts-query"
              className="text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Search query
            </label>
            <input
              id="fts-query"
              type="search"
              placeholder='e.g. "annual report" compliance'
              value={ftsQuery}
              onChange={(e) => setFtsQuery(e.target.value)}
              required
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !ftsQuery.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
      )}

      {/* Error */}
      {error && <ErrorAlert message={error} />}

      {/* Spinner */}
      {loading && <Spinner />}

      {/* Results */}
      {!loading && results !== null && (
        results.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 py-4 text-center">
            No documents matched your search.
          </p>
        ) : (
          <ul className="space-y-3" aria-label="Search results">
            {results.map((doc, idx) => {
              const fileName = doc.file_name || doc.title;
              // Mirror the same resolution used inside handleDownload so the
              // downloading-state key always matches.
              const downloadKey = doc.file_path || fileName;

              return (
                <li
                  key={doc.id ?? idx}
                  className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {fileName || `Document #${doc.id ?? idx + 1}`}
                    </p>
                    {(doc.description || doc.node_name) && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {doc.node_name
                          ? `${doc.node_name}: ${doc.node_value}`
                          : doc.description}
                      </p>
                    )}
                    {doc.file_path && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono truncate">
                        {doc.file_path}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDownload(doc.file_path, fileName)}
                    disabled={downloading === downloadKey}
                    className="shrink-0 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                    aria-label={`Download ${fileName || 'file'}`}
                  >
                    {downloading === downloadKey ? 'Downloading…' : '⬇ Download'}
                  </button>
                </li>
              );
            })}
          </ul>
        )
      )}
    </div>
  );
};

export default DocumentSearch;
