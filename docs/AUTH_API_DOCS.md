# Authentication API Documentation

This document provides comprehensive documentation for the GoEvent authentication system, including traditional email/password authentication and Google OAuth integration.

## Table of Contents
- [Overview](#overview)
- [Authentication Methods](#authentication-methods)
- [API Endpoints](#api-endpoints)
- [JWT Token Management](#jwt-token-management)
- [Google OAuth Setup](#google-oauth-setup)
- [Frontend Integration Examples](#frontend-integration-examples)
- [Error Handling](#error-handling)

## Overview

The GoEvent authentication system uses JWT (JSON Web Tokens) for secure API authentication. It supports:
- Email/password registration and login
- Google OAuth authentication
- Profile management with profile pictures
- Token refresh mechanism

### Base URL
```
http://localhost:8000/api/auth/
```

### Authentication Header
All protected endpoints require the JWT access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Authentication Methods

### 1. Traditional Email/Password
Users can register with email and password, then login to receive JWT tokens.

### 2. Google OAuth
Users can authenticate using their Google account, which automatically creates a user profile if one doesn't exist.

## API Endpoints

### 1. User Registration
Create a new user account.

**Endpoint:** `POST /api/auth/register/`

**Request Body:**
```json
{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "securepassword123",
    "password2": "securepassword123",
    "first_name": "John",
    "last_name": "Doe"
}
```

**Response (201 Created):**
```json
{
    "message": "User registered successfully",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "username": "johndoe",
        "first_name": "John",
        "last_name": "Doe",
        "profile_picture": "/media/profile_pictures/default.jpg",
        "bio": "",
        "is_verified": false,
        "created_at": "2024-01-01T12:00:00Z"
    },
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 2. User Login
Authenticate with email and password.

**Endpoint:** `POST /api/auth/login/`

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
    "message": "Login successful",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "username": "johndoe",
        "first_name": "John",
        "last_name": "Doe",
        "profile_picture": "/media/profile_pictures/default.jpg",
        "bio": "",
        "is_verified": false,
        "created_at": "2024-01-01T12:00:00Z"
    },
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 3. Google OAuth Login
Authenticate using Google OAuth.

**Endpoint:** `POST /api/auth/google/login/`

**Request Body:**
```json
{
    "access_token": "google_id_token_here"
}
```

**Response (200 OK):**
```json
{
    "user": {
        "id": 2,
        "email": "user@gmail.com",
        "username": "user",
        "first_name": "John",
        "last_name": "Doe",
        "profile_picture": "/media/profile_pictures/google_profile.jpg",
        "bio": "",
        "is_verified": true,
        "created_at": "2024-01-01T12:00:00Z"
    },
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 4. User Profile
Get or update the authenticated user's profile.

**Get Profile**
**Endpoint:** `GET /api/auth/profile/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture": "/media/profile_pictures/user_pic.jpg",
    "bio": "Software developer interested in events",
    "is_verified": true,
    "created_at": "2024-01-01T12:00:00Z"
}
```

**Update Profile**
**Endpoint:** `PUT /api/auth/profile/`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body (form-data):**
```
first_name: John
last_name: Doe
bio: Updated bio
profile_picture: [file]
```

**Response (200 OK):**
```json
{
    "message": "Profile updated successfully",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "username": "johndoe",
        "first_name": "John",
        "last_name": "Doe",
        "profile_picture": "/media/profile_pictures/new_pic.jpg",
        "bio": "Updated bio",
        "is_verified": true,
        "created_at": "2024-01-01T12:00:00Z"
    }
}
```

### 5. Change Password
Change the authenticated user's password.

**Endpoint:** `POST /api/auth/change-password/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
    "old_password": "currentpassword123",
    "new_password": "newsecurepassword123",
    "new_password2": "newsecurepassword123"
}
```

**Response (200 OK):**
```json
{
    "message": "Password changed successfully"
}
```

### 6. Logout
Blacklist the refresh token to logout.

**Endpoint:** `POST /api/auth/logout/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
    "message": "Logout successful"
}
```

### 7. Token Refresh
Get a new access token using the refresh token.

**Endpoint:** `POST /api/auth/token/refresh/`

**Request Body:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 8. Token Verify
Verify if an access token is valid.

**Endpoint:** `POST /api/auth/token/verify/`

**Request Body:**
```json
{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{}
```

## JWT Token Management

### Token Lifetimes
- **Access Token:** 60 minutes
- **Refresh Token:** 1 day

### Token Storage (Frontend)
```javascript
// Store tokens securely
localStorage.setItem('access_token', data.access);
localStorage.setItem('refresh_token', data.refresh);

// Use in API requests
const response = await fetch('http://localhost:8000/api/events/', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    }
});
```

### Automatic Token Refresh
```javascript
// Axios interceptor example
axios.interceptors.response.use(
    response => response,
    async error => {
        if (error.response?.status === 401) {
            const refreshToken = localStorage.getItem('refresh_token');
            try {
                const response = await axios.post('/api/auth/token/refresh/', {
                    refresh: refreshToken
                });
                localStorage.setItem('access_token', response.data.access);
                // Retry original request
                error.config.headers.Authorization = `Bearer ${response.data.access}`;
                return axios.request(error.config);
            } catch (refreshError) {
                // Redirect to login
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
```

## Google OAuth Setup

### Backend Configuration

1. **Install required packages** (already included):
   ```bash
   pip install django-allauth dj-rest-auth[with_social]
   ```

2. **Google Cloud Console Setup:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized JavaScript origins:
     - `http://localhost:3000` (Vue frontend)
     - `http://localhost:8000` (Django backend)
   - Add authorized redirect URIs:
     - `http://localhost:8000/accounts/google/login/callback/`

3. **Django Admin Configuration:**
   - Go to http://localhost:8000/admin/
   - Navigate to Sites → Sites
   - Update domain to `localhost:8000`
   - Go to Social Applications → Add
   - Provider: Google
   - Name: Google OAuth
   - Client ID: Your Google Client ID
   - Secret Key: Your Google Client Secret
   - Sites: Select your site

### Frontend Integration (Vue.js)

#### Option 1: Using Google Identity Services

```vue
<template>
  <div>
    <div id="googleSignInButton"></div>
    <!-- OR custom button -->
    <button @click="handleGoogleLogin" class="google-login-btn">
      <img src="/google-icon.svg" alt="Google" />
      Sign in with Google
    </button>
  </div>
</template>

<script>
export default {
  mounted() {
    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: '671277865303-d7pcuvm6tg2pkq8ee3ffkc18en29u5sd.apps.googleusercontent.com',
        callback: this.handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      
      // Render Google's button (optional)
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInButton"),
        { 
          theme: "outline", 
          size: "large",
          width: 250,
          text: "signin_with",
          shape: "rectangular"
        }
      );
    };
  },
  
  methods: {
    handleGoogleLogin() {
      // Programmatically trigger Google One Tap
      window.google.accounts.id.prompt();
    },
    
    async handleCredentialResponse(response) {
      try {
        const res = await fetch('http://localhost:8000/api/auth/google/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: response.credential
          })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          // Store tokens
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh);
          
          // Store user data (if using Vuex/Pinia)
          this.$store.commit('auth/setUser', data.user);
          this.$store.commit('auth/setTokens', {
            access: data.access,
            refresh: data.refresh
          });
          
          // Show success message
          this.$toast.success('Successfully signed in with Google!');
          
          // Redirect to dashboard
          this.$router.push('/dashboard');
        } else {
          this.$toast.error('Google sign-in failed');
        }
      } catch (error) {
        console.error('Google login error:', error);
        this.$toast.error('An error occurred during sign-in');
      }
    }
  }
}
</script>

<style scoped>
.google-login-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  background: white;
  color: #3c4043;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.google-login-btn:hover {
  background: #f8f9fa;
  box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3);
}

.google-login-btn img {
  width: 18px;
  height: 18px;
}
</style>
```

#### Option 2: Using vue3-google-login Package

```bash
npm install vue3-google-login
```

```javascript
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import vue3GoogleLogin from 'vue3-google-login'

const app = createApp(App)

app.use(vue3GoogleLogin, {
  clientId: '671277865303-d7pcuvm6tg2pkq8ee3ffkc18en29u5sd.apps.googleusercontent.com'
})

app.mount('#app')
```

```vue
<template>
  <GoogleLogin :callback="callback" :error="onError">
    <template #default="{ isReady }">
      <button :disabled="!isReady" class="google-login-btn">
        Sign in with Google
      </button>
    </template>
  </GoogleLogin>
</template>

<script>
import { GoogleLogin } from 'vue3-google-login'

export default {
  components: { GoogleLogin },
  
  methods: {
    async callback(response) {
      try {
        const res = await this.$http.post('/api/auth/google/login/', {
          access_token: response.credential
        });
        
        // Handle successful login
        this.$store.dispatch('auth/googleLogin', res.data);
        this.$router.push('/dashboard');
      } catch (error) {
        console.error('Google login failed:', error);
      }
    },
    
    onError() {
      console.error('Google Login Failed');
    }
  }
}
</script>
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
    "error": "Invalid credentials",
    "field_errors": {
        "email": ["This field is required."],
        "password": ["This field is required."]
    }
}
```

**401 Unauthorized:**
```json
{
    "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden:**
```json
{
    "detail": "You do not have permission to perform this action."
}
```

### Frontend Error Handling Example

```javascript
// Vue.js error handling
async login(credentials) {
  try {
    const response = await this.$http.post('/api/auth/login/', credentials);
    // Handle success
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          // Handle validation errors
          if (error.response.data.field_errors) {
            Object.entries(error.response.data.field_errors).forEach(([field, errors]) => {
              this.errors[field] = errors[0];
            });
          } else {
            this.$toast.error(error.response.data.error || 'Invalid request');
          }
          break;
        case 401:
          this.$toast.error('Invalid email or password');
          break;
        case 500:
          this.$toast.error('Server error. Please try again later.');
          break;
        default:
          this.$toast.error('An unexpected error occurred');
      }
    } else {
      this.$toast.error('Network error. Please check your connection.');
    }
  }
}
```

## Security Best Practices

1. **Token Storage:**
   - Store tokens in httpOnly cookies for better security (requires backend changes)
   - If using localStorage, ensure tokens are removed on logout
   - Never store tokens in plain cookies or sessionStorage

2. **HTTPS in Production:**
   - Always use HTTPS in production
   - Update CORS settings to only allow your production domain

3. **Token Expiration:**
   - Implement automatic token refresh before expiration
   - Force re-authentication for sensitive operations

4. **Google OAuth:**
   - Keep client secret secure (never expose in frontend)
   - Validate all tokens on the backend
   - Use state parameter to prevent CSRF attacks

## Testing

### Using cURL

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpass123",
    "password2": "testpass123"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'

# Get Profile (replace TOKEN with actual token)
curl -X GET http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables for tokens
3. Use the token in the Authorization tab (Bearer Token)

## Troubleshooting

### Common Issues

1. **"Invalid token" error:**
   - Check if token has expired
   - Ensure correct token format in header
   - Verify token hasn't been blacklisted

2. **Google OAuth not working:**
   - Verify client ID and secret are correct
   - Check authorized origins and redirect URIs
   - Ensure site domain is correctly set in Django admin

3. **CORS errors:**
   - Add frontend URL to CORS_ALLOWED_ORIGINS
   - Check if CORS middleware is properly configured

4. **Profile picture upload fails:**
   - Ensure MEDIA_ROOT directory exists
   - Check file size limits
   - Verify image format is supported (JPEG, PNG)

For more help, check the Django logs or contact the development team.