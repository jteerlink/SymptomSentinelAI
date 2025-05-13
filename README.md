# SymptomSentryAI

SymptomSentryAI is an advanced AI-powered healthcare application that provides intelligent medical insights through image analysis. This platform enables users to upload throat and ear images for instant analysis using state-of-the-art machine learning models.

![SymptomSentryAI Logo](generated-icon.png)

## Features

### Core Functionality

- **Binary Medical Image Classification**: Analyzes throat and ear images and classifies them as either "Normal" or "Infected/Abnormal" with confidence scores
- **Secure User Authentication**: Complete user registration, login, and profile management with HTTP-only cookies
- **Analysis History**: Stores and retrieves your past analyses for tracking health conditions over time
- **Detailed Health Insights**: Provides comprehensive information about potential conditions with treatment recommendations

### Technical Features

- **Enhanced ML Model Bridge**: Connects JavaScript frontend with Python-based TensorFlow models
- **Animated Medical Loading Spinner**: Visual feedback during analysis with medical-themed animations
- **Collapsible UI Components**: Dynamic interface that adapts to each stage of the analysis workflow
- **Comprehensive Security**: CSRF protection, rate limiting, and secure session management
- **Robust Error Handling**: Detailed error messages and graceful failure recovery across all functions

## Architecture

SymptomSentryAI is built using a modern web application stack:

### Frontend
- JavaScript with browser-compatible TensorFlow.js for client-side processing
- Responsive design with collapsible components for optimal user experience
- Real-time visualization of analysis results with attention maps

### Backend
- Node.js/Express server handling authentication, image processing, and API endpoints
- Advanced middleware for security, authentication, and request validation
- PostgreSQL database for user data and analysis history storage

### ML Components
- Python TensorFlow models for medical image analysis
- Support for multiple model types (ensemble, custom, version-specific)
- Binary classification system focusing on clear "Normal" vs "Infected" results

## Getting Started

### Prerequisites
- Node.js (v14+)
- Python 3.8+ with TensorFlow
- PostgreSQL database

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/symptom-sentry-ai.git
cd symptom-sentry-ai
```

2. Install dependencies:
```
npm install
```

3. Set up your environment variables in a `.env` file:
```
DATABASE_URL=postgresql://username:password@localhost:5432/symptom_sentry
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

4. Start the application:
```
npm start
```

The application will be available at http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user profile
- `POST /api/refresh-token` - Refresh authentication token

### Analysis
- `POST /analyze` - Analyze an image (throat or ear)
- `GET /api/analysis-history` - Get user's analysis history
- `GET /api/analysis/:id` - Get a specific analysis by ID
- `POST /api/save-analysis` - Save analysis results
- `DELETE /api/analysis/:id` - Delete a specific analysis

### User Management
- `PUT /api/user-profile` - Update user profile
- `PUT /api/update-password` - Update user password
- `PUT /api/update-subscription` - Update user subscription

## Security Features

SymptomSentryAI implements several security measures:

- **HTTP-only Cookies**: Authentication tokens stored in HTTP-only cookies to prevent XSS attacks
- **CSRF Protection**: Cross-Site Request Forgery protection with CSRF tokens
- **Rate Limiting**: API rate limiting to prevent brute force attacks
- **Secure Password Storage**: Passwords are hashed using scrypt/bcrypt
- **Input Validation**: Thorough validation of all user input
- **Session Management**: Proper session handling with timeout functionality

## Testing

The application includes comprehensive test suites:

- Backend API tests using Jest
- ML model tests using Python unittest
- Frontend integration tests

Run tests with:
```
node run-all-tests.js
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- TensorFlow and TensorFlow.js teams for the machine learning frameworks
- Express.js for the web framework
- Node.js community for the robust JavaScript runtime