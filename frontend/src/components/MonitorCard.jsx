/**
 * MonitorCard – Optimized for #CFD8DC Dashboard Background.
 * Colors: #37474F (Dark), #546E7A (Muted), #90A4AE (Gray), #B0BEC5 (Light)
 */
function MonitorCard({ title, status = 'up', latency = 0, uptime = 100, lastChecked }) {
  const statusConfig = {
    up: {
      label: 'Operational',
      dot: 'bg-green-500',
      badge: 'bg-green-50 text-green-700 border-green-200',
    },
    degraded: {
      label: 'Degraded',
      dot: 'bg-yellow-500',
      badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    down: {
      label: 'Down',
      dot: 'bg-red-500',
      badge: 'bg-red-50 text-red-700 border-red-200',
    },
  };

  const cfg = statusConfig[status] ?? statusConfig.up;

  const formattedDate = lastChecked
    ? new Date(lastChecked).toLocaleTimeString()
    : 'N/A';

  return (
    /* Card Base: 
       - Uses pure white to contrast against the #CFD8DC background.
       - Subtle border using #B0BEC5 (Light).
       - Higher shadow (shadow-md) to create depth on a light background.
    */
    <div className="bg-white border border-[#B0BEC5] rounded-[24px] p-6 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1">

      {/* Header Area */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h3 className="font-black text-[#37474F] text-lg tracking-tight truncate">{title}</h3>
          <span className="text-[10px] text-[#90A4AE] font-bold uppercase tracking-tighter">Live Service</span>
        </div>
        <span className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full border shadow-sm ${cfg.badge}`}>
          <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot} ${status === 'up' ? 'animate-pulse' : ''}`} />
          {cfg.label}
        </span>
      </div>

      {/* Stats Grid: Using a slightly darker tint for the boxes to stand out from the white card */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#CFD8DC]/20 rounded-2xl p-4 border border-[#B0BEC5]/30">
          <p className="text-[10px] font-black text-[#90A4AE] uppercase tracking-widest mb-1">Latency</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#37474F]">{latency}</span>
            <span className="text-[10px] font-bold text-[#546E7A]">MS</span>
          </div>
        </div>

        <div className="bg-[#CFD8DC]/20 rounded-2xl p-4 border border-[#B0BEC5]/30">
          <p className="text-[10px] font-black text-[#90A4AE] uppercase tracking-widest mb-1">Uptime</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#37474F]">{uptime.toFixed(1)}</span>
            <span className="text-[10px] font-bold text-[#546E7A]">%</span>
          </div>
        </div>
      </div>

      {/* Footer: Clean separation with a thin border */}
      <div className="mt-6 pt-4 border-t border-[#CFD8DC] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#B0BEC5]" />
          <p className="text-[9px] font-bold text-[#90A4AE] uppercase tracking-widest">
            Healthy Connection
          </p>
        </div>
        <p className="text-[11px] font-bold text-[#546E7A] bg-[#CFD8DC]/40 px-2 py-0.5 rounded-md">
          {formattedDate}
        </p>
      </div>
    </div>
  );
}

export default MonitorCard;