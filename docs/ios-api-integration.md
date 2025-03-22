# SymptomSentryAI iOS-Backend Integration Guide

This document provides guidelines and best practices for integrating the iOS app with the SymptomSentryAI backend services.

## Table of Contents

1. [Authentication](#authentication)
2. [Image Analysis](#image-analysis)
3. [User Profile Management](#user-profile-management)
4. [Analysis History](#analysis-history)
5. [Subscription Management](#subscription-management)
6. [Error Handling](#error-handling)
7. [Performance Considerations](#performance-considerations)

## Authentication

### Registration

**Endpoint**: `/api/register`
**Method**: `POST`
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response**:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "subscription": "free",
    "analysisCount": 0,
    "lastResetDate": "2025-03-01T00:00:00.000Z"
  }
}
```

### Login

**Endpoint**: `/api/login`
**Method**: `POST`
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "subscription": "free",
    "analysisCount": 5,
    "lastResetDate": "2025-03-01T00:00:00.000Z"
  }
}
```

### Token Usage

All authenticated requests should include the JWT token in the Authorization header:

```
Authorization: Bearer jwt_token_here
```

## Image Analysis

### Analyze an Image

**Endpoint**: `/api/analyze`
**Method**: `POST`
**Content-Type**: `multipart/form-data`
**Authentication**: Optional (authenticated users get subscription benefits)

**Form Fields**:
- `type`: Either "throat" or "ear"
- `image`: Image file data

**Swift Example**:
```swift
func analyzeImage(_ image: UIImage, type: AnalysisType) -> AnyPublisher<AnalysisResponse, Error> {
    guard let imageData = image.jpegData(compressionQuality: 0.8) else {
        return Fail(error: NSError(domain: "MLAnalysisService", code: 1, 
                                  userInfo: [NSLocalizedDescriptionKey: "Failed to convert image to data"]))
            .eraseToAnyPublisher()
    }
    
    // Prepare the parameters
    let parameters = [
        "type": type.rawValue
    ]
    
    return networkService.uploadImage(imageData, to: "/api/analyze", parameters: parameters)
        .decode(type: AnalysisAPIResponse.self, decoder: JSONDecoder())
        .tryMap { apiResponse -> AnalysisResponse in
            guard let analysisResponse = apiResponse.toAnalysisResponse() else {
                throw NSError(
                    domain: "MLAnalysisService",
                    code: 2,
                    userInfo: [NSLocalizedDescriptionKey: apiResponse.message ?? "Analysis failed"]
                )
            }
            return analysisResponse
        }
        .eraseToAnyPublisher()
}
```

**Response**:
```json
{
  "id": "analysis_uuid",
  "type": "throat",
  "timestamp": "2025-03-22T12:34:56.789Z",
  "conditions": [
    {
      "id": "strep_throat",
      "name": "Strep Throat",
      "confidence": 0.78,
      "description": "A bacterial infection that causes inflammation and pain in the throat.",
      "symptoms": [
        "Throat pain that comes on quickly",
        "Red and swollen tonsils",
        "White patches on the tonsils",
        "Tiny red spots on the roof of the mouth",
        "Fever"
      ],
      "isPotentiallySerious": true,
      "recommendConsultation": true,
      "treatmentInfo": "Usually requires antibiotics if bacterial in origin."
    },
    {
      "id": "tonsillitis",
      "name": "Tonsillitis",
      "confidence": 0.65,
      "description": "Inflammation of the tonsils, typically caused by viral or bacterial infection.",
      "symptoms": [
        "Red, swollen tonsils",
        "White or yellow coating on tonsils",
        "Sore throat",
        "Painful swallowing",
        "Fever"
      ],
      "isPotentiallySerious": false,
      "recommendConsultation": true,
      "treatmentInfo": "May require antibiotics if bacterial; otherwise symptom management."
    }
  ],
  "user": "user_uuid_if_authenticated",
  "debug_info": {
    "data_source": "multipart_form",
    "image_data_length": 12345,
    "processing_time": 1234
  }
}
```

### Save Analysis Result

**Endpoint**: `/api/analyses/save`
**Method**: `POST`
**Content-Type**: `application/json`
**Authentication**: Required

**Request Body**:
```json
{
  "id": "analysis_uuid",
  "type": "throat",
  "conditions": [
    {
      "id": "strep_throat",
      "name": "Strep Throat",
      "confidence": 0.78,
      "description": "A bacterial infection that causes inflammation and pain in the throat.",
      "symptoms": [
        "Throat pain",
        "Red and swollen tonsils"
      ],
      "isPotentiallySerious": true
    }
  ]
}
```

**Response**:
```json
{
  "message": "Analysis saved successfully",
  "analysis": {
    "id": "analysis_uuid",
    "user_id": "user_uuid",
    "type": "throat",
    "conditions": [...],
    "image_url": null,
    "created_at": "2025-03-22T12:34:56.789Z"
  },
  "subscription": {
    "subscription": "free",
    "analysisCount": 6,
    "analysisLimit": 5,
    "analysisRemaining": 0,
    "lastResetDate": "2025-03-01T00:00:00.000Z"
  }
}
```

## User Profile Management

### Get User Profile

**Endpoint**: `/api/user-profile`
**Method**: `GET`
**Authentication**: Required

**Response**:
```json
{
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "subscription": "free",
    "analysisCount": 5,
    "lastResetDate": "2025-03-01T00:00:00.000Z"
  }
}
```

### Update User Profile

**Endpoint**: `/api/update-profile`
**Method**: `PUT`
**Content-Type**: `application/json`
**Authentication**: Required

**Request Body**:
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

**Response**:
```json
{
  "user": {
    "id": "user_uuid",
    "email": "john.smith@example.com",
    "name": "John Smith",
    "subscription": "free",
    "analysisCount": 5,
    "lastResetDate": "2025-03-01T00:00:00.000Z"
  }
}
```

## Analysis History

### Get Analysis History

**Endpoint**: `/api/analyses`
**Method**: `GET`
**Authentication**: Required

**Response**:
```json
{
  "analyses": [
    {
      "id": "analysis_uuid1",
      "type": "throat",
      "conditions": [...],
      "created_at": "2025-03-22T12:34:56.789Z"
    },
    {
      "id": "analysis_uuid2",
      "type": "ear",
      "conditions": [...],
      "created_at": "2025-03-20T10:11:12.134Z"
    }
  ]
}
```

### Delete Analysis

**Endpoint**: `/api/analyses/:id`
**Method**: `DELETE`
**Authentication**: Required

**Response**:
```json
{
  "message": "Analysis deleted successfully"
}
```

## Subscription Management

### Update Subscription

**Endpoint**: `/api/update-subscription`
**Method**: `POST`
**Content-Type**: `application/json`
**Authentication**: Required

**Request Body**:
```json
{
  "subscription": "premium",
  "paymentToken": "payment_provider_token"
}
```

**Response**:
```json
{
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "subscription": "premium",
    "analysisCount": 5,
    "lastResetDate": "2025-03-01T00:00:00.000Z"
  }
}
```

## Error Handling

The API uses consistent error responses with the following structure:

```json
{
  "error": true,
  "message": "Human-readable error message",
  "details": "Additional error details (development mode only)",
  "code": "ERROR_CODE" 
}
```

Common error codes:
- `INVALID_CREDENTIALS`: Invalid email or password
- `ANALYSIS_LIMIT_EXCEEDED`: User has reached their monthly analysis limit
- `INVALID_IMAGE_FORMAT`: The uploaded image is in an unsupported format
- `SERVER_ERROR`: An internal server error occurred

## Performance Considerations

### Image Optimization

- Resize images to 224x224 pixels before uploading
- Use JPEG format with ~80% compression
- Typical image size should be under 200KB

### Network Resilience

- Implement retry logic for network failures
- Cache analysis results locally for offline viewing
- Implement proper cancellation of in-flight requests

### Memory Management

- Dispose of image resources after upload
- Use Combine's cancellation to prevent memory leaks
- Do not store large images in memory