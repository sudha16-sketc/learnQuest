import React from 'react';
import { IconX, IconFileText } from '../components/Icons';

export function LegalModal({ isOpen, onClose, documentType = 'tos' }) {
  if (!isOpen) return null;

  const isTOS = documentType === 'tos';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1410]/90 pointer-events-auto">
      <div className="w-full max-w-2xl bg-[#0d1410] border-2 border-[#17985d] p-6 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#17985d]/30 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0d1410] border border-[#17985d] text-[#17985d]">
              <IconFileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#d2fcf8]">
                {isTOS ? 'Terms of Service' : 'Privacy Policy'}
              </h2>
              <p className="text-xs text-[#d2fcf8]/70">
                LearnQuest Educational Game and MST Blockchain Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-[#17985d]/40 text-[#d2fcf8] hover:bg-[#17985d] hover:text-[#0d1410] transition-none"
            aria-label="Close dialog"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs text-[#d2fcf8]/90 leading-relaxed font-mono">
          {isTOS ? (
            <>
              <section>
                <h3 className="font-bold text-sm text-[#ffffff] uppercase tracking-wider mb-1">
                  1. Acceptance of Terms
                </h3>
                <p>
                  By accessing or playing LearnQuest, connecting a Web3 wallet, or submitting learning checkpoint responses, you agree to comply with and be bound by these Terms of Service. If you disagree with any portion of these terms, you must discontinue use of the platform.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-sm text-[#ffffff] uppercase tracking-wider mb-1">
                  2. Educational Utility and Tokens
                </h3>
                <p>
                  LQST tokens distributed on the MST Blockchain serve strictly as in-game utility tokens and proof of educational progress. They do not represent equity, dividends, voting shares, or monetary securities. Token rewards require verified gameplay completion recorded through cryptographic vouchers.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-sm text-[#ffffff] uppercase tracking-wider mb-1">
                  3. Intellectual Property and Course Content
                </h3>
                <p>
                  Curriculum materials, interactive 3D platforms, and smart contract architectures are proprietary assets of LearnQuest. Users retain full self-custody of soulbound on-chain achievement tokens issued to their linked wallet addresses.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-sm text-[#ffffff] uppercase tracking-wider mb-1">
                  4. Fair Play and Anti-Farming
                </h3>
                <p>
                  Automated scripts, duplicate answer replaying, or unauthorized tampering with challenge submissions are strictly prohibited. The platform maintains server-side verification and idempotency keys to safeguard learning integrity.
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h3 className="font-bold text-sm text-[#ffffff] uppercase tracking-wider mb-1">
                  1. Information We Collect
                </h3>
                <p>
                  We collect account credentials (email address, chosen username, password hash) and educational progress metrics (completed levels, question scores, checkpoint timestamps). When you link a Web3 wallet, we record your public Ethereum/MST address.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-sm text-[#ffffff] uppercase tracking-wider mb-1">
                  2. Blockchain Transparency
                </h3>
                <p>
                  Transactions executed on the MST Blockchain, including token minting and soulbound credential registry calls, are public by nature. Please be aware that your public wallet address and on-chain interactions are permanently visible on the public block explorer.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-sm text-[#ffffff] uppercase tracking-wider mb-1">
                  3. AI Challenge Generation
                </h3>
                <p>
                  Interactive questions and remedial feedback are generated via Google Gemini using strict prompt engineering. No personally identifiable student information is transmitted to upstream AI inference providers during question synthesis.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-sm text-[#ffffff] uppercase tracking-wider mb-1">
                  4. Data Security and Custody
                </h3>
                <p>
                  We employ industry-standard encryption for data in transit and at rest. LearnQuest never has access to your wallet private keys or recovery seed phrases. Self-custody remains the sole responsibility of the user.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-6 mt-6 border-t border-[#17985d]/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#17985d] text-[#ffffff] font-bold text-xs uppercase tracking-wider hover:bg-[#17985d]/90 transition-none"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
