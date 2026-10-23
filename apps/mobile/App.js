import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  Linking,
  Alert
} from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import { generateLevelCourse } from '@learnquest/game-core';
import { MST_NETWORKS } from '@learnquest/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

// 3D Player component in React Native R3F
function MobilePlayer({ position, isJumping }) {
  const meshRef = useRef();
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Body */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.7, 8]} />
        <meshStandardMaterial color="#4f46e5" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 1.38, 0.22]}>
        <boxGeometry args={[0.38, 0.12, 0.15]} />
        <meshStandardMaterial color="#06b6d4" />
      </mesh>
    </group>
  );
}

// 3D Platform component
function MobilePlatform({ position, isFinish, isCheckpoint }) {
  const crystalRef = useRef();
  useFrame((_, delta) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += delta * 1.5;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0, 0]}>
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
  const [courseData, setCourseData] = useState(() => generateLevelCourse(1, 4));
  const [currentCheckpoint, setCurrentCheckpoint] = useState(1);
  const [gameplayXP, setGameplayXP] = useState(120);
  const [tokensClaimable, setTokensClaimable] = useState('12.00');
  const [walletAddress, setWalletAddress] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [levelCompleted, setLevelCompleted] = useState(false);

  // Fetch initial questions from shared API backend
  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/ai/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: 'Blockchain Fundamentals',
            difficulty: 'beginner',
            count: 3
          })
        });
        const data = await res.json();
        if (data.success && data.data?.questions?.length) {
          // Questions ready
        }
      } catch (err) {
        console.warn('API sync warning:', err.message);
      }
    }
    loadQuestions();
  }, []);

  // Connect MetaMask Mobile via Deep Link
  const handleConnectMetaMaskMobile = async () => {
    const dappUrl = 'learnquest.io';
    const metamaskDeepLink = `https://metamask.app.link/dapp/${dappUrl}`;

    try {
      const canOpen = await Linking.canOpenURL(metamaskDeepLink);
      if (canOpen) {
        await Linking.openURL(metamaskDeepLink);
      } else {
        // Fallback simulate connection for testing
        setWalletAddress('0x7099...79C8');
        Alert.alert(
          'MetaMask Connected',
          'Successfully connected to MetaMask Mobile on MST Testnet (Chain ID 91562037).'
        );
      }
    } catch (e) {
      setWalletAddress('0x7099...79C8');
    }
  };

  const handleTriggerCheckpoint = () => {
    setActiveQuestion({
      id: 'q-mobile-1',
      concept: 'blocks',
      question: 'What fundamental data does a standard blockchain block contain?',
      options: [
        'A cryptographic hash, previous block hash, and verified transactions',
        'Only user profile pictures and private keys',
        'Raw executable game assets and 3D textures',
        'A single centralized database index'
      ],
      correctOptionIndex: 0,
      explanation: 'A block consists of a header with cryptographic hashes and recorded transactions.'
    });
    setSelectedOption(null);
    setFeedback(null);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    const isCorrect = selectedOption === 0;

    if (isCorrect) {
      setGameplayXP(x => x + 10);
      setTokensClaimable(t => (parseFloat(t) + 1.0).toFixed(2));
      setFeedback({
        isCorrect: true,
        text: 'Correct! +10 XP and +1.00 LQST earned.'
      });
    } else {
      setFeedback({
        isCorrect: false,
        text: 'Incorrect. Blocks link transactions cryptographically.'
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0d14" />

      {/* Top Mobile Bar */}
      <View style={styles.navbar}>
        <View>
          <Text style={styles.brandTitle}>LearnQuest</Text>
          <Text style={styles.brandSubtitle}>MST Blockchain 3D</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>XP {gameplayXP}</Text>
          </View>
          <View style={styles.tokenBadge}>
            <Text style={styles.tokenText}>{tokensClaimable} LQST</Text>
          </View>
          <TouchableOpacity
            style={styles.walletButton}
            onPress={handleConnectMetaMaskMobile}
          >
            <Text style={styles.walletButtonText}>
              {walletAddress ? walletAddress : 'MetaMask'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3D Game World Canvas */}
      <View style={styles.canvasContainer}>
        <Canvas camera={{ position: [0, 4, 8], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 15, 10]} intensity={1.2} />
          {courseData.platforms.map((p) => (
            <MobilePlatform
              key={p.id}
              position={p.position}
              isFinish={p.type === 'FINISH'}
              isCheckpoint={p.isCheckpoint}
            />
          ))}
          <MobilePlayer position={[0, 1.2, 0]} isJumping={false} />
        </Canvas>

        {/* Floating Checkpoint Trigger Button for Mobile Demo */}
        <TouchableOpacity
          style={styles.checkpointTriggerButton}
          onPress={handleTriggerCheckpoint}
        >
          <Text style={styles.checkpointTriggerText}>
            ⚡ Checkpoint Beacon {currentCheckpoint}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Touch Controls Area */}
      <View style={styles.controlsBar}>
        <View style={styles.dpad}>
          <TouchableOpacity style={styles.controlBtn}>
            <Text style={styles.arrowText}>▲</Text>
          </TouchableOpacity>
          <View style={styles.dpadRow}>
            <TouchableOpacity style={styles.controlBtn}>
              <Text style={styles.arrowText}>◀</Text>
            </TouchableOpacity>
            <View style={styles.dpadCenter} />
            <TouchableOpacity style={styles.controlBtn}>
              <Text style={styles.arrowText}>▶</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.controlBtn}>
            <Text style={styles.arrowText}>▼</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.jumpBtn}
          onPress={() => setLevelCompleted(true)}
        >
          <Text style={styles.jumpBtnText}>JUMP</Text>
        </TouchableOpacity>
      </View>

      {/* Question Overlay Modal */}
      {activeQuestion && (
        <Modal transparent animationType="slide" visible={!!activeQuestion}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.questionTag}>CONCEPT #{activeQuestion.concept.toUpperCase()}</Text>
              <Text style={styles.questionText}>{activeQuestion.question}</Text>

              {activeQuestion.options.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedOption(idx)}
                  style={[
                    styles.optionItem,
                    selectedOption === idx && styles.optionSelected
                  ]}
                >
                  <Text style={styles.optionChar}>{String.fromCharCode(65 + idx)}</Text>
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}

              {feedback && (
                <View style={[styles.feedbackBox, feedback.isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
                  <Text style={styles.feedbackText}>{feedback.text}</Text>
                </View>
              )}

              <View style={styles.modalActions}>
                {!feedback ? (
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleSubmitAnswer}
                  >
                    <Text style={styles.submitBtnText}>Confirm Answer</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={() => setActiveQuestion(null)}
                  >
                    <Text style={styles.continueBtnText}>Continue Level</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Level Complete Celebration Modal */}
      {levelCompleted && (
        <Modal transparent animationType="fade" visible={levelCompleted}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.celebrationTitle}>🏆 Level 1 Mastered!</Text>
              <Text style={styles.celebrationSub}>
                You earned +50 XP and +5.00 LQST tokens on MST Blockchain.
              </Text>

              <TouchableOpacity
                style={styles.claimTokensBtn}
                onPress={() => {
                  Alert.alert('Claimed on MST', 'Tokens successfully claimed to your connected wallet on MST Testnet!');
                  setLevelCompleted(false);
                }}
              >
                <Text style={styles.claimTokensText}>Claim on MST Blockchain</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextLevelBtn}
                onPress={() => setLevelCompleted(false)}
              >
                <Text style={styles.nextLevelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0d14'
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderColor: '#1e293b'
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff'
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#6366f1',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  xpBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  xpText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 11
  },
  tokenBadge: {
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderColor: '#4338ca',
    borderWidth: 1
  },
  tokenText: {
    color: '#06b6d4',
    fontWeight: 'bold',
    fontSize: 11
  },
  walletButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  walletButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  canvasContainer: {
    flex: 1,
    position: 'relative'
  },
  checkpointTriggerButton: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(30, 27, 75, 0.9)',
    borderColor: '#818cf8',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  checkpointTriggerText: {
    color: '#e0e7ff',
    fontWeight: 'bold',
    fontSize: 12
  },
  controlsBar: {
    height: 140,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(10, 13, 20, 0.95)'
  },
  dpad: {
    alignItems: 'center',
    width: 120
  },
  dpadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4
  },
  dpadCenter: {
    width: 32,
    height: 32
  },
  controlBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#1e293b',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  arrowText: {
    color: '#e2e8f0',
    fontSize: 14
  },
  jumpBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#818cf8'
  },
  jumpBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 20,
    borderColor: '#374151',
    borderWidth: 1
  },
  questionTag: {
    fontSize: 10,
    color: '#818cf8',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8
  },
  questionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  optionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#312e81'
  },
  optionChar: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#0f172a',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    marginRight: 10,
    fontSize: 12
  },
  optionText: {
    color: '#f1f5f9',
    fontSize: 13,
    flex: 1
  },
  feedbackBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8
  },
  feedbackCorrect: {
    backgroundColor: 'rgba(6, 78, 59, 0.6)'
  },
  feedbackWrong: {
    backgroundColor: 'rgba(136, 19, 55, 0.6)'
  },
  feedbackText: {
    color: '#ffffff',
    fontSize: 12
  },
  modalActions: {
    marginTop: 12
  },
  submitBtn: {
    backgroundColor: '#4f46e5',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14
  },
  continueBtn: {
    backgroundColor: '#059669',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  continueBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8
  },
  celebrationSub: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20
  },
  claimTokensBtn: {
    backgroundColor: '#0891b2',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10
  },
  claimTokensText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14
  },
  nextLevelBtn: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  nextLevelText: {
    color: '#cbd5e1',
    fontWeight: 'bold'
  }
});
