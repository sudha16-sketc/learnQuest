import React, { useState, useEffect } from 'react';
import {
  IconWallet,
  IconX,
  IconCoins,
  IconExternalLink,
  IconAlertTriangle,
  IconCheckCircle,
  IconLoader
} from '../components/Icons';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1410]/90 pointer-events-auto select-none">
      <div className="w-full max-w-xl bg-[#0d1410] border-2 border-[#17985d] p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto font-mono">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#17985d]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0d1410] border border-[#17985d] text-[#17985d]">
              <IconWallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#ffffff]">
                MST Wallet and Tokens
              </h2>
              <p className="text-xs text-[#d2fcf8]/70">
                Connect MetaMask, manage balances, and claim on-chain reward vouchers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-[#0d1410] border border-[#17985d] text-[#d2fcf8] hover:bg-[#17985d] hover:text-[#0d1410]"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-6 p-3 text-xs font-bold border uppercase tracking-wider ${
              feedback.type === 'success'
                ? 'bg-[#0d1410] border-[#17985d] text-[#17985d]'
                : 'bg-[#0d1410] border-[#6d6499] text-[#6d6499]'
            }`}
          >
            <p>{feedback.message}</p>
            {feedback.txHash && (
              <a
                href={`${explorerBase}/tx/${feedback.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-[#17985d] hover:underline"
              >
                <span>Explorer Link: {feedback.txHash.slice(0, 14)}...</span>
                <IconExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Wallet Connection Status Card */}
        {account ? (
          <div className="p-4 bg-[#0d1410] border border-[#17985d] mb-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs text-[#6d6499] font-bold uppercase tracking-wider">
                Connected Address
              </span>
              <div className="px-2 py-0.5 border border-[#17985d] text-xs text-[#ffffff]">
                {account.slice(0, 6)}...{account.slice(-4)}
              </div>
            </div>

            {/* Network Check */}
            {!isMSTNetwork ? (
              <div className="p-3 bg-[#0d1410] border border-[#6d6499] flex items-center justify-between gap-3 text-xs text-[#6d6499] mb-4">
                <div className="flex items-center gap-2">
                  <IconAlertTriangle className="w-4 h-4 text-[#6d6499] shrink-0" />
                  <span>Chain ID {chainId} detected. Switch to MST Testnet.</span>
                </div>
                <button
                  onClick={switchToMSTNetwork}
                  className="px-3 py-1 bg-[#6d6499] text-[#ffffff] font-bold uppercase tracking-wider"
                >
                  Switch Network
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-[#17985d] mb-4">
                <IconCheckCircle className="w-4 h-4 text-[#17985d]" />
                <span>Verified MST Testnet (Chain ID: {contractsConfig?.network?.chainId || 91562037})</span>
              </div>
            )}

            {/* Balances */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#17985d]/30">
              <div>
                <span className="text-[10px] text-[#6d6499] font-bold uppercase block">
                  Gas Token (tMSTC)
                </span>
                <div className="text-base sm:text-lg font-bold text-[#ffffff]">{nativeBalance}</div>
              </div>
              <div>
                <span className="text-[10px] text-[#6d6499] font-bold uppercase block">
                  Utility Token (LQST)
                </span>
                <div className="text-base sm:text-lg font-bold text-[#17985d]">{tokenBalance}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-[#0d1410] border border-[#17985d] text-center mb-6">
            <p className="text-xs text-[#d2fcf8]/80 mb-4">
              Connect your MetaMask wallet to claim vouchers and transfer utility tokens on the MST Blockchain.
            </p>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="py-2.5 px-6 bg-[#17985d] hover:bg-[#17985d]/90 text-[#ffffff] font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2"
            >
              <IconWallet className="w-4 h-4" />
              <span>{isConnecting ? 'Connecting...' : 'Connect MetaMask'}</span>
            </button>
          </div>
        )}

        {/* Pending Claimable Vouchers Section */}
        <div>
          <div className="flex items-center justify-between mb-3 pb-1 border-b border-[#17985d]/30">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#ffffff]">
              Pending Reward Vouchers
            </h3>
            <span className="text-xs text-[#6d6499]">
              {pendingVouchers.length} claimable
            </span>
          </div>

          {pendingVouchers.length === 0 ? (
            <div className="p-4 bg-[#0d1410] border border-[#17985d]/40 text-center text-xs text-[#d2fcf8]/60">
              No pending vouchers. Complete learning checkpoints and levels to earn rewards.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {pendingVouchers.map((v) => (
                <div
                  key={v.id}
                  className="p-3 bg-[#0d1410] border border-[#17985d]/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-[#ffffff]">{v.reason}</div>
                    <div className="text-[10px] text-[#6d6499]">Status: {v.status}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#17985d]">+{v.amountTokens} LQST</span>
                    <button
                      onClick={() => handleClaimVoucher(v.id)}
                      disabled={claimingId === v.id || !account || !isMSTNetwork}
                      className="px-3 py-1 bg-[#17985d] text-[#ffffff] font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1"
                    >
                      {claimingId === v.id ? (
                        <IconLoader className="w-3.5 h-3.5" />
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
