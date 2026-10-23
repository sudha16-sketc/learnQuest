import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';

let prisma;
let isPrismaConnected = false;

// Standalone memory storage for fallback development and instant testing
export const memoryStore = {
  users: new Map(),
  wallets: new Map(),
  topics: new Map(),
  sessions: new Map(),
  questionAttempts: new Map(),
  skillProgress: new Map(),
  xpEntries: new Map(),
  rewardEntitlements: new Map(),
  rewardClaims: new Map(),
  storeItems: new Map(),
  purchases: new Map(),
  accessoryUnlocks: new Map(),
  achievements: new Map(),
  blockchainTransactions: new Map(),
  idempotencyRecords: new Map()
};

export async function initDatabase() {
  try {
    prisma = new PrismaClient();
    await prisma.$connect();
    isPrismaConnected = true;
    console.log('[Database] Connected successfully to PostgreSQL via Prisma.');
  } catch (err) {
    console.warn('[Database] PostgreSQL connection not available. Operating with resilient in-memory local data store.');
    isPrismaConnected = false;
  }
}

export function getDb() {
  return {
    isPrismaConnected,
    prisma,
    memoryStore
  };
}
