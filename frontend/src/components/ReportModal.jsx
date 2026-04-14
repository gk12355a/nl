import React, { useState, useRef } from 'react';
import { X, MapPin, Droplet, Check, FileText, UploadCloud, ImageIcon } from 'lucide-react';

import { reportApi } from '../services/api';

export default function ReportModal({ isOpen, onClose, onSubmit, defaultLocation }) {
  const [floodLevel, setFloodLevel] = useState('nhẹ');
  const [description, setDescription] = useState('');
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToBackend = async (file) => {
    const formData = new FormData();
    // Chìa khóa FormData phải trùng tên với param của FastAPI: `file`
    formData.append('file', file);
    
    // Gọi API upload thông qua api-gateway (route -> report-service)
    const { data } = await reportApi.post('/reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (data.image_url) {
      return data.image_url;
    }
    throw new Error('Server returned invalid upload response');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setError("Image telemetry is required to verify condition.");
      return;
    }

    setLoading(true);
    setError('');
    
    // Fallback if no location is provided
    const loc = defaultLocation || { lat: 10.776, lng: 106.700 };

    try {
      setIsUploading(true);
      const uploadedUrl = await uploadToBackend(imageFile);
      setIsUploading(false);

      await onSubmit({
        location: {
          type: "Point",
          coordinates: [loc.lng, loc.lat] // GeoJSON is [lng, lat]
        },
        image_url: uploadedUrl,
        flood_level: floodLevel,
        description: description
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit Intel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Droplet className="text-yellow-500" size={20} /> Submit Threat Intel
          </h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-500/10 text-red-500 rounded text-sm">{error}</div>}

          <div className="space-y-1 text-sm text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex items-start gap-2">
            <MapPin className="text-green-400 shrink-0 mt-0.5" size={16} />
            <div>
              <div className="font-bold text-zinc-100 uppercase tracking-wide text-xs mb-1">Target Coordinates</div>
              <div className="font-mono text-zinc-400 text-xs text-green-500">
                Lat: {defaultLocation?.lat?.toFixed(4) || "Unknown"} <br/>
                Lng: {defaultLocation?.lng?.toFixed(4) || "Unknown"}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Threat Severity</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {['nhẹ', 'trung_bình', 'nặng'].map(lvl => (
                <div 
                  key={lvl}
                  onClick={() => setFloodLevel(lvl)}
                  className={`p-2 text-center text-xs font-medium rounded border cursor-pointer transition-colors uppercase ${floodLevel === lvl ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                >
                  {lvl.replace('_', ' ')}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Telemetry Image Upload</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                imagePreview ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-700 hover:border-yellow-500 hover:bg-zinc-900/50'
              }`}
            >
              {imagePreview ? (
                <div className="relative w-full text-center">
                  <div className="flex justify-center mb-2">
                    <img src={imagePreview} className="h-32 rounded object-cover border border-zinc-700" alt="Preview" />
                  </div>
                  <span className="text-xs text-yellow-500 underline uppercase tracking-widest">Click to change intel</span>
                </div>
              ) : (
                <div className="space-y-2 text-center flex flex-col items-center">
                  <UploadCloud className="mx-auto text-zinc-500" size={32} />
                  <div className="text-sm text-zinc-300">
                    <span className="text-yellow-500 font-semibold cursor-pointer">Click to browse </span> 
                    or drag and drop
                  </div>
                  <p className="text-xs text-zinc-500">PNG, JPG, HEIC up to 10MB</p>
                </div>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Additional Context</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-zinc-500" size={18} />
              <textarea 
                value={description}
                onChange={e=>setDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-yellow-500 transition-colors min-h-[80px]"
                placeholder="Tactical details regarding the flood..."
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 mt-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold tracking-wide uppercase rounded-lg transition-colors disabled:opacity-50"
            type="submit"
          >
            {isUploading ? 'Uploading to Server...' : loading ? 'Transmitting Data...' : <><Check size={18} /> Push Intel</>}
          </button>
        </form>
      </div>
    </div>
  );
}
