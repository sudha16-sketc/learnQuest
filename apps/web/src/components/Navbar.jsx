import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import {
  IconCoins,
  IconWallet,
  IconStore,
  IconAward,
  IconLogOut
} from './Icons';

export function Navbar({
  onOpenStore,
  onOpenWallet,
  onOpenAchievements,
  onOpenDashboard,
  onOpenTOS,
  onOpenPrivacy,
  gameplayXP = 0,
  pendingTokens = 0
}) {
  const { user, logout } = useAuth();
  const { account, tokenBalance, isMSTNetwork, connectWallet } = useWeb3();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between pointer-events-auto bg-[#0d1410] border-b border-[#17985d]/40 select-none">
      {/* Brand */}
      <div
        onClick={onOpenDashboard}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-9 h-9 bg-[#17985d] text-[#0d1410] flex items-center justify-center font-bold text-lg font-mono">
          LQ
        </div>
        <div>
          <span className="font-display font-extrabold text-lg tracking-wider text-[#ffffff]">
            LearnQuest
          </span>
          <span className="hidden sm:inline-block ml-2 text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#0d1410] border border-[#17985d] text-[#17985d]">
            MST Network
          </span>
        </div>
      </div>

      {/* Nav Controls & Stats Badges */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Gameplay XP Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0d1410] border border-[#17985d]">
          <span className="text-[10px] font-mono font-bold text-[#6d6499] uppercase">XP</span>
          <span className="text-xs font-mono font-bold text-[#d2fcf8]">{gameplayXP}</span>
        </div>

        {/* Claimable / Held Tokens */}
        <button
          onClick={onOpenWallet}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0d1410] border border-[#17985d] hover:bg-[#17985d]/10 text-left"
          title="Open Wallet and Claimable Tokens"
        >
          <IconCoins className="w-3.5 h-3.5 text-[#17985d]" />
          <span className="text-[10px] font-mono font-bold text-[#6d6499] uppercase">LQST</span>
          <span className="text-xs font-mono font-bold text-[#ffffff]">
            {account ? tokenBalance : pendingTokens}
          </span>
        </button>

        {/* Store Button */}
        <button
          onClick={onOpenStore}
          className="p-1.5 bg-[#0d1410] border border-[#17985d] text-[#d2fcf8] hover:bg-[#17985d] hover:text-[#0d1410]"
          title="In-Game Store"
          aria-label="In-Game Store"
        >
          <IconStore className="w-4 h-4" />
        </button>

        {/* Achievements Button */}
        <button
          onClick={onOpenAchievements}
          className="p-1.5 bg-[#0d1410] border border-[#17985d] text-[#d2fcf8] hover:bg-[#17985d] hover:text-[#0d1410]"
          title="On-Chain Credentials"
          aria-label="On-Chain Credentials"
        >
          <IconAward className="w-4 h-4" />
        </button>

        {/* Wallet Connection Status */}
        {account ? (
          <button
            onClick={onOpenWallet}
            className={`flex items-center gap-1.5 px-2.5 py-1 border text-xs font-mono font-bold ${
              isMSTNetwork
                ? 'bg-[#0d1410] border-[#17985d] text-[#17985d]'
                : 'bg-[#0d1410] border-[#6d6499] text-[#6d6499]'
            }`}
          >
            <div className={`w-1.5 h-1.5 ${isMSTNetwork ? 'bg-[#17985d]' : 'bg-[#6d6499]'}`} />
            <span>
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          </button>
        ) : (
            <button
              onClick={onOpenWallet}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0d1410] border border-[#6d6499] hover:bg-[#6d6499]/10"
            >
              <IconWallet className="w-3.5 h-3.5 text-[#6d6499]" />
              <span className="hidden sm:inline text-xs font-mono font-bold text-[#6d6499]">
                Connect Wallet
              </span>
            </button>
        )}

        {/* User profile / Logout */}
        {user && (
          <button
            onClick={logout}
            className="p-1.5 bg-[#0d1410] border border-[#6d6499] text-[#6d6499] hover:bg-[#6d6499] hover:text-[#ffffff]"
            title={`Log out (${user.username})`}
            aria-label={`Log out (${user.username})`}
          >
            <IconLogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </nav>
  );
}
