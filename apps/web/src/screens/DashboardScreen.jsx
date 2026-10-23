import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { api } from '../services/api';
import { DEFAULT_TOPICS } from '@learnquest/shared';
import {
  Play,
  Sparkles,
  Coins,
  Trophy,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Shield,
  Layers,
  ShoppingBag
} from 'lucide-react';

export function DashboardScreen({ onStartLevel, onOpenStore, onOpenWallet }) {
  const { user } = useAuth();
  const { account, tokenBalance, isMSTNetwork } = useWeb3();

  const [topics, setTopics] = useState(DEFAULT_TOPICS);
  const [selectedTopic, setSelectedTopic] = useState(DEFAULT_TOPICS[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('beginner');
  const [progress, setProgress] = useState({
    totalXP: 0,
    playerLevel: 1,
    completedLevels: 0,
    nextLevelXP: 100
  });
  const [rewardBalances, setRewardBalances] = useState({
    gameplayXP: 0,
    pendingClaimableTokens: '0.00',
    onChainTokenBalance: '0.00'
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [topicsRes, progRes, balRes] = await Promise.all([
          api.getTopics().catch(() => ({ success: false })),
          api.getProgress().catch(() => ({ success: false })),
          api.getRewardBalance().catch(() => ({ success: false }))
        ]);

        if (topicsRes.success && topicsRes.topics?.length) {
          setTopics(topicsRes.topics);
          setSelectedTopic(topicsRes.topics[0]);
        }
        if (progRes.success) {
          setProgress(progRes.progress);
        }
        if (balRes.success) {
          setRewardBalances(balRes.balance);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    }
    loadDashboardData();
  }, [user]);

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 max-w-6xl mx-auto select-none pointer-events-auto">
      {/* Welcome Banner */}
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-slate-900/90 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Welcome Back, Explorer</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white tracking-tight mb-2">
              {user?.username || 'Explorer'}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Ready for your next 3D learning expedition? Conquer floating platforms, solve AI-crafted challenges, and claim verifiable on-chain rewards on MST Blockchain.
            </p>
          </div>

          {/* Quick Launch CTA */}
          <button
            onClick={() => onStartLevel(selectedTopic.slug, 1, selectedDifficulty)}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all hover:scale-105 shrink-0"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Enter 3D Island World</span>
          </button>
        </div>
      </div>

      {/* 4 Essential Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Player Level */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-2">
            <span>Player Level</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mb-1">
            Level {progress.playerLevel}
          </div>
          <div className="text-xs text-slate-400">
            {progress.totalXP} / {progress.nextLevelXP} XP to Level {progress.playerLevel + 1}
          </div>
        </div>

        {/* Gameplay XP */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-2">
            <span>Gameplay XP</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 mb-1">
            {rewardBalances.gameplayXP || progress.totalXP}
          </div>
          <div className="text-xs text-slate-400">Durable XP Ledger</div>
        </div>

        {/* Pending Claimable Vouchers */}
        <div
          onClick={onOpenWallet}
          className="cursor-pointer p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 hover:border-indigo-400 transition-all"
        >
          <div className="flex items-center justify-between text-indigo-300 text-xs font-semibold uppercase mb-2">
            <span>Pending Tokens</span>
            <Coins className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-300 mb-1">
            {rewardBalances.pendingClaimableTokens} LQST
          </div>
          <div className="text-xs text-indigo-300">Click to Claim on MST</div>
        </div>

        {/* Verified On-Chain Balance */}
        <div
          onClick={onOpenWallet}
          className="cursor-pointer p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 hover:border-emerald-400 transition-all"
        >
          <div className="flex items-center justify-between text-emerald-300 text-xs font-semibold uppercase mb-2">
            <span>Wallet Holdings</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-300 mb-1">
            {account ? tokenBalance : '0.00'} LQST
          </div>
          <div className="text-xs text-emerald-400/80">
            {account ? (isMSTNetwork ? 'Verified MST Testnet' : 'Wrong Network') : 'MetaMask Disconnected'}
          </div>
        </div>
      </div>

      {/* Main Learning Hub: Topics & Course Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left: Course Selection & Levels */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-extrabold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Available Expeditions</span>
            </h2>
            {/* Difficulty Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
              {['beginner', 'intermediate', 'advanced'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                    selectedDifficulty === diff
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selector */}
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <button
                key={topic.id || topic.slug}
                onClick={() => setSelectedTopic(topic)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                  selectedTopic.slug === topic.slug
                    ? 'bg-indigo-950/80 border-indigo-400 text-indigo-200'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {topic.title}
              </button>
            ))}
          </div>

          {/* Course Levels List */}
          <div className="space-y-4">
            {selectedTopic.levels?.map((lvl) => (
              <div
                key={lvl.level}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase mb-1">
                    <span>Level {lvl.level}</span>
                    <span>•</span>
                    <span>{lvl.platformsCount} Floating Platforms</span>
                  </div>
                  <h3 className="text-lg font-display font-bold text-white mb-1.5">{lvl.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                    {lvl.objective}
                  </p>
                </div>

                <button
                  onClick={() => onStartLevel(selectedTopic.slug, lvl.level, selectedDifficulty)}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all shrink-0"
                >
                  <span>Launch Level</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Topic Mastery Radar & Store Teaser */}
        <div className="space-y-6">
          {/* Live Progress Snapshot */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-800">
            <h3 className="font-display font-bold text-base text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Your Progress</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>Player Level {progress.playerLevel}</span>
                  <span className="text-indigo-300 font-bold">
                    {progress.totalXP} / {progress.nextLevelXP} XP
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.round((progress.totalXP / Math.max(1, progress.nextLevelXP)) * 100))}%`
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs text-slate-400">Completed Levels</span>
                <span className="text-sm font-bold text-emerald-400">{progress.completedLevels}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs text-slate-400">Pending Token Vouchers</span>
                <span className="text-sm font-bold text-cyan-300">{rewardBalances.pendingClaimableTokens} LQST</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs text-slate-400">Answered Checkpoints</span>
                <span className="text-sm font-bold text-indigo-300">{progress.completedLevels} levels completed</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-4">
              All progress shown here is loaded from your LearnQuest account ledger.
            </p>
          </div>

          {/* Cosmetic Store Banner */}
          <div
            onClick={onOpenStore}
            className="cursor-pointer p-6 rounded-3xl bg-gradient-to-br from-indigo-950/80 to-purple-950/50 border border-indigo-500/30 hover:border-indigo-400 transition-all"
          >
            <div className="flex items-center gap-2.5 text-indigo-300 text-xs font-bold uppercase mb-2">
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <span>Cosmetic Accessories</span>
            </div>
            <h4 className="font-display font-extrabold text-lg text-white mb-2">
              Customize Your 3D Explorer
            </h4>
            <p className="text-xs text-slate-300 mb-4">
              Spend your earned LQST tokens on Cyber Auras, Scholar Hats, and Jump Trails.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:underline">
              <span>Browse Store Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
