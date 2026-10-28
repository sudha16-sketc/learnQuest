import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/index.js';
import { initDatabase, getDb } from './db/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { standardLimiter } from './middleware/rate-limiter.js';

import authRoutes from './routes/auth.routes.js';
import learningRoutes from './routes/learning.routes.js';
import aiRoutes from './routes/ai.routes.js';
import rewardsRoutes from './routes/rewards.routes.js';
import storeRoutes from './routes/store.routes.js';
import blockchainRoutes from './routes/blockchain.routes.js';
import achievementsRoutes from './routes/achievements.routes.js';
import sponsorsRoutes from './routes/sponsors.routes.js';
import { getTopics } from './controllers/learning.controller.js';
import { aiService } from './services/ai/index.js';

const app = express();

// Security and middleware
app.use(helmet());
const allowedOrigins = config.corsOrigin === '*'
  ? true
  : config.corsOrigin.split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Global rate limiting
app.use('/api', standardLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  const { isPrismaConnected } = getDb();
  const ai = aiService.getStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'LearnQuest API',
    version: '1.0.0',
    environment: config.env,
    database: {
      mode: isPrismaConnected ? 'postgresql' : 'in-memory',
      connected: isPrismaConnected
    },
    ai: {
      provider: ai.provider,
      model: ai.model,
      configured: ai.configured,
      active: ai.active,
      fallback: ai.fallback,
      lastErrorCode: ai.lastError?.code || null
    },
    mstNetwork: config.blockchain.networkName,
    chainId: config.blockchain.chainId
  });
});

// Mount API groups
app.get('/api/topics', getTopics);
app.use('/api/auth', authRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/sponsors', sponsorsRoutes);

// Error handler
app.use(errorHandler);

// Start server
const isRunningTests = process.env.NODE_ENV === 'test' || process.argv.some(a => a.includes('test'));
if (!isRunningTests) {
  initDatabase().then(() => {
    app.listen(config.port, () => {
      console.log(`\n========================================`);
      console.log(`🚀 LearnQuest API Server running on port ${config.port}`);
      console.log(`📡 MST Network: ${config.blockchain.networkName} (Chain ID: ${config.blockchain.chainId})`);
      const ai = aiService.getStatus();
      console.log(`🤖 AI Provider: ${ai.provider} (Gemini model: ${ai.model}, configured: ${ai.configured})`);
      if (!ai.configured) {
        console.warn('⚠️  GEMINI_API_KEY is not configured. AI endpoints will serve the curated curriculum fallback.');
      }
      console.log(`🏥 Health Check: http://localhost:${config.port}/health`);
      console.log(`========================================\n`);
    });
  });
}

export default app;
