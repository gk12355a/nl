import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Sửa lỗi icon Marker của Leaflet không hiển thị
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  const center = [10.776, 106.700]; // Tọa độ TP.HCM

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md z-[1000]">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MapPin size={24} /> NL - Hệ Thống Cảnh Báo Ngập Lụt Real-time
        </h1>
      </header>

      {/* Map Area */}
      <main className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={center}>
            <Popup>
              Chào mừng bạn đến với hệ thống NL! <br /> Khu vực TP. Hồ Chí Minh.
            </Popup>
          </Marker>
        </MapContainer>
      </main>
    </div>
  );
}

export default App;