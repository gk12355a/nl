import React, { useState, useEffect } from 'react';
import { weatherApi } from '../services/api';
import { Activity, Droplet, AlertTriangle, ShieldCheck, CloudRain, MapPin } from 'lucide-react';

export default function AnalyticsDashboard({ defaultLocation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // HCM by default if no location
  const coords = defaultLocation || { lat: 10.776, lng: 106.700 };

  useEffect(() => {
    let isMounted = true;
    const fetchRiskSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await weatherApi.get('/predict/flood-risk', {
          params: { lat: coords.lat, lng: coords.lng }
        });
        if (isMounted) setData(res.data);
      } catch (err) {
        if (isMounted) setError("Failed to compute target algorithms. Node disconnected.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRiskSettings();
    return () => { isMounted = false; };
  }, [coords.lat, coords.lng]);

  const getRiskColor = (level) => {
    switch (level) {
      case 'High': return 'text-red-500 border-red-500/50 bg-red-500/10';
      case 'Medium': return 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10';
      default: return 'text-green-500 border-green-500/50 bg-green-500/10';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'High': return <AlertTriangle size={32} className="text-red-500" />;
      case 'Medium': return <Activity size={32} className="text-yellow-500" />;
      default: return <ShieldCheck size={32} className="text-green-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pt-24 pb-12 px-6 lg:px-10 bg-zinc-950">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-3">
              <Activity className="text-yellow-500" size={28} />
              Tactical Risk Analytics
            </h1>
            <p className="text-sm text-zinc-500 tracking-wide mt-1">Deep-dive predictive analytics and telemetry algorithms.</p>
          </div>
          <div className="text-right flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg">
             <MapPin size={18} className="text-yellow-500" />
             <div>
               <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Target Coordinates</div>
               <div className="font-mono text-zinc-300 text-sm">Lat: {coords.lat.toFixed(4)} | Lng: {coords.lng.toFixed(4)}</div>
             </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-yellow-500 rounded-full animate-spin"></div>
            <div className="text-zinc-500 uppercase tracking-widest font-mono text-sm animate-pulse">Running Predictions...</div>
          </div>
        ) : error ? (
           <div className="p-4 border border-red-500/30 bg-red-500/10 text-red-500 rounded-lg font-mono text-sm max-w-lg mx-auto text-center mt-10">
              {error}
           </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* OVERALL RISK CARD */}
            <div className={`col-span-1 border rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg transition-colors duration-500 ${getRiskColor(data.risk_level)}`}>
               {getRiskIcon(data.risk_level)}
               <h2 className="text-4xl font-black uppercase mt-4 mb-1">{data.risk_level}</h2>
               <div className="text-xs font-bold tracking-[0.2em] uppercase opacity-70">Threat Level Assessment</div>
            </div>

            {/* TELEMETRY METRICS */}
            <div className="col-span-1 lg:col-span-2 grid grid-cols-2 gap-4">
               {/* RAIN 1H */}
               <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
                 <div className="flex items-center justify-between text-zinc-400">
                   <h3 className="text-xs font-bold uppercase tracking-wider">Precipitation (1H)</h3>
                   <CloudRain size={20} className="text-blue-400" />
                 </div>
                 <div className="mt-4 flex items-end gap-2">
                   <span className="text-4xl font-mono font-bold text-zinc-100">{data.rain_1h_mm}</span>
                   <span className="text-zinc-500 mb-1 font-bold">mm</span>
                 </div>
                 <div className="w-full bg-zinc-800 h-1.5 mt-4 rounded-full overflow-hidden">
                   <div className="bg-blue-500 h-full" style={{ width: `${Math.min((data.rain_1h_mm / 50) * 100, 100)}%` }}></div>
                 </div>
               </div>

               {/* NEARBY INTEL */}
               <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
                 <div className="flex items-center justify-between text-zinc-400">
                   <h3 className="text-xs font-bold uppercase tracking-wider">Verified Intel Spots</h3>
                   <Droplet size={20} className="text-cyan-400" />
                 </div>
                 <div className="mt-4 flex items-end gap-2">
                   <span className="text-4xl font-mono font-bold text-zinc-100">{data.nearby_reports_count}</span>
                   <span className="text-zinc-500 mb-1 font-bold">nodes active</span>
                 </div>
                 <div className="w-full bg-zinc-800 h-1.5 mt-4 rounded-full overflow-hidden">
                   <div className="bg-cyan-500 h-full w-[40%] animate-pulse"></div>
                 </div>
               </div>
            </div>

            {/* REASONING ENGINE */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-xl mt-4">
               <div className="bg-zinc-800/50 p-4 border-b border-zinc-800 flex items-center justify-between">
                 <h3 className="text-xs font-bold text-zinc-300 tracking-widest uppercase">AI Classification Reasons</h3>
                 <span className="text-xs font-mono text-zinc-500">[{new Date(data.calculation_time).toLocaleTimeString()}]</span>
               </div>
               <div className="p-6">
                 {data.reasons.length === 0 ? (
                    <div className="text-zinc-500 text-sm">No specific triggers detected in the sector.</div>
                 ) : (
                   <ul className="space-y-3">
                     {data.reasons.map((r, i) => (
                       <li key={i} className="flex items-start gap-3">
                         <ShieldCheck className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                         <span className="text-sm text-zinc-300 font-mono leading-relaxed">{r}</span>
                       </li>
                     ))}
                   </ul>
                 )}
               </div>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}
