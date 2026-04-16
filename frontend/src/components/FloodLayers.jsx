import { useEffect, useRef, useMemo } from 'react';
import { useMap, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

// ─── Flood level helpers ────────────────────────────────────────────────────
const LEVEL_CONFIG = {
  nhẹ: { color: '#3b82f6', fillColor: '#3b82f6', weight: 1, label: 'Nhẹ', intensity: 0.35, radius: 900 },
  trung_bình: { color: '#f59e0b', fillColor: '#f59e0b', weight: 1.5, label: 'Trung bình', intensity: 0.65, radius: 1400 },
  nặng: { color: '#ef4444', fillColor: '#ef4444', weight: 2, label: 'Nặng', intensity: 1.0, radius: 2200 },
};

const getConfig = (level) => LEVEL_CONFIG[level] || LEVEL_CONFIG['nhẹ'];

// ─── Canvas Heatmap Layer ────────────────────────────────────────────────────
// Pure Leaflet Canvas — no extra packages needed
export function FloodHeatmapLayer({ reports }) {
  const map = useMap();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const points = useMemo(() =>
    reports
      .filter(r => r.location?.coordinates?.length === 2)
      .map(r => ({
        lat: r.location.coordinates[1],
        lng: r.location.coordinates[0],
        intensity: getConfig(r.flood_level).intensity,
      })),
    [reports]
  );

  useEffect(() => {
    // Create an overlay using Leaflet's built-in renderer approach
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '400';
    canvasRef.current = canvas;

    const pane = map.getPane('overlayPane');
    pane.appendChild(canvas);
    containerRef.current = pane;

    const render = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Reposition canvas to match map position
      const topLeft = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(canvas, topLeft);

      points.forEach(({ lat, lng, intensity }) => {
        const point = map.latLngToContainerPoint([lat, lng]);
        const zoom = map.getZoom();
        // Radius grows with zoom
        const r = Math.max(30, 20 * Math.pow(1.6, zoom - 6)) * (0.6 + intensity * 0.8);

        const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, r);
        if (intensity >= 0.9) {
          gradient.addColorStop(0, `rgba(239,68,68,${0.55 * intensity})`);
          gradient.addColorStop(0.4, `rgba(239,68,68,${0.3 * intensity})`);
          gradient.addColorStop(1, 'rgba(239,68,68,0)');
        } else if (intensity >= 0.5) {
          gradient.addColorStop(0, `rgba(245,158,11,${0.55 * intensity})`);
          gradient.addColorStop(0.4, `rgba(245,158,11,${0.3 * intensity})`);
          gradient.addColorStop(1, 'rgba(245,158,11,0)');
        } else {
          gradient.addColorStop(0, `rgba(59,130,246,${0.5 * intensity})`);
          gradient.addColorStop(0.4, `rgba(59,130,246,${0.28 * intensity})`);
          gradient.addColorStop(1, 'rgba(59,130,246,0)');
        }

        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillRect(point.x - r, point.y - r, r * 2, r * 2);
      });
    };

    render();
    map.on('moveend zoomend resize', render);

    return () => {
      map.off('moveend zoomend resize', render);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [map, points]);

  return null;
}

// ─── Flood Zone Layer (Circle overlays with popup) ───────────────────────────
export function FloodZoneLayer({ reports, onVote }) {
  return reports
    .filter(r => r.location?.coordinates?.length === 2)
    .map((rep, idx) => {
      const cfg = getConfig(rep.flood_level);
      const lat = rep.location.coordinates[1];
      const lng = rep.location.coordinates[0];

      return (
        <CircleMarker
          key={rep.id || idx}
          center={[lat, lng]}
          radius={20}
          pathOptions={{
            color: cfg.color,
            fillColor: cfg.fillColor,
            fillOpacity: 0.22,
            weight: cfg.weight,
            opacity: 0.85,
          }}
        >
          <ZonePopup rep={rep} cfg={cfg} onVote={onVote} />
        </CircleMarker>
      );
    });
}

function ZonePopup({ rep, cfg, onVote }) {
  const statusColor =
    rep.status === 'verified' ? '#4ade80' :
    rep.status === 'rejected' ? '#f87171' : '#eab308';

  return (
    <Popup className="tactical-popup">
      <div style={{ fontFamily: 'sans-serif', fontSize: 13, padding: 4, minWidth: 200 }}>
        <div style={{ color: cfg.color, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>
          ⬤ Vùng ngập — {cfg.label}
        </div>
        <div style={{ color: statusColor, fontSize: 11, textTransform: 'uppercase', marginBottom: 6 }}>
          Trạng thái: {rep.status}
        </div>
        <div style={{ color: '#d4d4d8', marginBottom: 8 }}>
          {rep.description || 'Không có mô tả.'}
        </div>
        {rep.image_url && (
          <img src={rep.image_url} alt="Intel" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }} />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #27272a', paddingTop: 6 }}>
          <span style={{ fontSize: 11, color: '#71717a' }}>Votes: <strong style={{ color: '#d4d4d8' }}>{rep.votes}</strong></span>
          {onVote && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => onVote(rep.id, true)} style={{ fontSize: 11, padding: '2px 8px', background: '#18181b', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer' }}>✓ Xác nhận</button>
              <button onClick={() => onVote(rep.id, false)} style={{ fontSize: 11, padding: '2px 8px', background: '#18181b', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer' }}>✗ Bác bỏ</button>
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
}

// ─── Layer Control Panel (floating UI outside MapContainer) ─────────────────
const LAYER_OPTIONS = [
  {
    id: 'markers',
    label: 'Điểm báo cáo',
    icon: '📍',
    desc: 'Hiển thị marker từng điểm'
  },
  {
    id: 'heatmap',
    label: 'Bản đồ nhiệt',
    icon: '🌡️',
    desc: 'Cường độ ngập theo màu'
  },
  {
    id: 'zones',
    label: 'Vùng ngập',
    icon: '🔴',
    desc: 'Khoanh vùng theo mức độ'
  },
];

export function LayerControlPanel({ activeLayers, onToggle }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1200,
        display: 'flex',
        gap: 8,
        background: 'rgba(9,9,11,0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(63,63,70,0.8)',
        borderRadius: 16,
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Label left */}
      <div style={{ display: 'flex', alignItems: 'center', paddingRight: 10, borderRight: '1px solid #3f3f46' }}>
        <span style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, whiteSpace: 'nowrap' }}>
          Lớp hiển thị
        </span>
      </div>

      {LAYER_OPTIONS.map(opt => {
        const isActive = activeLayers.includes(opt.id);
        return (
          <button
            key={opt.id}
            onClick={() => onToggle(opt.id)}
            title={opt.desc}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 10,
              border: isActive
                ? '1px solid rgba(234,179,8,0.6)'
                : '1px solid rgba(63,63,70,0.5)',
              background: isActive
                ? 'rgba(234,179,8,0.12)'
                : 'rgba(24,24,27,0.6)',
              color: isActive ? '#eab308' : '#71717a',
              fontSize: 12,
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              boxShadow: isActive ? '0 0 8px rgba(234,179,8,0.2)' : 'none',
            }}
          >
            <span style={{ fontSize: 14 }}>{opt.icon}</span>
            {opt.label}
            {isActive && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#eab308',
                boxShadow: '0 0 6px #eab308',
                flexShrink: 0,
              }} />
            )}
          </button>
        );
      })}

      {/* Legend strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 10, borderLeft: '1px solid #3f3f46' }}>
        {[
          { color: '#3b82f6', label: 'Nhẹ' },
          { color: '#f59e0b', label: 'TB' },
          { color: '#ef4444', label: 'Nặng' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#71717a' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
