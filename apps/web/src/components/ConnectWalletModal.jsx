import React, { useEffect, useState } from 'react';
import { IconWallet, IconX, IconAlertTriangle, IconCheckCircle, IconLoader } from './Icons';

const WALLET_META = {
  bridgekey: { label: 'BridgeKey Wallet', hint: 'Official MST recommended wallet' },
  metamask: { label: 'MetaMask', hint: 'Popular EVM wallet' },
  injected: { label: 'Injected Wallet', hint: 'EIP-1193 compatible wallet' }
};

export function ConnectWalletModal({ isOpen, onClose, providers, onSelect, connecting, error }) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setSelected(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async (wallet) => {
    setSelected(wallet.id);
    await onSelect(wallet);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0d1410]/95 pointer-events-auto select-none">
      <div className="w-full max-w-md bg-[#0d1410] border-2 border-[#17985d] relative font-mono">
        <div className="flex items-center justify-between p-5 border-b border-[#17985d]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0d1410] border border-[#17985d] text-[#17985d]">
              <IconWallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#ffffff]">Connect Wallet</h2>
              <p className="text-xs text-[#d2fcf8]/70">Select a wallet to connect to MST Testnet</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 border border-[#17985d] text-[#d2fcf8] hover:bg-[#17985d] hover:text-[#0d1410]">
            <IconX className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-2">
          {providers.length === 0 && (
            <div className="p-4 border border-[#6d6499] text-xs text-[#6d6499] flex items-start gap-2">
              <IconAlertTriangle className="w-4 h-4 mt-0.5" />
              <div>
                <p className="font-bold uppercase">No wallets detected</p>
                <p className="mt-1 text-[#d2fcf8]/70">Install BridgeKey or MetaMask and refresh this page.</p>
              </div>
            </div>
          )}

          {providers.map((wallet) => {
            const meta = WALLET_META[wallet.id] || { label: wallet.name, hint: 'EIP-1193 compatible' };
            const isBusy = connecting && selected === wallet.id;
            return (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet)}
                disabled={connecting}
                className="w-full flex items-center justify-between p-3 border border-[#17985d]/60 hover:border-[#17985d] hover:bg-[#17985d]/10 text-left disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center border border-[#17985d] text-[#17985d]">
                    <IconWallet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#ffffff] uppercase tracking-wider">{meta.label}</p>
                    <p className="text-[10px] text-[#d2fcf8]/60">{meta.hint}</p>
                  </div>
                </div>
                {isBusy ? <IconLoader className="w-4 h-4 animate-spin text-[#17985d]" /> : <span className="text-xs text-[#17985d]">Connect</span>}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mx-5 mb-5 p-3 border border-[#6d6499] text-xs text-[#6d6499] flex items-start gap-2">
            <IconAlertTriangle className="w-4 h-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="px-5 pb-5 text-[10px] text-[#d2fcf8]/50">
          MST Testnet • Chain ID 91562037 • tMSTC • https://testnet.mstscan.com
        </div>
      </div>
    </div>
  );
}
