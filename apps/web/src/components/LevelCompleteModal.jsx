import React, { useState } from 'react';
import { IconTrophy, IconCoins, IconArrowRight, IconCheckCircle, IconExternalLink, IconLoader } from './Icons';
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
  const { account, claimRewardOnChain, contractsConfig } = useWeb3();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimReceipt, setClaimReceipt] = useState(null);
  const [claimError, setClaimError] = useState(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1410]/90 pointer-events-auto select-none">
      <div className="w-full max-w-lg bg-[#0d1410] border-2 border-[#17985d] p-6 sm:p-8 text-center relative overflow-hidden font-mono">
        {/* Trophy Indicator */}
        <div className="w-14 h-14 mx-auto mb-4 bg-[#0d1410] border-2 border-[#17985d] text-[#17985d] flex items-center justify-center">
          <IconTrophy className="w-7 h-7" />
        </div>

        <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[#ffffff] mb-2 uppercase tracking-wide">
          Level {levelNumber} Completed
        </h2>
        <p className="text-xs text-[#d2fcf8]/80 max-w-sm mx-auto mb-6 leading-relaxed">
          Course requirements fulfilled. All knowledge checkpoints and platform coordinates verified.
        </p>

        {/* Reward Showcase */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          <div className="p-3.5 bg-[#0d1410] border border-[#17985d]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6d6499] block mb-1">
              Gameplay XP
            </span>
            <div className="text-xl font-bold text-[#ffffff]">+{bonusXP}</div>
            <div className="text-[10px] text-[#17985d]">Recorded in Profile</div>
          </div>

          <div className="p-3.5 bg-[#0d1410] border border-[#17985d]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6d6499] block mb-1">
              MST Tokens
            </span>
            <div className="text-xl font-bold text-[#ffffff]">+{bonusTokens}</div>
            <div className="text-[10px] text-[#17985d]">Claimable LQST</div>
          </div>
        </div>

        {/* Claim State / Feedback */}
        {claimReceipt ? (
          <div className="mb-6 p-4 bg-[#0d1410] border-2 border-[#17985d] text-left">
            <div className="flex items-center gap-2 text-[#17985d] font-bold text-xs mb-1 uppercase">
              <IconCheckCircle className="w-4 h-4 text-[#17985d]" />
              <span>Tokens Minted on MST Blockchain</span>
            </div>
            <p className="text-xs text-[#d2fcf8]/80 mb-2">
              Transaction successfully confirmed on MST Testnet.
            </p>
            <a
              href={`${explorerBase}/tx/${claimReceipt.hash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#17985d] hover:underline"
            >
              <span>View Explorer: {claimReceipt.hash.slice(0, 10)}...</span>
              <IconExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="mb-6">
            <button
              onClick={handleClaimTokensOnChain}
              disabled={isClaiming}
              className="w-full py-3 px-6 bg-[#0d1410] border-2 border-[#17985d] hover:bg-[#17985d] text-[#ffffff] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isClaiming ? (
                <>
                  <IconLoader className="w-4 h-4" />
                  <span>Signing On-Chain Voucher...</span>
                </>
              ) : (
                <>
                  <IconCoins className="w-4 h-4" />
                  <span>Claim {bonusTokens} LQST on MST Network</span>
                </>
              )}
            </button>
            {claimError && (
              <p className="text-xs text-[#6d6499] mt-2 text-left bg-[#0d1410] p-2 border border-[#6d6499]">
                {claimError}
              </p>
            )}
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onNextLevel}
            className="flex-1 py-3 px-6 bg-[#17985d] text-[#ffffff] font-bold text-xs uppercase tracking-wider hover:bg-[#17985d]/90 flex items-center justify-center gap-2"
          >
            <span>Next Expedition</span>
            <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
