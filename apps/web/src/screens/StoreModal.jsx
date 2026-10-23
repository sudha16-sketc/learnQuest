import React, { useState } from 'react';
import { ShoppingBag, X, Sparkles, Check, Loader2, Coins } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { api } from '../services/api';

export function StoreModal({ isOpen, onClose, storeItems = [], onEquipChange }) {
  const { account, tokenBalance, purchaseStoreItemOnChain } = useWeb3();
  const [purchasingSku, setPurchasingSku] = useState(null);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handlePurchase = async (item) => {
    if (!account) {
      setFeedback({ type: 'error', message: 'Please connect your MetaMask wallet first.' });
      return;
    }

    if (parseFloat(tokenBalance) < parseFloat(item.priceTokens)) {
      setFeedback({
        type: 'error',
        message: `Insufficient LQST balance (${tokenBalance} held vs ${item.priceTokens} needed). Play courses or claim vouchers to earn tokens!`
      });
      return;
    }

    setPurchasingSku(item.sku);
    setFeedback(null);

    try {
      await purchaseStoreItemOnChain(item.sku, item.priceTokens);
      setFeedback({
        type: 'success',
        message: `Successfully purchased ${item.name} on MST Blockchain!`
      });
      if (onEquipChange) onEquipChange();
    } catch (err) {
      console.error('Purchase error:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'On-chain purchase transaction failed.'
      });
    } finally {
      setPurchasingSku(null);
    }
  };

  const handleEquip = async (sku) => {
    try {
      await api.equipAccessory(sku);
      if (onEquipChange) onEquipChange();
    } catch (err) {
      console.error('Equip error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-extrabold text-white">In-Game Store</h2>
              <p className="text-xs text-slate-400">
                Unlock cosmetics and abilities using your earned MST utility tokens.
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
            {feedback.message}
          </div>
        )}

        {/* Store Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {storeItems.map((item) => {
            const isPurchasing = purchasingSku === item.sku;

            return (
              <div
                key={item.sku}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-display font-bold text-base text-white">{item.name}</h3>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold shrink-0">
                      <Coins className="w-3.5 h-3.5" />
                      <span>{item.priceTokens} LQST</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800/80">
                  {item.isUnlocked ? (
                    item.isEquipped ? (
                      <div className="w-full py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>Equipped on Explorer</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEquip(item.sku)}
                        className="w-full py-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 text-xs font-bold transition-all"
                      >
                        Equip Accessory
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={isPurchasing}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Purchasing on MST...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Buy with {item.priceTokens} LQST</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
