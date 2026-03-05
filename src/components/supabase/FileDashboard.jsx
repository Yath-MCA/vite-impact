/**
 * @file FileDashboard.jsx
 * @description Lists objects from the Supabase Storage 'publishing' bucket
 * and provides a download button for each file.
 */

import React, { useEffect, useState, useCallback } from 'react';
import supabase from '../../services/supabase/supabaseClient';

const BUCKET = 'publishing';

/**
 * FileDashboard component
 *
 * Fetches the list of files stored in the 'publishing' Supabase Storage bucket
 * and renders a table with file name, size, last modified date, and a download
 * button for each entry.
 */
const FileDashboard = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: listError } = await supabase.storage
        .from(BUCKET)
        .list('', { limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } });

      if (listError) throw listError;
      setFiles(data ?? []);
    } catch (err) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDownload = useCallback(async (fileName) => {
    setDownloading(fileName);
    try {
      const { data, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(fileName);

      if (downloadError) throw downloadError;

      // Trigger browser download
      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
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

  const formatBytes = (bytes) => {
    if (bytes === undefined || bytes === null) return '—';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Publishing Bucket — File Dashboard
        </h2>
        <button
          onClick={fetchFiles}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : files.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 py-4 text-center">
          No files found in the <strong>{BUCKET}</strong> bucket.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Size
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Last Modified
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">
                  Download
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              {files.map((file) => (
                <tr key={file.id ?? file.name} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-mono">
                    {file.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {formatBytes(file.metadata?.size)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {formatDate(file.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDownload(file.name)}
                      disabled={downloading === file.name}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                    >
                      {downloading === file.name ? 'Downloading…' : '⬇ Download'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FileDashboard;
