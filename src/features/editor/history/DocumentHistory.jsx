import { useState, useMemo } from 'react';
import AppLayout from '../../../components/layout/AppLayout';
import DashboardTopBar from '../../../components/layout/DashboardTopBar';
import { Search, Download, History, FileText, User, Clock, GitCommit } from 'lucide-react';

const mockHistoryData = Array.from({ length: 50 }, (_, i) => ({
  id: `HIST-${1000 + i}`,
  docId: `DOC-${2000 + (i % 20)}`,
  manuscriptNo: `MS-${3000 + (i % 20)}`,
  client: ['PLOS', 'OUP', 'LWW', 'Elsevier'][i % 4],
  version: `v${1 + (i % 10)}.0`,
  action: ['Created', 'Updated', 'Reviewed', 'Approved', 'Rejected', 'Published'][i % 6],
  user: ['editor1', 'editor2', 'qcuser', 'admin', 'system'][i % 5],
  timestamp: `2026-03-${String((i % 28) + 1).padStart(2, '0')} ${String((i % 24)).padStart(2, '0')}:${String((i % 60)).padStart(2, '0')}`,
  changes: [
    'Modified metadata fields',
    'Updated XML structure',
    'Added new section',
    'Fixed validation errors',
    'Updated references',
    'No changes recorded'
  ][i % 6],
  comment: i % 3 === 0 ? 'Routine maintenance update' : ''
}));

export default function DocumentHistory() {
  const [filter, setFilter] = useState('');
  const [docFilter, setDocFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const filteredData = useMemo(() => {
    return mockHistoryData.filter(item => {
      const matchesSearch = !filter ||
        item.docId.toLowerCase().includes(filter.toLowerCase()) ||
        item.manuscriptNo.toLowerCase().includes(filter.toLowerCase()) ||
        item.user.toLowerCase().includes(filter.toLowerCase()) ||
        item.action.toLowerCase().includes(filter.toLowerCase());
      const matchesDoc = !docFilter || item.docId === docFilter;
      const matchesDate = (!dateFrom || item.timestamp >= dateFrom) && (!dateTo || item.timestamp <= dateTo);
      return matchesSearch && matchesDoc && matchesDate;
    });
  }, [filter, docFilter, dateFrom, dateTo]);

  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const uniqueDocs = useMemo(() => {
    return [...new Set(mockHistoryData.map(item => item.docId))];
  }, []);

  const stats = useMemo(() => {
    const created = filteredData.filter(i => i.action === 'Created').length;
    const updated = filteredData.filter(i => i.action === 'Updated').length;
    const published = filteredData.filter(i => i.action === 'Published').length;
    return { created, updated, published, total: filteredData.length };
  }, [filteredData]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const exportData = () => {
    const csv = [
      ['ID', 'Doc ID', 'Manuscript No', 'Client', 'Version', 'Action', 'User', 'Timestamp', 'Changes', 'Comment'].join(','),
      ...filteredData.map(row => [
        row.id, row.docId, row.manuscriptNo, row.client, row.version,
        row.action, row.user, row.timestamp, `"${row.changes}"`, `"${row.comment}"`
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'Created': return <FileText className="w-4 h-4 text-green-600" />;
      case 'Updated': return <GitCommit className="w-4 h-4 text-blue-600" />;
      case 'Published': return <History className="w-4 h-4 text-purple-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'Created': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'Updated': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'Published': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-4">
        <DashboardTopBar
          title="Document History"
          subtitle="Track document changes, versions, and user actions over time"
        />

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm mb-1">
              <FileText className="w-4 h-4" />
              Created
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.created}</div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm mb-1">
              <GitCommit className="w-4 h-4" />
              Updated
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.updated}</div>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-900/20 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm mb-1">
              <History className="w-4 h-4" />
              Published
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.published}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Total Events
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                />
              </div>
              <select
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              >
                <option value="">All Documents</option>
                {uniqueDocs.map(doc => (
                  <option key={doc} value={doc}>{doc}</option>
                ))}
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                placeholder="From"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                placeholder="To"
              />
            </div>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Doc ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Manuscript No</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Version</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Changes</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(row.action)}`}>
                        {getActionIcon(row.action)}
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{row.docId}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.manuscriptNo}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.version}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <User className="w-3 h-3" />
                        {row.user}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs max-w-xs" title={row.changes}>
                      {row.changes}
                      {row.comment && <span className="block mt-1 text-gray-400 italic">"{row.comment}"</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">
                      {row.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredData.length)} of {filteredData.length} entries
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
