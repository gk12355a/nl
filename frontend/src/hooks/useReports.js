import { useState, useCallback, useEffect, useRef } from 'react';
import { reportApi } from '../services/api';

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);

  // Khởi tạo WebSocket listener
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8003/ws";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log("Radar Signal Connected [WS]");
    
    ws.onmessage = (event) => {
      try {
        const newReport = JSON.parse(event.data);
        // Kiểm tra nếu chưa tồn tại thì thêm vào đầu list
        setReports(prev => {
          if (prev.find(r => r.id === newReport.id)) return prev;
          return [newReport, ...prev];
        });
      } catch (err) {
        console.error("Invalid WS Payload", err);
      }
    };

    return () => {
      if (ws.readyState === 1) ws.close();
    };
  }, []);

  const fetchNearbyReports = useCallback(async (lat, lng, radiusKm = 1000) => {
    setLoading(true);
    try {
      const { data } = await reportApi.get(`/reports/nearby`, {
        params: { lat, lng, radius_km: radiusKm }
      });
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitReport = async (reportData) => {
    const { data } = await reportApi.post('/reports', reportData);
    // Real-time server WebSocket sẽ tự dội msg về, không cần đẩy tay
    return data;
  };

  const voteReport = async (reportId, isUpvote, userId) => {
    try {
      const { data } = await reportApi.post(`/reports/${reportId}/vote`, {
        user_id: userId,
        is_upvote: isUpvote
      });
      // Update cục bộ
      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r, 
            votes: data.new_total_votes, 
            status: data.report_status,
            trust_score: data.new_trust_score
          };
        }
        return r;
      }));
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.detail || "You have already voted.");
    }
  };

  return { reports, loading, fetchNearbyReports, submitReport, voteReport };
}
