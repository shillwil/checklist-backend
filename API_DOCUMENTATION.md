# Checklist API Documentation

This document provides detailed information about the Checklist API endpoints, request/response formats, and authentication requirements.

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:3000/api
```

For production, replace with your production domain.

## Authentication

### Overview

The API uses Firebase Authentication. Clients must include a Firebase ID token in the `Authorization` header of each request:

```
Authorization: Bearer <firebase-id-token>
```

### Getting a Firebase ID Token

1. Authenticate users with Firebase Authentication on the client side
2. Retrieve the ID token from the Firebase Auth user object
3. Include the token in API requests

### Error Responses

Authentication errors return the following status codes:

- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - User not found in database (needs to be synced)

Error response format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `INVALID_TOKEN` - The token is invalid
- `TOKEN_EXPIRED` - The token has expired
- `USER_NOT_SYNCED` - User exists in Firebase but not in the database

## Endpoints

### Authentication

#### POST /auth/sync

Syncs a Firebase user with the database. This endpoint should be called after Firebase sign-up or when a user is not found in the database.

**Request Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Request Body:**
```json
{
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "name": "User Name"  // Optional
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "firebase_uid": "firebase-user-id",
    "name": "User Name",
    "email": "user@example.com"
  },
  "created": true  // false if user already existed
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

#### GET /auth/me

Retrieves the current authenticated user's information.

**Request Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Response (200 OK):**
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

**Error Responses:**
- `401 Unauthorized` - Invalid token
- `404 Not Found` - User not found in database
- `500 Internal Server Error` - Server error

#### GET /auth/health

Health check endpoint for the authentication service.

**Response (200 OK):**
```json
{
  "status": "ok",
  "firebase": "connected"
}
```

### Checklist Items

#### GET /checklist

Retrieves a paginated list of checklist items for the authenticated user.

**Request Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 30)
- `category` (optional) - Filter by category
- `search` (optional) - Search in title
- `sortField` (optional) - Field to sort by (default: priority)
  - Valid values: id, title, category, completed, dueDate, priority, createdAt, updatedAt
- `sortDirection` (optional) - Sort direction (default: asc)
  - Valid values: asc, desc

**Response (200 OK):**
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
    // More items...
  ],
  "totalCount": 100,
  "currentPage": 1,
  "totalPages": 4
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

#### POST /checklist

Creates a new checklist item for the authenticated user.

**Request Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Request Body:**
```json
{
  "title": "New item",  // Required
  "description": "Item description",  // Optional
  "category": "Category",  // Optional
  "dueDate": "2023-06-15T00:00:00.000Z",  // Optional, ISO date string
  "priority": 2  // Optional, default: 3
}
```

**Response (200 OK):**
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

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

#### PATCH /checklist/:id

Updates an existing checklist item.

**Request Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**URL Parameters:**
- `id` - UUID of the checklist item to update

**Request Body:**
Any combination of the following fields:
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "category": "Updated category",
  "completed": true,
  "dueDate": "2023-06-20T00:00:00.000Z",
  "priority": 1
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "title": "Updated title",
  "description": "Updated description",
  "category": "Updated category",
  "completed": true,
  "dueDate": "2023-06-20T00:00:00.000Z",
  "priority": 1,
  "createdAt": "2023-06-01T00:00:00.000Z",
  "updatedAt": "2023-06-02T00:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Item not found or doesn't belong to user
- `500 Internal Server Error` - Server error

#### DELETE /checklist/:id

Deletes a checklist item.

**Request Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**URL Parameters:**
- `id` - UUID of the checklist item to delete

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Item not found or doesn't belong to user
- `500 Internal Server Error` - Server error

## Data Models

### User

```typescript
{
  id: string;            // UUID
  firebase_uid: string;  // Firebase user ID
  name: string;          // User's name
  email: string;         // User's email
}
```

### Checklist Item

```typescript
{
  id: string;            // UUID
  userId: string;        // UUID of the user who owns this item
  title: string;         // Item title
  description?: string;  // Optional description
  category?: string;     // Optional category
  completed: boolean;    // Completion status (default: false)
  dueDate?: Date;        // Optional due date
  priority: number;      // Priority level (1-5, default: 3)
  createdAt: Date;       // Creation timestamp
  updatedAt: Date;       // Last update timestamp
}
```

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "error": "Human-readable error message",
  "details": "Optional additional details",
  "code": "Optional error code for client-side handling"
}
```

Common HTTP status codes:
- `200 OK` - Request succeeded
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required or failed
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

The API currently does not implement rate limiting, but it may be added in the future.

## Versioning

The current API version is v1, which is implicit in the endpoints. Future versions will be explicitly versioned in the URL path (e.g., `/api/v2/checklist`).

## Development Notes

When testing the API locally:

1. Ensure you have set up Firebase Authentication in your client application
2. Use a tool like Postman or curl to test the API endpoints
3. Include the Firebase ID token in the Authorization header
4. For the `/auth/sync` endpoint, include the Firebase UID and email in the request body
