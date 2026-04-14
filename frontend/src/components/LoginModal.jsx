import React, { useState } from 'react';
import { X, Mail, Lock } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-100">Terminal Login</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-sm font-medium">{error}</div>}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={e=>setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                placeholder="trader@node.system"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={e=>setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button 
            disabled={loading}
            className="w-full py-3 mt-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold tracking-wide uppercase rounded-lg transition-colors disabled:opacity-50"
            type="submit"
          >
            {loading ? 'Authenticating...' : 'Connect node'}
          </button>
        </form>
      </div>
    </div>
  );
}
