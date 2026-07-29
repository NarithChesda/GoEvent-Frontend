# Frontend Deployment Guide for GoEvent

This document provides essential information for deploying the frontend application with proper integration to the GoEvent Django backend.

## Backend Server Information

### Production Environment
- **Server IP**: `178.128.81.196`
- **Primary Domain**: `api.goevent.online` (configured with Let's Encrypt SSL)
- **Backup Access**: Direct IP access available
- **Protocol**: HTTPS only (HTTP redirects to HTTPS)

### API Base URLs
```
Production (Primary): https://api.goevent.online/api/
Production (Backup):  https://178.128.81.196/api/
Development:          http://localhost:8000/api/
```

## CORS Configuration

### Current CORS Settings
The Django backend is configured with the following CORS settings:

```python
# Environment Variables (.env)
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://178.128.81.196,http://178.128.81.196,http://localhost:3000,https://localhost:3000,http://127.0.0.1:3000,https://127.0.0.1:3000,http://localhost:5173,https://localhost:5173,http://127.0.0.1:5173,https://127.0.0.1:5173,https://api.goevent.online,https://goevent.online
CORS_ALLOW_CREDENTIALS=True
```

### Allowed Origins (Currently Configured)
- `https://178.128.81.196`
- `http://178.128.81.196`
- `http://localhost:3000` (React development)
- `https://localhost:3000`
- `http://127.0.0.1:3000`
- `https://127.0.0.1:3000`
- `http://localhost:5173` (Vite development)
- `https://localhost:5173`
- `http://127.0.0.1:5173`
- `https://127.0.0.1:5173`
- `https://api.goevent.online`
- `https://goevent.online`

### Adding New Frontend Domains
To add new frontend deployment domains, update the server's `.env` file:

1. SSH into the server:
   ```bash
   ssh -i goevent_sshkey root@178.128.81.196
   ```

2. Navigate to the application directory:
   ```bash
   cd /var/www/goevent
   ```

3. Edit the `.env` file and add your domain to `CORS_ALLOWED_ORIGINS`:
   ```bash
   nano .env
   ```

4. Add your domain (comma-separated, no spaces):
   ```
   CORS_ALLOWED_ORIGINS=...existing_domains...,https://your-frontend-domain.com
   ```

5. Restart the application:
   ```bash
   supervisorctl restart goevent
   ```

## SSL Certificate Setup

### Current SSL Configuration

#### Primary Domain (api.goevent.online)
- **Certificate Type**: Let's Encrypt SSL
- **Certificate Location**: `/etc/letsencrypt/live/api.goevent.online/`
- **Auto-renewal**: Configured via certbot
- **Status**: Active and properly configured

#### IP-based Access (178.128.81.196)
- **Certificate Type**: Self-signed SSL
- **Certificate Location**: `/etc/ssl/certs/goevent.crt`
- **Key Location**: `/etc/ssl/private/goevent.key`
- **Status**: Active (browser warnings expected)

### SSL Certificate Details
Both configurations support:
- **Protocols**: TLSv1.2, TLSv1.3
- **HSTS**: Enabled with `includeSubDomains`
- **Security Headers**: XSS protection, content type options
- **HTTP Redirect**: All HTTP traffic redirects to HTTPS

## Authentication & JWT Configuration

### JWT Token Settings
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),     # 1 hour
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),        # 24 hours
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
}
```

### Authentication Endpoints
```
POST /api/auth/login/          - Login and get JWT tokens
POST /api/auth/register/       - User registration
POST /api/auth/token/refresh/  - Refresh access token
POST /api/auth/logout/         - Logout (blacklist tokens)
GET  /api/auth/profile/        - Get user profile
PUT  /api/auth/profile/        - Update user profile
```

### Token Usage Example
```javascript
// Login request
const loginResponse = await fetch('https://api.goevent.online/api/auth/login/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123'
    }),
    credentials: 'include'
});

const { access, refresh, user } = await loginResponse.json();

// Authenticated API request
const apiResponse = await fetch('https://api.goevent.online/api/events/', {
    headers: {
        'Authorization': `Bearer ${access}`,
        'Content-Type': 'application/json',
    },
    credentials: 'include'
});
```

## Environment-Specific Configuration

### Frontend Environment Variables

#### Production
```env
VITE_API_BASE_URL=https://api.goevent.online/api
VITE_WS_BASE_URL=wss://api.goevent.online/ws
VITE_MEDIA_BASE_URL=https://api.goevent.online
VITE_ENVIRONMENT=production
```

#### Staging (if using IP directly)
```env
VITE_API_BASE_URL=https://178.128.81.196/api
VITE_WS_BASE_URL=wss://178.128.81.196/ws
VITE_MEDIA_BASE_URL=https://178.128.81.196
VITE_ENVIRONMENT=staging
```

#### Development
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000/ws
VITE_MEDIA_BASE_URL=http://localhost:8000
VITE_ENVIRONMENT=development
```

## Cloudflare Pages Deployment Guide

This section provides a complete step-by-step guide for deploying the Vue.js frontend to Cloudflare Pages.

### Prerequisites
- ✅ Cloudflare account with Pages access
- ✅ GitHub repository connected to Cloudflare Pages
- ✅ Domain configured (goevent.online) with Cloudflare DNS
- ✅ Backend API running at api.goevent.online

### Project Configuration Files
The following configuration files have been optimized for Cloudflare Pages deployment:

1. **wrangler.toml** - Main Cloudflare configuration
2. **_headers** - Security and caching headers
3. **_redirects** - SPA routing configuration
4. **vite.config.ts** - Optimized build configuration
5. **.env.production** - Production environment variables

### Step 1: Cloudflare Pages Setup

#### 1.1 Connect Repository
1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
2. Click "Create a project" → "Connect to Git"
3. Select your GitHub repository: `GoEvent-Frontend`
4. Choose branch: `main` (or your production branch)

#### 1.2 Build Configuration
```yaml
Framework preset: Vue
Build command: npm run build-cloudflare
Build output directory: dist
Root directory: /
Node.js version: 20
```

**Important**: Use `npm run build-cloudflare` which skips TypeScript checking for faster builds.

#### 1.3 Environment Variables

> **The Cloudflare Pages dashboard is the authority for production, not the
> committed `.env`.** The `.env` on `clean-production` is a local/reference copy;
> the deployed build reads its `VITE_*` values from the Pages project's
> "Variables and secrets" panel. A flag's value in the repo is **not** evidence
> of what the live site does — always check the dashboard.

**Currently set on the production Pages project** (verified 2026-07-29):

| Variable | Value | Read by |
|---|---|---|
| `VITE_API_BASE_URL` | `https://api.goevent.online` | api client, all media URL resolution |
| `VITE_GOOGLE_CLIENT_ID` | `671277865303-…` | Google OAuth |
| `VITE_TELEGRAM_BOT_USERNAME` | `goevent_authentication_bot` | Telegram login widget |
| `VITE_IMAGEKIT_ENABLED` | `true` | [`src/utils/mediaUrl.ts`](../../src/utils/mediaUrl.ts), `useImageKitConfig` |
| `VITE_ASSET_PROTECTION_ENABLED` | `true` | showcase asset protection |
| `VITE_GENERATE_SOURCEMAP` | `true` | `vite.config.ts` — see warning below |
| `VITE_ENVIRONMENT` | `production` | **nothing — unused** |
| `VITE_MEDIA_BASE_URL` | `https://api.goevent.online` | **nothing — unused** |
| `VITE_TELEGRAM_BOT_TOKEN` | *(secret)* | **nothing — see warning below** |
| `VITE_TELEGRAM_ADMIN_CHAT_ID` | `6934534080` | **nothing — see warning below** |

**Deliberately absent**, so they fall back to their safe defaults — do not add
them to production:

- `VITE_SHOWCASE_TEMPLATE_VERSION` — absent ⇒ `v1`. Setting `v2` would put the
  in-development scroll-story showcase in front of every wedding customer.
- `VITE_SERVICES_PORTFOLIO_PLACEHOLDER` — absent ⇒ `false`. Visual testing only.
- `VITE_SHOWCASE_CONTENT_WIDTH` — absent ⇒ `standard`.

> ⚠️ **`VITE_TELEGRAM_BOT_TOKEN` should not be here.** Any `VITE_*` variable is
> inlined into the client bundle at build time and is readable by anyone who
> opens the JS. Today nothing in `src/` references this variable, so Vite does
> not actually inline it and there is no live leak — but it is one
> `import.meta.env.VITE_TELEGRAM_BOT_TOKEN` away from being published, and a bot
> token does not belong in a frontend build config regardless. Telegram
> notifications already go through the backend (`POST /notifications/telegram/`)
> with the token held server-side in Django. **Delete `VITE_TELEGRAM_BOT_TOKEN`
> and `VITE_TELEGRAM_ADMIN_CHAT_ID` from the Pages project, and rotate the bot
> token** — it has been sitting in a broadly-readable location.

> ⚠️ **`VITE_GENERATE_SOURCEMAP=true` publishes the original source.** The build
> emits `.map` files (several MB) that Cloudflare serves as static assets, so
> anyone can reconstruct unminified source from the live site. Set it to `false`
> for production and leave it on only for preview/debug builds.

`VITE_ENVIRONMENT` and `VITE_MEDIA_BASE_URL` are read by nothing in the
codebase; they can be removed whenever convenient.

**Build settings** (not `VITE_*`, set alongside the above):
```env
NODE_VERSION=20
NPM_FLAGS=--frozen-lockfile
```

### Step 2: Domain Configuration

#### 2.1 Custom Domain Setup
1. In Cloudflare Pages dashboard, go to your project
2. Navigate to "Custom domains" tab
3. Add your domain: `goevent.online`
4. Cloudflare will automatically configure DNS and SSL

#### 2.2 DNS Configuration
Ensure your domain's DNS settings point to Cloudflare Pages:
```
Type: CNAME
Name: goevent.online (or @)
Value: your-project-name.pages.dev
Proxy status: Proxied (orange cloud)
```

### Step 3: Backend CORS Configuration

Update the backend server to allow your Cloudflare Pages domain:

1. SSH into backend server:
   ```bash
   ssh -i goevent_sshkey root@178.128.81.196
   ```

2. Edit the backend .env file:
   ```bash
   cd /var/www/goevent
   nano .env
   ```

3. Update CORS_ALLOWED_ORIGINS to include your domain:
   ```env
   CORS_ALLOWED_ORIGINS=https://178.128.81.196,http://178.128.81.196,http://localhost:3000,https://localhost:3000,http://127.0.0.1:3000,https://127.0.0.1:3000,http://localhost:5173,https://localhost:5173,http://127.0.0.1:5173,https://127.0.0.1:5173,https://api.goevent.online,https://goevent.online,https://your-project-name.pages.dev
   ```

4. Restart the application:
   ```bash
   supervisorctl restart goevent
   ```

### Step 4: Build Optimization Features

The project includes several optimizations for Cloudflare Pages:

#### 4.1 Advanced Chunk Splitting
- **Vendor chunk**: Vue, Vue Router, Pinia
- **UI chunk**: Lucide icons, DOMPurify
- **Auth chunk**: Google Login components
- **Asset optimization**: Images, fonts, CSS with proper hashing

#### 4.2 Caching Strategy
- **Static assets**: 1 year cache with immutable flag
- **HTML files**: No cache (dynamic content)
- **Images/fonts**: 30-day cache
- **Special files**: Optimized caching per file type

#### 4.3 Security Headers
- **CSP**: Content Security Policy for XSS protection
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: Clickjacking protection
- **Permissions Policy**: Feature restrictions

### Step 5: Deployment Commands

#### 5.1 Local Testing
Before deploying, test the build locally:
```bash
# Install dependencies
npm install

# Test build process
npm run build-cloudflare

# Preview build locally
npm run preview
```

#### 5.2 Deploy via Wrangler CLI (Optional)
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to Pages
wrangler pages deploy dist --project-name=goevent-frontend
```

#### 5.3 Automatic Deployment
Cloudflare Pages will automatically deploy on:
- Push to main branch (production)
- Push to other branches (preview deployments)

### Step 6: Post-Deployment Verification

#### 6.1 Health Checks
Test these URLs after deployment:
```bash
# Frontend accessibility
curl -I https://goevent.online

# API connectivity from frontend
curl -I https://api.goevent.online/api/events/

# CORS headers verification
curl -H "Origin: https://goevent.online" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS https://api.goevent.online/api/events/
```

#### 6.2 Performance Testing
- **Lighthouse scores**: Check via Chrome DevTools
- **Page load speed**: Monitor via Cloudflare Analytics
- **Core Web Vitals**: Verify via Google Search Console

### Step 7: TypeScript Issues (Future Fix)
Currently using `build-cloudflare` script to bypass TypeScript errors. The following errors need to be addressed:

**Priority TypeScript Fixes Needed:**
1. **EventReferrerSection.vue**: Property access on empty object
2. **Showcase components**: Boolean type assignments
3. **PhotoGallery.vue**: Array method and parameter types
4. **LRU Cache composable**: Generic type constraints
5. **Performance composables**: DOM property access

**Temporary Solution:**
- Using `npm run build-cloudflare` (skips type checking)
- TypeScript errors don't affect runtime functionality
- Plan to fix these in next development cycle

### Step 8: Monitoring and Maintenance

#### 8.1 Cloudflare Analytics
- Monitor page views and performance metrics
- Track Core Web Vitals and user experience
- Set up alerts for build failures

#### 8.2 Build Monitoring
```bash
# Check build logs
wrangler pages tail

# View deployment history
wrangler pages deployment list
```

#### 8.3 Environment Management
- Use preview deployments for testing
- Manage environment variables per environment
- Monitor build times and optimize as needed

### Troubleshooting Common Issues

#### Build Failures
- **Node version mismatch**: Ensure Node.js 20 is specified
- **Memory issues**: Build uses optimized chunk splitting
- **Dependency conflicts**: Run `npm install` locally first

#### Runtime Issues
- **API calls failing**: Check CORS configuration
- **Assets not loading**: Verify build output in dist/
- **Routing issues**: Ensure _redirects file is deployed

#### Performance Issues
- **Large bundle sizes**: Review chunk splitting configuration
- **Slow loading**: Check Cloudflare caching headers
- **High bounce rate**: Monitor Core Web Vitals

### Security Considerations

#### Content Security Policy
The _headers file includes a basic CSP. Adjust based on your needs:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' https:; connect-src 'self' https://api.goevent.online https://accounts.google.com; frame-src https://accounts.google.com;
```

#### SSL/TLS Configuration
- Cloudflare provides automatic SSL certificates
- Enable "Always Use HTTPS" in Cloudflare dashboard
- Consider enabling HSTS for enhanced security

## API Testing & Validation

### Health Check Endpoints
```bash
# Test API connectivity
curl -k https://api.goevent.online/api/events/

# Test authentication
curl -X POST https://api.goevent.online/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@goevent.com", "password": "admin123"}'
```

### Sample API Response
The API returns properly formatted JSON with CORS headers:
```json
{
    "count": 6,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": "69ce3eff-eac6-4a74-8a05-8de997137372",
            "title": "Sample Event",
            "slug": "sample-event",
            "banner_image": "https://178.128.81.196/media/event_banners/image.webp",
            // ... other fields
        }
    ]
}
```

## Common Issues & Troubleshooting

### CORS Issues
- **Problem**: CORS errors in browser console
- **Solution**: Ensure your frontend domain is added to `CORS_ALLOWED_ORIGINS`
- **Verification**: Check browser network tab for proper CORS headers

### SSL Certificate Issues
- **Problem**: SSL certificate warnings
- **Solution**: Use `api.goevent.online` instead of IP address
- **Self-signed cert**: Expected for direct IP access

### Authentication Issues
- **Problem**: 401 Unauthorized responses
- **Solution**: Verify token format: `Authorization: Bearer <token>`
- **Token expiry**: Implement automatic token refresh

### File Upload Issues
- **Problem**: File uploads failing
- **Solution**: Use `multipart/form-data` content type
- **Max size**: 100MB limit configured on server

## Backend Maintenance Commands

For backend maintenance, connect via SSH:
```bash
ssh -i goevent_sshkey root@178.128.81.196

# Application status
supervisorctl status goevent

# Restart application
supervisorctl restart goevent

# Check logs
tail -f /var/log/goevent/gunicorn.log

# Database operations
cd /var/www/goevent
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic
```

## Support & Contact

- **Production Server**: `178.128.81.196`
- **API Documentation**: Available at `/api/` endpoints
- **Admin Panel**: `https://api.goevent.online/admin/`
- **SSH Access**: Use provided `goevent_sshkey`

---

**Last Updated**: September 14, 2025
**Backend Version**: Django 5.2.4 with DRF 3.16.0
**Environment**: Production-ready with PostgreSQL, Nginx, SSL