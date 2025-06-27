import express from 'express';
import cors from 'cors';
import config from './config';
import logger from './lib/logger';
import authRoutes from './routes/auth';
import checklistRoutes from './routes/checklist';

const app = express();

// Environment-aware CORS
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}));

app.use(express.json());

// Enhanced health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    firebase_project: config.firebase.projectId,
  });
});

// Routes
logger.info('Registering auth routes at /api/auth');
app.use('/api/auth', authRoutes);
logger.info('Registering checklist routes at /api/checklist');
app.use('/api/checklist', checklistRoutes);

app.listen(config.port, () => {
  logger.info(`🚀 Server running on port ${config.port} (${config.nodeEnv})`);
  logger.info(`🔥 Firebase project: ${config.firebase.projectId}`);
});