import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root env files. Local values take precedence over shared defaults.
const rootDir = path.resolve(__dirname, '../../../..');
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(rootDir, '.env.local'), override: true });

import { ethers } from 'ethers';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'learnquest_dev_secret_key_change_me',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/learnquest?schema=public',

  ai: {
    provider: (process.env.AI_PROVIDER || 'gemini').toLowerCase(),
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '20000', 10),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '2', 10),
    cacheTtlMs: parseInt(process.env.AI_CACHE_TTL_MS || '600000', 10),
    cacheMaxEntries: parseInt(process.env.AI_CACHE_MAX_ENTRIES || '200', 10)
  },

  blockchain: {
    networkName: process.env.MST_NETWORK_NAME || 'MST Testnet',
    chainId: parseInt(process.env.MST_CHAIN_ID || '91562037', 10),
    rpcUrl: process.env.MST_RPC_URL || 'https://testnetrpc.mstblockchain.com',
    explorerUrl: process.env.MST_EXPLORER_URL || 'https://testnet.mstscan.com',
    currencySymbol: process.env.MST_CURRENCY_SYMBOL || 'tMSTC',
    rewardSignerPrivateKey: process.env.REWARD_SIGNER_PRIVATE_KEY || '',
    tokenAddress: process.env.MST_TOKEN_ADDRESS || '0x51825657e00622B538B920551aE845F3f95faC95',
    rewardsAddress: process.env.MST_REWARDS_ADDRESS || '0xBA1969Ff27F0e2cBD443B817f9d4c7b7d8449314',
    storeAddress: process.env.MST_STORE_ADDRESS || '0xfF169521b09f77e7867B857511E79695C47348db',
    achievementsAddress: process.env.MST_ACHIEVEMENTS_ADDRESS || '0x14d2f7Ca4AD3725E384efD83DC0C598716b05B4C',
    treasuryAddress: process.env.MST_TREASURY_ADDRESS || '0x0E370085799a51a1e437D34F5385032B2fBCeAA9'
  }
};
