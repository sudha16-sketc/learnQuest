import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IconX, IconUser, IconLogIn, IconUserPlus, IconLoader } from '../components/Icons';

export function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register(email, username, password);
      } else {
        await login(email || username, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1410]/90 pointer-events-auto select-none">
      <div className="w-full max-w-md bg-[#0d1410] border-2 border-[#17985d] p-6 sm:p-8 relative font-mono">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#17985d]/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0d1410] border border-[#17985d] text-[#17985d]">
              <IconUser className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-[#ffffff]">
              {isRegister ? 'Register Explorer' : 'Explorer Sign In'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-[#0d1410] border border-[#17985d] text-[#d2fcf8] hover:bg-[#17985d] hover:text-[#0d1410]"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border border-[#17985d] mb-5">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${
              !isRegister ? 'bg-[#17985d] text-[#ffffff]' : 'text-[#d2fcf8]/60 hover:text-[#ffffff]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider ${
              isRegister ? 'bg-[#17985d] text-[#ffffff]' : 'text-[#d2fcf8]/60 hover:text-[#ffffff]'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-[#0d1410] border border-[#6d6499] text-[#6d6499] text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#6d6499] mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full px-3 py-2 bg-[#0d1410] border border-[#17985d] text-[#d2fcf8] focus:border-[#ffffff] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block font-bold uppercase tracking-wider text-[#6d6499] mb-1">
              {isRegister ? 'Choose Username' : 'Username or Email'}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={isRegister ? 'explorer_alex' : 'student@example.com'}
              className="w-full px-3 py-2 bg-[#0d1410] border border-[#17985d] text-[#d2fcf8] focus:border-[#ffffff] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-[#6d6499] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-[#0d1410] border border-[#17985d] text-[#d2fcf8] focus:border-[#ffffff] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#17985d] hover:bg-[#17985d]/90 text-[#ffffff] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <IconLoader className="w-4 h-4" />
            ) : isRegister ? (
              <>
                <IconUserPlus className="w-4 h-4" />
                <span>Create Explorer Profile</span>
              </>
            ) : (
              <>
                <IconLogIn className="w-4 h-4" />
                <span>Sign In to LearnQuest</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
