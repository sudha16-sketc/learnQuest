import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Canvas, useFrame } from '@react-three/fiber';
import { generateLevelCourse } from '@learnquest/game-core';
import { DEFAULT_TOPICS } from '@learnquest/shared';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const TOKEN_KEY = 'learnquest_token';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function apiRequest(endpoint, { token, method = 'GET', body, timeoutMs = 30000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    const raw = await res.text();
    let data = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        throw new ApiError(`Unexpected response from server (HTTP ${res.status})`, res.status);
      }
    }
    if (!res.ok) {
      throw new ApiError(data?.error || data?.message || `HTTP error ${res.status}`, res.status);
    }
    return data ?? {};
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Check the API URL and your network connection.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function MobilePlayer() {
  const meshRef = useRef();
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.5;
  });
  return (
    <group ref={meshRef} position={[0, 1.2, 0]}>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.7, 8]} />
        <meshStandardMaterial color="#4f46e5" />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
}

function MobilePlatform({ position, isFinish, isCheckpoint }) {
  const crystalRef = useRef();
  useFrame((_, delta) => {
    if (crystalRef.current) crystalRef.current.rotation.y += delta * 1.5;
  });
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[4.5, 0.6, 4.5]} />
        <meshStandardMaterial color={isFinish ? '#059669' : '#4f46e5'} />
      </mesh>
      {isCheckpoint && (
        <group ref={crystalRef} position={[0, 1.2, 0]}>
          <mesh>
            <octahedronGeometry args={[0.5]} />
            <meshStandardMaterial color="#c084fc" />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', username: '', password: '' });
  const [authError, setAuthError] = useState(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [view, setView] = useState('home');
  const [topics, setTopics] = useState(DEFAULT_TOPICS);
  const [selectedTopicSlug, setSelectedTopicSlug] = useState(DEFAULT_TOPICS[0].slug);
  const [difficulty, setDifficulty] = useState('beginner');
  const [progress, setProgress] = useState({ totalXP: 0, playerLevel: 1, completedLevels: 0, nextLevelXP: 100 });
  const [balance, setBalance] = useState({ gameplayXP: 0, pendingClaimableTokens: '0.00', onChainTokenBalance: '0.00' });
  const [dashboardError, setDashboardError] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState('');
  const [hintVisible, setHintVisible] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [levelError, setLevelError] = useState(null);
  const [levelLoading, setLevelLoading] = useState(false);
  const [levelSummary, setLevelSummary] = useState(null);
  const [courseData, setCourseData] = useState(() => generateLevelCourse(1, 4));

  const activeTopic = topics.find(topic => topic.slug === selectedTopicSlug) || topics[0] || DEFAULT_TOPICS[0];
  const activeQuestion = questions[currentIndex] || null;

  const clearSession = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setView('home');
    setSessionId(null);
    setQuestions([]);
  };

  const request = async (endpoint, options = {}) => {
    try {
      return await apiRequest(endpoint, { token, ...options });
    } catch (err) {
      if (err.status === 401) {
        await clearSession();
      }
      throw err;
    }
  };

  const loadDashboard = async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const [topicsRes, progressRes, balanceRes] = await Promise.all([
        request('/api/topics'),
        request('/api/learning/progress'),
        request('/api/rewards/balance')
      ]);
      if (topicsRes.topics?.length) {
        setTopics(topicsRes.topics);
        if (!topicsRes.topics.some(topic => topic.slug === selectedTopicSlug)) {
          setSelectedTopicSlug(topicsRes.topics[0].slug);
        }
      }
      if (progressRes.progress) setProgress(progressRes.progress);
      if (balanceRes.balance) setBalance(balanceRes.balance);
    } catch (err) {
      setDashboardError(err.message);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    async function bootstrap() {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (!stored) return;
        const me = await apiRequest('/api/auth/me', { token: stored });
        if (me.success) {
          setToken(stored);
          setUser(me.user);
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setBooting(false);
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (token && user) loadDashboard();
  }, [token, user]);

  const handleAuthSubmit = async () => {
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = authMode === 'register'
        ? { email: authForm.email.trim(), username: authForm.username.trim(), password: authForm.password }
        : { login: authForm.email.trim() || authForm.username.trim(), password: authForm.password };
      const data = await apiRequest(endpoint, { method: 'POST', body });
      if (!data.token || !data.user) throw new Error('The server did not return a valid session.');
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setAuthForm({ email: '', username: '', password: '' });
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const startLevel = async () => {
    if (!user) {
      setView('home');
      return;
    }
    setView('level');
    setLevelLoading(true);
    setLevelError(null);
    setLevelSummary(null);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setFeedback(null);
    setHint('');
    setHintVisible(false);
    setHintsUsed(0);
    setSessionId(null);
    setCourseData(generateLevelCourse(1, 4));

    try {
      const sessionRes = await request('/api/learning/sessions', {
        method: 'POST',
        body: { topicId: activeTopic.slug, difficulty }
      });
      if (!sessionRes.session?.id) throw new Error('Could not create a learning session.');
      setSessionId(sessionRes.session.id);

      const questionRes = await request('/api/ai/questions', {
        method: 'POST',
        body: { topic: activeTopic.title, difficulty, count: 4 }
      });
      const generated = questionRes.data?.questions || [];
      if (!generated.length) throw new Error('No verified questions were returned.');
      setQuestions(generated);
      if (questionRes.data?.degraded) {
        setLevelError('Gemini is unavailable right now; verified curated curriculum questions are in use.');
      }
    } catch (err) {
      setLevelError(err.message);
    } finally {
      setLevelLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!activeQuestion || selectedOption === null || !sessionId) return;
    setLevelLoading(true);
    setLevelError(null);
    try {
      const result = await request(`/api/learning/sessions/${sessionId}/answers`, {
        method: 'POST',
        body: {
          questionId: activeQuestion.id,
          concept: activeQuestion.concept,
          chosenOption: selectedOption,
          hintsUsed,
          timeSpentMs: 3000,
          idempotencyKey: `mobile-${sessionId}-${activeQuestion.id}-${Date.now()}`
        }
      });
      setFeedback(result);
      if (result.isCorrect && !result.alreadyAnswered) {
        setProgress(prev => ({ ...prev, totalXP: prev.totalXP + result.xpAwarded }));
        setBalance(prev => ({
          ...prev,
          gameplayXP: prev.gameplayXP + result.xpAwarded,
          pendingClaimableTokens: (parseFloat(prev.pendingClaimableTokens) + parseFloat(result.tokensEntitled || '0')).toFixed(2)
        }));
      }
    } catch (err) {
      setLevelError(err.message);
    } finally {
      setLevelLoading(false);
    }
  };

  const requestHint = async () => {
    if (!activeQuestion) return;
    setHintVisible(true);
    setHintsUsed(count => count + 1);
    if (hint) return;
    try {
      const res = await request('/api/ai/hints', {
        method: 'POST',
        body: { concept: activeQuestion.concept, question: activeQuestion.question }
      });
      setHint(res.data?.hint || activeQuestion.hint || 'Review the core definition for this concept.');
    } catch (err) {
      setHint(activeQuestion.hint || 'Review the core definition for this concept.');
      setLevelError(err.message);
    }
  };

  const retryWithRemedial = async () => {
    if (!activeQuestion) return;
    setLevelLoading(true);
    setLevelError(null);
    try {
      const res = await request('/api/ai/remedial', {
        method: 'POST',
        body: { concept: activeQuestion.concept, difficulty }
      });
      if (!res.data?.id) throw new Error('No remedial question was returned.');
      setQuestions(prev => {
        const updated = [...prev];
        updated[currentIndex] = res.data;
        return updated;
      });
      setSelectedOption(null);
      setFeedback(null);
      setHint('');
      setHintVisible(false);
      setHintsUsed(0);
    } catch (err) {
      setLevelError(err.message);
    } finally {
      setLevelLoading(false);
    }
  };

  const completeLevel = async () => {
    if (!sessionId) return;
    setLevelLoading(true);
    setLevelError(null);
    try {
      const res = await request(`/api/learning/sessions/${sessionId}/complete`, { method: 'POST' });
      setLevelSummary({
        bonusXP: res.bonusXP ?? 0,
        bonusTokens: res.bonusTokens ?? '0.00',
        alreadyCompleted: !!res.alreadyCompleted
      });
      setView('home');
      await loadDashboard();
    } catch (err) {
      setLevelError(err.message);
    } finally {
      setLevelLoading(false);
    }
  };

  const advanceQuestion = async () => {
    setSelectedOption(null);
    setFeedback(null);
    setHint('');
    setHintVisible(false);
    setHintsUsed(0);
    if (currentIndex >= questions.length - 1) {
      await completeLevel();
    } else {
      setCurrentIndex(index => index + 1);
    }
  };

  const leaveLevel = () => {
    if (!feedback && questions.length > 0) {
      Alert.alert('Leave this expedition?', 'Your current level question will be abandoned.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => setView('home') }
      ]);
      return;
    }
    setView('home');
  };

  if (booting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerScreen}>
          <ActivityIndicator size="large" color="#818cf8" />
          <Text style={styles.mutedText}>Loading LearnQuest...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0d14" />
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBlock}>
            <Text style={styles.brandTitle}>LearnQuest</Text>
            <Text style={styles.brandSubtitle}>AI-powered blockchain learning on MST</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, authMode === 'login' && styles.tabActive]}
                onPress={() => { setAuthMode('login'); setAuthError(null); }}
              >
                <Text style={[styles.tabText, authMode === 'login' && styles.tabTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, authMode === 'register' && styles.tabActive]}
                onPress={() => { setAuthMode('register'); setAuthError(null); }}
              >
                <Text style={[styles.tabText, authMode === 'register' && styles.tabTextActive]}>Register</Text>
              </TouchableOpacity>
            </View>

            {authError && <Text style={styles.errorText}>{authError}</Text>}

            {authMode === 'register' && (
              <TextInput
                style={styles.input}
                value={authForm.email}
                onChangeText={email => setAuthForm(prev => ({ ...prev, email }))}
                placeholder="Email address"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            )}
            <TextInput
              style={styles.input}
              value={authMode === 'register' ? authForm.username : authForm.email}
              onChangeText={value => setAuthForm(prev => authMode === 'register'
                ? { ...prev, username: value }
                : { ...prev, email: value })}
              placeholder={authMode === 'register' ? 'Choose a username' : 'Username or email'}
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={authForm.password}
              onChangeText={password => setAuthForm(prev => ({ ...prev, password }))}
              placeholder="Password"
              placeholderTextColor="#64748b"
              secureTextEntry
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleAuthSubmit} disabled={authSubmitting}>
              {authSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {authMode === 'register' ? 'Create Explorer Profile' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>
            <Text style={styles.helperText}>
              This app uses the same authenticated LearnQuest account, XP ledger, and rewards as the web version.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'level') {
    const optionLocked = !!feedback || levelLoading;
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0d14" />
        <View style={styles.navbar}>
          <TouchableOpacity onPress={leaveLevel} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Level 1</Text>
          <View style={styles.xpBadge}><Text style={styles.xpText}>XP {balance.gameplayXP}</Text></View>
        </View>

        <View style={styles.progressStrip}>
          <Text style={styles.progressText}>
            Checkpoint {Math.min(currentIndex + 1, Math.max(questions.length, 1))} of {questions.length || 4}
          </Text>
          <Text style={styles.progressText}>{activeTopic.title}</Text>
        </View>

        <View style={styles.canvasContainer}>
          <Canvas camera={{ position: [0, 4, 8], fov: 60 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 15, 10]} intensity={1.2} />
            {courseData.platforms.map(platform => (
              <MobilePlatform
                key={platform.id}
                position={platform.position}
                isFinish={platform.type === 'FINISH'}
                isCheckpoint={platform.isCheckpoint}
              />
            ))}
            <MobilePlayer />
          </Canvas>
        </View>

        <ScrollView style={styles.levelPanel} contentContainerStyle={styles.levelPanelContent}>
          {levelError && <Text style={styles.warningText}>{levelError}</Text>}
          {levelLoading && <ActivityIndicator color="#818cf8" style={{ marginBottom: 12 }} />}

          {!activeQuestion ? (
            <Text style={styles.mutedText}>Preparing verified checkpoint questions...</Text>
          ) : (
            <View style={styles.card}>
              <Text style={styles.questionTag}>CONCEPT: {String(activeQuestion.concept).toUpperCase()}</Text>
              <Text style={styles.questionText}>{activeQuestion.question}</Text>

              {activeQuestion.options.map((option, index) => {
                const isSelected = selectedOption === index;
                const isCorrect = feedback && feedback.correctOptionIndex === index;
                const isWrong = feedback && isSelected && !feedback.isCorrect;
                return (
                  <TouchableOpacity
                    key={`${activeQuestion.id}-${index}`}
                    disabled={optionLocked}
                    onPress={() => setSelectedOption(index)}
                    style={[
                      styles.optionItem,
                      isSelected && !feedback && styles.optionSelected,
                      isCorrect && styles.optionCorrect,
                      isWrong && styles.optionWrong
                    ]}
                  >
                    <Text style={styles.optionChar}>{String.fromCharCode(65 + index)}</Text>
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                );
              })}

              {!feedback && (
                <TouchableOpacity style={styles.hintButton} onPress={requestHint} disabled={hintVisible}>
                  <Text style={styles.hintButtonText}>{hintVisible ? 'Hint Revealed' : 'Need a Hint?'}</Text>
                </TouchableOpacity>
              )}
              {hintVisible && (
                <View style={styles.hintBox}>
                  <Text style={styles.hintText}>{hint || activeQuestion.hint || 'Review the checkpoint concept.'}</Text>
                </View>
              )}

              {feedback && (
                <View style={[styles.feedbackBox, feedback.isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
                  <Text style={styles.feedbackTitle}>
                    {feedback.isCorrect ? 'Correct checkpoint answer' : 'Not quite yet'}
                  </Text>
                  <Text style={styles.feedbackText}>
                    {feedback.explanation || (feedback.isCorrect
                      ? 'Your answer was verified by the LearnQuest server.'
                      : 'Review the verified correct option highlighted above.')}
                  </Text>
                  {feedback.isCorrect && !feedback.alreadyAnswered && (
                    <Text style={styles.rewardText}>+{feedback.xpAwarded} XP and {feedback.tokensEntitled} LQST entitled</Text>
                  )}
                  {feedback.alreadyAnswered && (
                    <Text style={styles.mutedText}>This question was already scored; no duplicate XP was awarded.</Text>
                  )}
                </View>
              )}

              {!feedback ? (
                <TouchableOpacity
                  style={[styles.primaryButton, (selectedOption === null || levelLoading) && styles.disabledButton]}
                  onPress={submitAnswer}
                  disabled={selectedOption === null || levelLoading}
                >
                  <Text style={styles.primaryButtonText}>Confirm Answer</Text>
                </TouchableOpacity>
              ) : feedback.isCorrect ? (
                <TouchableOpacity style={styles.successButton} onPress={advanceQuestion}>
                  <Text style={styles.primaryButtonText}>
                    {currentIndex >= questions.length - 1 ? 'Complete Level' : 'Next Checkpoint'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.retryButton} onPress={retryWithRemedial}>
                    <Text style={styles.primaryButtonText}>Retry with Remedial</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={advanceQuestion}>
                    <Text style={styles.secondaryButtonText}>Skip</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0d14" />
      <View style={styles.navbar}>
        <View>
          <Text style={styles.brandTitle}>LearnQuest</Text>
          <Text style={styles.brandSubtitle}>{user.username}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.xpBadge}><Text style={styles.xpText}>XP {balance.gameplayXP || progress.totalXP}</Text></View>
          <View style={styles.tokenBadge}><Text style={styles.tokenText}>{balance.pendingClaimableTokens} LQST</Text></View>
          <TouchableOpacity style={styles.logoutButton} onPress={clearSession}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.homeContent}>
        {dashboardError && <Text style={styles.warningText}>{dashboardError}</Text>}
        {dashboardLoading && <ActivityIndicator color="#818cf8" style={{ marginBottom: 12 }} />}

        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>WELCOME BACK</Text>
          <Text style={styles.heroTitle}>Continue your blockchain expedition</Text>
          <Text style={styles.heroBody}>
            Questions are generated by Google Gemini on the server with schema validation and a verified curated fallback.
            Every answer and reward is scored by the LearnQuest API.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PLAYER LEVEL</Text>
            <Text style={styles.statValue}>{progress.playerLevel}</Text>
            <Text style={styles.statSub}>{progress.totalXP} / {progress.nextLevelXP} XP</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>COMPLETED LEVELS</Text>
            <Text style={styles.statValue}>{progress.completedLevels}</Text>
            <Text style={styles.statSub}>Server-verified</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PENDING REWARDS</Text>
            <Text style={[styles.statValue, { color: '#22d3ee' }]}>{balance.pendingClaimableTokens}</Text>
            <Text style={styles.statSub}>LQST vouchers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ON-CHAIN BALANCE</Text>
            <Text style={[styles.statValue, { color: '#34d399' }]}>{balance.onChainTokenBalance}</Text>
            <Text style={styles.statSub}>{balance.walletAddress ? 'Linked wallet' : 'Link wallet on web'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Available Expeditions</Text>
        {topics.map(topic => (
          <TouchableOpacity
            key={topic.id || topic.slug}
            style={[styles.topicCard, selectedTopicSlug === topic.slug && styles.topicCardActive]}
            onPress={() => setSelectedTopicSlug(topic.slug)}
          >
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.topicDescription}>{topic.description}</Text>
            <Text style={styles.topicMeta}>
              {topic.levels?.length || 1} level{(topic.levels?.length || 1) === 1 ? '' : 's'} available
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Difficulty</Text>
        <View style={styles.difficultyRow}>
          {['beginner', 'intermediate', 'advanced'].map(level => (
            <TouchableOpacity
              key={level}
              style={[styles.difficultyChip, difficulty === level && styles.difficultyChipActive]}
              onPress={() => setDifficulty(level)}
            >
              <Text style={[styles.difficultyText, difficulty === level && styles.difficultyTextActive]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, dashboardLoading && styles.disabledButton]}
          onPress={startLevel}
          disabled={dashboardLoading}
        >
          <Text style={styles.primaryButtonText}>Start Learning Expedition</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Rewards and wallet linking</Text>
          <Text style={styles.infoText}>
            XP and pending LQST are stored in your account ledger. To receive LQST on MST, link an EVM wallet from the
            web wallet screen, then claim your signed voucher on chain. This mobile app does not simulate a wallet connection.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={!!levelSummary} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.celebrationTitle}>Level Complete</Text>
            <Text style={styles.celebrationSub}>
              {levelSummary?.alreadyCompleted
                ? 'This level was already completed. No duplicate bonus was awarded.'
                : `Server-confirmed bonus: +${levelSummary?.bonusXP ?? 0} XP and ${levelSummary?.bonusTokens ?? '0.00'} LQST entitled.`}
            </Text>
            <TouchableOpacity style={styles.successButton} onPress={() => setLevelSummary(null)}>
              <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0d14' },
  centerScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  authScroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  brandBlock: { alignItems: 'center', marginBottom: 24 },
  brandTitle: { fontSize: 26, fontWeight: '900', color: '#ffffff' },
  brandSubtitle: { fontSize: 11, color: '#818cf8', fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
  card: { backgroundColor: '#111827', borderRadius: 22, padding: 18, borderColor: '#1f2937', borderWidth: 1, marginBottom: 16 },
  tabRow: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: '#4f46e5' },
  tabText: { color: '#94a3b8', fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: '#ffffff' },
  input: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    color: '#f8fafc',
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 14
  },
  primaryButton: { backgroundColor: '#4f46e5', padding: 14, borderRadius: 13, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  successButton: { backgroundColor: '#059669', padding: 14, borderRadius: 13, alignItems: 'center', marginTop: 12 },
  disabledButton: { opacity: 0.5 },
  helperText: { color: '#64748b', fontSize: 11, lineHeight: 16, marginTop: 12 },
  errorText: { color: '#fda4af', backgroundColor: '#4c0519', padding: 10, borderRadius: 10, marginBottom: 12, fontSize: 12 },
  warningText: { color: '#fcd34d', backgroundColor: '#451a03', borderColor: '#b45309', borderWidth: 1, padding: 10, borderRadius: 10, marginBottom: 12, fontSize: 12 },
  mutedText: { color: '#94a3b8', fontSize: 12, textAlign: 'center' },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderColor: '#1e293b'
  },
  navTitle: { color: '#e2e8f0', fontSize: 13, fontWeight: '800' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  xpBadge: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  xpText: { color: '#f59e0b', fontWeight: '800', fontSize: 10 },
  tokenBadge: { backgroundColor: '#1e1b4b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderColor: '#4338ca', borderWidth: 1 },
  tokenText: { color: '#22d3ee', fontWeight: '800', fontSize: 10 },
  logoutButton: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  logoutText: { color: '#cbd5e1', fontSize: 10, fontWeight: '700' },
  backButton: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 },
  backButtonText: { color: '#cbd5e1', fontWeight: '700', fontSize: 11 },
  homeContent: { padding: 16, paddingBottom: 40 },
  heroCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 22,
    padding: 18,
    borderColor: '#4338ca',
    borderWidth: 1,
    marginBottom: 14
  },
  heroEyebrow: { color: '#a5b4fc', fontSize: 10, letterSpacing: 1.2, fontWeight: '800', marginBottom: 6 },
  heroTitle: { color: '#ffffff', fontSize: 21, fontWeight: '900', marginBottom: 8 },
  heroBody: { color: '#c7d2fe', fontSize: 12, lineHeight: 18 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  statCard: {
    width: '48%',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 13,
    borderColor: '#1f2937',
    borderWidth: 1
  },
  statLabel: { color: '#64748b', fontSize: 9, fontWeight: '800', letterSpacing: 0.6, marginBottom: 7 },
  statValue: { color: '#f8fafc', fontSize: 22, fontWeight: '900' },
  statSub: { color: '#94a3b8', fontSize: 10, marginTop: 3 },
  sectionTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '900', marginBottom: 10, marginTop: 4 },
  topicCard: { backgroundColor: '#111827', borderRadius: 15, padding: 14, borderColor: '#1f2937', borderWidth: 1, marginBottom: 9 },
  topicCardActive: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
  topicTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '800', marginBottom: 4 },
  topicDescription: { color: '#94a3b8', fontSize: 11, lineHeight: 16 },
  topicMeta: { color: '#818cf8', fontSize: 10, fontWeight: '700', marginTop: 7 },
  difficultyRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  difficultyChip: { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: '#111827', borderColor: '#1f2937', borderWidth: 1, alignItems: 'center' },
  difficultyChipActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  difficultyText: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  difficultyTextActive: { color: '#ffffff' },
  infoCard: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1, borderRadius: 15, padding: 14, marginTop: 16 },
  infoTitle: { color: '#e2e8f0', fontSize: 13, fontWeight: '800', marginBottom: 6 },
  infoText: { color: '#94a3b8', fontSize: 11, lineHeight: 17 },
  progressStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#0f172a' },
  progressText: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },
  canvasContainer: { height: 180, backgroundColor: '#05070c' },
  levelPanel: { flex: 1, backgroundColor: '#0a0d14' },
  levelPanelContent: { padding: 14, paddingBottom: 40 },
  questionTag: { color: '#818cf8', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8 },
  questionText: { color: '#ffffff', fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 14 },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#1e293b',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  optionSelected: { borderColor: '#6366f1', backgroundColor: '#312e81' },
  optionCorrect: { borderColor: '#10b981', backgroundColor: '#064e3b' },
  optionWrong: { borderColor: '#f43f5e', backgroundColor: '#4c0519' },
  optionChar: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#0f172a',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '800',
    marginRight: 10,
    fontSize: 11
  },
  optionText: { color: '#f1f5f9', fontSize: 12, flex: 1, lineHeight: 17 },
  hintButton: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: '#422006', borderColor: '#a16207', borderWidth: 1, marginTop: 4 },
  hintButtonText: { color: '#fbbf24', fontSize: 11, fontWeight: '700' },
  hintBox: { backgroundColor: '#451a03', borderRadius: 10, padding: 10, marginTop: 8 },
  hintText: { color: '#fde68a', fontSize: 11, lineHeight: 16 },
  feedbackBox: { borderRadius: 12, padding: 12, marginTop: 10 },
  feedbackCorrect: { backgroundColor: '#064e3b' },
  feedbackWrong: { backgroundColor: '#4c0519' },
  feedbackTitle: { color: '#ffffff', fontWeight: '800', fontSize: 13, marginBottom: 5 },
  feedbackText: { color: '#e2e8f0', fontSize: 11, lineHeight: 17 },
  rewardText: { color: '#fbbf24', fontSize: 11, fontWeight: '800', marginTop: 7 },
  actionRow: { flexDirection: 'row', gap: 8 },
  retryButton: { flex: 1, backgroundColor: '#7c3aed', padding: 13, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  secondaryButton: { marginTop: 10, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#cbd5e1', fontWeight: '800', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(5, 7, 12, 0.88)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: '#111827', borderRadius: 22, padding: 20, borderColor: '#374151', borderWidth: 1 },
  celebrationTitle: { fontSize: 21, fontWeight: '900', color: '#ffffff', textAlign: 'center', marginBottom: 8 },
  celebrationSub: { color: '#94a3b8', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 8 }
});
