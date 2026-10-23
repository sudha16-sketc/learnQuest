import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { Sparkles, Coins, Wallet, ShoppingBag, Award, User, LogOut } from 'lucide-react';

export function Navbar({
  onOpenStore,
  onOpenWallet,
  onOpenAchievements,
  onOpenDashboard,
  gameplayXP = 0,
  pendingTokens = 0
}) {
  const { user, logout } = useAuth();
  const { account, tokenBalance, isMSTNetwork, connectWallet } = useWeb3();

  return (
    <nav className="absolute top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between pointer-events-auto">
      {/* Brand */}
      <div
        onClick={onOpenDashboard}
        className="flex items-center gap-2 cursor-pointer group select-none"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            LearnQuest
          </span>
          <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-indigo-300">
            MST 3D
          </span>
        </div>
      </div>

      {/* Stats Badges */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Gameplay XP */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-sm backdrop-blur">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300">XP</span>
          <span className="text-sm font-bold text-amber-400">{gameplayXP}</span>
        </div>

        {/* Claimable / Held Tokens */}
        <div
          onClick={onOpenWallet}
          className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-700/50 hover:border-indigo-500 shadow-sm backdrop-blur transition-all"
        >
          <Coins className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">LQST</span>
          <span className="text-sm font-bold text-cyan-300">
            {account ? tokenBalance : pendingTokens}
          </span>
        </div>

        {/* Store Button */}
        <button
          onClick={onOpenStore}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all"
          title="In-Game Store"
        >
          <ShoppingBag className="w-4 h-4 text-indigo-400" />
        </button>

        {/* Achievements Button */}
        <button
          onClick={onOpenAchievements}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all"
          title="On-Chain Credentials"
        >
          <Award className="w-4 h-4 text-amber-400" />
        </button>

        {/* Wallet Connection Status */}
        {account ? (
          <button
            onClick={onOpenWallet}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isMSTNetwork
                ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-amber-950/60 border-amber-600/60 text-amber-300 hover:bg-amber-900/60'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isMSTNetwork ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="font-mono">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          </button>
        ) : (
          <button
            onClick={connectWallet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Connect</span>
          </button>
        )}

        {/* User profile / Logout */}
        {user && (
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-red-950/60 border border-slate-700/60 hover:border-red-600/60 text-slate-400 hover:text-red-400 transition-all"
            title={`Log out (${user.username})`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </nav>
  );
}
