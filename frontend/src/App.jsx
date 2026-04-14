import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity, Bell, Map, LayoutDashboard, User, LogOut, ChevronRight, ActivitySquare, PlusCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { useAuth } from './hooks/useAuth';
import { useReports } from './hooks/useReports';
import AuthModal from './components/AuthModal';
import ReportModal from './components/ReportModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import GeoFeedDashboard from './components/GeoFeedDashboard';

// Fix Default Leaflet icon issue
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function App() {
  const { user, loading: authLoading, login, register, logout } = useAuth();
  const { reports, fetchNearbyReports, submitReport, voteReport } = useReports();
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isReportOpen, setReportOpen] = useState(false);
  const [targetLocation, setTargetLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [unreadCount, setUnreadCount] = useState(0);
  const [mapCenter, setMapCenter] = useState([16.0544, 108.2022]);

  // Initial load
  useEffect(() => {
    // Center of Vietnam roughly, getting broad radius
    fetchNearbyReports(16.0544, 108.2022, 2000); 
  }, [fetchNearbyReports]);

  const defaultZoom = 6;

  // Remove mock tactical nodes since we fetch real ones now
  // Handlers
  const handleMapClick = (latlng) => {
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
    setActiveTab('map');
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
          <NavItem icon={<Map size={20} />} label="Live Map" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
          <NavItem icon={<LayoutDashboard size={20} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <NavItem icon={<ActivitySquare size={20} />} label="Geo Feed" active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} />
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
                  <p className="text-xs text-green-400">Connected</p>
                </div>
              </div>
              <LogOut size={16} className="hidden lg:block text-zinc-500 group-hover:text-red-400 transition-colors" />
            </div>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="lg:w-full flex items-center justify-center py-2 lg:bg-zinc-800 lg:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-300 hover:text-white"
            >
              <User size={20} className="lg:hidden" />
              <span className="hidden lg:block text-sm font-semibold tracking-wide">Connect User Node</span>
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden">

        {/* TOP BAR */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 glass-panel absolute w-full z-[1000]">
          <div className="flex items-center text-sm font-medium text-zinc-400">
            <span>Terminal</span>
            <ChevronRight size={14} className="mx-2" />
            <span className="text-zinc-100">Live Intel Map</span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs text-zinc-500">Network Sync</span>
              <span className="text-sm font-semibold text-green-400 flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Operational
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell size={18} className="text-zinc-400 cursor-pointer hover:text-white transition-colors" onClick={() => setUnreadCount(0)} />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308]"></span>}
              </div>
              <Activity size={18} className="text-green-500" />
            </div>
          </div>
        </header>

        {activeTab === 'map' && (
          <>
            {/* INTERACTIVE MAP CONTAINER */}
            <div className="flex-1 w-full relative pt-16 z-[10]">
              <MapContainer
                center={mapCenter}
                zoom={defaultZoom}
                zoomControl={false}
                style={{ height: "100%", width: "100%", background: "#09090b" }}
              >
                {/* Dark mode Map */}
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <ZoomControl position="bottomright" />

                <MapUpdater center={mapCenter} />
                <MapClickHandler onMapClick={handleMapClick} />
                
                {reports.map((rep, idx) => (
                  <Marker key={rep.id || idx} position={[rep.location.coordinates[1], rep.location.coordinates[0]]}>
                    <Popup className="tactical-popup">
                      <div className="font-sans text-sm p-1 min-w-[200px]">
                        <div className={`font-bold mb-1 tracking-wider uppercase text-xs ${rep.status === 'verified' ? 'text-green-500' : rep.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'}`}>
                          Intel: {rep.status}
                        </div>
                        <div className="text-zinc-300 mb-2">{rep.description || 'No contextual intel provided.'}</div>
                        <div className="flex items-center text-xs mb-3">
                          <span className="text-zinc-500 mr-2">Severity:</span>
                          <span className="text-yellow-500 uppercase">{rep.flood_level}</span>
                        </div>
                        {rep.image_url && <img src={rep.image_url} alt="Intel" className="mb-3 w-full h-28 object-cover rounded border border-zinc-800" />}
                        
                        {/* VOTE METRICS */}
                        <div className="flex items-center justify-between border-t border-zinc-800 pt-2 mt-2">
                           <span className="text-xs text-zinc-500">Net Votes: <span className="text-zinc-300 font-bold">{rep.votes}</span></span>
                           <div className="flex gap-2">
                              <button onClick={() => handleVote(rep.id, true)} className="flex items-center gap-1 text-zinc-400 hover:text-green-400 text-xs px-2 py-1 bg-zinc-900 rounded border border-zinc-800 transition-colors">
                                <ThumbsUp size={12} /> Confirm
                              </button>
                              <button onClick={() => handleVote(rep.id, false)} className="flex items-center gap-1 text-zinc-400 hover:text-red-400 text-xs px-2 py-1 bg-zinc-900 rounded border border-zinc-800 transition-colors">
                                <ThumbsDown size={12} /> Reject
                              </button>
                           </div>
                        </div>

                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* OVERLAY PANEL (Like an Order Book) */}
              <div className="absolute top-20 right-6 w-72 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-xl z-[1000] flex flex-col hidden lg:flex shadow-2xl">
                <div className="p-4 border-b border-zinc-800">
                  <h3 className="text-xs font-bold text-zinc-400 tracking-widest uppercase">Live Events Stream</h3>
                </div>
                <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[60vh]">
                  {reports.length === 0 ? (
                    <div className="text-xs text-zinc-500 text-center py-4">No recent intel detected.</div>
                  ) : (
                    reports.slice(0, 8).map(rep => {
                      const utcDateStr = rep.created_at.endsWith('Z') ? rep.created_at : `${rep.created_at}Z`;
                      const timeString = new Date(utcDateStr).toLocaleTimeString('en-US', { 
                        hour12: false,
                        timeZone: 'Asia/Ho_Chi_Minh'
                      });
                      const statusColor = rep.status === 'verified' ? 'text-green-500' : rep.status === 'rejected' ? 'text-red-500' : 'text-yellow-500';
                      return (
                        <div key={rep.id} className="flex justify-between items-center text-sm border-b border-zinc-900 pb-2">
                          <span className={`${statusColor} font-mono text-xs w-16`}>{timeString}</span>
                          <span className="text-zinc-300 text-xs truncate flex-1 mx-2">{rep.description || 'Raw telemetry'}</span>
                          <span className="text-yellow-600 text-[10px] font-bold uppercase shrink-0">LVL-{rep.flood_level === 'nặng' ? 3 : rep.flood_level === 'trung_bình' ? 2 : 1}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
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

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function MapUpdater({ center }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center[0] !== 16.0544) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

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