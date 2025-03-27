# Analysis History API Documentation

## Overview

The Analysis History API provides endpoints for retrieving, managing, and interacting with a user's previous analyses. This document outlines the available endpoints, their parameters, and expected responses.

## Authentication

All Analysis History API endpoints require authentication. Include a valid JWT token in the Authorization header using the Bearer scheme:

```
Authorization: Bearer <your_token>
```

## Endpoints

### Get Analysis History

Retrieves a paginated list of analysis records for the authenticated user.

**Endpoint:** `GET /api/analysis-history`

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of records per page (default: 10)
- `sort` (optional): Sort order, one of: "newest" (default), "oldest", "type"

**Success Response:**
```json
{
  "analyses": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "type": "throat",
      "created_at": "2025-03-25T14:30:00Z",
      "conditions": [
        {
          "id": "strep_throat",
          "name": "Strep Throat",
          "confidence": 0.78,
          "description": "A bacterial infection that causes inflammation and pain in the throat.",
          "symptoms": ["Throat pain", "Red and swollen tonsils"],
          "isPotentiallySerious": true
        },
        {
          "id": "tonsillitis",
          "name": "Tonsillitis",
          "confidence": 0.65,
          "description": "Inflammation of the tonsils, typically due to viral or bacterial infection.",
          "symptoms": ["Sore throat", "Difficulty swallowing", "Fever"],
          "isPotentiallySerious": false
        }
      ]
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `500 Internal Server Error`: Server-side error

### Get Analysis by ID

Retrieves a specific analysis by its ID.

**Endpoint:** `GET /api/analysis/:id`

**URL Parameters:**
- `id`: The unique identifier of the analysis to retrieve

**Success Response:**
```json
{
  "analysis": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "type": "throat",
    "created_at": "2025-03-25T14:30:00Z",
    "conditions": [
      {
        "id": "strep_throat",
        "name": "Strep Throat",
        "confidence": 0.78,
        "description": "A bacterial infection that causes inflammation and pain in the throat.",
        "symptoms": ["Throat pain", "Red and swollen tonsils"],
        "isPotentiallySerious": true
      },
      {
        "id": "tonsillitis",
        "name": "Tonsillitis",
        "confidence": 0.65,
        "description": "Inflammation of the tonsils, typically due to viral or bacterial infection.",
        "symptoms": ["Sore throat", "Difficulty swallowing", "Fever"],
        "isPotentiallySerious": false
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing analysis ID
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Attempt to access analysis belonging to another user
- `404 Not Found`: Analysis not found
- `500 Internal Server Error`: Server-side error

### Delete Analysis

Deletes a specific analysis by its ID.

**Endpoint:** `DELETE /api/analysis/:id`

**URL Parameters:**
- `id`: The unique identifier of the analysis to delete

**Success Response:**
```json
{
  "success": true,
  "message": "Analysis deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing analysis ID
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Attempt to delete analysis belonging to another user
- `404 Not Found`: Analysis not found
- `500 Internal Server Error`: Server-side error

### Clear All Analyses

Deletes all analyses for the authenticated user.

**Endpoint:** `POST /api/clear-analyses`

**Success Response:**
```json
{
  "success": true,
  "count": 5,
  "message": "All analyses cleared successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `500 Internal Server Error`: Server-side error

## Frontend Component Integration

The Analysis History component in the frontend application interfaces with these API endpoints to provide a user-friendly interface for viewing and managing analysis history.

### Component Features

- Displays date/time of analysis, analysis type, and top condition in a list
- Shows complete analysis details when a specific analysis is selected
- Provides delete and share options for each analysis
- Allows sorting with default to most recent first
- Displays a login prompt for unauthenticated users

For UI implementation details, refer to the [frontend documentation](./frontend-components.md).

## Testing

The Analysis History API endpoints are covered by comprehensive unit and integration tests located in the `/backend/tests` directory. These tests verify:

- Authentication and authorization requirements
- Proper retrieval of analysis data
- Secure access controls
- Error handling
- Database interactions

To run the tests:

```bash
cd backend
npm test
```

Or to run just the analysis-related tests:

```bash
cd backend
npx jest tests/imageAnalysis.test.js
```