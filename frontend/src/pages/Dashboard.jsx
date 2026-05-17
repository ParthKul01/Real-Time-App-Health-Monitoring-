import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import MonitorCard from '../components/MonitorCard';
import LatencyChart from '../components/LatencyChart';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { token } = useAuth();

  const [services, setServices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMonitor, setNewMonitor] = useState({ title: '', target: '' });
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [latencyHistory, setLatencyHistory] = useState({});
  const [lastChecked, setLastChecked] = useState(new Date().toISOString());

  // ─── Fetch real monitor data from the backend ───────────────────────────────
  const fetchMonitors = useCallback(async () => {
    try {
      const res = await fetch('/api/monitors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();

      setServices(data);
      setLastChecked(new Date().toISOString());

      // Append latest latency reading to each service's history
      setLatencyHistory(prev => {
        const next = { ...prev };
        data.forEach(s => {
          const history = [...(prev[s.id] || Array(20).fill(0)), s.latency ?? 0];
          next[s.id] = history.slice(-30);
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to fetch monitors:', err);
    }
  }, [token]);

  // Poll the backend every 16 seconds (engine runs every 15s, give 1s slack)
  useEffect(() => {
    fetchMonitors();
    const interval = setInterval(fetchMonitors, 16000);
    return () => clearInterval(interval);
  }, [fetchMonitors]);

  // ─── Add a new monitor via the API ──────────────────────────────────────────
  const handleAddMonitor = async (e) => {
    e.preventDefault();
    setAddError('');
    setIsAdding(true);

    try {
      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newMonitor.title, target: newMonitor.target }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to add monitor');
      }

      // Immediately add to the local state so it appears without waiting for next poll
      setServices(prev => [data, ...prev]);
      setLatencyHistory(prev => ({ ...prev, [data.id]: Array(20).fill(0) }));
      setNewMonitor({ title: '', target: '' });
      setIsModalOpen(false);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  // ─── Delete a monitor ────────────────────────────────────────────────────────
  const handleDeleteMonitor = async (id) => {
    try {
      const res = await fetch(`/api/monitors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setServices(prev => prev.filter(s => s.id !== id));
      setLatencyHistory(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error('Failed to delete monitor:', err);
    }
  };

  const upCount = services.filter(s => s.status === 'up').length;
  const downCount = services.filter(s => s.status === 'down').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;
  const pendingCount = services.filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#CFD8DC] relative">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-[#B0BEC5] pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#37474F]">Infrastructure Health</h1>
            <p className="text-[#546E7A] text-sm mt-1">
              Last sync: {new Date(lastChecked).toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={() => { setAddError(''); setIsModalOpen(true); }}
            className="bg-[#37474F] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#546E7A] transition-all active:scale-95"
          >
            Add New Monitor
          </button>
        </div>

        {/* Status Summary */}
        <div className="flex flex-wrap gap-3 mb-8">
          <span className="flex items-center gap-2 bg-white border border-[#90A4AE] text-[#37474F] text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            {upCount} Operational
          </span>
          <span className="flex items-center gap-2 bg-white border border-[#90A4AE] text-[#37474F] text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            {degradedCount} Degraded
          </span>
          <span className="flex items-center gap-2 bg-white border border-[#90A4AE] text-[#37474F] text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            {downCount} Offline
          </span>
          {pendingCount > 0 && (
            <span className="flex items-center gap-2 bg-white border border-[#90A4AE] text-[#37474F] text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
              {pendingCount} Pending first check…
            </span>
          )}
        </div>

        {/* Service Monitors Grid */}
        <section className="mb-12">
          <h2 className="text-sm font-black text-[#546E7A] mb-6 uppercase tracking-[0.2em]">Service Monitors</h2>

          {services.length === 0 ? (
            <div className="text-center py-16 text-[#90A4AE]">
              <p className="text-4xl mb-3">📡</p>
              <p className="font-bold text-lg">No monitors yet.</p>
              <p className="text-sm mt-1">Click <strong>Add New Monitor</strong> to start tracking an IP or URL.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(service => (
                <MonitorCard
                  key={service.id}
                  id={service.id}
                  title={service.title}
                  target={service.target}
                  status={service.status}
                  latency={service.latency ?? 0}
                  uptime={service.uptime ?? 100}
                  lastChecked={lastChecked}
                  onDelete={handleDeleteMonitor}
                />
              ))}
            </div>
          )}
        </section>

        {/* Latency History Charts */}
        {services.filter(s => s.status !== 'down' && s.status !== 'pending').length > 0 && (
          <section>
            <h2 className="text-sm font-black text-[#546E7A] mb-6 uppercase tracking-[0.2em]">Latency History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.filter(s => s.status !== 'down' && s.status !== 'pending').map(service => (
                <div key={service.id} className="bg-white p-6 rounded-2xl border border-[#B0BEC5] shadow-sm">
                  <div className="mb-4">
                    <h4 className="text-[#37474F] font-bold">{service.title}</h4>
                    <p className="text-[#90A4AE] text-xs font-medium">{service.target}</p>
                  </div>
                  <LatencyChart
                    label={service.title}
                    data={latencyHistory[service.id] || []}
                    color={service.status === 'degraded' ? '#f59e0b' : '#546E7A'}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Add Monitor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#37474F]/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#B0BEC5] overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-black text-[#37474F] mb-2">New Monitor</h2>
              <p className="text-[#546E7A] text-sm mb-6 font-medium">Track a new IP address or URL.</p>

              {addError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                  {addError}
                </div>
              )}

              <form onSubmit={handleAddMonitor} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-[#90A4AE] uppercase tracking-widest mb-2 ml-1">
                    Friendly Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. AWS Production Server"
                    className="w-full px-4 py-3 rounded-xl bg-[#CFD8DC]/20 border border-[#B0BEC5] text-[#37474F] outline-none focus:ring-2 focus:ring-[#546E7A]"
                    value={newMonitor.title}
                    onChange={(e) => setNewMonitor({ ...newMonitor, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#90A4AE] uppercase tracking-widest mb-2 ml-1">
                    Target (IP or URL)
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 13.233.10.254 or https://example.com"
                    className="w-full px-4 py-3 rounded-xl bg-[#CFD8DC]/20 border border-[#B0BEC5] text-[#37474F] outline-none focus:ring-2 focus:ring-[#546E7A]"
                    value={newMonitor.target}
                    onChange={(e) => setNewMonitor({ ...newMonitor, target: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-[#546E7A] hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 px-4 py-3 rounded-xl font-bold bg-[#37474F] text-white shadow-lg hover:bg-[#546E7A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdding ? 'Adding…' : 'Start Tracking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;