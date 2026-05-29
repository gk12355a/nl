import React, { useEffect, useRef, useMemo } from 'react';
import { useMap, CircleMarker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

// ─── Flood level helpers ────────────────────────────────────────────────────
const LEVEL_CONFIG = {
  nhẹ: { color: '#3b82f6', fillColor: '#3b82f6', weight: 1, label: 'Nhẹ', intensity: 0.35, radius: 900 },
  trung_bình: { color: '#f59e0b', fillColor: '#f59e0b', weight: 1.5, label: 'Trung bình', intensity: 0.65, radius: 1400 },
  nặng: { color: '#ef4444', fillColor: '#ef4444', weight: 2, label: 'Nặng', intensity: 1.0, radius: 2200 },
};

const getConfig = (level) => LEVEL_CONFIG[level] || LEVEL_CONFIG['nhẹ'];


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
        <div style={{ color: 'var(--zinc-300)', marginBottom: 8 }}>
          {rep.description || 'Không có mô tả.'}
        </div>
        {rep.image_url && (
          <img src={rep.image_url} alt="Intel" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }} />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--zinc-800)', paddingTop: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--zinc-500)' }}>Votes: <strong style={{ color: 'var(--zinc-100)' }}>{rep.votes}</strong></span>
          {onVote && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => onVote(rep.id, true)} style={{ fontSize: 11, padding: '2px 8px', background: 'var(--zinc-950)', border: '1px solid var(--zinc-800)', borderRadius: 4, color: 'var(--zinc-400)', cursor: 'pointer' }}>✓ Xác nhận</button>
              <button onClick={() => onVote(rep.id, false)} style={{ fontSize: 11, padding: '2px 8px', background: 'var(--zinc-950)', border: '1px solid var(--zinc-800)', borderRadius: 4, color: 'var(--zinc-400)', cursor: 'pointer' }}>✗ Bác bỏ</button>
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
}


export function RoutingPathLayer({ routes, selectedRouteIndex }) {
  if (!routes || routes.length === 0) return null;

  return (
    <>
      {routes.map((route, index) => {
        const isSelected = selectedRouteIndex === index;
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        
        if (isSelected) {
          const baseColor = route.isFlooded ? '#ef4444' : '#10b981';
          return (
            <React.Fragment key={`selected-${index}`}>
              {/* Outer glow */}
              <Polyline
                positions={coordinates}
                pathOptions={{
                  color: baseColor,
                  weight: 12,
                  opacity: 0.2,
                  lineJoin: 'round',
                  lineCap: 'round',
                  dashArray: route.isFlooded ? '5, 10' : null
                }}
              />
              {/* Inner core */}
              <Polyline
                positions={coordinates}
                pathOptions={{
                  color: baseColor,
                  weight: 5,
                  opacity: 0.95,
                  lineJoin: 'round',
                  lineCap: 'round',
                  dashArray: route.isFlooded ? '5, 10' : null
                }}
              />
            </React.Fragment>
          );
        } else {
          const baseColor = route.isFlooded ? '#ef4444' : '#3b82f6';
          return (
            <Polyline
              key={`alt-${index}`}
              positions={coordinates}
              pathOptions={{
                color: baseColor,
                weight: 4,
                opacity: 0.4,
                lineJoin: 'round',
                lineCap: 'round',
                dashArray: route.isFlooded ? '5, 10' : '2, 5'
              }}
            />
          );
        }
      })}
    </>
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
        background: 'var(--panel-bg-alpha)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--panel-border)',
        borderRadius: 16,
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Label left */}
      <div style={{ display: 'flex', alignItems: 'center', paddingRight: 10, borderRight: '1px solid var(--zinc-700)' }}>
        <span style={{ fontSize: 10, color: 'var(--zinc-500)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, whiteSpace: 'nowrap' }}>
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
                : '1px solid var(--panel-border)',
              background: isActive
                ? 'rgba(234,179,8,0.12)'
                : 'var(--control-btn-bg)',
              color: isActive ? '#eab308' : 'var(--zinc-500)',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 10, borderLeft: '1px solid var(--zinc-700)' }}>
        {[
          { color: '#3b82f6', label: 'Nhẹ' },
          { color: '#f59e0b', label: 'TB' },
          { color: '#ef4444', label: 'Nặng' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--zinc-500)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
