import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  vi: {
    translation: {
      // Sidebar
      liveMap: "Bản đồ trực tuyến",
      analytics: "Phân tích số liệu",
      geoFeed: "Bảng telemetry",
      connectNode: "Kết nối node",
      connected: "Đang kết nối",
      logout: "Đăng xuất",

      // Top Bar
      terminal: "Trạm điều khiển",
      liveIntelMap: "Bản đồ tình báo trực tiếp",
      networkSync: "Đồng bộ mạng lưới",
      operational: "Đang hoạt động",
      lightThemeTooltip: "Chuyển sang giao diện sáng",
      darkThemeTooltip: "Chuyển sang giao diện tối",
      switchLang: "English",

      // Live Events Stream
      liveEventsStream: "Dòng sự kiện trực tiếp",
      noRecentIntel: "Chưa phát hiện tín hiệu tình báo.",
      rawTelemetry: "Dữ liệu đo xa thô",
      severity: "Mức độ:",
      votes: "Số phiếu bầu:",
      confirm: "Xác nhận",
      reject: "Bác bỏ",
      intelStatus: "Tình báo:",

      // Routing Panel
      routingTitle: "Định tuyến tối ưu",
      collapse: "Thu gọn",
      expand: "Mở rộng",
      startPoint: "Điểm xuất phát",
      destination: "Điểm đến",
      placeholderStart: "Nhập địa chỉ hoặc click bản đồ...",
      placeholderEnd: "Nhập địa chỉ hoặc click bản đồ...",
      clickModeTip: "Click vào bản đồ để chọn {{mode}}",
      findRouteBtn: "Tìm đường đi",
      clearBtn: "Xóa",
      foundRoutes: "Các lộ trình tìm thấy",
      shortest: "Ngắn nhất",
      activeRoute: "Đang chọn",
      safe: "An toàn",
      flooded: "Ngập lụt",
      routeDescriptionSafe: "Lộ trình lý tưởng! Hệ thống đã tự động tính toán tránh toàn bộ điểm ngập lụt đang hoạt động. Tuyến đường hoàn toàn thông suốt và an toàn.",
      routeDescriptionFlooded: "Cảnh báo ngập lụt! Tuyến đường này đi qua {{count}} vùng ngập nước. Bạn nên chọn lộ trình an toàn có ký hiệu xanh lá.",

      // Other UI
      minutes: "phút",
      etaAt: "Đến lúc",
      userLocation: "Vị trí của bạn",

      // Tactical Risk Analytics
      tacticalRiskAnalytics: "Phân tích rủi ro chiến thuật",
      tacticalRiskDesc: "Thuật toán dự báo chuyên sâu và đo xa.",
      targetCoordinates: "Tọa độ mục tiêu",
      coordsFormat: "Vĩ độ: {{lat}} | Kinh độ: {{lng}}",
      threatLevelAssessment: "Đánh giá mức độ đe dọa",
      precipitation1h: "Lượng mưa (1H)",
      verifiedIntelSpots: "Điểm tình báo đã xác minh",
      nodesActive: "{{count}} node hoạt động",
      aiClassificationReasons: "Lý do phân loại AI",
      noSpecificTriggers: "Không phát hiện kích hoạt đặc biệt nào trong khu vực.",
      runningPredictions: "Đang tính toán dự báo...",
      failedToCompute: "Không thể tính toán các thuật toán mục tiêu. Node đã ngắt kết nối.",
      risk_Low: "Thấp",
      risk_Medium: "Trung bình",
      risk_High: "Cao",

      // Notifications
      notificationsTitle: "Thông báo",
      newNotifications: "{{count}} mới",
      readAll: "Đọc tất cả",
      clearAll: "Xóa tất cả",
      noNewNotifications: "Không có thông báo mới",
      notifFooter: "{{count}} thông báo • Cập nhật realtime",
      viewOnMap: "Xem trên bản đồ",
      
      // Notification Labels/Levels
      notifAlert: "CẢNH BÁO",
      notifNewReport: "BÁO CÁO MỚI",
      notifVerified: "XÁC NHẬN",
      notifInfo: "THÔNG TIN",
      levelLow: "Nhẹ",
      levelMedium: "Trung bình",
      levelHigh: "Nặng",

      // Time strings
      timeAgoSeconds: "{{count}}s trước",
      timeAgoMinutes: "{{count}}m trước",
      timeAgoHours: "{{count}}h trước",

      // Notification Texts
      severeFloodingReported: "⚠️ Ngập nghiêm trọng được báo cáo",
      reportVerified: "✅ Báo cáo đã được xác nhận",
      newFloodReport: "Báo cáo ngập mới — Mức {{level}}",
      severityLevel: "Mức độ: {{level}}",

      // Geo Feed
      rawGeoFeed: "Dữ liệu đo xa thô",
      geoFeedDesc: "Luồng truyền nhận dữ liệu đo xa đã xác thực theo trình tự thời gian.",
      syncStatus: "Trạng thái đồng bộ",
      receivingLive: "Đang nhận trực tiếp ({{count}} hoạt động)",
      timestampCol: "Mốc thời gian",
      reportIdCol: "Mã báo cáo",
      nodeCoordsCol: "Tọa độ Node",
      threatLevelCol: "Mức độ đe dọa",
      trustMetricsCol: "Chỉ số tin cậy",
      statusCol: "Trạng thái",
      noTelemetryPackages: "Chưa nhận được gói dữ liệu đo xa nào trong khu vực.",
      netVotes: "{{count}} phiếu bầu",
      status_pending: "Đang chờ",
      status_verified: "Đã xác minh",
      status_rejected: "Bị bác bỏ",
      level_Low: "Thấp",
      level_Medium: "Trung bình",
      level_High: "Cao"
    }
  },
  en: {
    translation: {
      // Sidebar
      liveMap: "Live Map",
      analytics: "Analytics",
      geoFeed: "Geo Feed",
      connectNode: "Connect Node",
      connected: "Connected",
      logout: "Disconnect Node",

      // Top Bar
      terminal: "Terminal",
      liveIntelMap: "Live Intel Map",
      networkSync: "Network Sync",
      operational: "Operational",
      lightThemeTooltip: "Switch to Light Theme",
      darkThemeTooltip: "Switch to Dark Theme",
      switchLang: "Tiếng Việt",

      // Live Events Stream
      liveEventsStream: "Live Events Stream",
      noRecentIntel: "No recent intel detected.",
      rawTelemetry: "Raw telemetry",
      severity: "Severity:",
      votes: "Net Votes:",
      confirm: "Confirm",
      reject: "Reject",
      intelStatus: "Intel:",

      // Routing Panel
      routingTitle: "Optimal Routing",
      collapse: "Collapse",
      expand: "Expand",
      startPoint: "Starting Point",
      destination: "Destination",
      placeholderStart: "Enter address or click map...",
      placeholderEnd: "Enter address or click map...",
      clickModeTip: "Click on map to select {{mode}}",
      findRouteBtn: "Find Route",
      clearBtn: "Clear",
      foundRoutes: "Routes Found",
      shortest: "Shortest",
      activeRoute: "Selected",
      safe: "Safe",
      flooded: "Flooded",
      routeDescriptionSafe: "Optimal route! The system has automatically bypassed all active flooded spots. Route is fully clear and safe.",
      routeDescriptionFlooded: "Flooding Warning! This route passes through {{count}} flooded area(s). We advise selecting a safe green route.",

      // Other UI
      minutes: "mins",
      etaAt: "Arrive at",
      userLocation: "Your Location",

      // Tactical Risk Analytics
      tacticalRiskAnalytics: "Tactical Risk Analytics",
      tacticalRiskDesc: "Deep-dive predictive analytics and telemetry algorithms.",
      targetCoordinates: "Target Coordinates",
      coordsFormat: "Lat: {{lat}} | Lng: {{lng}}",
      threatLevelAssessment: "Threat Level Assessment",
      precipitation1h: "Precipitation (1H)",
      verifiedIntelSpots: "Verified Intel Spots",
      nodesActive: "{{count}} nodes active",
      aiClassificationReasons: "AI Classification Reasons",
      noSpecificTriggers: "No specific triggers detected in the sector.",
      runningPredictions: "Running Predictions...",
      failedToCompute: "Failed to compute target algorithms. Node disconnected.",
      risk_Low: "Low",
      risk_Medium: "Medium",
      risk_High: "High",

      // Notifications
      notificationsTitle: "Notifications",
      newNotifications: "{{count}} new",
      readAll: "Read all",
      clearAll: "Clear all",
      noNewNotifications: "No new notifications",
      notifFooter: "{{count}} notifications • Realtime updates",
      viewOnMap: "View on map",
      
      // Notification Labels/Levels
      notifAlert: "WARNING",
      notifNewReport: "NEW REPORT",
      notifVerified: "VERIFIED",
      notifInfo: "INFO",
      levelLow: "Low",
      levelMedium: "Medium",
      levelHigh: "High",

      // Time strings
      timeAgoSeconds: "{{count}}s ago",
      timeAgoMinutes: "{{count}}m ago",
      timeAgoHours: "{{count}}h ago",

      // Notification Texts
      severeFloodingReported: "⚠️ Severe flooding reported",
      reportVerified: "✅ Report verified",
      newFloodReport: "New flood report — Level {{level}}",
      severityLevel: "Severity: {{level}}",

      // Geo Feed
      rawGeoFeed: "Raw Geo Feed",
      geoFeedDesc: "Direct chronological pipeline of authenticated node telemetry.",
      syncStatus: "Sync Status",
      receivingLive: "Receiving Live ({{count}} ops)",
      timestampCol: "Timestamp",
      reportIdCol: "Report ID",
      nodeCoordsCol: "Node Coordinates",
      threatLevelCol: "Threat Level",
      trustMetricsCol: "Trust Metrics",
      statusCol: "Status",
      noTelemetryPackages: "No telemetry packages received in the current sector.",
      netVotes: "{{count}} Net Votes",
      status_pending: "Pending",
      status_verified: "Verified",
      status_rejected: "Rejected",
      level_Low: "Low",
      level_Medium: "Medium",
      level_High: "High"
    }
  }
};

const savedLang = localStorage.getItem('i18nextLng') || 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;
