import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  firebase: {
    projectId: string;
    serviceAccount: string;
  };
  cors: {
    origins: string[];
  };
  logging: {
    level: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT!,
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;
