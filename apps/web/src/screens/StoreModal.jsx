import React, { useState } from 'react';
import { IconStore, IconX, IconCheck, IconLoader, IconCoins } from '../components/Icons';
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
        message: `Insufficient LQST balance (${tokenBalance} held vs ${item.priceTokens} needed). Play courses or claim vouchers to earn tokens.`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1410]/90 pointer-events-auto select-none">
      <div className="w-full max-w-2xl bg-[#0d1410] border-2 border-[#17985d] p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto font-mono">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#17985d]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0d1410] border border-[#17985d] text-[#17985d]">
              <IconStore className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#ffffff]">
                Accessory Store
              </h2>
              <p className="text-xs text-[#d2fcf8]/70">
                Unlock cosmetics and abilities using earned MST utility tokens.
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
                className="p-4 bg-[#0d1410] border border-[#17985d]/60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-sm text-[#ffffff] uppercase">{item.name}</h3>
                    <div className="flex items-center gap-1 px-2 py-0.5 border border-[#17985d] text-[#17985d] text-xs font-bold shrink-0">
                      <IconCoins className="w-3.5 h-3.5" />
                      <span>{item.priceTokens} LQST</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#d2fcf8]/80 mb-4 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#17985d]/30">
                  {item.isUnlocked ? (
                    item.isEquipped ? (
                      <div className="w-full py-2 bg-[#17985d] text-[#ffffff] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <IconCheck className="w-4 h-4" />
                        <span>Equipped</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEquip(item.sku)}
                        className="w-full py-2 bg-[#0d1410] border border-[#17985d] hover:bg-[#17985d]/10 text-[#d2fcf8] text-xs font-bold uppercase tracking-wider"
                      >
                        Equip Accessory
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={isPurchasing}
                      className="w-full py-2 bg-[#17985d] hover:bg-[#17985d]/90 text-[#ffffff] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isPurchasing ? (
                        <>
                          <IconLoader className="w-3.5 h-3.5" />
                          <span>Processing on MST...</span>
                        </>
                      ) : (
                        <span>Purchase for {item.priceTokens} LQST</span>
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
