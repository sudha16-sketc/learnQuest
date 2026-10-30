import React, { useState, useEffect } from 'react';
import { GameCanvas } from './game/GameCanvas';
import { Navbar } from './components/Navbar';
import { HUD } from './components/HUD';
import { QuestionOverlay } from './components/QuestionOverlay';
import { LevelCompleteModal } from './components/LevelCompleteModal';


import { LandingScreen } from './screens/LandingScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { StoreModal } from './screens/StoreModal';
import { WalletModal } from './screens/WalletModal';
import { AchievementsModal } from './screens/AchievementsModal';
import { AuthModal } from './screens/AuthModal';
import { LegalModal } from './screens/LegalModal';
import { generateLevelCourse } from '@learnquest/game-core';
import { GAME_STATES, ACCESSORIES_CATALOG } from '@learnquest/shared';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import { useWeb3 } from './context/Web3Context';

export function App() {
  const { user, loading: authLoading } = useAuth();
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
  const [gameError, setGameError] = useState(null);

  // Active Modals
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [legalModalDoc, setLegalModalDoc] = useState(null); // 'tos' | 'privacy' | null
  const [levelCompletionData, setLevelCompletionData] = useState(null);

  // Equipped Cosmetics
  const [storeItems, setStoreItems] = useState(ACCESSORIES_CATALOG);

  // Load balances and equipped accessories
  const refreshUserData = async () => {
    if (!user) return;

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

  useEffect(() => {
    if (user) setGameError(null);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user && gameState === GAME_STATES.TOPIC_SELECTION) {
      setGameState(GAME_STATES.MENU);
      setIsAuthOpen(true);
    }
  }, [authLoading, user, gameState]);

  // Start Level
  const startLevel = async (topicSlug = 'blockchain-fundamentals', levelNum = 1, difficulty = 'beginner') => {
    if (!user) {
      setGameError('Sign in to start a learning expedition and save your progress.');
      setIsAuthOpen(true);
      return;
    }

    setGameState(GAME_STATES.LOADING_QUESTIONS);
    setCurrentLevelNumber(levelNum);
    setCheckpointsSolved(new Set());
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setActiveSessionId(null);
    setGameError(null);

    const newCourse = generateLevelCourse(levelNum, 5);
    setCourseData(newCourse);

    try {
      const sessRes = await api.startSession(topicSlug, difficulty);
      if (!sessRes?.success || !sessRes.session?.id) {
        throw new Error('Could not start a learning session on the server.');
      }
      setActiveSessionId(sessRes.session.id);

      const qRes = await api.generateQuestions('Blockchain Fundamentals', difficulty, 4);
      if (!qRes?.success || !qRes.data?.questions?.length) {
        throw new Error('No verified questions were returned by the learning service.');
      }

      setQuestions(qRes.data.questions);
      if (qRes.data.degraded) {
        setGameError('Gemini is temporarily unavailable, so verified curated curriculum questions are being used.');
      }
      setGameState(GAME_STATES.PLAYING);
    } catch (err) {
      console.error('Error initiating level:', err);
      setGameError(err.message || 'Could not start this level. Please try again.');
      setGameState(GAME_STATES.TOPIC_SELECTION);
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

  const handleOrbCollected = () => {};

  // Fall Recovery Respawn Handler
  const handleFallRespawn = () => {
    setRespawnAlert(true);
    setTimeout(() => setRespawnAlert(false), 3000);
  };

  // Submit Question Answer
  const handleSubmitAnswer = async ({ questionId, concept, chosenOption, hintsUsed }) => {
    if (!activeSessionId) {
      throw new Error('Your learning session is not active. Please restart the level.');
    }
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
    if (res.success && res.isCorrect && !res.alreadyAnswered) {
      setGameplayXP(x => x + res.xpAwarded);
      setPendingTokens(t => (parseFloat(t) + parseFloat(res.tokensEntitled || '0')).toFixed(2));
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
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    try {
      const res = await api.generateRemedial(currentQ.concept || 'blocks', currentQ.difficulty || 'beginner');
      if (res.success && res.data) {
        setQuestions(prev => {
          const updated = [...prev];
          updated[currentQuestionIndex] = res.data;
          return updated;
        });
      }
    } catch (err) {
      setGameError(err.message || 'Could not load a remedial question.');
    }
  };

  // Finish Level
  const handleLevelFinish = async () => {
    if (!activeSessionId) {
      setGameError('No active learning session to complete.');
      return;
    }
    try {
      const res = await api.completeSession(activeSessionId);
      if (!res?.success) {
        throw new Error('The server could not confirm level completion.');
      }
      if (!res.alreadyCompleted) {
        setGameplayXP(x => x + res.bonusXP);
        setPendingTokens(t => (parseFloat(t) + parseFloat(res.bonusTokens || '0')).toFixed(2));
      }
      setLevelCompletionData({
        levelNumber: currentLevelNumber,
        bonusXP: res.bonusXP,
        bonusTokens: res.bonusTokens,
        entitlementId: res.entitlementId
      });
      setGameState(GAME_STATES.LEVEL_COMPLETED);
      await refreshUserData();
    } catch (err) {
      console.error('Level finish error:', err);
      setGameError(err.message || 'Could not complete the level. Please try again.');
      setGameState(GAME_STATES.PLAYING);
    }
  };

  // Next Level Progression
  const handleNextLevel = () => {
    setLevelCompletionData(null);
    const nextLvl = currentLevelNumber + 1;
    startLevel('blockchain-fundamentals', nextLvl, 'beginner');
  };

  const equippedAccessories = storeItems.filter(i => i.isEquipped);
  const courseCheckpointCount = courseData.platforms.filter(p => p.type === 'CHECKPOINT').length;
  const totalCheckpoints = questions.length || courseCheckpointCount;

  if (authLoading) {
    return (
      <div className="w-screen h-screen bg-[#0d1410] flex items-center justify-center text-[#d2fcf8] text-xs font-mono uppercase tracking-wider">
        Loading LearnQuest Systems...
      </div>
    );
  }

  const isPlayingGame = (
    gameState === GAME_STATES.PLAYING ||
    gameState === GAME_STATES.QUESTION_ACTIVE ||
    gameState === GAME_STATES.FEEDBACK ||
    gameState === GAME_STATES.LEVEL_COMPLETED ||
    gameState === GAME_STATES.LOADING_QUESTIONS
  );

  return (
    <div className={`w-full min-h-screen bg-[#0d1410] text-[#d2fcf8] relative overflow-x-hidden ${isPlayingGame ? 'h-screen overflow-hidden touch-none' : 'overflow-y-auto'}`}>
      {/* Persistent Navbar */}
      <Navbar
        onOpenStore={() => setIsStoreOpen(true)}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenDashboard={() => setGameState(GAME_STATES.TOPIC_SELECTION)}
        onLogoClick={
          gameState === GAME_STATES.MENU
            ? () => window.scrollTo({ top: 0, behavior: 'smooth' })
            : undefined
        }
        onOpenTOS={() => setLegalModalDoc('tos')}
        onOpenPrivacy={() => setLegalModalDoc('privacy')}
        gameplayXP={gameplayXP}
        pendingTokens={pendingTokens}
        variant={gameState === GAME_STATES.MENU ? 'landing' : 'app'}
        showSectionLinks={gameState === GAME_STATES.MENU}
      />

      {gameError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[calc(100%-2rem)] px-4 py-2.5 bg-[#0d1410] border-2 border-[#6d6499] text-[#6d6499] text-xs font-mono font-medium">
          {gameError}
        </div>
      )}

      {/* Screen Views */}
      {gameState === GAME_STATES.MENU && (
        <LandingScreen
          onStart={() => startLevel('blockchain-fundamentals', 1, 'beginner')}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenTOS={() => setLegalModalDoc('tos')}
          onOpenPrivacy={() => setLegalModalDoc('privacy')}
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
            levelTitle="Blocks and Cryptography"
            checkpointsCompleted={checkpointsSolved.size}
            totalCheckpoints={totalCheckpoints}
            respawnAlert={respawnAlert}
          />

          <GameCanvas
            courseData={courseData}
            onCheckpointReached={handleCheckpointReached}
            onOrbCollected={handleOrbCollected}
            onFallRespawn={handleFallRespawn}
            equippedAccessories={equippedAccessories}
          />


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

      {/* Legal Compliance Modal (Terms of Service / Privacy Policy) */}
      <LegalModal
        isOpen={!!legalModalDoc}
        documentType={legalModalDoc}
        onClose={() => setLegalModalDoc(null)}
      />
    </div>
  );
}

