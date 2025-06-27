import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

import config from '../config';
import logger from './logger';

let serviceAccount;
try {
  if (config.firebase.serviceAccount && config.firebase.serviceAccount !== 'undefined') {
    // Try to parse as JSON string first
    serviceAccount = JSON.parse(config.firebase.serviceAccount);
    logger.info('Using Firebase service account from environment variable');
  } else {
    // Fallback to file path for development
    const possiblePaths = [
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH_STAGING
    ].filter((path): path is string => path !== undefined);
    
    let serviceAccountPath = null;
    for (const filePath of possiblePaths) {
      if (fs.existsSync(path.resolve(filePath))) {
        serviceAccountPath = filePath;
        break;
      }
    }
    
    if (serviceAccountPath) {
      const rawData = fs.readFileSync(path.resolve(serviceAccountPath), 'utf8');
      serviceAccount = JSON.parse(rawData);
      logger.info(`Using Firebase service account from file: ${serviceAccountPath}`);
    } else {
      throw new Error('No Firebase service account found. Please set FIREBASE_SERVICE_ACCOUNT environment variable or place service account file in project root.');
    }
  }
} catch (error) {
  logger.error('Error loading Firebase service account:', error);
  throw new Error('Invalid Firebase service account configuration');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: config.firebase.projectId || serviceAccount.project_id,
  });
  logger.info(`Firebase Admin initialized for project: ${serviceAccount.project_id}`);
}

export const auth = admin.auth();