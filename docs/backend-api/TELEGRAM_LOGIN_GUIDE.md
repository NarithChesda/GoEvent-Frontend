# Telegram Login Implementation Guide

## Overview

Telegram Login Widget authentication for GoEvent platform - a simplified, production-ready implementation that works seamlessly in Telegram's in-app browser where traditional OAuth (Google) doesn't work.

---

## 🎯 Key Features

✅ **Minimal Database Fields**: Only 2 Telegram-specific fields (`telegram_id`, `telegram_auth_date`)
✅ **Reuses Existing Fields**: Populates standard user fields (`first_name`, `last_name`, `username`, `profile_picture`)
✅ **Frontend Friendly**: Same user object structure for all authentication methods
✅ **Secure**: HMAC-SHA256 verification per Telegram's official specs
✅ **Auto-verified**: Telegram users are automatically marked as verified
✅ **Profile Sync**: Downloads and saves Telegram profile pictures
✅ **JWT Compatible**: Returns standard JWT tokens like other auth methods
✅ **Backward Compatible**: Works alongside email/password and Google OAuth

---

## 📊 Database Schema

### Telegram-Specific Fields (Minimal)
```python
telegram_id = BigIntegerField(unique=True, null=True, db_index=True)
# Unique Telegram user ID - used to identify returning users

telegram_auth_date = DateTimeField(null=True, blank=True)
# Last Telegram authentication timestamp - for tracking/security
```

### Reused Standard Fields
```python
first_name         # ← Populated from Telegram
last_name          # ← Populated from Telegram
username           # ← Populated from Telegram
profile_picture    # ← Downloaded from Telegram photo URL
email              # ← Generated as telegram_{id}@telegram.user
is_verified        # ← Set to True for Telegram users
```

---

## 🔌 API Endpoint

**POST** `/api/auth/telegram/login/`

### Request Body
```json
{
  "id": "123456789",
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "photo_url": "https://t.me/i/userpic/320/...",
  "auth_date": "1696435200",
  "hash": "abc123..."
}
```

### Success Response (200)
```json
{
  "message": "Telegram login successful",
  "user": {
    "id": "uuid",
    "email": "telegram_123456789@telegram.user",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture": "/media/profile_pictures/telegram_123456789.jpg",
    "is_verified": true,
    "telegram_id": 123456789,
    "telegram_auth_date": "2025-10-04T12:00:00Z",
    "created_at": "2025-10-04T12:00:00Z",
    "updated_at": "2025-10-04T12:00:00Z"
  },
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Error Response (400)
```json
{
  "error": "Invalid Telegram authentication data. Please try again."
}
```

---

## 🚀 Setup Instructions

### 1. Create Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Note your bot username (e.g., `YourBot`)

### 2. Configure Bot Domain

1. Send `/setdomain` to @BotFather
2. Select your bot
3. Enter your domain:
   - Development: `localhost`
   - Production: `goevent.online` or your domain

### 3. Configure Django Backend

**Using Management Command (Recommended):**
```bash
python manage.py setup_telegram_login \
  --bot-token "YOUR_BOT_TOKEN" \
  --bot-username "your_bot_username"
```

**Manual Configuration:**

Add to `.env` file:
```bash
TELEGRAM_LOGIN_BOT_TOKEN=your-bot-token-here
TELEGRAM_LOGIN_BOT_USERNAME=your_bot_username
```

### 4. Restart Django Server

```bash
python manage.py runserver
```

### 5. Verify Setup

```bash
# Check configuration
python manage.py setup_telegram_login --show-config

# Test bot connection
python manage.py setup_telegram_login --test-connection

# Test full login flow
python test_simplified_telegram_login.py "YOUR_BOT_TOKEN"
```

---

## 🌐 Frontend Integration

### Option 1: Telegram Widget (Redirect)

Add to your HTML:
```html
<script async src="https://telegram.org/js/telegram-widget.js?22"
  data-telegram-login="YOUR_BOT_USERNAME"
  data-size="large"
  data-auth-url="https://api.goevent.online/api/auth/telegram/login/"
  data-request-access="write">
</script>
```

The widget redirects to your backend, which processes the auth and returns JWT tokens.

### Option 2: JavaScript Callback (Recommended for SPAs)

```html
<script async src="https://telegram.org/js/telegram-widget.js?22"
  data-telegram-login="YOUR_BOT_USERNAME"
  data-size="large"
  data-onauth="onTelegramAuth(user)"
  data-request-access="write">
</script>

<script>
function onTelegramAuth(user) {
  // Send to your backend
  fetch('https://api.goevent.online/api/auth/telegram/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  })
  .then(response => response.json())
  .then(data => {
    // Store JWT tokens
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);

    // User object is the same as email/Google login!
    console.log('User:', data.user);

    // Redirect to dashboard
    window.location.href = '/dashboard';
  })
  .catch(error => {
    console.error('Login failed:', error);
  });
}
</script>
```

### Option 3: React/Vue Component

```jsx
import React, { useEffect } from 'react';

function TelegramLogin({ onSuccess }) {
  useEffect(() => {
    // Load Telegram widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', 'YOUR_BOT_USERNAME');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    document.getElementById('telegram-login-container').appendChild(script);

    // Define callback
    window.onTelegramAuth = async (user) => {
      try {
        const response = await fetch('/api/auth/telegram/login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });

        const data = await response.json();

        // Store tokens
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);

        // Call success callback
        onSuccess(data.user);
      } catch (error) {
        console.error('Telegram login failed:', error);
      }
    };
  }, [onSuccess]);

  return <div id="telegram-login-container"></div>;
}

export default TelegramLogin;
```

---

## 🔐 Security Features

### 1. Hash Verification
Every request is verified using HMAC-SHA256:
```
data_check_string = sorted fields as key=value pairs
secret_key = SHA256(bot_token)
hash = HMAC-SHA256(data_check_string, secret_key)
```

### 2. Timestamp Validation
Authentication data older than 24 hours is automatically rejected to prevent replay attacks.

### 3. Bot Token Security
- Stored in environment variables only
- Never exposed to frontend
- Different tokens for dev/prod

### 4. Auto-verified Users
Telegram users are automatically marked as `is_verified=True` since Telegram handles phone verification.

### 5. Unusable Passwords
Telegram-only users have unusable passwords - they can only login via Telegram (no password breaches).

---

## 👤 User Flow

### New Telegram User
1. User clicks "Login with Telegram"
2. Telegram widget opens → user authorizes
3. Backend receives and verifies data
4. Creates new user:
   ```python
   User(
       username='johndoe',                    # From Telegram
       email='telegram_123456789@telegram.user',  # Generated
       first_name='John',                     # From Telegram
       last_name='Doe',                       # From Telegram
       telegram_id=123456789,                 # Telegram ID
       telegram_auth_date=now(),              # Timestamp
       is_verified=True,                      # Auto-verified
       password=unusable                      # Telegram-only login
   )
   ```
5. Downloads profile picture from Telegram
6. Returns JWT tokens

### Returning Telegram User
1. User authenticates with Telegram
2. Backend finds user by `telegram_id`
3. Updates user data:
   ```python
   user.first_name = 'John'           # Update from Telegram
   user.last_name = 'Doe'             # Update from Telegram
   user.telegram_auth_date = now()    # Update timestamp
   ```
4. Returns JWT tokens

---

## 🎨 Frontend Benefits

### Consistent User Object Structure

**Email/Password Login:**
```json
{
  "user": {
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe"
  }
}
```

**Google OAuth Login:**
```json
{
  "user": {
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe"
  }
}
```

**Telegram Login:**
```json
{
  "user": {
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "telegram_id": 123456789  // Optional: track auth method
  }
}
```

### Single Component for All Auth Methods

```jsx
function UserProfile({ user }) {
  // Same code works for ALL authentication methods!
  return (
    <div>
      <img src={user.profile_picture} alt={user.username} />
      <h1>{user.first_name} {user.last_name}</h1>
      <p>@{user.username}</p>

      {/* Optional: Show Telegram badge */}
      {user.telegram_id && <Badge>Telegram User</Badge>}
    </div>
  );
}
```

**No need for:**
```jsx
// ❌ DON'T NEED THIS
const firstName = user.telegram_first_name || user.first_name;
const lastName = user.telegram_last_name || user.last_name;
```

---

## 🧪 Testing

### Management Commands

```bash
# Show current configuration
python manage.py setup_telegram_login --show-config

# Test bot connection and hash verification
python manage.py setup_telegram_login --test-connection
```

### Test Script

```bash
# Test full login flow
python test_simplified_telegram_login.py "YOUR_BOT_TOKEN"
```

### Manual API Testing

```bash
# Test endpoint availability
curl -X OPTIONS http://localhost:8000/api/auth/telegram/login/

# Test with mock data (requires valid hash)
curl -X POST http://localhost:8000/api/auth/telegram/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123456789",
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "auth_date": "1696435200",
    "hash": "valid_hash_here"
  }'
```

---

## 🐛 Troubleshooting

### "Telegram login is not configured"
- Check `.env` has `TELEGRAM_LOGIN_BOT_TOKEN` and `TELEGRAM_LOGIN_BOT_USERNAME`
- Restart Django server: `python manage.py runserver`

### "Invalid Telegram authentication data"
- Verify bot token is correct
- Check bot domain is set in @BotFather (`/setdomain`)
- Ensure `auth_date` is not older than 24 hours

### Widget Not Displaying
- Check bot username is correct (without @)
- Verify domain is authorized in @BotFather
- For localhost, set domain to `localhost` in @BotFather
- Check browser console for JavaScript errors

### CORS Errors
- Ensure `CORS_ALLOWED_ORIGINS` includes your frontend domain
- Check `CORS_ALLOW_CREDENTIALS = True` if using cookies

---

## 🔧 Configuration Files

### Environment Variables (.env)

```bash
# Telegram Login Configuration
TELEGRAM_LOGIN_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_LOGIN_BOT_USERNAME=YourBotUsername
```

### Django Settings (goevent/settings/base.py)

```python
# Telegram Login Configuration
TELEGRAM_LOGIN_BOT_TOKEN = config('TELEGRAM_LOGIN_BOT_TOKEN', default='')
TELEGRAM_LOGIN_BOT_USERNAME = config('TELEGRAM_LOGIN_BOT_USERNAME', default='')
```

---

## 📁 File Structure

```
authentication/
├── models.py                 # CustomUser with telegram_id, telegram_auth_date
├── serializers.py            # TelegramLoginSerializer
├── views.py                  # TelegramLoginView
├── urls.py                   # /api/auth/telegram/login/
├── utils.py                  # verify_telegram_authentication()
└── management/
    └── commands/
        └── setup_telegram_login.py

test_simplified_telegram_login.py  # Test script
TELEGRAM_LOGIN_GUIDE.md            # This file
```

---

## 🚦 Development vs Production

### Development (localhost)

**.env:**
```bash
TELEGRAM_LOGIN_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_LOGIN_BOT_USERNAME=YourDevBot
```

**@BotFather:**
- Domain: `localhost`

### Production

**.env:**
```bash
TELEGRAM_LOGIN_BOT_TOKEN=987654321:ZYXwvuTSRqpONMlkjIHGfeDCBA
TELEGRAM_LOGIN_BOT_USERNAME=YourProdBot
```

**@BotFather:**
- Domain: `goevent.online` or your production domain

**Note:** Use separate bots for development and production!

---

## 📊 API Compatibility

### All Auth Methods Return Same Structure

```json
{
  "message": "Login successful",
  "user": {
    // Standard fields (same for all methods)
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture": "/media/...",
    "is_verified": true,

    // Optional: Telegram tracking
    "telegram_id": 123456789,           // Only for Telegram users
    "telegram_auth_date": "2025-10-04"  // Only for Telegram users
  },
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## ✨ Why This Design?

### ✅ Minimal Fields Approach

**Only 2 Telegram-specific fields:**
- `telegram_id` - Required for user identification
- `telegram_auth_date` - Optional for tracking

**Reuses existing fields:**
- `first_name`, `last_name`, `username`, `profile_picture`

### Benefits

1. **Frontend Simplicity**
   - Same user object for all auth methods
   - No conditional logic needed
   - Single source of truth

2. **Database Efficiency**
   - Cleaner schema
   - Less storage
   - Fewer fields to maintain

3. **Developer Experience**
   - Easier to understand
   - Follows Django conventions
   - Less code to maintain

4. **User Experience**
   - Consistent profile everywhere
   - Name changes sync automatically
   - No duplicate data confusion

---

## 🎯 Key Takeaways

✅ **Works in Telegram Browser**: Solves OAuth limitation
✅ **Frontend Friendly**: Same user object for all auth methods
✅ **Minimal Schema**: Only 2 extra fields
✅ **Secure**: Official Telegram verification
✅ **Production Ready**: Fully tested and documented
✅ **Backward Compatible**: Works with existing auth

---

## 📚 References

- [Telegram Login Widget Docs](https://core.telegram.org/widgets/login)
- [@BotFather](https://t.me/BotFather)
- [HMAC-SHA256 Verification](https://core.telegram.org/widgets/login#checking-authorization)

---

**Implementation Date**: October 4, 2025
**Status**: ✅ Production Ready
**Approach**: Minimal fields, maximum compatibility
