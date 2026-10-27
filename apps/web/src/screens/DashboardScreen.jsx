import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { api } from '../services/api';
import { DEFAULT_TOPICS } from '@learnquest/shared';
import {
  IconPlay,
  IconCoins,
  IconTrophy,
  IconArrowRight,
  IconTrendingUp,
  IconShield,
  IconLayers,
  IconStore
} from '../components/Icons';
import { SkeletonStatRow, SkeletonCard } from '../components/SkeletonLoader';

export function DashboardScreen({ onStartLevel, onOpenStore, onOpenWallet }) {
  const { user } = useAuth();
  const { account, tokenBalance, isMSTNetwork } = useWeb3();

  const [topics, setTopics] = useState(DEFAULT_TOPICS);
  const [selectedTopic, setSelectedTopic] = useState(DEFAULT_TOPICS[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('beginner');
  const [isLoading, setIsLoading] = useState(true);
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
      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 max-w-6xl mx-auto select-none pointer-events-auto bg-[#0d1410] text-[#d2fcf8]">
      {/* Welcome Section */}
      <div className="mb-8 p-6 sm:p-8 bg-[#0d1410] border-2 border-[#17985d] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[#17985d] text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <span>Verified Explorer Profile</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-[#ffffff] tracking-tight mb-2 uppercase">
              {user?.username || 'Explorer'}
            </h1>
            <p className="text-xs sm:text-sm text-[#d2fcf8]/80 max-w-xl font-mono leading-relaxed">
              Expedition command center. Conquer 3D platform obstacles, resolve validated AI challenges, and claim cryptographic vouchers on the MST network.
            </p>
          </div>

          {/* Quick Launch Action */}
          <button
            onClick={() => onStartLevel(selectedTopic.slug, 1, selectedDifficulty)}
            className="px-8 py-4 bg-[#17985d] text-[#ffffff] font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-[#17985d]/90 shrink-0"
          >
            <IconPlay className="w-5 h-5" />
            <span>Launch 3D World</span>
          </button>
        </div>
      </div>

      {/* Skeletons when fetching; Live Stats Cards when ready */}
      {isLoading ? (
        <SkeletonStatRow />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Player Level */}
          <div className="p-4 bg-[#0d1410] border border-[#17985d]">
            <div className="flex items-center justify-between text-[#6d6499] text-xs font-mono uppercase mb-2">
              <span>Player Level</span>
              <IconTrophy className="w-4 h-4 text-[#17985d]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#ffffff] mb-1">
              Level {progress.playerLevel}
            </div>
            <div className="text-[10px] font-mono text-[#d2fcf8]/70">
              {progress.totalXP} / {progress.nextLevelXP} XP
            </div>
          </div>

          {/* Gameplay XP */}
          <div className="p-4 bg-[#0d1410] border border-[#17985d]">
            <div className="flex items-center justify-between text-[#6d6499] text-xs font-mono uppercase mb-2">
              <span>Gameplay XP</span>
              <span className="text-[10px] font-mono text-[#17985d]">DURABLE</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#17985d] mb-1">
              {rewardBalances.gameplayXP || progress.totalXP}
            </div>
            <div className="text-[10px] font-mono text-[#d2fcf8]/70">Persisted in Ledger</div>
          </div>

          {/* Pending Claimable Vouchers */}
          <button
            onClick={onOpenWallet}
            className="p-4 bg-[#0d1410] border border-[#17985d] hover:bg-[#17985d]/10 text-left"
          >
            <div className="flex items-center justify-between text-[#6d6499] text-xs font-mono uppercase mb-2">
              <span>Pending Tokens</span>
              <IconCoins className="w-4 h-4 text-[#17985d]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#ffffff] mb-1">
              {rewardBalances.pendingClaimableTokens} LQST
            </div>
            <div className="text-[10px] font-mono text-[#17985d]">Click to Claim on MST</div>
          </button>

          {/* Verified On-Chain Balance */}
          <button
            onClick={onOpenWallet}
            className="p-4 bg-[#0d1410] border border-[#6d6499] hover:bg-[#6d6499]/10 text-left"
          >
            <div className="flex items-center justify-between text-[#6d6499] text-xs font-mono uppercase mb-2">
              <span>Wallet Holdings</span>
              <IconShield className="w-4 h-4 text-[#6d6499]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#ffffff] mb-1">
              {account ? tokenBalance : '0.00'} LQST
            </div>
            <div className="text-[10px] font-mono text-[#6d6499]">
              {account ? (isMSTNetwork ? 'Verified MST Testnet' : 'Switch Network') : 'MetaMask Not Linked'}
            </div>
          </button>
        </div>
      )}

      {/* Main Learning Hub: Topics & Course Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left: Course Selection & Levels */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#17985d]/40">
            <h2 className="text-lg font-display font-extrabold text-[#ffffff] flex items-center gap-2 uppercase">
              <IconLayers className="w-5 h-5 text-[#17985d]" />
              <span>Available Expeditions</span>
            </h2>
            {/* Difficulty Tabs */}
            <div className="flex items-center p-1 bg-[#0d1410] border border-[#17985d] text-xs font-mono">
              {['beginner', 'intermediate', 'advanced'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1 font-bold uppercase tracking-wider ${
                    selectedDifficulty === diff
                      ? 'bg-[#17985d] text-[#ffffff]'
                      : 'text-[#d2fcf8]/60 hover:text-[#ffffff]'
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
                className={`px-3.5 py-1.5 border text-xs font-mono font-bold uppercase tracking-wider ${
                  selectedTopic.slug === topic.slug
                    ? 'bg-[#17985d] border-[#17985d] text-[#ffffff]'
                    : 'bg-[#0d1410] border-[#17985d]/50 text-[#d2fcf8]/70 hover:border-[#17985d]'
                }`}
              >
                {topic.title}
              </button>
            ))}
          </div>

          {/* Course Levels List */}
          {isLoading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="space-y-4">
              {selectedTopic.levels?.map((lvl) => (
                <div
                  key={lvl.level}
                  className="p-5 bg-[#0d1410] border border-[#17985d] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-[#17985d] text-xs font-mono font-bold uppercase mb-1">
                      <span>Level {lvl.level}</span>
                      <span>/</span>
                      <span>{lvl.platformsCount} Floating Platforms</span>
                    </div>
                    <h3 className="text-base font-bold text-[#ffffff] uppercase mb-1">{lvl.title}</h3>
                    <p className="text-xs text-[#d2fcf8]/80 font-mono leading-relaxed max-w-lg">
                      {lvl.objective}
                    </p>
                  </div>

                  <button
                    onClick={() => onStartLevel(selectedTopic.slug, lvl.level, selectedDifficulty)}
                    className="px-5 py-2.5 bg-[#17985d] text-[#ffffff] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#17985d]/90 shrink-0"
                  >
                    <span>Launch Level</span>
                    <IconArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Mastery Breakdown & Store Access */}
        <div className="space-y-6">
          {/* Progress Ledger */}
          <div className="p-5 bg-[#0d1410] border border-[#17985d]">
            <h3 className="font-bold text-sm text-[#ffffff] uppercase tracking-wider mb-4 flex items-center gap-2">
              <IconTrendingUp className="w-4 h-4 text-[#17985d]" />
              <span>Progress Status</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-[11px] text-[#d2fcf8]/70 mb-1">
                  <span>Level {progress.playerLevel} XP Progress</span>
                  <span className="text-[#ffffff] font-bold">
                    {progress.totalXP} / {progress.nextLevelXP}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#0d1410] border border-[#17985d]">
                  <div
                    className="h-full bg-[#17985d]"
                    style={{
                      width: `${Math.min(100, Math.round((progress.totalXP / Math.max(1, progress.nextLevelXP)) * 100))}%`
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#0d1410] border border-[#17985d]/40">
                <span className="text-[#d2fcf8]/70">Completed Levels</span>
                <span className="font-bold text-[#ffffff]">{progress.completedLevels}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#0d1410] border border-[#17985d]/40">
                <span className="text-[#d2fcf8]/70">Pending Token Vouchers</span>
                <span className="font-bold text-[#17985d]">{rewardBalances.pendingClaimableTokens} LQST</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#0d1410] border border-[#17985d]/40">
                <span className="text-[#d2fcf8]/70">Active Chain</span>
                <span className="font-bold text-[#6d6499]">MST Testnet</span>
              </div>
            </div>
            <p className="text-[10px] font-mono text-[#d2fcf8]/50 mt-4">
              All progress metrics are verified against database records and smart contract state.
            </p>
          </div>

          {/* Cosmetic Accessories Store Panel */}
          <div
            onClick={onOpenStore}
            className="cursor-pointer p-5 bg-[#0d1410] border-2 border-[#6d6499] hover:bg-[#6d6499]/10"
          >
            <div className="flex items-center gap-2 text-[#6d6499] text-xs font-mono font-bold uppercase mb-2">
              <IconStore className="w-4 h-4" />
              <span>Cosmetic Accessories</span>
            </div>
            <h4 className="font-bold text-base text-[#ffffff] uppercase mb-2">
              Customize 3D Explorer
            </h4>
            <p className="text-xs text-[#d2fcf8]/80 font-mono mb-4 leading-relaxed">
              Redeem earned LQST tokens for Cyber Auras, Scholar Hats, and Jump Trails directly in the store.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#6d6499] uppercase tracking-wider">
              <span>Open Catalog</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
