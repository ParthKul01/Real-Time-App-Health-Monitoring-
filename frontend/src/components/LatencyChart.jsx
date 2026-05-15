import { useRef } from 'react';

function LatencyChart({ data = [], color = '#546E7A', label = 'Latency', height = 80 }) {
  const svgRef = useRef(null);
  const width = 400;
  const padding = { top: 8, bottom: 8, left: 4, right: 4 };

  const points = data.length > 0 ? data : Array(20).fill(0);
  const max = Math.max(...points, 1);
  const min = Math.min(...points);
  const range = max - min || 1;

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const stepX = chartWidth / (points.length - 1 || 1);

  const coords = points.map((v, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + chartHeight - ((v - min) / range) * chartHeight,
  }));

  const polyline = coords.map(p => `${p.x},${p.y}`).join(' ');

  // Build fill area path
  const fillPath =
    `M ${coords[0].x},${padding.top + chartHeight} ` +
    coords.map(p => `L ${p.x},${p.y}`).join(' ') +
    ` L ${coords[coords.length - 1].x},${padding.top + chartHeight} Z`;

  const latest = points[points.length - 1];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-[#546E7A] uppercase tracking-wider">{label}</span>
        <span className="text-sm font-black text-[#37474F]">{latest} <span className="text-xs font-medium text-[#90A4AE]">ms</span></span>
      </div>
      <div className="overflow-hidden rounded-lg">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ height }}
        >
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Fill */}
          <path d={fillPath} fill={`url(#grad-${label})`} />
          {/* Line */}
          <polyline
            points={polyline}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Latest point */}
          {coords.length > 0 && (
            <circle
              cx={coords[coords.length - 1].x}
              cy={coords[coords.length - 1].y}
              r="3"
              fill={color}
            />
          )}
        </svg>
      </div>
    </div>
  );
}

export default LatencyChart;
