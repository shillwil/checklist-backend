# Deployment Guide

This guide provides instructions for deploying the Checklist Backend application to various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
  - [Railway](#railway)
  - [Docker](#docker)
- [Database Migration](#database-migration)
- [Firebase Configuration](#firebase-configuration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the application, ensure you have:

1. Node.js (v14 or higher)
2. PostgreSQL database
3. Firebase project with Authentication enabled
4. Firebase Admin SDK service account credentials

## Environment Variables

The application requires the following environment variables:

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/checklist_db

# Firebase
FIREBASE_SERVICE_ACCOUNT={"your-firebase-service-account-json"}
# OR
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account-file.json

# Server
PORT=3000
NODE_ENV=development|production
```

## Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd checklist-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the required environment variables.

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The server will be available at http://localhost:3000 (or the port specified in your `.env` file).

## Production Deployment

### Railway

[Railway](https://railway.app/) is a modern deployment platform that makes it easy to deploy your applications with minimal configuration.

1. Create a Railway account and install the Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Initialize your project:
   ```bash
   railway init
   ```

4. Provision a PostgreSQL database:
   ```bash
   railway add
   ```
   Select PostgreSQL from the list of plugins.

5. Set up environment variables in the Railway dashboard:
   - `NODE_ENV`: production
   - `FIREBASE_SERVICE_ACCOUNT`: Your Firebase service account JSON

6. Deploy your application:
   ```bash
   railway up
   ```

7. Run database migrations:
   ```bash
   railway run npm run db:migrate
   ```

8. Open your deployed application:
   ```bash
   railway open
   ```

Railway automatically assigns a domain to your application and handles SSL certificates. You can configure a custom domain in the Railway dashboard.

### Docker

1. Create a `Dockerfile` in the project root:

```Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

2. Create a `.dockerignore` file:

```
node_modules
npm-debug.log
.env
.git
```

3. Build the Docker image:
   ```bash
   docker build -t checklist-backend .
   ```

4. Run the container:
   ```bash
   docker run -p 3000:3000 \
     -e NODE_ENV=production \
     -e DATABASE_URL=your-database-url \
     -e FIREBASE_SERVICE_ACCOUNT='{"your-firebase-service-account-json"}' \
     checklist-backend
   ```

## Database Migration

Before running the application in any environment, ensure you run the database migrations:

```bash
npm run db:migrate
```

For production environments, you may want to create a separate migration script that doesn't use `tsx` directly:

```json
{
  "scripts": {
    "db:migrate:prod": "node dist/db/migrate.js"
  }
}
```

## Firebase Configuration

### Obtaining Firebase Admin SDK Credentials

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Project Settings > Service accounts
4. Click "Generate new private key"
5. Save the JSON file securely

### Setting Up Firebase Authentication

1. In the Firebase Console, go to Authentication > Sign-in method
2. Enable the authentication methods you want to use (Email/Password, Google, etc.)
3. Configure the authorized domains for your application

### Security Rules

Ensure your Firebase security rules are properly configured to secure your data:

```
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Verify your `DATABASE_URL` is correct
2. Ensure the database server is running and accessible
3. Check if your IP is allowed in the database firewall rules
4. Verify the database user has the necessary permissions

### Firebase Authentication Issues

If Firebase authentication is not working:

1. Verify your `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_SERVICE_ACCOUNT_PATH` is correct
2. Check if the Firebase project has Authentication enabled
3. Ensure the service account has the necessary permissions
4. Verify the client is sending the correct ID token

### Application Crashes

If the application crashes on startup:

1. Check the logs for error messages
2. Verify all required environment variables are set
3. Ensure the database migrations have been run
4. Check if the port is already in use by another application
