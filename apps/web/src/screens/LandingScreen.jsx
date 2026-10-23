import React from 'react';
import { Play, Sparkles, Shield, Cpu, Coins, Award, ArrowRight } from 'lucide-react';

export function LandingScreen({ onStart, onOpenAuth }) {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col justify-center select-none pointer-events-auto">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>LearnQuest • Next-Gen Educational Gaming</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight leading-tight mb-6">
          Level Up Your Knowledge in a{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
            3D Floating World
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
          Traverse low-poly floating islands, jump across moving platforms, master AI-generated blockchain challenges at knowledge checkpoints, and claim verifiable utility tokens on MST Blockchain.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all hover:scale-105"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start Learning</span>
          </button>

          <button
            onClick={onOpenAuth}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-base flex items-center justify-center gap-2 transition-all"
          >
            <span>Create Account / Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="p-6 rounded-3xl glass-panel border border-indigo-500/20">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mb-4">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-white mb-2">
            Adaptive AI Learning
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Powered by Google Gemini with schema-validated JSON generation and a verified curated fallback. Experience our failure-recovery loop: Attempt, Diagnose, Explain, Retry, and Master.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-panel border border-cyan-500/20">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mb-4">
            <Coins className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-white mb-2">
            MST Blockchain Utility Token
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Earn immediately credited XP, receive cryptographically signed EIP-712 reward vouchers, and mint utility tokens to your connected MetaMask wallet.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-panel border border-amber-500/20">
          <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-4">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-white mb-2">
            On-Chain Credentials
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Complete mastery challenges to earn tamper-proof diplomas recorded permanently in the MST Achievements registry.
          </p>
        </div>
      </div>
    </div>
  );
}
