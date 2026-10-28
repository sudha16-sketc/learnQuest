/**
 * LearnQuest Shared Constants
 * Contains verified MST Blockchain parameters, Game States, XP Economy rules, and Store configuration.
 */

export const MST_NETWORKS = {
  TESTNET: {
    name: 'MST Testnet',
    chainId: 91562037, // 0x5752035 (also supports 4545 fallback where configured)
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

export const GAME_STATES = {
  MENU: 'MENU',
  TOPIC_SELECTION: 'TOPIC_SELECTION',
  LEVEL_BRIEFING: 'LEVEL_BRIEFING',
  LOADING_QUESTIONS: 'LOADING_QUESTIONS',
  PLAYING: 'PLAYING',
  QUESTION_ACTIVE: 'QUESTION_ACTIVE',
  FEEDBACK: 'FEEDBACK',
  LEARNING_EXPLANATION: 'LEARNING_EXPLANATION',
  LEVEL_COMPLETED: 'LEVEL_COMPLETED',
  LEVEL_FAILED: 'LEVEL_FAILED',
  PAUSED: 'PAUSED'
};

export const XP_ECONOMY = {
  CORRECT_FIRST_ATTEMPT: 10,
  CORRECT_AFTER_HINT: 5,
  LEVEL_COMPLETION_BONUS: 50,
  MASTERY_CHALLENGE_BONUS: 100,
  // 10 XP equals 1 claimable utility token entitlement
  XP_TO_TOKEN_RATIO: 0.1,
  LEVEL_XP_CURVE_BASE: 100
};

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
};

export const DEFAULT_TOPICS = [
  {
    id: 'topic-blockchain-fundamentals',
    slug: 'blockchain-fundamentals',
    title: 'Blockchain Fundamentals',
    description: 'Master blocks, hashes, distributed ledgers, consensus mechanisms, and smart contract execution.',
    category: 'Blockchain',
    icon: 'cube',
    levels: [
      {
        level: 1,
        title: 'Blocks & Cryptography',
        objective: 'Learn how transaction batches form immutable cryptographic chains.',
        platformsCount: 5,
        requiredMastery: 0.6
      },
      {
        level: 2,
        title: 'Consensus Mechanisms',
        objective: 'Understand Proof of Work, Proof of Stake, and Byzantine fault tolerance.',
        platformsCount: 6,
        requiredMastery: 0.7
      },
      {
        level: 3,
        title: 'Smart Contracts & Web3',
        objective: 'Explore automated decentralized state machines and EVM execution.',
        platformsCount: 7,
        requiredMastery: 0.75
      }
    ]
  }
];

export const ACCESSORIES_CATALOG = [
  {
    sku: 'cosmetic-neon-aura',
    name: 'Cyber Neon Aura',
    description: 'A vibrant pulsating neon energy aura surrounding the explorer.',
    category: 'accessory',
    priceTokens: '15',
    metadata: {
      slot: 'aura',
      color: '#00ffff',
      intensity: 1.5
    }
  },
  {
    sku: 'cosmetic-wizard-hat',
    name: 'Cosmic Scholar Hat',
    description: 'An enchanted floating cap reserved for diligent learners.',
    category: 'accessory',
    priceTokens: '25',
    metadata: {
      slot: 'hat',
      color: '#8b5cf6',
      floating: true
    }
  },
  {
    sku: 'cosmetic-spark-trail',
    name: 'Stardust Jump Trail',
    description: 'Leaves a shimmering wake of luminescent particles as you jump between platforms.',
    category: 'accessory',
    priceTokens: '20',
    metadata: {
      slot: 'trail',
      particleCount: 25,
      color: '#f59e0b'
    }
  },
  {
    sku: 'item-hint-pack-3',
    name: 'Insight Hint Pack (x3)',
    description: 'Unlocks 3 premium AI hints during difficult challenges.',
    category: 'hint',
    priceTokens: '5',
    metadata: {
      hintsCount: 3
    }
  }
];
