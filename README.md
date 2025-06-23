# Checklist Backend

A RESTful API backend for managing checklist items with Firebase Authentication.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Database](#database)
- [Authentication](#authentication)
- [API Documentation](#api-documentation)
- [Development](#development)

## Overview

This backend service provides a RESTful API for managing checklist items. It uses Firebase for authentication and PostgreSQL for data storage with Drizzle ORM.

## Features

- User authentication via Firebase
- CRUD operations for checklist items
- Filtering, sorting, and pagination for checklist items
- User-specific data isolation

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL** - Database
- **Drizzle ORM** - Database ORM
- **Firebase Admin SDK** - Authentication
- **dotenv** - Environment variable management

## Project Structure

```
checklist-backend/
├── drizzle/             # Drizzle ORM migrations
├── src/
│   ├── db/              # Database configuration
│   │   ├── index.ts     # Database connection setup
│   │   ├── migrate.ts   # Database migration script
│   │   └── schema.ts    # Database schema definitions
│   ├── lib/
│   │   └── firebase-admin.ts  # Firebase Admin SDK setup
│   ├── middleware/
│   │   └── auth.ts      # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts      # Authentication routes
│   │   └── checklist.ts # Checklist CRUD routes
│   └── index.ts         # Main application entry point
├── .env                 # Environment variables
├── drizzle.config.ts    # Drizzle ORM configuration
├── package.json         # Project dependencies
└── tsconfig.json        # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Firebase project with Authentication enabled

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd checklist-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see [Environment Variables](#environment-variables))

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/checklist_db

# Firebase
FIREBASE_SERVICE_ACCOUNT={"your-firebase-service-account-json"}
# OR
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account-file.json

# Server
PORT=3000
NODE_ENV=development
```

## Database

The application uses PostgreSQL with Drizzle ORM. The schema includes:

### Users Table
- `id` - UUID primary key
- `firebase_uid` - Firebase user ID (unique)
- `name` - User's name
- `email` - User's email (unique)

### Checklist Items Table
- `id` - UUID primary key
- `userId` - Foreign key to users table
- `title` - Item title
- `description` - Item description (optional)
- `category` - Item category (optional)
- `completed` - Completion status (boolean)
- `dueDate` - Due date (optional)
- `priority` - Priority level (1-5, default: 3)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Authentication

Authentication is handled via Firebase. The application uses Firebase Admin SDK to verify ID tokens sent from the client.

1. Users authenticate with Firebase on the client side
2. The client sends the Firebase ID token in the Authorization header
3. The server verifies the token and identifies the user
4. New users are synced to the database via the `/api/auth/sync` endpoint

## API Documentation

### Authentication Endpoints

#### POST /api/auth/sync
Syncs a Firebase user with the database.

**Request:**
```json
{
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "name": "User Name"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "firebase_uid": "firebase-user-id",
    "name": "User Name",
    "email": "user@example.com"
  },
  "created": true
}
```

#### GET /api/auth/me
Gets the current authenticated user.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "firebase_uid": "firebase-user-id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

### Checklist Endpoints

#### GET /api/checklist
Gets paginated checklist items.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 30)
- `category` - Filter by category
- `search` - Search in title
- `sortField` - Field to sort by (default: priority)
- `sortDirection` - Sort direction (asc/desc, default: asc)

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "title": "Item title",
      "description": "Item description",
      "category": "Category",
      "completed": false,
      "dueDate": "2023-06-15T00:00:00.000Z",
      "priority": 3,
      "createdAt": "2023-06-01T00:00:00.000Z",
      "updatedAt": "2023-06-01T00:00:00.000Z"
    }
  ],
  "totalCount": 100,
  "currentPage": 1,
  "totalPages": 4
}
```

#### POST /api/checklist
Creates a new checklist item.

**Request:**
```json
{
  "title": "New item",
  "description": "Item description",
  "category": "Category",
  "dueDate": "2023-06-15T00:00:00.000Z",
  "priority": 2
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "title": "New item",
  "description": "Item description",
  "category": "Category",
  "completed": false,
  "dueDate": "2023-06-15T00:00:00.000Z",
  "priority": 2,
  "createdAt": "2023-06-01T00:00:00.000Z",
  "updatedAt": "2023-06-01T00:00:00.000Z"
}
```

#### PATCH /api/checklist/:id
Updates a checklist item.

**Request:**
```json
{
  "title": "Updated title",
  "completed": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "title": "Updated title",
  "description": "Item description",
  "category": "Category",
  "completed": true,
  "dueDate": "2023-06-15T00:00:00.000Z",
  "priority": 2,
  "createdAt": "2023-06-01T00:00:00.000Z",
  "updatedAt": "2023-06-02T00:00:00.000Z"
}
```

#### DELETE /api/checklist/:id
Deletes a checklist item.

**Response:**
```json
{
  "success": true
}
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build the TypeScript project
- `npm start` - Start the production server
- `npm run db:generate` - Generate Drizzle ORM migrations
- `npm run db:migrate` - Run database migrations