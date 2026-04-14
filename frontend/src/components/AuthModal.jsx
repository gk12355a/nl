import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }) {
  const [isLogin, setIsLogin] = useState(true);
  
  // States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        await onRegister({ email, password, username, full_name: fullName });
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-xl font-bold text-zinc-100">
            {isLogin ? 'Terminal Login' : 'Register New Node'}
          </h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-sm font-medium">
              {error}
            </div>
          )}

          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="text" 
                    value={username}
                    onChange={e=>setUsername(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    placeholder="trader_xyz"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Full Name (Optional)</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={e=>setFullName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            </>
          )}

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
                placeholder="•••••••• (Min 6 chars)"
                minLength="6"
                required
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full py-3 mt-6 bg-yellow-500 hover:bg-yellow-400 text-black font-bold tracking-wide uppercase rounded-lg transition-colors disabled:opacity-50"
            type="submit"
          >
            {loading ? 'Processing...' : (isLogin ? 'Connect Node' : 'Register Node')}
          </button>
          
          <div className="mt-4 text-center">
            <button 
              type="button" 
              onClick={toggleMode}
              className="text-xs text-zinc-400 hover:text-yellow-500 transition-colors cursor-pointer"
            >
              {isLogin ? "Don't have an auth key? Create one here." : "Already have an auth key? Log in."}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
