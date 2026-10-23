import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/index.js';
import { initDatabase } from './db/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { standardLimiter } from './middleware/rate-limiter.js';

import authRoutes from './routes/auth.routes.js';
import learningRoutes from './routes/learning.routes.js';
import aiRoutes from './routes/ai.routes.js';
import rewardsRoutes from './routes/rewards.routes.js';
import storeRoutes from './routes/store.routes.js';
import blockchainRoutes from './routes/blockchain.routes.js';
import { getTopics } from './controllers/learning.controller.js';

const app = express();

// Security and middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
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
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'LearnQuest API',
    version: '1.0.0',
    environment: config.env,
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
      console.log(`🤖 AI Provider: ${config.ai.provider} (Ollama model: ${config.ai.ollamaModel})`);
      console.log(`🏥 Health Check: http://localhost:${config.port}/health`);
      console.log(`========================================\n`);
    });
  });
}

export default app;
