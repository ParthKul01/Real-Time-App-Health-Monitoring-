/**
 * MonitorCard – displays a single service's health status.
 *
 * Props:
 *   title       {string}  – Service name
 *   status      {string}  – "up" | "down" | "degraded"
 *   latency     {number}  – Latest latency in ms
 *   uptime      {number}  – Uptime percentage (0-100)
 *   lastChecked {string}  – ISO date string of last check
 */
function MonitorCard({ title, status = 'up', latency = 0, uptime = 100, lastChecked }) {
  const statusConfig = {
    up: {
      label: 'Operational',
      dot: 'bg-green-400',
      badge: 'bg-green-500/20 text-green-400 border-green-500/30',
      glow: 'shadow-green-500/10',
    },
    degraded: {
      label: 'Degraded',
      dot: 'bg-yellow-400',
      badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      glow: 'shadow-yellow-500/10',
    },
    down: {
      label: 'Down',
      dot: 'bg-red-400',
      badge: 'bg-red-500/20 text-red-400 border-red-500/30',
      glow: 'shadow-red-500/10',
    },
  };

  const cfg = statusConfig[status] ?? statusConfig.up;

  const formattedDate = lastChecked
    ? new Date(lastChecked).toLocaleTimeString()
    : 'N/A';

  return (
    <div className={`card p-5 hover:border-white/20 transition-all duration-300 shadow-xl ${cfg.glow}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white truncate">{title}</h3>
        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.badge}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
          {cfg.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Latency</p>
          <p className="text-xl font-bold text-white">
            {latency}<span className="text-xs text-gray-400 ml-1">ms</span>
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Uptime</p>
          <p className="text-xl font-bold text-white">
            {uptime.toFixed(1)}<span className="text-xs text-gray-400 ml-1">%</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-600 mt-3">Last checked: {formattedDate}</p>
    </div>
  );
}

export default MonitorCard;
