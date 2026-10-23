import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Coins, ArrowRight, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { api } from '../services/api';

export function LevelCompleteModal({
  levelNumber,
  bonusXP = 50,
  bonusTokens = '5.00',
  entitlementId,
  onNextLevel,
  onClose
}) {
  const modalRef = useRef(null);
  const { account, claimRewardOnChain, contractsConfig } = useWeb3();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimReceipt, setClaimReceipt] = useState(null);
  const [claimError, setClaimError] = useState(null);

  useEffect(() => {
    // Launch celebratory confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.7, opacity: 0, y: 50 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }, []);

  const handleClaimTokensOnChain = async () => {
    if (!account) {
      setClaimError('Please connect your MetaMask wallet first from the top navbar.');
      return;
    }

    setIsClaiming(true);
    setClaimError(null);

    try {
      // 1. Request cryptographically signed EIP-712 voucher from backend
      const res = await api.claimRewardVoucher(entitlementId);
      if (!res.success || !res.voucher) {
        throw new Error(res.error || 'Failed to issue signed voucher');
      }

      // 2. Submit on-chain claim transaction via MetaMask
      const receipt = await claimRewardOnChain(res.voucher);
      setClaimReceipt(receipt);
    } catch (err) {
      console.error('Claim error:', err);
      setClaimError(err.message || 'On-chain claim failed');
    } finally {
      setIsClaiming(false);
    }
  };

  const explorerBase = contractsConfig?.network?.explorerUrl || 'https://testnet.mstscan.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md pointer-events-auto">
      <div
        ref={modalRef}
        className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/40 shadow-2xl text-center relative overflow-hidden"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Trophy Fanfare */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Trophy className="w-8 h-8 text-white animate-bounce" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white mb-2">
          Level {levelNumber} Mastered!
        </h2>
        <p className="text-sm text-slate-300 max-w-sm mx-auto mb-6">
          Outstanding job! You've successfully navigated all floating platforms and conquered the knowledge checkpoints.
        </p>

        {/* Reward Showcase */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Gameplay XP</span>
            </div>
            <div className="text-2xl font-extrabold text-white">+{bonusXP}</div>
            <div className="text-[11px] text-slate-400">Credited to Profile</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/40">
            <div className="flex items-center justify-center gap-1.5 text-cyan-400 mb-1">
              <Coins className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">MST Tokens</span>
            </div>
            <div className="text-2xl font-extrabold text-cyan-300">+{bonusTokens}</div>
            <div className="text-[11px] text-slate-400">Claimable LQST</div>
          </div>
        </div>

        {/* Claim State / Feedback */}
        {claimReceipt ? (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 text-left">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
              <CheckCircle className="w-4 h-4" />
              <span>Tokens Minted on MST Blockchain!</span>
            </div>
            <p className="text-xs text-slate-300 mb-2">
              Transaction successfully confirmed on MST Testnet.
            </p>
            <a
              href={`${explorerBase}/tx/${claimReceipt.hash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline font-mono"
            >
              <span>View on MSTScan: {claimReceipt.hash.slice(0, 10)}...</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="mb-6">
            <button
              onClick={handleClaimTokensOnChain}
              disabled={isClaiming}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-700 hover:from-cyan-500 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing & Claiming on MST...</span>
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  <span>Claim {bonusTokens} LQST Tokens on MST Blockchain</span>
                </>
              )}
            </button>
            {claimError && (
              <p className="text-xs text-rose-400 mt-2 text-left bg-rose-950/40 p-2 rounded-lg border border-rose-500/30">
                {claimError}
              </p>
            )}
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onNextLevel}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <span>Proceed to Next Course Level</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
