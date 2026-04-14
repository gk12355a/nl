import React from 'react';
import { ActivitySquare, Database, MapPin, Hash, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function GeoFeedDashboard({ reports, onRowClick }) {
  return (
    <div className="flex-1 overflow-y-auto pt-24 pb-12 px-6 lg:px-10 bg-zinc-950 font-sans">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-3">
              <ActivitySquare className="text-yellow-500" size={28} />
              Raw Geo Feed
            </h1>
            <p className="text-sm text-zinc-500 tracking-wide mt-1">Direct chronological pipeline of authenticated node telemetry.</p>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg">
             <Database size={18} className="text-green-500 animate-pulse" />
             <div>
               <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Sync Status</div>
               <div className="font-mono text-zinc-300 text-sm">Receiving Live ({reports.length} ops)</div>
             </div>
          </div>
        </header>

        {/* FEED LIST */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/80 border-b border-zinc-800 text-xs uppercase tracking-widest text-zinc-500 font-bold">
                  <th className="p-4 whitespace-nowrap min-w-[120px]">Timestamp</th>
                  <th className="p-4 whitespace-nowrap">Report ID</th>
                  <th className="p-4 whitespace-nowrap">Node Coordinates</th>
                  <th className="p-4 whitespace-nowrap text-center">Threat Level</th>
                  <th className="p-4 whitespace-nowrap text-center">Trust Metrics</th>
                  <th className="p-4 whitespace-nowrap text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-zinc-500 text-sm">
                      <div className="flex flex-col items-center gap-3">
                        <ActivitySquare size={32} className="opacity-50" />
                        <div>No telemetry packages received in the current sector.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reports.map(rep => {
                    const utcDateStr = rep.created_at.endsWith('Z') ? rep.created_at : `${rep.created_at}Z`;
                    const dateObj = new Date(utcDateStr);
                    const timeString = dateObj.toLocaleTimeString('en-US', { hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
                    const dateString = dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
                    
                    const statusColor = rep.status === 'verified' ? 'text-green-500 bg-green-500/10 border-green-500/20' 
                                      : rep.status === 'rejected' ? 'text-red-500 bg-red-500/10 border-red-500/20' 
                                      : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';

                    const levelColor = rep.flood_level === 'nặng' ? 'text-red-500' 
                                     : rep.flood_level === 'trung_bình' ? 'text-yellow-500' 
                                     : 'text-blue-400';

                    return (
                      <tr 
                        key={rep.id} 
                        onClick={() => onRowClick && onRowClick(rep.location.coordinates[1], rep.location.coordinates[0])}
                        className="hover:bg-zinc-900/30 transition-colors group cursor-pointer"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2 font-mono text-sm text-zinc-300">
                            <Clock size={14} className="text-zinc-600 hidden lg:block" />
                            <span>{dateString} <span className="opacity-50">|</span> <span className="text-zinc-100">{timeString}</span></span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            <Hash size={14} />
                            {rep.id.slice(-8).toUpperCase()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 font-mono text-xs bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800 w-max">
                            <MapPin size={12} className="text-yellow-500 shrink-0" />
                            Lat: {rep.location.coordinates[1].toFixed(5)} <span className="text-zinc-600">|</span> Lng: {rep.location.coordinates[0].toFixed(5)}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`font-mono text-xs font-bold uppercase tracking-wider ${levelColor}`}>
                            {rep.flood_level === 'trung_bình' ? 'Medium' : rep.flood_level === 'nặng' ? 'High' : 'Low'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-mono text-zinc-300">{rep.votes} Net Votes</span>
                            <div className="w-16 h-1 mt-1 bg-zinc-800 rounded-full overflow-hidden">
                               <div className={`h-full ${rep.votes > 0 ? 'bg-green-500' : rep.votes < 0 ? 'bg-red-500' : 'bg-zinc-600'}`} style={{ width: `${Math.min(Math.abs(rep.votes) * 10, 100)}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-widest ${statusColor}`}>
                            {rep.status === 'verified' ? <CheckCircle size={12} /> : rep.status === 'rejected' ? <XCircle size={12} /> : <ActivitySquare size={12} />}
                            {rep.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
