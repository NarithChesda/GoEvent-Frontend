# Authentication API Documentation

## Overview

This document provides comprehensive documentation for the GoEvent authentication API. The API uses JWT (JSON Web Tokens) for authentication with support for both email/password login and Google OAuth integration.

**Base URL:** `http://localhost:8000/api/auth/`

---

## Authentication Flow

### JWT Token System
- **Access Token**: 60-minute lifetime, used for API authentication
- **Refresh Token**: 1-day lifetime, used to obtain new access tokens
- **Token Rotation**: Refresh tokens are rotated on each refresh
- **Token Blacklisting**: Tokens are blacklisted on logout and rotation

### Headers
All authenticated requests must include:
```
Authorization: Bearer <access_token>
```

---

## API Endpoints

### 1. User Registration

**POST** `/api/auth/register/`

Register a new user account.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "password_confirm": "securepassword123",
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe"  // Optional, auto-generated if not provided
}
```

#### Response
**Success (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture": null,
    "bio": "",
    "date_joined": "2025-01-15T10:00:00Z"
  },
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error (400 Bad Request):**
```json
{
  "email": ["A user with this email already exists."],
  "password": ["Password must be at least 8 characters long."],
  "password_confirm": ["Passwords do not match."]
}
```

#### Validation Rules
- **Email**: Must be valid email format and unique
- **Password**: Minimum 8 characters, cannot be too common
- **Username**: Optional, auto-generated from email if not provided
- **First Name**: Optional but recommended
- **Last Name**: Optional but recommended

---

### 2. User Login

**POST** `/api/auth/login/`

Authenticate user and receive JWT tokens.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Response
**Success (200 OK):**
```json
{
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture": "http://localhost:8000/media/profile_pictures/user1.jpg",
    "bio": "Software developer and event enthusiast"
  }
}
```

**Error (401 Unauthorized):**
```json
{
  "detail": "Invalid email or password."
}
```

**Error (400 Bad Request):**
```json
{
  "email": ["This field is required."],
  "password": ["This field is required."]
}
```

---

### 3. Token Refresh

**POST** `/api/auth/token/refresh/`

Get new access token using refresh token.

#### Request Body
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response
**Success (200 OK):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (401 Unauthorized):**
```json
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
```

---

### 4. User Logout

**POST** `/api/auth/logout/`

Logout user and blacklist refresh token.

**Authentication Required:** Yes

#### Request Body
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response
**Success (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Refresh token is required"
}
```

**Error (401 Unauthorized):**
```json
{
  "error": "Invalid or expired refresh token"
}
```

---

### 5. User Profile

**GET** `/api/auth/user/`

Get current user profile information.

**Authentication Required:** Yes

#### Response
**Success (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "profile_picture": "http://localhost:8000/media/profile_pictures/user1.jpg",
  "bio": "Software developer and event enthusiast",
  "date_joined": "2025-01-15T10:00:00Z"
}
```

---

### 6. Update Profile

**PUT/PATCH** `/api/auth/user/`

Update current user profile.

**Authentication Required:** Yes

#### Request Body (multipart/form-data for profile picture)
```json
{
  "first_name": "John Updated",
  "last_name": "Doe Updated",
  "bio": "Updated bio text",
  "profile_picture": "<file_upload>"  // Optional file upload
}
```

#### Response
**Success (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "first_name": "John Updated",
  "last_name": "Doe Updated",
  "profile_picture": "http://localhost:8000/media/profile_pictures/user1_updated.jpg",
  "bio": "Updated bio text",
  "date_joined": "2025-01-15T10:00:00Z"
}
```

**Error (400 Bad Request):**
```json
{
  "profile_picture": ["File size too large. Maximum size is 5MB."]
}
```

---

### 7. Change Password

**POST** `/api/auth/change-password/`

Change user password.

**Authentication Required:** Yes

#### Request Body
```json
{
  "old_password": "currentpassword123",
  "new_password": "newsecurepassword456",
  "confirm_password": "newsecurepassword456"
}
```

#### Response
**Success (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Error (400 Bad Request):**
```json
{
  "old_password": ["Current password is incorrect."],
  "new_password": ["Password must be at least 8 characters long."],
  "confirm_password": ["Passwords do not match."]
}
```

---

### 8. Google OAuth Login

**POST** `/api/auth/google/`

Authenticate using Google OAuth.

#### Request Body
```json
{
  "access_token": "google_oauth_access_token_here"
}
```

#### Response
**Success (200 OK):**
```json
{
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "username": "user_gmail_com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture": "http://localhost:8000/media/profile_pictures/google_user1.jpg",
    "bio": ""
  },
  "is_new_user": false
}
```

**Error (400 Bad Request):**
```json
{
  "non_field_errors": ["Invalid Google access token."]
}
```

---

## Error Handling

### Standard Error Responses

#### 400 Bad Request
Validation errors or malformed requests.
```json
{
  "field_name": ["Error message for this field."],
  "non_field_errors": ["General error message."]
}
```

#### 401 Unauthorized
Authentication required or invalid credentials.
```json
{
  "detail": "Authentication credentials were not provided."
}
```

#### 403 Forbidden
Permission denied.
```json
{
  "detail": "You do not have permission to perform this action."
}
```

#### 404 Not Found
Resource not found.
```json
{
  "detail": "Not found."
}
```

#### 429 Too Many Requests
Rate limit exceeded.
```json
{
  "detail": "Request was throttled. Expected available in 60 seconds."
}
```

#### 500 Internal Server Error
Server error.
```json
{
  "detail": "A server error occurred."
}
```

---

## Security Considerations

### Password Requirements
- Minimum 8 characters
- Cannot be entirely numeric
- Cannot be too common (checked against common password list)
- Cannot be too similar to user information

### File Upload Restrictions
- **Profile Pictures**: Maximum 5MB, JPEG/PNG/WebP only
- Images are automatically resized to 300x300 pixels
- Files are scanned for malicious content

### Rate Limiting
- **Login**: 5 attempts per minute per IP
- **Registration**: 3 attempts per minute per IP
- **Password Change**: 5 attempts per minute per user
- **General API**: 100 requests per minute per user

### Token Security
- Access tokens expire after 60 minutes
- Refresh tokens expire after 1 day
- Tokens are blacklisted on logout
- Refresh tokens are rotated on each use

---

## Frontend Integration Examples

### JavaScript/TypeScript Example

```javascript
class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api/auth';
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        this.accessToken = data.tokens.access;
        this.refreshToken = data.tokens.refresh;
        localStorage.setItem('access_token', this.accessToken);
        localStorage.setItem('refresh_token', this.refreshToken);
        return { success: true, user: data.user };
      } else {
        return { success: false, errors: data };
      }
    } catch (error) {
      return { success: false, errors: { detail: 'Network error' } };
    }
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseURL}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });

      const data = await response.json();
      
      if (response.ok) {
        this.accessToken = data.access;
        this.refreshToken = data.refresh;
        localStorage.setItem('access_token', this.accessToken);
        localStorage.setItem('refresh_token', this.refreshToken);
        return true;
      } else {
        // Refresh token invalid, redirect to login
        this.logout();
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async apiCall(url, options = {}) {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      ...options.headers,
    };

    let response = await fetch(url, { ...options, headers });

    // If unauthorized, try refreshing token
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    return response;
  }

  async logout() {
    if (this.refreshToken) {
      try {
        await fetch(`${this.baseURL}/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({ refresh: this.refreshToken }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async updateProfile(formData) {
    try {
      const response = await this.apiCall(`${this.baseURL}/user/`, {
        method: 'PATCH',
        body: formData, // FormData for file uploads
      });

      const data = await response.json();
      return response.ok ? { success: true, user: data } : { success: false, errors: data };
    } catch (error) {
      return { success: false, errors: { detail: 'Network error' } };
    }
  }
}

// Usage example
const auth = new AuthService();

// Login
const loginResult = await auth.login('user@example.com', 'password123');
if (loginResult.success) {
  console.log('Logged in:', loginResult.user);
} else {
  console.log('Login failed:', loginResult.errors);
}

// Update profile with image
const formData = new FormData();
formData.append('first_name', 'John');
formData.append('profile_picture', fileInput.files[0]);

const updateResult = await auth.updateProfile(formData);
if (updateResult.success) {
  console.log('Profile updated:', updateResult.user);
}
```

### Vue.js/React Integration

```javascript
// Vue.js Composable
import { ref, computed } from 'vue';

export function useAuth() {
  const user = ref(null);
  const isAuthenticated = computed(() => !!user.value);
  const authService = new AuthService();

  const login = async (credentials) => {
    const result = await authService.login(credentials.email, credentials.password);
    if (result.success) {
      user.value = result.user;
    }
    return result;
  };

  const logout = async () => {
    await authService.logout();
    user.value = null;
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
}
```

---

## Testing

### API Testing with cURL

```bash
# Register new user
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "password_confirm": "testpassword123",
    "first_name": "Test",
    "last_name": "User"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'

# Get user profile (replace TOKEN with actual access token)
curl -X GET http://localhost:8000/api/auth/user/ \
  -H "Authorization: Bearer TOKEN"

# Update profile with file upload
curl -X PATCH http://localhost:8000/api/auth/user/ \
  -H "Authorization: Bearer TOKEN" \
  -F "first_name=Updated Name" \
  -F "profile_picture=@/path/to/image.jpg"

# Logout
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refresh": "REFRESH_TOKEN"}'
```

---

## Changelog

### Version 1.0.0 (Current)
- Initial API implementation
- JWT authentication with blacklisting
- Google OAuth integration
- Profile management with image uploads
- Password change functionality
- Comprehensive error handling

---

This documentation covers all authentication endpoints and provides complete integration examples for frontend applications. For any questions or issues, please refer to the project's issue tracker.