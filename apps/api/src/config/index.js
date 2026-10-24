import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root env files. Local values take precedence over shared defaults.
const rootDir = path.resolve(__dirname, '../../../..');
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(rootDir, '.env.local'), override: true });

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
    rewardSignerPrivateKey: process.env.REWARD_SIGNER_PRIVATE_KEY || '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
    tokenAddress: process.env.MST_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    rewardsAddress: process.env.MST_REWARDS_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    storeAddress: process.env.MST_STORE_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    achievementsAddress: process.env.MST_ACHIEVEMENTS_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    treasuryAddress: process.env.MST_TREASURY_ADDRESS || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  }
};
