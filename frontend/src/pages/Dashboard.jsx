import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MonitorCard from '../components/MonitorCard';
import LatencyChart from '../components/LatencyChart';

// Simulated services for demo purposes
const INITIAL_SERVICES = [
  { id: 1, title: 'API Gateway', status: 'up', latency: 42, uptime: 99.98 },
  { id: 2, title: 'Auth Service', status: 'up', latency: 18, uptime: 100 },
  { id: 3, title: 'Database (Primary)', status: 'degraded', latency: 210, uptime: 97.3 },
  { id: 4, title: 'CDN / Static Assets', status: 'up', latency: 8, uptime: 99.99 },
  { id: 5, title: 'Payment Service', status: 'down', latency: 0, uptime: 94.1 },
  { id: 6, title: 'Notification Worker', status: 'up', latency: 65, uptime: 99.5 },
];

/**
 * Dashboard – main monitoring view showing service cards and latency charts.
 */
function Dashboard() {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [latencyHistory, setLatencyHistory] = useState(() =>
    Object.fromEntries(INITIAL_SERVICES.map(s => [s.id, Array(20).fill(s.latency)]))
  );
  const [lastChecked, setLastChecked] = useState(new Date().toISOString());

  // Simulate real-time updates every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setServices(prev =>
        prev.map(service => {
          if (service.status === 'down') return service;
          const delta = Math.floor(Math.random() * 20) - 10;
          return { ...service, latency: Math.max(1, service.latency + delta) };
        })
      );

      setLatencyHistory(prev => {
        const next = { ...prev };
        services.forEach(s => {
          if (s.status !== 'down') {
            const history = [...(prev[s.id] || []), s.latency];
            next[s.id] = history.slice(-30); // keep last 30 data points
          }
        });
        return next;
      });

      setLastChecked(new Date().toISOString());
    }, 3000);

    return () => clearInterval(interval);
  }, [services]);

  const upCount = services.filter(s => s.status === 'up').length;
  const downCount = services.filter(s => s.status === 'down').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">System Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Last updated: {new Date(lastChecked).toLocaleTimeString()}
          </p>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-3 mb-8">
          <span className="flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/30 text-sm font-medium px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            {upCount} Operational
          </span>
          <span className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-sm font-medium px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            {degradedCount} Degraded
          </span>
          <span className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/30 text-sm font-medium px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            {downCount} Down
          </span>
        </div>

        {/* Monitor cards grid */}
        <section id="monitor-cards" className="mb-10">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(service => (
              <MonitorCard
                key={service.id}
                title={service.title}
                status={service.status}
                latency={service.latency}
                uptime={service.uptime}
                lastChecked={lastChecked}
              />
            ))}
          </div>
        </section>

        {/* Latency charts */}
        <section id="latency-charts">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Latency Trends</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services
              .filter(s => s.status !== 'down')
              .map(service => (
                <LatencyChart
                  key={service.id}
                  label={service.title}
                  data={latencyHistory[service.id] || []}
                  color={service.status === 'degraded' ? '#f59e0b' : '#6366f1'}
                />
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
