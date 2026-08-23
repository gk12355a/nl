import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, ThumbsUp, ThumbsDown } from 'lucide-react';
import { FloodZoneLayer, LayerControlPanel, RoutingPathLayer } from '../components/FloodLayers';
import RoutingPanel from '../components/RoutingPanel';

// Fix Default Leaflet icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function MapUpdater({ center, userLocation }) {
  const map = useMapEvents({});
  useEffect(() => {
    // Zoom in and fly to if center is the user's GPS location
    if (userLocation && Math.abs(center[0] - userLocation.lat) < 0.00001 && Math.abs(center[1] - userLocation.lng) < 0.00001) {
      map.flyTo(center, 15, { duration: 1.5 });
    } else if (center[0] !== 16.0544 || center[1] !== 108.2022) {
      // Focus on other coordinates (e.g., specific reports) and ensure zoom level is high enough
      map.flyTo(center, map.getZoom() < 12 ? 15 : map.getZoom(), { duration: 1.5 });
    }
  }, [center, userLocation, map]);
  return null;
}

function MapInvalidator() {
  const map = useMapEvents({});
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function LiveMap({
  theme,
  mapCenter,
  defaultZoom,
  handleMapClick,
  activeLayers,
  handleLayerToggle,
  reports,
  handleVote,
  routes,
  selectedRouteIndex,
  setSelectedRouteIndex,
  userLocation,
  setUserLocation,
  handleFindRoute,
  handleClearRoute,
  mapClickMode,
  setMapClickMode,
  routingStart,
  routingEnd,
  setRoutingStart,
  setRoutingEnd,
  reverseGeocode,
  handleLocateUser,
  t
}) {
  return (
    <div className="flex-1 w-full relative pt-16 z-[10]">
      <MapContainer
        center={mapCenter}
        zoom={userLocation ? 15 : defaultZoom}
        zoomControl={false}
        style={{ height: "100%", width: "100%", background: "var(--zinc-950)" }}
      >
        {/* Dynamic Theme Map */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url={theme === 'dark'
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          }
        />
        <ZoomControl position="bottomright" />

        <MapUpdater center={mapCenter} userLocation={userLocation} />
        <MapClickHandler onMapClick={handleMapClick} />
        <MapInvalidator />

        {/* ── Zone Circles Layer ── */}
        {activeLayers.includes('zones') && (
          <FloodZoneLayer reports={reports} onVote={handleVote} />
        )}

        {/* ── Routing Path Layer ── */}
        <RoutingPathLayer routes={routes} selectedRouteIndex={selectedRouteIndex} />

        {/* ── User Location Layer ── */}
        {userLocation && (
          <>
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={20}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.15,
                weight: 1,
                opacity: 0.3
              }}
            />
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={8}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#3b82f6',
                fillOpacity: 1,
                weight: 2,
                opacity: 1
              }}
            >
              <Popup className="tactical-popup">
                <div className="font-sans text-xs font-bold text-center p-1">Vị trí hiện tại của bạn</div>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* ── Marker Layer ── */}
        {activeLayers.includes('markers') && reports.map((rep, idx) => (
          <Marker key={rep.id || idx} position={[rep.location.coordinates[1], rep.location.coordinates[0]]}>
            <Popup className="tactical-popup">
              <div className="font-sans text-sm p-1 min-w-[200px]">
                <div className={`font-bold mb-1 tracking-wider uppercase text-xs ${rep.status === 'verified' ? 'text-green-500' : rep.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'}`}>
                  {t('intelStatus')} {rep.status}
                </div>
                <div className="text-zinc-300 mb-2">{rep.description || t('noRecentIntel')}</div>
                <div className="flex items-center text-xs mb-3">
                  <span className="text-zinc-500 mr-2">{t('severity')}</span>
                  <span className="text-yellow-500 uppercase">{rep.flood_level}</span>
                </div>
                {rep.image_url && <img src={rep.image_url} alt="Intel" className="mb-3 w-full h-28 object-cover rounded border border-zinc-800" />}
                <div className="flex items-center justify-between border-t border-zinc-800 pt-2 mt-2">
                  <span className="text-xs text-zinc-500">{t('votes')} <span className="text-zinc-300 font-bold">{rep.votes}</span></span>
                  <div className="flex gap-2">
                    <button onClick={() => handleVote(rep.id, true)} className="flex items-center gap-1 text-zinc-400 hover:text-green-400 text-xs px-2 py-1 bg-zinc-900 rounded border border-zinc-800 transition-colors">
                      <ThumbsUp size={12} /> {t('confirm')}
                    </button>
                    <button onClick={() => handleVote(rep.id, false)} className="flex items-center gap-1 text-zinc-400 hover:text-red-400 text-xs px-2 py-1 bg-zinc-900 rounded border border-zinc-800 transition-colors">
                      <ThumbsDown size={12} /> {t('reject')}
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* LAYER CONTROL PANEL */}
      <LayerControlPanel
        activeLayers={activeLayers}
        onToggle={handleLayerToggle}
      />

      {/* ROUTING FLOATING PANEL */}
      <RoutingPanel
        onFindRoute={handleFindRoute}
        onClearRoute={handleClearRoute}
        routes={routes}
        selectedRouteIndex={selectedRouteIndex}
        onSelectRoute={setSelectedRouteIndex}
        mapClickMode={mapClickMode}
        setMapClickMode={setMapClickMode}
        routingStart={routingStart}
        routingEnd={routingEnd}
        setRoutingStart={setRoutingStart}
        setRoutingEnd={setRoutingEnd}
        theme={theme}
        userLocation={userLocation}
        onUseCurrentLocation={async (type) => {
          if (!navigator.geolocation) {
            alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
            return;
          }
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              const coords = { lat: latitude, lng: longitude };
              setUserLocation(coords);

              const addressName = await reverseGeocode(latitude, longitude);
              const locationWithAddress = { ...coords, name: `Vị trí của tôi (${addressName})` };

              if (type === 'start') {
                setRoutingStart(locationWithAddress);
              } else {
                setRoutingEnd(locationWithAddress);
              }
            },
            (error) => {
              console.error("Lỗi định vị:", error);
              alert("Không thể lấy vị trí hiện tại. Vui lòng cấp quyền định vị!");
            },
            { enableHighAccuracy: true }
          );
        }}
      />

      {/* GPS FLOATING BUTTON */}
      <button
        onClick={handleLocateUser}
        className="absolute bottom-24 right-6 p-3 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 hover:border-yellow-500 rounded-full text-zinc-400 hover:text-yellow-500 hover:scale-110 shadow-2xl transition-all duration-200 z-[1000] flex items-center justify-center cursor-pointer"
        title="Định vị vị trí hiện tại của bạn"
      >
        <Compass size={20} />
      </button>

      {/* OVERLAY PANEL (Live Events Stream) */}
      <div className="absolute top-20 right-6 w-72 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-xl z-[1000] flex flex-col hidden lg:flex shadow-2xl">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-xs font-bold text-zinc-400 tracking-widest uppercase">{t('liveEventsStream')}</h3>
        </div>
        <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[60vh]">
          {reports.length === 0 ? (
            <div className="text-xs text-zinc-500 text-center py-4">{t('noRecentIntel')}</div>
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
                  <span className="text-zinc-300 text-xs truncate flex-1 mx-2">{rep.description || t('rawTelemetry')}</span>
                  <span className="text-yellow-600 text-[10px] font-bold uppercase shrink-0">LVL-{rep.flood_level === 'nặng' ? 3 : rep.flood_level === 'trung_bình' ? 2 : 1}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
