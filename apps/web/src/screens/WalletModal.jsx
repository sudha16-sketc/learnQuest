import React, { useState, useEffect } from 'react';
import { Wallet, X, Coins, ExternalLink, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { api } from '../services/api';

export function WalletModal({ isOpen, onClose }) {
  const {
    account,
    chainId,
    isMSTNetwork,
    nativeBalance,
    tokenBalance,
    isConnecting,
    connectWallet,
    switchToMSTNetwork,
    claimRewardOnChain,
    contractsConfig
  } = useWeb3();

  const [pendingVouchers, setPendingVouchers] = useState([]);
  const [claimingId, setClaimingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    async function loadPending() {
      if (isOpen) {
        try {
          const res = await api.getPendingRewards();
          if (res.success) {
            setPendingVouchers(res.pending || []);
          }
        } catch (e) {
          console.warn('Error loading pending vouchers:', e);
        }
      }
    }
    loadPending();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaimVoucher = async (entitlementId) => {
    setClaimingId(entitlementId);
    setFeedback(null);

    try {
      // 1. Get signed voucher from backend
      const res = await api.claimRewardVoucher(entitlementId);
      if (!res.success || !res.voucher) {
        throw new Error(res.error || 'Failed to generate signed voucher');
      }

      // 2. Submit claim transaction on MST
      const receipt = await claimRewardOnChain(res.voucher);

      setFeedback({
        type: 'success',
        message: 'Reward claimed successfully on MST Testnet!',
        txHash: receipt.hash
      });

      // Remove claimed from pending list
      setPendingVouchers(prev => prev.filter(p => p.id !== entitlementId));
    } catch (err) {
      console.error('Claim error:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Reward claim transaction failed'
      });
    } finally {
      setClaimingId(null);
    }
  };

  const explorerBase = contractsConfig?.network?.explorerUrl || 'https://testnet.mstscan.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto">
      <div className="w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-cyan-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-extrabold text-white">MST Wallet & Tokens</h2>
              <p className="text-xs text-slate-400">
                Connect MetaMask, manage balances, and claim on-chain reward vouchers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs font-medium border animate-fadeIn ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500 text-rose-200'
            }`}
          >
            <p>{feedback.message}</p>
            {feedback.txHash && (
              <a
                href={`${explorerBase}/tx/${feedback.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-cyan-300 font-mono hover:underline"
              >
                <span>View on MSTScan: {feedback.txHash.slice(0, 12)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Wallet Connection Status Card */}
        {account ? (
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 mb-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Connected Wallet</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-xs font-mono text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
            </div>

            {/* Network Check */}
            {!isMSTNetwork ? (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-between gap-3 text-xs text-amber-200 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Connected to wrong network (Chain {chainId}). Switch to MST Testnet.</span>
                </div>
                <button
                  onClick={switchToMSTNetwork}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shrink-0 transition-all"
                >
                  Switch Network
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-4">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Verified MST Testnet (Chain ID: {contractsConfig?.network?.chainId || 91562037})</span>
              </div>
            )}

            {/* Balances */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Gas Token (tMSTC)</span>
                <div className="text-lg font-extrabold text-white">{nativeBalance}</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Utility Token (LQST)</span>
                <div className="text-lg font-extrabold text-cyan-300">{tokenBalance}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-center mb-6">
            <p className="text-sm text-slate-300 mb-4">
              Connect your MetaMask browser extension to claim rewards and spend tokens on the MST Blockchain.
            </p>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 inline-flex items-center gap-2 transition-all"
            >
              <Wallet className="w-4 h-4" />
              <span>{isConnecting ? 'Connecting...' : 'Connect MetaMask'}</span>
            </button>
          </div>
        )}

        {/* Pending Claimable Vouchers Section */}
        <div>
          <h3 className="text-sm font-display font-bold text-white mb-3 flex items-center justify-between">
            <span>Pending Reward Vouchers</span>
            <span className="text-xs text-slate-400 font-normal">
              {pendingVouchers.length} claimable
            </span>
          </h3>

          {pendingVouchers.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
              No pending vouchers. Complete learning checkpoints and levels to earn rewards!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {pendingVouchers.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{v.reason}</div>
                    <div className="text-[11px] text-slate-400">Status: {v.status}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-cyan-300 text-sm">+{v.amountTokens} LQST</span>
                    <button
                      onClick={() => handleClaimVoucher(v.id)}
                      disabled={claimingId === v.id || !account || !isMSTNetwork}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-all flex items-center gap-1"
                    >
                      {claimingId === v.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>Claim</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
