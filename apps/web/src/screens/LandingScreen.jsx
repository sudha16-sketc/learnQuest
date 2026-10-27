import React from 'react';
import {
  IconPlay,
  IconCpu,
  IconCoins,
  IconAward,
  IconShield,
  IconArrowRight
} from '../components/Icons';

export function LandingScreen({ onStart, onOpenAuth, onOpenTOS, onOpenPrivacy }) {
  return (
    <div className="w-full min-h-screen pt-20 pb-16 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col bg-[#0d1410] text-[#d2fcf8]">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto my-auto py-8">
        <div className="inline-block px-3 py-1 bg-[#0d1410] border border-[#17985d] text-[#17985d] text-xs font-mono font-bold uppercase tracking-wider mb-6">
          Educational Gaming Platform on MST Blockchain
        </div>

        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-[#ffffff] tracking-tight leading-tight mb-6 uppercase">
          Master Computer Science in a 3D Island World
        </h1>

        <p className="text-sm sm:text-base text-[#d2fcf8] leading-relaxed mb-8 max-w-2xl font-mono">
          Navigate low-poly floating islands, jump across moving platforms, master AI-generated blockchain and algorithms challenges at knowledge checkpoints, and claim verifiable utility tokens on MST Blockchain.
        </p>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-12">
          <button
            onClick={onStart}
            className="px-8 py-3.5 bg-[#17985d] text-[#ffffff] font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-[#17985d]/90"
          >
            <IconPlay className="w-4 h-4" />
            <span>Start Expedition</span>
          </button>

          <button
            onClick={onOpenAuth}
            className="px-8 py-3.5 bg-[#0d1410] border-2 border-[#17985d] text-[#d2fcf8] font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#17985d]/10"
          >
            <span>Create Profile or Sign In</span>
            <IconArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Real Product Demo Section */}
        <div className="p-6 bg-[#0d1410] border-2 border-[#17985d] mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#17985d]/30">
            <div>
              <span className="text-xs font-mono font-bold text-[#17985d] uppercase tracking-wider">
                Live Interactive Architecture
              </span>
              <h2 className="text-lg font-bold text-[#ffffff] uppercase">
                Active Three.js Physics, AI Evaluation, and EIP-712 Settlement
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-1 bg-[#17985d] text-[#0d1410] font-bold">LIVE STACK</span>
              <span className="text-[#6d6499]">React Three Fiber + Gemini + Hardhat</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            <div className="space-y-3">
              <div className="p-3 bg-[#0d1410] border border-[#17985d]/40">
                <div className="text-[#17985d] font-bold uppercase mb-1">1. Procedural 3D World Generation</div>
                <p className="text-[#d2fcf8]/80">
                  Real-time physics calculation of coordinate steps, floating target platforms, moving hazards, and collectible beacons directly executed in your browser.
                </p>
              </div>

              <div className="p-3 bg-[#0d1410] border border-[#17985d]/40">
                <div className="text-[#17985d] font-bold uppercase mb-1">2. Adaptive AI Checkpoint Validation</div>
                <p className="text-[#d2fcf8]/80">
                  Concept-targeted questions generated with schema verification, server-side answer evaluation, idempotency tokens, and real-time remedial loops.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#0d1410] border border-[#6d6499]/60">
                <div className="text-[#6d6499] font-bold uppercase mb-1">3. EIP-712 Cryptographic Vouchers</div>
                <p className="text-[#d2fcf8]/80">
                  Server-signed typed data vouchers issued upon level mastery, redeemable on the MST Testnet smart contracts for zero gas manipulation.
                </p>
              </div>

              <div className="p-3 bg-[#0d1410] border border-[#6d6499]/60">
                <div className="text-[#6d6499] font-bold uppercase mb-1">4. Soulbound On-Chain Registry</div>
                <p className="text-[#d2fcf8]/80">
                  Permanent academic achievement credentials minted directly to student wallet addresses with tamper-proof smart contract verification.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Architectural Pillars (Split 2x2 asymmetric layout, strictly avoiding 3 in a row) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-5 bg-[#0d1410] border border-[#17985d]/50 flex items-start gap-4">
            <div className="p-3 bg-[#0d1410] border border-[#17985d] text-[#17985d] shrink-0">
              <IconCpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#ffffff] uppercase mb-1">
                Schema-Validated Adaptive AI
              </h3>
              <p className="text-xs text-[#d2fcf8]/80 font-mono leading-relaxed">
                Powered by Gemini with verified fallback questions. Experience our structured failure recovery loop: Attempt, Diagnose, Explain, Retry, and Master.
              </p>
            </div>
          </div>

          <div className="p-5 bg-[#0d1410] border border-[#17985d]/50 flex items-start gap-4">
            <div className="p-3 bg-[#0d1410] border border-[#17985d] text-[#17985d] shrink-0">
              <IconCoins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#ffffff] uppercase mb-1">
                MST Blockchain Utility Token
              </h3>
              <p className="text-xs text-[#d2fcf8]/80 font-mono leading-relaxed">
                Earn immediately credited XP, receive cryptographically signed EIP-712 reward vouchers, and mint utility tokens to your connected MetaMask wallet.
              </p>
            </div>
          </div>

          <div className="p-5 bg-[#0d1410] border border-[#6d6499]/60 flex items-start gap-4">
            <div className="p-3 bg-[#0d1410] border border-[#6d6499] text-[#6d6499] shrink-0">
              <IconAward className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#ffffff] uppercase mb-1">
                On-Chain Credentials
              </h3>
              <p className="text-xs text-[#d2fcf8]/80 font-mono leading-relaxed">
                Complete mastery challenges to earn tamper-proof diplomas recorded permanently in the MST Achievements registry.
              </p>
            </div>
          </div>

          <div className="p-5 bg-[#0d1410] border border-[#6d6499]/60 flex items-start gap-4">
            <div className="p-3 bg-[#0d1410] border border-[#6d6499] text-[#6d6499] shrink-0">
              <IconShield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#ffffff] uppercase mb-1">
                Hardened Security Architecture
              </h3>
              <p className="text-xs text-[#d2fcf8]/80 font-mono leading-relaxed">
                Anti-farming protection, replay protection, non-transferable diploma registry, and strict input validation via Zod schemas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Mandatory Legal Links */}
      <footer className="pt-6 border-t border-[#17985d]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#d2fcf8]/60">
        <div>
          LearnQuest 2026. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={onOpenTOS}
            className="hover:text-[#ffffff] underline uppercase tracking-wider"
          >
            Terms of Service
          </button>
          <button
            onClick={onOpenPrivacy}
            className="hover:text-[#ffffff] underline uppercase tracking-wider"
          >
            Privacy Policy
          </button>
        </div>
      </footer>
    </div>
  );
}
