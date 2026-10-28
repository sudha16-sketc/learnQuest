// CommonJS re-export for Metro bundler (React Native / Expo)
// The ESM .js files are used by the web/Node build; the .cjs files are used by Metro.
'use strict';

const { LEVEL_BRIEFINGS, getLevelBriefing } = require('./level-briefings.cjs');

const MST_NETWORKS = {
  TESTNET: {
    name: 'MST Testnet',
    chainId: 91562037,
    chainIdHex: '0x5752035',
    rpcUrl: 'https://testnetrpc.mstblockchain.com',
    explorerUrl: 'https://testnet.mstscan.com',
    currencySymbol: 'tMSTC',
    decimals: 18,
    verifiedDate: '2026-10-23',
    source: 'chainlist.org & mstblockchain.com'
  },
  MAINNET: {
    name: 'MST Mainnet',
    chainId: 4646,
    chainIdHex: '0x1226',
    rpcUrl: 'https://mariorpc.mstblockchain.com',
    explorerUrl: 'https://mstscan.com',
    currencySymbol: 'MSTC',
    decimals: 18,
    verifiedDate: '2026-10-23',
    source: 'chainlist.org'
  }
};

const GAME_STATES = {
  MENU: 'MENU',
  TOPIC_SELECTION: 'TOPIC_SELECTION',
  LOADING_QUESTIONS: 'LOADING_QUESTIONS',
  PLAYING: 'PLAYING',
  QUESTION_ACTIVE: 'QUESTION_ACTIVE',
  FEEDBACK: 'FEEDBACK',
  LEARNING_EXPLANATION: 'LEARNING_EXPLANATION',
  LEVEL_BRIEFING: 'LEVEL_BRIEFING',
  LEVEL_COMPLETED: 'LEVEL_COMPLETED',
  LEVEL_FAILED: 'LEVEL_FAILED',
  PAUSED: 'PAUSED',
  REWARD_SCREEN: 'REWARD_SCREEN',
};

const XP_ECONOMY = {
  BASE_XP_CORRECT: 20,
  BONUS_XP_FAST: 10,
  BONUS_XP_NO_HINT: 5,
  PENALTY_WRONG: 0,
  LEVEL_COMPLETION_BONUS: 50,
  TOKEN_PER_100_XP: 1,
  MAX_LEVEL_XP: 500,
};

const DEFAULT_TOPICS = [
  {
    id: 'topic-blockchain-fundamentals',
    slug: 'blockchain-fundamentals',
    title: 'Blockchain Fundamentals',
    description: 'Core concepts of distributed ledgers, consensus mechanisms, and cryptographic security.',
    category: 'blockchain',
    difficulty: 'beginner',
    levels: [
      { level: 1, title: 'Ledger Basics', objective: 'Understand the immutability and transparency of blockchain records.', platformsCount: 4, requiredMastery: 0.7 },
      { level: 2, title: 'Consensus & Cryptography', objective: 'Learn PoW, PoS and how digital signatures secure transactions.', platformsCount: 5, requiredMastery: 0.75 },
    ]
  },
  {
    id: 'topic-mst-blockchain',
    slug: 'mst-blockchain',
    title: 'MST Blockchain',
    description: 'Explore the MST Blockchain EVM-compatible network, its tools, and its utility ecosystem.',
    category: 'blockchain',
    difficulty: 'intermediate',
    levels: [
      { level: 1, title: 'MST Network Architecture', objective: 'Understand the MST chain ID, RPC endpoints, and native currency.', platformsCount: 4, requiredMastery: 0.7 },
      { level: 2, title: 'LQST Token & Rewards', objective: 'Learn how the LearnQuest utility token works on MST.', platformsCount: 5, requiredMastery: 0.75 },
    ]
  },
  {
    id: 'topic-smart-contracts',
    slug: 'smart-contracts',
    title: 'Smart Contracts & Web3',
    description: 'Deep dive into Solidity, ERC-20 tokens, and decentralized application development.',
    category: 'development',
    difficulty: 'intermediate',
    levels: [
      { level: 1, title: 'Solidity Basics', objective: 'Write your first Solidity contract and understand the EVM.', platformsCount: 4, requiredMastery: 0.7 },
      { level: 2, title: 'ERC-20 & DeFi', objective: 'Implement fungible tokens and interact with DEX protocols.', platformsCount: 5, requiredMastery: 0.75 },
      { level: 3, title: 'Smart Contracts & Web3', objective: 'Explore automated decentralized state machines and EVM execution.', platformsCount: 7, requiredMastery: 0.75 }
    ]
  }
];

const ACCESSORIES_CATALOG = [
  {
    sku: 'cosmetic-neon-aura',
    name: 'Cyber Neon Aura',
    description: 'A vibrant pulsating neon energy aura surrounding the explorer.',
    category: 'accessory',
    priceTokens: '15',
    metadata: { slot: 'aura', color: '#00ffff', intensity: 1.5 }
  },
  {
    sku: 'cosmetic-wizard-hat',
    name: 'Cosmic Scholar Hat',
    description: 'An enchanted floating cap reserved for diligent learners.',
    category: 'accessory',
    priceTokens: '25',
    metadata: { slot: 'hat', color: '#8b5cf6', floating: true }
  },
  {
    sku: 'cosmetic-spark-trail',
    name: 'Stardust Jump Trail',
    description: 'Leaves a shimmering wake of luminescent particles as you jump between platforms.',
    category: 'accessory',
    priceTokens: '20',
    metadata: { slot: 'trail', particleCount: 25, color: '#f59e0b' }
  },
  {
    sku: 'item-hint-pack-3',
    name: 'Insight Hint Pack (x3)',
    description: 'Unlocks 3 premium AI hints during difficult challenges.',
    category: 'hint',
    priceTokens: '5',
    metadata: { hintsCount: 3 }
  }
];

module.exports = {
  MST_NETWORKS,
  GAME_STATES,
  XP_ECONOMY,
  DEFAULT_TOPICS,
  ACCESSORIES_CATALOG,
  LEVEL_BRIEFINGS,
  getLevelBriefing,
};
