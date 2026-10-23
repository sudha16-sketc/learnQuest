import React, { useState, useEffect } from 'react';
import { GameCanvas } from './game/GameCanvas';
import { Navbar } from './components/Navbar';
import { HUD } from './components/HUD';
import { QuestionOverlay } from './components/QuestionOverlay';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { MobileControls } from './components/MobileControls';

import { LandingScreen } from './screens/LandingScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { StoreModal } from './screens/StoreModal';
import { WalletModal } from './screens/WalletModal';
import { AchievementsModal } from './screens/AchievementsModal';
import { AuthModal } from './screens/AuthModal';

import { generateLevelCourse } from '@learnquest/game-core';
import { GAME_STATES, ACCESSORIES_CATALOG } from '@learnquest/shared';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import { useWeb3 } from './context/Web3Context';

export function App() {
  const { user } = useAuth();
  const { account } = useWeb3();

  // Explicit Game State
  const [gameState, setGameState] = useState(GAME_STATES.MENU);

  // Active Level Course Data
  const [currentLevelNumber, setCurrentLevelNumber] = useState(1);
  const [courseData, setCourseData] = useState(() => generateLevelCourse(1, 5));
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Stats
  const [gameplayXP, setGameplayXP] = useState(0);
  const [pendingTokens, setPendingTokens] = useState('0.00');
  const [checkpointsSolved, setCheckpointsSolved] = useState(new Set());
  const [respawnAlert, setRespawnAlert] = useState(false);

  // Active Modals
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [levelCompletionData, setLevelCompletionData] = useState(null);

  // Equipped Cosmetics
  const [storeItems, setStoreItems] = useState(ACCESSORIES_CATALOG);

  // Load balances and equipped accessories
  const refreshUserData = async () => {
    try {
      const [balRes, storeRes] = await Promise.all([
        api.getRewardBalance().catch(() => null),
        api.getStoreItems().catch(() => null)
      ]);

      if (balRes?.success) {
        setGameplayXP(balRes.balance.gameplayXP);
        setPendingTokens(balRes.balance.pendingClaimableTokens);
      }
      if (storeRes?.success) {
        setStoreItems(storeRes.items);
      }
    } catch (e) {
      console.warn('Refresh error:', e);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, [user, account]);

  // Start Level
  const startLevel = async (topicSlug = 'blockchain-fundamentals', levelNum = 1, difficulty = 'beginner') => {
    setGameState(GAME_STATES.LOADING_QUESTIONS);
    setCurrentLevelNumber(levelNum);
    setCheckpointsSolved(new Set());

    // Generate fresh course platforms and orbs
    const newCourse = generateLevelCourse(levelNum, 5);
    setCourseData(newCourse);

    try {
      // 1. Start learning session on backend
      let sessId = `session-${Date.now()}`;
      try {
        const sessRes = await api.startSession(topicSlug, difficulty);
        if (sessRes.success) sessId = sessRes.session.id;
      } catch (e) {
        console.warn('Session offline fallback');
      }
      setActiveSessionId(sessId);

      // 2. Generate questions via AI service
      const qRes = await api.generateQuestions('Blockchain Fundamentals', difficulty, 4);
      if (qRes.success && qRes.data?.questions?.length) {
        setQuestions(qRes.data.questions);
      }
    } catch (err) {
      console.error('Error initiating level:', err);
    } finally {
      setGameState(GAME_STATES.PLAYING);
    }
  };

  // Checkpoint Reached Handler
  const handleCheckpointReached = (platform) => {
    if (platform.type === 'CHECKPOINT') {
      const checkpointNum = platform.checkpointNumber || 1;
      if (!checkpointsSolved.has(checkpointNum)) {
        setCurrentQuestionIndex(Math.min(checkpointNum - 1, questions.length - 1));
        setGameState(GAME_STATES.QUESTION_ACTIVE);
      }
    } else if (platform.type === 'FINISH') {
      handleLevelFinish();
    }
  };

  // Orb Collected Handler
  const handleOrbCollected = (orb) => {
    setGameplayXP(x => x + orb.value);
  };

  // Fall Recovery Respawn Handler
  const handleFallRespawn = () => {
    setRespawnAlert(true);
    setTimeout(() => setRespawnAlert(false), 3000);
  };

  // Submit Question Answer
  const handleSubmitAnswer = async ({ questionId, concept, chosenOption, hintsUsed }) => {
    const idempotencyKey = `idem-${activeSessionId}-${questionId}-${Date.now()}`;
    const payload = {
      questionId,
      concept,
      chosenOption,
      hintsUsed,
      timeSpentMs: 3000,
      idempotencyKey
    };

    const res = await api.submitAnswer(activeSessionId, payload);
    if (res.success && res.isCorrect) {
      setGameplayXP(x => x + res.xpAwarded);
      setPendingTokens(t => (parseFloat(t) + parseFloat(res.tokensEntitled)).toFixed(2));
      setCheckpointsSolved(prev => new Set([...prev, currentQuestionIndex + 1]));
    }
    return res;
  };

  // Request Hint from AI
  const handleRequestHint = async (concept, questionText) => {
    const res = await api.generateHint(concept, questionText);
    return res?.data;
  };

  // Retry with Remedial Question
  const handleRetryWithRemedial = async () => {
    try {
      const currentQ = questions[currentQuestionIndex];
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/ai/remedial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(api.getToken() && { Authorization: `Bearer ${api.getToken()}` })
        },
        body: JSON.stringify({ concept: currentQ?.concept || 'blocks', difficulty: 'beginner' })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setQuestions(prev => {
          const updated = [...prev];
          updated[currentQuestionIndex] = data.data;
          return updated;
        });
      }
    } catch (e) {
      console.warn('Remedial fetch failed', e);
    }
  };

  // Finish Level
  const handleLevelFinish = async () => {
    try {
      const res = await api.completeSession(activeSessionId);
      if (res.success) {
        setGameplayXP(x => x + res.bonusXP);
        setPendingTokens(t => (parseFloat(t) + parseFloat(res.bonusTokens)).toFixed(2));
        setLevelCompletionData({
          levelNumber: currentLevelNumber,
          bonusXP: res.bonusXP,
          bonusTokens: res.bonusTokens,
          entitlementId: res.entitlementId
        });
        setGameState(GAME_STATES.LEVEL_COMPLETED);
      }
    } catch (e) {
      console.error('Level finish error:', e);
      setLevelCompletionData({
        levelNumber: currentLevelNumber,
        bonusXP: 50,
        bonusTokens: '5.00',
        entitlementId: `ent-${Date.now()}`
      });
      setGameState(GAME_STATES.LEVEL_COMPLETED);
    }
  };

  // Next Level Progression
  const handleNextLevel = () => {
    setLevelCompletionData(null);
    const nextLvl = currentLevelNumber + 1;
    startLevel('blockchain-fundamentals', nextLvl, 'beginner');
  };

  const equippedAccessories = storeItems.filter(i => i.isEquipped);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0d14] relative">
      {/* Persistent Navbar */}
      <Navbar
        onOpenStore={() => setIsStoreOpen(true)}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenDashboard={() => setGameState(GAME_STATES.TOPIC_SELECTION)}
        gameplayXP={gameplayXP}
        pendingTokens={pendingTokens}
      />

      {/* Screen Views */}
      {gameState === GAME_STATES.MENU && (
        <LandingScreen
          onStart={() => startLevel('blockchain-fundamentals', 1, 'beginner')}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

      {gameState === GAME_STATES.TOPIC_SELECTION && (
        <DashboardScreen
          onStartLevel={(slug, lvl, diff) => startLevel(slug, lvl, diff)}
          onOpenStore={() => setIsStoreOpen(true)}
          onOpenWallet={() => setIsWalletOpen(true)}
        />
      )}

      {/* 3D Game Playing / Active States */}
      {(gameState === GAME_STATES.PLAYING ||
        gameState === GAME_STATES.QUESTION_ACTIVE ||
        gameState === GAME_STATES.FEEDBACK ||
        gameState === GAME_STATES.LEVEL_COMPLETED ||
        gameState === GAME_STATES.LOADING_QUESTIONS) && (
        <>
          <HUD
            currentLevel={currentLevelNumber}
            levelTitle="Blocks & Cryptography"
            checkpointsCompleted={checkpointsSolved.size}
            totalCheckpoints={3}
            respawnAlert={respawnAlert}
          />

          <GameCanvas
            courseData={courseData}
            onCheckpointReached={handleCheckpointReached}
            onOrbCollected={handleOrbCollected}
            onFallRespawn={handleFallRespawn}
            equippedAccessories={equippedAccessories}
          />

          <MobileControls />
        </>
      )}

      {/* Question Overlay Checkpoint */}
      {gameState === GAME_STATES.QUESTION_ACTIVE && questions[currentQuestionIndex] && (
        <QuestionOverlay
          question={questions[currentQuestionIndex]}
          checkpointNumber={currentQuestionIndex + 1}
          onSubmitAnswer={handleSubmitAnswer}
          onRequestHint={handleRequestHint}
          onRetryWithRemedial={handleRetryWithRemedial}
          onContinue={() => setGameState(GAME_STATES.PLAYING)}
        />
      )}

      {/* Level Complete Celebration Modal */}
      {gameState === GAME_STATES.LEVEL_COMPLETED && levelCompletionData && (
        <LevelCompleteModal
          levelNumber={levelCompletionData.levelNumber}
          bonusXP={levelCompletionData.bonusXP}
          bonusTokens={levelCompletionData.bonusTokens}
          entitlementId={levelCompletionData.entitlementId}
          onNextLevel={handleNextLevel}
          onClose={() => setGameState(GAME_STATES.TOPIC_SELECTION)}
        />
      )}

      {/* In-Game Store Modal */}
      <StoreModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        storeItems={storeItems}
        onEquipChange={refreshUserData}
      />

      {/* MetaMask & MST Wallet Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />

      {/* On-Chain Achievements Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
      />

      {/* User Login/Register Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          refreshUserData();
        }}
      />
    </div>
  );
}
