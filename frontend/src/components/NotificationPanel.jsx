import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, X, AlertTriangle, CheckCircle2, Info, Droplets, ChevronRight, Trash2 } from 'lucide-react';

// ─── Notification type config ────────────────────────────────────────────────
const NOTIF_CONFIG = {
  alert: {
    icon: AlertTriangle,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    labelKey: 'notifAlert',
  },
  report: {
    icon: Droplets,
    color: '#eab308',
    bg: 'rgba(234,179,8,0.08)',
    border: 'rgba(234,179,8,0.15)',
    labelKey: 'notifNewReport',
  },
  verified: {
    icon: CheckCircle2,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.15)',
    labelKey: 'notifVerified',
  },
  info: {
    icon: Info,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.15)',
    labelKey: 'notifInfo',
  },
};

function getNotifType(report) {
  if (report.flood_level === 'nặng') return 'alert';
  if (report.status === 'verified') return 'verified';
  return 'report';
}

function timeAgo(dateStr, t, lng) {
  const date = new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return t('timeAgoSeconds', { count: diff });
  if (diff < 3600) return t('timeAgoMinutes', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('timeAgoHours', { count: Math.floor(diff / 3600) });
  return date.toLocaleDateString(lng === 'vi' ? 'vi-VN' : 'en-US');
}

function floodLabel(level, t) {
  const map = {
    nhẹ: t('levelLow'),
    trung_bình: t('levelMedium'),
    nặng: t('levelHigh'),
    Low: t('levelLow'),
    Medium: t('levelMedium'),
    High: t('levelHigh')
  };
  return map[level] || level;
}

// ─── Single Notification Item ────────────────────────────────────────────────
function NotifItem({ notif, onRead, onLocate }) {
  const { t, i18n } = useTranslation();
  const cfg = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.info;
  const Icon = cfg.icon;

  const levelText = floodLabel(notif.rawLevel, t);
  let title = '';
  let detail = null;

  if (notif.type === 'alert') {
    title = t('severeFloodingReported');
    detail = notif.description ? notif.description.slice(0, 80) : t('severityLevel', { level: levelText });
  } else if (notif.type === 'verified') {
    title = t('reportVerified');
    detail = notif.description ? notif.description.slice(0, 80) : t('severityLevel', { level: levelText });
  } else {
    title = t('newFloodReport', { level: levelText });
    detail = notif.description ? notif.description.slice(0, 80) : null;
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 14px',
        background: notif.read ? 'transparent' : cfg.bg,
        borderLeft: `3px solid ${notif.read ? 'transparent' : cfg.color}`,
        borderBottom: '1px solid var(--notif-item-border)',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        position: 'relative',
      }}
      onClick={() => onRead(notif.id)}
    >
      {/* Icon */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <Icon size={15} color={cfg.color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: 1 }}>
            {t(cfg.labelKey)}
          </span>
          <span style={{ fontSize: 10, color: 'var(--zinc-600)', flexShrink: 0 }}>
            {timeAgo(notif.time, t, i18n.language)}
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--zinc-300)', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
          {title}
        </p>
        {detail && (
          <p style={{ fontSize: 11, color: 'var(--zinc-500)', margin: '4px 0 0', lineHeight: 1.4 }}>
            {detail}
          </p>
        )}
        {/* Locate button */}
        {notif.lat && notif.lng && onLocate && (
          <button
            onClick={(e) => { e.stopPropagation(); onLocate(notif.lat, notif.lng); }}
            style={{
              marginTop: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10,
              color: cfg.color,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontWeight: 600,
              opacity: 0.85,
            }}
          >
            <ChevronRight size={11} />
            {t('viewOnMap')}
          </button>
        )}
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <span
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: cfg.color,
            boxShadow: `0 0 6px ${cfg.color}`,
          }}
        />
      )}
    </div>
  );
}

// ─── Notification Panel (dropdown) ───────────────────────────────────────────
export default function NotificationPanel({
  notifications,
  unreadCount,
  isOpen,
  onToggle,
  onRead,
  onReadAll,
  onClear,
  onLocate,
}) {
  const { t } = useTranslation();
  const panelRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onToggle(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onToggle]);

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell trigger */}
      <button
        onClick={() => onToggle(!isOpen)}
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          transition: 'background 0.15s',
        }}
        title={t('notificationsTitle')}
      >
        <Bell
          size={18}
          color={isOpen ? '#eab308' : unreadCount > 0 ? 'var(--zinc-200)' : 'var(--zinc-500)'}
          style={{ transition: 'color 0.15s' }}
        />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: '#ef4444',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              boxShadow: '0 0 8px rgba(239,68,68,0.6)',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            right: -8,
            width: 360,
            maxHeight: 520,
            background: 'var(--panel-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--panel-border)',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9998,
            animation: 'notifSlideIn 0.18s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px 12px',
              borderBottom: '1px solid var(--notif-item-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={15} color="#eab308" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--zinc-100)', letterSpacing: 0.3 }}>
                {t('notificationsTitle')}
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'rgba(234,179,8,0.15)',
                    border: '1px solid rgba(234,179,8,0.3)',
                    color: '#eab308',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 7px',
                  }}
                >
                  {t('newNotifications', { count: unreadCount })}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {unreadCount > 0 && (
                <button
                  onClick={onReadAll}
                  style={{
                    fontSize: 10,
                    color: '#71717a',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '3px 6px',
                    borderRadius: 4,
                    transition: 'color 0.15s',
                    fontWeight: 500,
                  }}
                  title={t('readAll')}
                >
                  {t('readAll')}
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClear}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--zinc-600)',
                    padding: '3px 4px',
                    borderRadius: 4,
                    transition: 'color 0.15s',
                  }}
                  title={t('clearAll')}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: 420 }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 24px',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--zinc-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bell size={20} color="var(--zinc-700)" />
                </div>
                <p style={{ fontSize: 13, color: 'var(--zinc-600)', margin: 0, textAlign: 'center' }}>
                  {t('noNewNotifications')}
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifItem
                  key={n.id}
                  notif={n}
                  onRead={onRead}
                  onLocate={(lat, lng) => {
                    onLocate(lat, lng);
                    onToggle(false);
                  }}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--notif-item-border)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--zinc-600)' }}>
                {t('notifFooter', { count: notifications.length })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* CSS keyframe for slide-in */}
      <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Hook: useNotifications ───────────────────────────────────────────────────
export function useNotifications(reports) {
  const [notifications, setNotifications] = React.useState([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const prevReportIds = React.useRef(new Set());
  const notifCounter = React.useRef(0);

  // Convert a report → notification object
  const reportToNotif = React.useCallback((rep) => {
    const type = getNotifType(rep);
    const loc = rep.location?.coordinates;

    return {
      id: `notif-${rep.id || notifCounter.current++}`,
      reportId: rep.id,
      type,
      rawLevel: rep.flood_level,
      description: rep.description,
      time: rep.created_at || new Date().toISOString(),
      read: false,
      lat: loc ? loc[1] : null,
      lng: loc ? loc[0] : null,
    };
  }, []);

  // Sync notifications when reports change
  React.useEffect(() => {
    if (!reports || reports.length === 0) return;

    const newNotifs = [];
    reports.forEach((rep) => {
      if (!prevReportIds.current.has(rep.id)) {
        prevReportIds.current.add(rep.id);
        newNotifs.push(reportToNotif(rep));
      }
    });

    if (newNotifs.length > 0) {
      setNotifications((prev) => {
        const combined = [...newNotifs, ...prev];
        // Deduplicate by reportId, cap at 50
        const seen = new Set();
        return combined.filter((n) => {
          if (seen.has(n.reportId)) return false;
          seen.add(n.reportId);
          return true;
        }).slice(0, 50);
      });
    }
  }, [reports, reportToNotif]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = React.useCallback((id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = React.useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = React.useCallback(() => {
    setNotifications([]);
  }, []);

  const toggle = React.useCallback((val) => {
    setIsOpen(typeof val === 'boolean' ? val : (prev) => !prev);
  }, []);

  return { notifications, unreadCount, isOpen, toggle, markRead, markAllRead, clearAll };
}
