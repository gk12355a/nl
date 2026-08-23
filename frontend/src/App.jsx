import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Map, LayoutDashboard, User, LogOut, ChevronRight, ActivitySquare, Sun, Moon } from 'lucide-react';

import { useAuth } from './hooks/useAuth';
import { useReports } from './hooks/useReports';
import AuthModal from './components/AuthModal';
import ReportModal from './components/ReportModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import GeoFeedDashboard from './components/GeoFeedDashboard';
import NotificationPanel, { useNotifications } from './components/NotificationPanel';
import LiveMap from './pages/LiveMap';

export default function App() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, login, register, logout, forgotPassword, resetPassword } = useAuth();
  const { reports, fetchNearbyReports, submitReport, voteReport } = useReports();
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isReportOpen, setReportOpen] = useState(false);
  const [targetLocation, setTargetLocation] = useState(null);
  const [currentPath, setCurrentPath] = useState(() => {
    const p = window.location.pathname;
    if (p === '/analytics') return '/analytics';
    if (p === '/geofeed') return '/geofeed';
    if (p !== '/livemap') {
      window.history.replaceState({}, '', '/livemap');
    }
    return '/livemap';
  });

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      if (p === '/analytics') setCurrentPath('/analytics');
      else if (p === '/geofeed') setCurrentPath('/geofeed');
      else setCurrentPath('/livemap');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const activeTab = currentPath === '/analytics' ? 'analytics' : currentPath === '/geofeed' ? 'feed' : 'map';
  const [mapCenter, setMapCenter] = useState([16.0544, 108.2022]);
  const [activeLayers, setActiveLayers] = useState(['markers', 'zones']);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Routing states
  const [routingStart, setRoutingStart] = useState(null);
  const [routingEnd, setRoutingEnd] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [mapClickMode, setMapClickMode] = useState(null); // 'start' | 'end' | null
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const {
    notifications,
    unreadCount,
    isOpen: notifOpen,
    toggle: toggleNotif,
    markRead,
    markAllRead,
    clearAll: clearNotifs,
  } = useNotifications(reports);

  const handleNotifLocate = (lat, lng) => {
    setMapCenter([lat, lng]);
    navigateTo('/livemap');
  };

  // Initial load: Attempt to locate user on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter([latitude, longitude]);
          // Fetch reports around user's actual location (50km radius)
          fetchNearbyReports(latitude, longitude, 50);
        },
        (error) => {
          console.warn("Định vị lúc khởi động thất bại hoặc bị từ chối:", error);
          // Fallback to Vietnam center and fetch broad reports
          fetchNearbyReports(16.0544, 108.2022, 2000);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      // Browser doesn't support geolocation, fallback
      fetchNearbyReports(16.0544, 108.2022, 2000);
    }
  }, [fetchNearbyReports]);

  const defaultZoom = 6;

  // Remove mock tactical nodes since we fetch real ones now
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': 'vi,en' }
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address;
        const street = addr.road || addr.suburb || addr.quarter || addr.city_district || addr.city || "";
        const county = addr.county || addr.state || "";
        const cleanName = street && county ? `${street}, ${county}` : (data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        return cleanName.length > 55 ? cleanName.substring(0, 52) + "..." : cleanName;
      }
    } catch (e) {
      console.error("Reverse geocoding error", e);
    }
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  };

  const handleMapClick = async (latlng) => {
    if (mapClickMode === 'start') {
      setRoutingStart({ lat: latlng.lat, lng: latlng.lng, name: "Đang xác định vị trí..." });
      setMapClickMode(null);
      const name = await reverseGeocode(latlng.lat, latlng.lng);
      setRoutingStart({ lat: latlng.lat, lng: latlng.lng, name });
      return;
    }
    if (mapClickMode === 'end') {
      setRoutingEnd({ lat: latlng.lat, lng: latlng.lng, name: "Đang xác định vị trí..." });
      setMapClickMode(null);
      const name = await reverseGeocode(latlng.lat, latlng.lng);
      setRoutingEnd({ lat: latlng.lat, lng: latlng.lng, name });
      return;
    }

    if (!user) {
      setLoginOpen(true);
      return;
    }
    setTargetLocation(latlng);
    setReportOpen(true);
  };

  const handleVote = async (reportId, isUpvote) => {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    try {
      await voteReport(reportId, isUpvote, user.id || user._id || user.username);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFeedClick = (lat, lng) => {
    setMapCenter([lat, lng]);
    navigateTo('/livemap');
  };

  const handleLayerToggle = (layerId) => {
    setActiveLayers(prev =>
      prev.includes(layerId)
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    );
  };

  const getPointToSegmentDistance = (plat, plng, alat, alng, blat, blng) => {
    const x = plng;
    const y = plat;
    const ax = alng;
    const ay = alat;
    const bx = blng;
    const by = blat;

    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 0) {
      t = ((x - ax) * dx + (y - ay) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }

    const cx = ax + t * dx;
    const cy = ay + t * dy;

    const dLat = (y - cy) * 111139;
    const dLng = (x - cx) * 111139 * Math.cos(y * Math.PI / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  };

  const handleFindRoute = async () => {
    if (!routingStart || !routingEnd) return;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${routingStart.lng},${routingStart.lat};${routingEnd.lng},${routingEnd.lat}?overview=full&geometries=geojson&alternatives=true`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Không thể kết nối dịch vụ định tuyến");
      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        alert("Không tìm thấy đường đi giữa hai điểm này!");
        return;
      }

      const evaluateRoute = (route) => {
        let isFlooded = false;
        let intersectingFloodsCount = 0;
        const coordinates = route.geometry.coordinates;
        const intersectedFloodSpots = [];

        reports.forEach(rep => {
          if (rep.status === 'rejected') return;
          if (!rep.location?.coordinates || rep.location.coordinates.length !== 2) return;
          const floodLng = rep.location.coordinates[0];
          const floodLat = rep.location.coordinates[1];
          
          let radius = 50;
          if (rep.flood_level === 'nặng') radius = 100;
          else if (rep.flood_level === 'trung_bình') radius = 50;
          else if (rep.flood_level === 'nhẹ') radius = 25;

          for (let i = 0; i < coordinates.length - 1; i++) {
            const segStart = coordinates[i];
            const segEnd = coordinates[i + 1];

            const dist = getPointToSegmentDistance(
              floodLat, floodLng,
              segStart[1], segStart[0],
              segEnd[1], segEnd[0]
            );

            if (dist < radius) {
              isFlooded = true;
              intersectingFloodsCount++;
              intersectedFloodSpots.push({ lat: floodLat, lng: floodLng, radius });
              break;
            }
          }
        });

        return {
          ...route,
          isFlooded,
          intersectingFloodsCount,
          intersectedFloodSpots
        };
      };

      const evaluatedMainRoutes = data.routes.map(evaluateRoute);
      let allCandidateRoutes = [...evaluatedMainRoutes];
      const floodedRoutes = evaluatedMainRoutes.filter(r => r.isFlooded);

      if (floodedRoutes.length > 0) {
        const angle = Math.atan2(routingEnd.lat - routingStart.lat, routingEnd.lng - routingStart.lng);
        const detourPromises = [];
        const processedSpots = new Set();

        floodedRoutes.forEach(route => {
          route.intersectedFloodSpots.forEach(spot => {
            const spotKey = `${spot.lat.toFixed(4)}_${spot.lng.toFixed(4)}`;
            if (processedSpots.has(spotKey)) return;
            processedSpots.add(spotKey);

            const offsetDist = 0.009; // ~900m offset perpendicular
            const cosP = Math.cos(spot.lat * Math.PI / 180);

            const detourPts = [
              {
                lat: spot.lat + offsetDist * Math.sin(angle + Math.PI / 2),
                lng: spot.lng + offsetDist * Math.cos(angle + Math.PI / 2) / cosP
              },
              {
                lat: spot.lat + offsetDist * Math.sin(angle - Math.PI / 2),
                lng: spot.lng + offsetDist * Math.cos(angle - Math.PI / 2) / cosP
              }
            ];

            detourPts.forEach(pt => {
              const detourUrl = `https://router.project-osrm.org/route/v1/driving/${routingStart.lng},${routingStart.lat};${pt.lng},${pt.lat};${routingEnd.lng},${routingEnd.lat}?overview=full&geometries=geojson`;
              
              const fetchDetour = async () => {
                try {
                  const res = await fetch(detourUrl);
                  if (!res.ok) return null;
                  const rData = await res.json();
                  if (rData.routes && rData.routes.length > 0) {
                    return rData.routes[0];
                  }
                } catch (e) {
                  console.error("Lỗi tìm tuyến đường tránh:", e);
                }
                return null;
              };
              
              detourPromises.push(fetchDetour());
            });
          });
        });

        const calculatedDetourRoutes = (await Promise.all(detourPromises)).filter(Boolean);
        const evaluatedDetourRoutes = calculatedDetourRoutes.map(evaluateRoute);
        allCandidateRoutes = [...allCandidateRoutes, ...evaluatedDetourRoutes];
      }

      // De-duplicate routes
      const uniqueRoutes = [];
      const seenRoutes = new Set();
      
      allCandidateRoutes.forEach(route => {
        const distanceBucket = Math.round(route.distance / 100);
        const durationBucket = Math.round(route.duration / 20);
        const key = `${distanceBucket}_${durationBucket}`;
        
        if (!seenRoutes.has(key)) {
          seenRoutes.add(key);
          uniqueRoutes.push(route);
        }
      });

      const sortedRoutes = uniqueRoutes.sort((a, b) => {
        if (a.isFlooded && !b.isFlooded) return 1;
        if (!a.isFlooded && b.isFlooded) return -1;
        if (a.isFlooded && b.isFlooded) {
          return a.intersectingFloodsCount - b.intersectingFloodsCount;
        }
        return a.duration - b.duration;
      });

      const limitedRoutes = sortedRoutes.slice(0, 3);
      setRoutes(limitedRoutes);
      setSelectedRouteIndex(0);
    } catch (err) {
      console.error("Lỗi tìm đường:", err);
      alert("Lỗi khi kết nối dịch vụ tìm đường. Vui lòng thử lại sau!");
    }
  };

  const handleClearRoute = () => {
    setRoutingStart(null);
    setRoutingEnd(null);
    setRoutes([]);
    setSelectedRouteIndex(0);
    setMapClickMode(null);
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setUserLocation(coords);
        setMapCenter([latitude, longitude]);
      },
      (error) => {
        console.error("Lỗi định vị:", error);
        alert("Không thể định vị. Vui lòng cấp quyền truy cập vị trí cho trình duyệt!");
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-yellow-500/30">

      {/* SIDEBAR */}
      <aside className="w-16 lg:w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col transition-all duration-300 z-[1100]">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-zinc-800">
          <ActivitySquare className="text-yellow-500 shrink-0" size={28} />
          <span className="hidden lg:block ml-3 font-bold text-lg tracking-tight">NL<span className="text-yellow-500">Node</span></span>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-2 lg:px-4">
          <NavItem icon={<Map size={20} />} label={t('liveMap')} active={activeTab === 'map'} onClick={() => navigateTo('/livemap')} />
          <NavItem icon={<LayoutDashboard size={20} />} label={t('analytics')} active={activeTab === 'analytics'} onClick={() => navigateTo('/analytics')} />
          <NavItem icon={<ActivitySquare size={20} />} label={t('geoFeed')} active={activeTab === 'feed'} onClick={() => navigateTo('/geofeed')} />
        </nav>

        <div className="p-4 border-t border-zinc-800 flex justify-center lg:justify-start items-center">
          {authLoading ? (
            <div className="w-6 h-6 border-2 border-zinc-700 border-t-yellow-500 rounded-full animate-spin"></div>
          ) : user ? (
            <div className="flex items-center w-full justify-between group cursor-pointer" onClick={logout}>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-sm shrink-0">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-zinc-100 truncate w-32">{user.username}</p>
                  <p className="text-xs text-green-400">{t('connected')}</p>
                </div>
              </div>
              <LogOut size={16} className="hidden lg:block text-zinc-500 group-hover:text-red-400 transition-colors" />
            </div>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="lg:w-full flex items-center justify-center py-2 lg:bg-zinc-800 lg:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-300 hover:text-zinc-50"
            >
              <User size={20} className="lg:hidden" />
              <span className="hidden lg:block text-sm font-semibold tracking-wide">{t('connectNode')}</span>
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden">

        {/* TOP BAR */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 glass-panel absolute w-full z-[1000]">
          <div className="flex items-center text-sm font-medium text-zinc-400">
            <span>{t('terminal')}</span>
            <ChevronRight size={14} className="mx-2" />
            <span className="text-zinc-100">{t('liveIntelMap')}</span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs text-zinc-500">{t('networkSync')}</span>
              <span className="text-sm font-semibold text-green-400 flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                {t('operational')}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {/* LANGUAGE SWITCHER */}
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi')}
                className="px-2.5 py-1.5 text-xs font-bold tracking-wider rounded-lg border border-zinc-800 dark:border-zinc-800 hover:border-yellow-500/50 bg-zinc-900/60 dark:bg-zinc-900/60 text-zinc-300 hover:text-yellow-500 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                title={t('switchLang')}
              >
                <span className="text-base">{i18n.language === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
                <span className="font-mono uppercase">{i18n.language === 'vi' ? 'VI' : 'EN'}</span>
              </button>

              <button
                onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                className="p-2 text-zinc-400 hover:text-yellow-500 hover:bg-zinc-800/40 rounded-lg transition-all duration-200"
                title={theme === 'dark' ? t('lightThemeTooltip') : t('darkThemeTooltip')}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <NotificationPanel
                notifications={notifications}
                unreadCount={unreadCount}
                isOpen={notifOpen}
                onToggle={toggleNotif}
                onRead={markRead}
                onReadAll={markAllRead}
                onClear={clearNotifs}
                onLocate={handleNotifLocate}
              />
              <Activity size={18} className="text-green-500" />
            </div>
          </div>
        </header>

        {activeTab === 'map' && (
          <LiveMap
            theme={theme}
            mapCenter={mapCenter}
            defaultZoom={defaultZoom}
            handleMapClick={handleMapClick}
            activeLayers={activeLayers}
            handleLayerToggle={handleLayerToggle}
            reports={reports}
            handleVote={handleVote}
            routes={routes}
            selectedRouteIndex={selectedRouteIndex}
            setSelectedRouteIndex={setSelectedRouteIndex}
            userLocation={userLocation}
            setUserLocation={setUserLocation}
            handleFindRoute={handleFindRoute}
            handleClearRoute={handleClearRoute}
            mapClickMode={mapClickMode}
            setMapClickMode={setMapClickMode}
            routingStart={routingStart}
            routingEnd={routingEnd}
            setRoutingStart={setRoutingStart}
            setRoutingEnd={setRoutingEnd}
            reverseGeocode={reverseGeocode}
            handleLocateUser={handleLocateUser}
            t={t}
          />
        )}

        {/* MOUNT REAL ANALYTICS DASHBOARD */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard defaultLocation={targetLocation || { lat: mapCenter[0], lng: mapCenter[1] }} />
        )}

        {/* RAW GEO FEED TAB */}
        {activeTab === 'feed' && (
          <GeoFeedDashboard reports={reports} onRowClick={handleFeedClick} />
        )}
      </main>

      <AuthModal
        isOpen={isLoginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={login}
        onRegister={register}
        onForgotPassword={forgotPassword}
        onResetPassword={resetPassword}
      />
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={submitReport}
        defaultLocation={targetLocation}
      />
    </div>
  );
}

// MapClickHandler and MapUpdater helper components extracted to LiveMap.jsx

function NavItem({ icon, label, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 group
      ${active ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'}
    `}>
      <div className={`${active ? 'text-yellow-500' : 'text-zinc-500 group-hover:text-zinc-300'} transition-colors`}>
        {icon}
      </div>
      <span className="hidden lg:block font-medium text-sm">{label}</span>
    </div>
  );
}