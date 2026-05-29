import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, X, Search, CheckCircle, AlertTriangle, ArrowRight, CornerDownRight, Compass } from 'lucide-react';
import axios from 'axios';

export default function RoutingPanel({
  onFindRoute,
  onClearRoute,
  routes,
  selectedRouteIndex,
  onSelectRoute,
  mapClickMode,
  setMapClickMode,
  routingStart,
  routingEnd,
  setRoutingStart,
  setRoutingEnd,
  theme,
  userLocation,
  onUseCurrentLocation
}) {
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingEnd, setLoadingEnd] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  const startTimeoutRef = useRef(null);
  const endTimeoutRef = useRef(null);

  // Sync inputs when points are selected via map click
  useEffect(() => {
    if (routingStart) {
      setStartQuery(routingStart.name || `${routingStart.lat.toFixed(5)}, ${routingStart.lng.toFixed(5)}`);
    } else {
      setStartQuery('');
    }
  }, [routingStart]);

  useEffect(() => {
    if (routingEnd) {
      setEndQuery(routingEnd.name || `${routingEnd.lat.toFixed(5)}, ${routingEnd.lng.toFixed(5)}`);
    } else {
      setEndQuery('');
    }
  }, [routingEnd]);

  // Geocoding suggestions from OSM Nominatim
  const fetchSuggestions = async (query, setSuggestions, setLoading) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          limit: 5,
          countrycodes: 'vn', // Vietnam focused
          addressdetails: 1
        },
        headers: {
          'Accept-Language': 'vi,en'
        }
      });
      setSuggestions(res.data);
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChange = (e) => {
    const val = e.target.value;
    setStartQuery(val);
    if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
    startTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(val, setStartSuggestions, setLoadingStart);
    }, 500);
  };

  const handleEndChange = (e) => {
    const val = e.target.value;
    setEndQuery(val);
    if (endTimeoutRef.current) clearTimeout(endTimeoutRef.current);
    endTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(val, setEndSuggestions, setLoadingEnd);
    }, 500);
  };

  const handleSelectStart = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setRoutingStart({ lat, lng, name: item.display_name });
    setStartQuery(item.display_name);
    setStartSuggestions([]);
  };

  const handleSelectEnd = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setRoutingEnd({ lat, lng, name: item.display_name });
    setEndQuery(item.display_name);
    setEndSuggestions([]);
  };

  const handleClear = () => {
    setStartQuery('');
    setEndQuery('');
    setStartSuggestions([]);
    setEndSuggestions([]);
    onClearRoute();
  };

  const getETA = (durationSeconds) => {
    const now = new Date();
    const etaDate = new Date(now.getTime() + durationSeconds * 1000);
    const hours = String(etaDate.getHours()).padStart(2, '0');
    const minutes = String(etaDate.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Get active route metrics
  const activeRoute = routes && routes.length > 0 ? routes[selectedRouteIndex || 0] : null;

  return (
    <div className="absolute top-20 left-6 w-80 sm:w-96 bg-zinc-950/90 dark:bg-zinc-950/90 light:bg-white/95 backdrop-blur-md border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 rounded-2xl z-[1000] shadow-2xl flex flex-col transition-all duration-300 overflow-hidden text-zinc-100 light:text-zinc-800">
      
      {/* PANEL HEADER */}
      <div className="p-4 border-b border-zinc-800 dark:border-zinc-800 light:border-zinc-200 flex items-center justify-between bg-zinc-900/60 light:bg-zinc-100/60">
        <div className="flex items-center gap-2">
          <Navigation size={18} className="text-yellow-500 animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase text-zinc-300 light:text-zinc-600">Định tuyến tối ưu</span>
        </div>
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="text-xs text-zinc-500 hover:text-zinc-300 font-bold px-2 py-1 rounded bg-zinc-900 light:bg-zinc-200 border border-zinc-800 light:border-zinc-300"
        >
          {panelOpen ? 'Thu gọn' : 'Mở rộng'}
        </button>
      </div>

      {panelOpen && (
        <div className="p-4 space-y-4">
          
          {/* STARTING POINT INPUT */}
          <div className="relative space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Điểm xuất phát</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Nhập địa chỉ hoặc click bản đồ..."
                  value={startQuery}
                  onChange={handleStartChange}
                  className="w-full text-sm py-2 pl-3 pr-8 bg-zinc-900/80 light:bg-zinc-100 border border-zinc-800 light:border-zinc-300 rounded-lg text-zinc-100 light:text-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors"
                />
                {loadingStart && (
                  <div className="absolute right-2.5 top-2.5 w-4 h-4 border-2 border-zinc-700 border-t-yellow-500 rounded-full animate-spin"></div>
                )}
              </div>
              <button
                onClick={() => setMapClickMode(mapClickMode === 'start' ? null : 'start')}
                className={`px-2.5 rounded-lg border transition-all duration-200 flex items-center justify-center shrink-0 ${
                  mapClickMode === 'start'
                    ? 'bg-yellow-500 text-black border-yellow-500 font-bold scale-105'
                    : 'bg-zinc-900 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 border-zinc-800 light:border-zinc-300 hover:border-zinc-700'
                }`}
                title="Chọn điểm xuất phát trên bản đồ"
              >
                <MapPin size={16} />
              </button>
              <button
                onClick={() => onUseCurrentLocation('start')}
                className="px-2.5 rounded-lg border border-zinc-800 light:border-zinc-300 bg-zinc-900/60 light:bg-zinc-100 text-zinc-400 hover:text-yellow-500 hover:border-zinc-700 transition-colors flex items-center justify-center shrink-0"
                title="Sử dụng vị trí hiện tại của tôi"
              >
                <Compass size={16} />
              </button>
            </div>
            {/* Suggestions list */}
            {startSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[54px] bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-300 rounded-lg shadow-2xl z-[2000] max-h-48 overflow-y-auto font-sans text-xs">
                {startSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectStart(item)}
                    className="p-2.5 hover:bg-zinc-800 light:hover:bg-zinc-100 border-b border-zinc-800/40 light:border-zinc-200 cursor-pointer text-zinc-300 light:text-zinc-700 truncate"
                    title={item.display_name}
                  >
                    {item.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DESTINATION INPUT */}
          <div className="relative space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Điểm đến</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Nhập địa chỉ hoặc click bản đồ..."
                  value={endQuery}
                  onChange={handleEndChange}
                  className="w-full text-sm py-2 pl-3 pr-8 bg-zinc-900/80 light:bg-zinc-100 border border-zinc-800 light:border-zinc-300 rounded-lg text-zinc-100 light:text-zinc-800 focus:outline-none focus:border-yellow-500 transition-colors"
                />
                {loadingEnd && (
                  <div className="absolute right-2.5 top-2.5 w-4 h-4 border-2 border-zinc-700 border-t-yellow-500 rounded-full animate-spin"></div>
                )}
              </div>
              <button
                onClick={() => setMapClickMode(mapClickMode === 'end' ? null : 'end')}
                className={`px-2.5 rounded-lg border transition-all duration-200 flex items-center justify-center shrink-0 ${
                  mapClickMode === 'end'
                    ? 'bg-yellow-500 text-black border-yellow-500 font-bold scale-105'
                    : 'bg-zinc-900 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 border-zinc-800 light:border-zinc-300 hover:border-zinc-700'
                }`}
                title="Chọn điểm đến trên bản đồ"
              >
                <MapPin size={16} />
              </button>
              <button
                onClick={() => onUseCurrentLocation('end')}
                className="px-2.5 rounded-lg border border-zinc-800 light:border-zinc-300 bg-zinc-900/60 light:bg-zinc-100 text-zinc-400 hover:text-yellow-500 hover:border-zinc-700 transition-colors flex items-center justify-center shrink-0"
                title="Sử dụng vị trí hiện tại của tôi"
              >
                <Compass size={16} />
              </button>
            </div>
            {/* Suggestions list */}
            {endSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[54px] bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-300 rounded-lg shadow-2xl z-[2000] max-h-48 overflow-y-auto font-sans text-xs">
                {endSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectEnd(item)}
                    className="p-2.5 hover:bg-zinc-800 light:hover:bg-zinc-100 border-b border-zinc-800/40 light:border-zinc-200 cursor-pointer text-zinc-300 light:text-zinc-700 truncate"
                    title={item.display_name}
                  >
                    {item.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SYSTEM TIP FOR CLICK MODE */}
          {mapClickMode && (
            <div className="p-2 border border-yellow-500/20 bg-yellow-500/5 text-yellow-500 rounded-lg text-xs font-mono text-center animate-pulse">
              Click vào bản đồ để chọn {mapClickMode === 'start' ? 'Điểm xuất phát' : 'Điểm đến'}
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onFindRoute}
              disabled={!routingStart || !routingEnd}
              className={`flex-1 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
                routingStart && routingEnd
                  ? 'bg-yellow-500 text-black hover:bg-yellow-400 hover:shadow-lg shadow-yellow-500/10 cursor-pointer font-bold'
                  : 'bg-zinc-800 light:bg-zinc-200 text-zinc-500 light:text-zinc-400 cursor-not-allowed border border-zinc-700/30'
              }`}
            >
              <Navigation size={15} /> Tìm đường đi
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-zinc-800 light:border-zinc-300 bg-zinc-900/60 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 rounded-xl text-sm font-semibold transition-colors"
            >
              Xóa
            </button>
          </div>

          {/* ROUTING RESULTS AREA */}
          {routes && routes.length > 0 && (
            <div className="mt-4 border-t border-zinc-800/60 dark:border-zinc-800/60 light:border-zinc-200 pt-4 space-y-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Các lộ trình tìm thấy</span>
              
              <div className="space-y-2">
                {routes.map((route, index) => {
                  const isSelected = selectedRouteIndex === index;
                  const isFlooded = route.isFlooded;
                  
                  return (
                    <div
                      key={index}
                      onClick={() => onSelectRoute(index)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-start justify-between gap-3 ${
                        isSelected
                          ? isFlooded
                            ? 'bg-red-500/10 border-red-500/40 text-zinc-100 shadow-md shadow-red-500/5'
                            : 'bg-green-500/10 border-green-500/40 text-zinc-100 shadow-md shadow-green-500/5'
                          : 'bg-zinc-900/30 light:bg-zinc-50 border-zinc-800/50 light:border-zinc-200 hover:bg-zinc-900/60 light:hover:bg-zinc-100 text-zinc-400'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${isSelected ? 'text-zinc-200' : 'text-zinc-400'}`}>
                            Lộ trình {index + 1}
                          </span>
                          {index === 0 && (
                            <span className="text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1 rounded uppercase font-bold tracking-wider">Ngắn nhất</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold">
                          <span className="text-zinc-100 light:text-zinc-800 font-mono">{(route.distance / 1000).toFixed(1)} km</span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-zinc-100 light:text-zinc-800 font-mono">{Math.round(route.duration / 60)} phút</span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-yellow-500 dark:text-yellow-500 light:text-yellow-600 font-mono text-[11px] font-bold">Đến lúc {getETA(route.duration)}</span>
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                        {isFlooded ? (
                          <span className="text-[10px] flex items-center gap-1 bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
                            <AlertTriangle size={10} /> Ngập lụt ({route.intersectingFloodsCount})
                          </span>
                        ) : (
                          <span className="text-[10px] flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">
                            <CheckCircle size={10} /> An toàn
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider flex items-center gap-1">
                            <ArrowRight size={10} /> Đang chọn
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ROUTE DESCRIPTION / INSIGHT */}
              {activeRoute && (
                <div className={`p-3 border rounded-xl flex gap-2.5 text-xs leading-relaxed ${
                  activeRoute.isFlooded
                    ? 'border-red-500/20 bg-red-500/5 text-red-300 light:text-red-800'
                    : 'border-green-500/20 bg-green-500/5 text-green-300 light:text-green-800'
                }`}>
                  {activeRoute.isFlooded ? (
                    <>
                      <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <strong>Cảnh báo ngập lụt!</strong> Tuyến đường này đi qua <strong>{activeRoute.intersectingFloodsCount} vùng ngập nước</strong>. Bạn nên chọn lộ trình an toàn có ký hiệu xanh lá.
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <strong>Lộ trình lý tưởng!</strong> Hệ thống đã tự động tính toán tránh toàn bộ điểm ngập lụt đang hoạt động. Tuyến đường hoàn toàn thông suốt và an toàn.
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          )}
          
        </div>
      )}
    </div>
  );
}
