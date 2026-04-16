import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, KeyRound, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

// Views: 'login' | 'register' | 'forgot' | 'reset'
export default function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  onForgotPassword,
  onResetPassword,
}) {
  const [view, setView] = useState('login');

  // Login / Register fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // Forgot / Reset fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);

  // UI States
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const clearErrors = () => { setError(''); setInfo(''); };

  const switchView = (v) => {
    setView(v);
    clearErrors();
    setSuccess(false);
  };

  // ── Login ──────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    clearErrors();
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

  // ── Register ───────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    try {
      await onRegister({ email, password, username, full_name: fullName });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password ─────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    try {
      const data = await onForgotPassword(forgotEmail);
      // DEV MODE: auto-fill the reset token if returned by backend
      if (data?.reset_token) {
        setResetToken(data.reset_token);
        setInfo('DEV MODE: Reset token has been auto-filled below for testing.');
      } else {
        setInfo('If this email exists, a reset link has been sent.');
      }
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not process request');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset Password ──────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearErrors();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await onResetPassword(resetToken, newPassword);
      setSuccess(true);
      setInfo('Password reset successfully! You can now log in.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. Token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  // ── Shared input style ──────────────────────────────────────
  const inputCls =
    'w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-10 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500 transition-colors text-sm';
  const labelCls = 'text-xs font-semibold text-zinc-400 uppercase tracking-wide';

  // ── Title map ───────────────────────────────────────────────
  const titles = {
    login: 'Terminal Login',
    register: 'Register New Node',
    forgot: 'Recover Access',
    reset: 'Set New Password',
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            {(view === 'forgot' || view === 'reset') && (
              <button
                onClick={() => switchView('login')}
                className="p-1 text-zinc-400 hover:text-yellow-500 transition-colors"
                title="Back to login"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-xl font-bold text-zinc-100">{titles[view]}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Error banner */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          {/* Info banner */}
          {info && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg text-sm">
              {info}
            </div>
          )}

          {/* ──── LOGIN VIEW ──────────────────────────────────── */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className={labelCls}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                    placeholder="user@node.system"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                    placeholder="••••••••"
                    minLength="6"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Forgot password link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchView('forgot')}
                  className="text-xs text-zinc-400 hover:text-yellow-500 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                disabled={loading}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold tracking-wide uppercase rounded-lg transition-colors disabled:opacity-50"
                type="submit"
              >
                {loading ? 'Processing...' : 'Connect Node'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchView('register')}
                  className="text-xs text-zinc-400 hover:text-yellow-500 transition-colors"
                >
                  Don't have an auth key? Create one here.
                </button>
              </div>
            </form>
          )}

          {/* ──── REGISTER VIEW ───────────────────────────────── */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className={labelCls}>Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputCls}
                    placeholder="trader_xyz"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Full Name (Optional)</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputCls}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                    placeholder="user@node.system"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                    placeholder="•••••••• (Min 6 chars)"
                    minLength="6"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold tracking-wide uppercase rounded-lg transition-colors disabled:opacity-50"
                type="submit"
              >
                {loading ? 'Processing...' : 'Register Node'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="text-xs text-zinc-400 hover:text-yellow-500 transition-colors"
                >
                  Already have an auth key? Log in.
                </button>
              </div>
            </form>
          )}

          {/* ──── FORGOT PASSWORD VIEW ────────────────────────── */}
          {view === 'forgot' && !success && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-zinc-400">
                Enter your registered email address and we'll send you a password reset link.
              </p>

              <div className="space-y-1">
                <label className={labelCls}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className={inputCls}
                    placeholder="user@node.system"
                    required
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold tracking-wide uppercase rounded-lg transition-colors disabled:opacity-50"
                type="submit"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {/* After forgot-password success → show token input to jump to reset */}
          {view === 'forgot' && success && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2 py-2">
                <CheckCircle2 size={36} className="text-green-400" />
                <p className="text-sm text-zinc-300 text-center">
                  {info || 'If this email exists, a reset link has been sent.'}
                </p>
              </div>
              <button
                onClick={() => { clearErrors(); setSuccess(false); switchView('reset'); }}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                I have a reset token → Set New Password
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="text-xs text-zinc-400 hover:text-yellow-500 transition-colors"
                >
                  Back to login
                </button>
              </div>
            </div>
          )}

          {/* ──── RESET PASSWORD VIEW ─────────────────────────── */}
          {view === 'reset' && !success && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-zinc-400">
                Paste your reset token and choose a new password.
              </p>

              <div className="space-y-1">
                <label className={labelCls}>Reset Token</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className={inputCls}
                    placeholder="Paste token here..."
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputCls}
                    placeholder="•••••••• (Min 6 chars)"
                    minLength="6"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputCls}
                    placeholder="Repeat new password"
                    minLength="6"
                    required
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold tracking-wide uppercase rounded-lg transition-colors disabled:opacity-50"
                type="submit"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Reset success */}
          {view === 'reset' && success && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 size={42} className="text-green-400" />
                <p className="text-base font-semibold text-zinc-100">Password Reset Successful!</p>
                <p className="text-sm text-zinc-400 text-center">
                  Your password has been updated. You can now log in with your new password.
                </p>
              </div>
              <button
                onClick={() => {
                  setSuccess(false);
                  setResetToken('');
                  setNewPassword('');
                  setConfirmPassword('');
                  switchView('login');
                }}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold tracking-wide uppercase rounded-lg transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
