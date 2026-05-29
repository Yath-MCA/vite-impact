import { useState, useEffect, useContext } from "react";
import apiService from "../../../services/api/apiService";
import DashboardContext from "../context/DashboardContext";

export default function DashboardHeader({ onDataFetched }) {
  const { setRowData, setFetchLoading } = useContext(DashboardContext);

  // Default to last 3 days (inclusive)
  const today = new Date();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(today.getDate() - 2);
  const format = d => d.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(format(threeDaysAgo));
  const [endDate, setEndDate] = useState(format(today));
  const [client, setClient] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const clientOptions = ["all", "oup", "plos", "medknow", "brill"];

  const fetchData = async () => {
    setLoading(true);
    setFetchLoading(true);
    try {
      const payload = {
        tbl: "Fileslist",
        find: {
          client: { $regex: '[A-z]+', $options: 'i' },
          linkinfo: { $exists: true },
          projecttitle: { $exists: true },
          time_c: { $gte: new Date(startDate).getTime(), $lte: new Date(endDate).getTime() }
        },
        sort: { time_c: -1 }
      };
      const data = await apiService.getDocs(payload);
      const rows = Array.isArray(data) ? data : (data?.data ?? []);

      // Push into shared context
      setRowData(rows);

      // Backward-compat callback
      if (onDataFetched) onDataFetched(rows);
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setLoading(false);
      setFetchLoading(false);
    }
  };

  // initial load for default range
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      {/* Date range */}
      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium">From</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="rounded border px-2 py-1 dark:bg-gray-700" />
        <label className="text-sm font-medium">To</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="rounded border px-2 py-1 dark:bg-gray-700" />
      </div>

      {/* Client dropdown */}
      <select value={client} onChange={e => setClient(e.target.value)}
        className="rounded border px-2 py-1 dark:bg-gray-700">
        {clientOptions.map(opt => (
          <option key={opt} value={opt}>{opt.toUpperCase()}</option>
        ))}
      </select>

      {/* Search input */}
      <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
        className="flex-1 rounded border px-2 py-1 dark:bg-gray-700" />

      {/* Fetch button */}
      <button onClick={fetchData} disabled={loading}
        className={`btn-primary ${loading ? "opacity-60 cursor-not-allowed" : ""}`}>
        {loading ? "Loading…" : "Fetch"}
      </button>
    </div>
  );
}
