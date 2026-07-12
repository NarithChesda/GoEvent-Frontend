# Cloudflare Pages Deployment Guide - GoEvent Frontend

## Table of Contents
1. [Overview](#overview)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Process](#deployment-process)
5. [Local Development Workflow](#local-development-workflow)
6. [Production Updates & Maintenance](#production-updates--maintenance)
7. [Branch Strategy](#branch-strategy)
8. [Monitoring & Analytics](#monitoring--analytics)
9. [Troubleshooting](#troubleshooting)
10. [Security & Performance](#security--performance)

---

## Overview

This document provides comprehensive guidance for deploying and maintaining the GoEvent Vue.js frontend on Cloudflare Pages.

### Architecture Summary
- **Frontend**: Vue 3 + TypeScript + Vite deployed on Cloudflare Pages
- **Backend**: Django REST API at `api.goevent.online`
- **Production Branch**: `clean-production`
- **Development Branch**: `unstable`
- **Build Tool**: Vite 7.0 with custom build script
- **CDN**: Cloudflare global network with edge caching

### Key Features
- ✅ Automatic deployments from Git
- ✅ Preview deployments for feature branches
- ✅ Global CDN with edge caching
- ✅ Automatic SSL certificates
- ✅ Security headers and CSP
- ✅ SPA routing support
- ✅ Environment-specific configurations

---

## Initial Setup

### Prerequisites
- Cloudflare account (free tier sufficient)
- GitHub repository access: `NarithChesda/GoEvent-Frontend`
- Domain configured (optional, but recommended)

### 1. Cloudflare Pages Setup

#### 1.1 Access Cloudflare Dashboard
```
1. Go to https://dash.cloudflare.com
2. Sign in to your Cloudflare account
3. Navigate to "Workers & Pages" → "Pages"
4. Click "Create application"
```

#### 1.2 Connect Repository
```
1. Choose "Connect to Git"
2. Select "GitHub" and authorize Cloudflare
3. Repository: NarithChesda/GoEvent-Frontend
4. Production branch: clean-production
5. Project name: goevent-frontend (or your preference)
```

#### 1.3 Build Configuration
```
Framework preset: Vue
Build command: npm run build-cloudflare
Build output directory: dist
Root directory: / (leave empty)
Node.js version: 20
```

### 2. Environment Variables Setup

Configure these in Cloudflare Pages dashboard under **Settings → Environment Variables**:

#### Production Environment
```bash
VITE_API_BASE_URL=https://api.goevent.online
VITE_MEDIA_BASE_URL=https://api.goevent.online
VITE_ENVIRONMENT=production
VITE_GOOGLE_CLIENT_ID=your_actual_google_oauth_client_id
VITE_GENERATE_SOURCEMAP=true
```

#### Preview Environment (Optional)
```bash
VITE_API_BASE_URL=https://api.goevent.online
VITE_MEDIA_BASE_URL=https://api.goevent.online
VITE_ENVIRONMENT=preview
VITE_GOOGLE_CLIENT_ID=your_actual_google_oauth_client_id
VITE_GENERATE_SOURCEMAP=true
```

---

## Environment Configuration

### Local Environment Files

#### `.env` (Development - Not committed)
```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_MEDIA_BASE_URL=http://127.0.0.1:8000
VITE_ENVIRONMENT=development
VITE_GOOGLE_CLIENT_ID=your_dev_google_client_id
VITE_GENERATE_SOURCEMAP=true
```

#### `.env.production` (Template - Not committed)
```bash
VITE_API_BASE_URL=https://api.goevent.online
VITE_MEDIA_BASE_URL=https://api.goevent.online
VITE_ENVIRONMENT=production
VITE_GOOGLE_CLIENT_ID=your_prod_google_client_id
VITE_GENERATE_SOURCEMAP=true
```

### Configuration Files (Committed)

#### `wrangler.toml` - Cloudflare Pages Configuration
```toml
name = "goevent-frontend"
compatibility_date = "2024-09-14"

[build]
command = "npm run build-cloudflare"
cwd = "."
watch_dir = ["src", "public", "index.html", "vite.config.ts", "tailwind.config.js"]

[build.upload]
format = "directory"
dir = "dist"

[build.environment_variables]
NODE_VERSION = "20"
NPM_FLAGS = "--frozen-lockfile"
```

#### `_headers` - Security and Performance Headers
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' https: blob:; connect-src 'self' https://api.goevent.online wss://api.goevent.online https://accounts.google.com; frame-src 'self' https://accounts.google.com;

/assets/*
  Cache-Control: public, max-age=31536000, immutable

*.js
  Cache-Control: public, max-age=31536000, immutable

*.css
  Cache-Control: public, max-age=31536000, immutable

*.png
  Cache-Control: public, max-age=31536000, immutable

*.jpg
  Cache-Control: public, max-age=31536000, immutable

*.jpeg
  Cache-Control: public, max-age=31536000, immutable

*.webp
  Cache-Control: public, max-age=31536000, immutable

*.svg
  Cache-Control: public, max-age=31536000, immutable

*.woff2
  Cache-Control: public, max-age=31536000, immutable

*.ico
  Cache-Control: public, max-age=86400

/
  Cache-Control: public, max-age=0, must-revalidate

/index.html
  Cache-Control: public, max-age=0, must-revalidate
```

#### `_redirects` - SPA Routing Support
```
# Single Page Application routing
# All routes should be handled by Vue Router client-side
/* /index.html 200
```

---

## Deployment Process

### Automatic Deployments

#### Production Deployment
- **Trigger**: Push to `clean-production` branch
- **URL**: Your custom domain or `*.pages.dev`
- **Process**:
  1. Cloudflare detects push
  2. Runs `npm run build-cloudflare`
  3. Deploys to global CDN
  4. Updates live site (~2-3 minutes)

#### Preview Deployments
- **Trigger**: Push to any other branch
- **URL**: Unique preview URL (`branch-name.goevent-frontend.pages.dev`)
- **Use Case**: Testing features before merging

### Manual Deployment
1. Go to Cloudflare Pages dashboard
2. Select your project
3. Click "Create deployment"
4. Choose branch and deploy

---

## Local Development Workflow

### Daily Development Process

#### 1. Start Development
```bash
# Navigate to project
cd C:\Users\narit\Code\GoEvent-Frontend

# Ensure on development branch
git checkout unstable

# Pull latest changes
git pull origin unstable

# Install dependencies (if package.json changed)
npm install

# Start development server
npm run dev
# Server runs at http://localhost:5173
```

#### 2. Make Changes
```bash
# Create feature branch (optional)
git checkout -b feature/your-feature-name

# Make your changes...
# Edit files, add features, fix bugs

# Test locally
npm run dev
# Verify functionality at http://localhost:5173
```

#### 3. Quality Checks
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test (ensure no build errors)
npm run build-cloudflare

# Unit tests (if applicable)
npm run test:unit
```

#### 4. Commit Changes
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature description

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push origin your-branch-name
```

---

## Production Updates & Maintenance

### Deploying to Production

#### Option 1: Direct Push (Recommended for hotfixes)
```bash
# Switch to production branch
git checkout clean-production

# Pull latest
git pull origin clean-production

# Merge your changes from development
git merge unstable

# Push to trigger deployment
git push origin clean-production
```

#### Option 2: Pull Request Workflow (Recommended for features)
```bash
# Create PR from your feature branch to clean-production
# Via GitHub web interface or CLI:
gh pr create --title "Deploy: Feature description" --body "Production deployment" --base clean-production --head feature/your-feature
```

### Backend CORS Updates

When deploying new domains, update backend CORS:

```bash
# SSH into backend server
ssh -i goevent_sshkey root@178.128.81.196

# Navigate to app directory
cd /var/www/goevent

# Edit environment file
nano .env

# Add your new domain to CORS_ALLOWED_ORIGINS
CORS_ALLOWED_ORIGINS=https://178.128.81.196,http://178.128.81.196,http://localhost:3000,https://localhost:3000,http://127.0.0.1:3000,https://127.0.0.1:3000,http://localhost:5173,https://localhost:5173,http://127.0.0.1:5173,https://127.0.0.1:5173,https://api.goevent.online,https://goevent.online,https://your-new-domain.com

# Restart backend
supervisorctl restart goevent
```

### Updating Environment Variables

#### In Cloudflare Pages Dashboard:
1. Go to project → Settings → Environment variables
2. Edit production variables
3. Click "Save and deploy"
4. Deployment automatically triggers

#### Common Updates:
- Google OAuth Client ID changes
- API endpoint changes
- Feature flags
- Build configuration

### Dependency Updates

#### Regular Maintenance:
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update to specific version
npm install package@version

# Test after updates
npm run build-cloudflare
npm run type-check
npm run lint

# Commit and deploy
git add package*.json
git commit -m "chore: update dependencies"
```

#### Security Updates:
```bash
# Check for security vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Manual fixes for high-severity issues
npm install package@secure-version
```

---

## Branch Strategy

### Branch Structure

```
main/master (archived)
├── unstable (development)
│   ├── feature/user-auth
│   ├── feature/event-showcase
│   └── hotfix/critical-bug
└── clean-production (production)
    └── release/v1.0.0
```

### Branch Purposes

#### `unstable` - Development Branch
- **Purpose**: Active development, testing
- **Environment**: Local development
- **Stability**: May have bugs, experimental features
- **Deploy**: Preview deployments only

#### `clean-production` - Production Branch
- **Purpose**: Production-ready code
- **Environment**: Live website
- **Stability**: Stable, tested code only
- **Deploy**: Automatic production deployment

### Workflow Examples

#### Feature Development
```bash
git checkout unstable
git pull origin unstable
git checkout -b feature/new-payment-system
# ... develop feature ...
git push origin feature/new-payment-system
# Create PR to unstable for review
# After approval, merge to unstable
# Test on preview deployment
# When ready, merge unstable to clean-production
```

#### Hotfix Process
```bash
git checkout clean-production
git pull origin clean-production
git checkout -b hotfix/security-patch
# ... fix critical issue ...
git push origin hotfix/security-patch
# Create PR to clean-production
# After approval, merge and deploy
# Also merge back to unstable
```

---

## Monitoring & Analytics

### Cloudflare Pages Analytics

#### Access Analytics:
1. Cloudflare Pages dashboard
2. Select your project
3. Click "Analytics" tab

#### Key Metrics:
- **Page Views**: Total page impressions
- **Unique Visitors**: Distinct users
- **Bandwidth**: Data transfer usage
- **Requests**: API and asset requests
- **Errors**: 4xx/5xx error rates

### Build Monitoring

#### Build Logs:
1. Pages dashboard → Deployments
2. Click specific deployment
3. View build logs for errors

#### Common Build Issues:
- TypeScript errors (currently bypassed)
- Package installation failures
- Environment variable issues
- Memory/timeout limits

### Performance Monitoring

#### Core Web Vitals:
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

#### Tools:
- Cloudflare Web Analytics
- Google PageSpeed Insights
- Browser Developer Tools

### Error Tracking

#### Frontend Errors:
- Browser console errors
- Network request failures
- JavaScript runtime errors

#### Backend Integration Issues:
- CORS errors (check browser network tab)
- API authentication failures
- Media loading failures

---

## Troubleshooting

### Common Issues & Solutions

#### Build Failures

**Issue**: TypeScript compilation errors
```bash
# Solution: Use the bypass build command
npm run build-cloudflare  # Bypasses type checking

# Or fix TypeScript errors:
npm run type-check  # Identify issues
# Fix reported errors
npm run build  # Standard build
```

**Issue**: Package installation failures
```bash
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install
npm run build-cloudflare
```

**Issue**: Environment variable not found
```bash
# Check Cloudflare Pages dashboard
# Settings → Environment variables
# Ensure all required variables are set
# Redeploy after adding variables
```

#### Runtime Issues

**Issue**: CORS errors in production
```bash
# Check backend CORS settings
# Verify your domain is in CORS_ALLOWED_ORIGINS
# Add missing domains and restart backend:
supervisorctl restart goevent
```

**Issue**: 404 errors on direct navigation
```bash
# Verify _redirects file exists and contains:
/* /index.html 200
# Redeploy if missing
```

**Issue**: Assets not loading (images, videos)
```bash
# Check browser network tab
# Verify media URLs are correct
# Check _headers file for proper caching
# Verify backend media serving
```

#### Authentication Issues

**Issue**: Google OAuth not working
```bash
# Check VITE_GOOGLE_CLIENT_ID is set correctly
# Verify OAuth consent screen configuration
# Check CSP headers allow Google domains
# Verify redirect URIs match your domain
```

**Issue**: JWT token issues
```bash
# Check API responses in browser network tab
# Verify token storage in localStorage
# Check token expiration and refresh logic
# Verify backend authentication endpoints
```

### Debug Tools

#### Local Development
```bash
# Development server with debugging
npm run dev
# Server at http://localhost:5173
# Vue DevTools: http://localhost:5173/__devtools__/

# Build debugging
npm run build-cloudflare 2>&1 | tee build.log

# Network debugging
# Use browser F12 → Network tab
# Monitor API calls and responses
```

#### Production Debugging
```bash
# Check deployment logs
# Cloudflare Pages dashboard → Deployments → View logs

# Check Cloudflare Analytics
# Monitor error rates and performance

# Browser debugging
# F12 → Console for JavaScript errors
# F12 → Network for API/asset issues
# F12 → Application → Local Storage for auth tokens
```

### Support Resources

#### Documentation
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Vite Documentation](https://vitejs.dev/)
- [Vue.js Documentation](https://vuejs.org/)

#### Community Support
- Cloudflare Community Forum
- Vue.js Discord/Forums
- Stack Overflow

#### Internal Resources
- Backend API Documentation: `frontend_deployment_guide.md`
- Project Architecture: `CLAUDE.md`
- Django Backend: SSH access to `178.128.81.196`

---

## Security & Performance

### Security Configuration

#### Content Security Policy (CSP)
Already configured in `_headers` file:
- Restricts script sources
- Allows Google OAuth domains
- Prevents XSS attacks
- Controls resource loading

#### Security Headers
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: XSS filtering
- **HSTS**: Forces HTTPS connections
- **Referrer-Policy**: Controls referrer information

### Performance Optimization

#### Caching Strategy
- **Static Assets**: 1 year cache (`max-age=31536000`)
- **HTML Files**: No cache (`max-age=0`)
- **API Responses**: Backend controlled
- **CDN**: Global edge caching

#### Build Optimizations
- Code splitting by route
- Tree shaking for unused code
- Asset minification and compression
- Source maps for debugging

#### Monitoring Performance
```bash
# Local performance testing
npm run build-cloudflare
npm run preview  # Test production build locally

# Production performance
# Use browser DevTools → Lighthouse
# Monitor Core Web Vitals
# Check Cloudflare Analytics
```

### Best Practices

#### Development
- Always test locally before deploying
- Use preview deployments for feature testing
- Keep dependencies updated
- Monitor build times and bundle sizes

#### Deployment
- Use pull requests for production changes
- Test on preview deployments first
- Monitor deployment success
- Have rollback plan ready

#### Security
- Never commit `.env` files
- Regularly update dependencies
- Monitor for security vulnerabilities
- Use proper CSP and security headers

#### Performance
- Optimize images and media
- Minimize bundle sizes
- Use lazy loading for routes
- Monitor Core Web Vitals

---

## Appendix

### Useful Commands Reference

#### Development
```bash
npm run dev              # Start development server
npm run build            # Production build with type checking
npm run build-cloudflare # Production build bypassing type errors
npm run preview          # Preview production build locally
npm run type-check       # TypeScript type checking
npm run lint             # ESLint code linting
npm run format           # Prettier code formatting
```

#### Git Workflow
```bash
git checkout unstable                    # Switch to development
git pull origin unstable               # Get latest changes
git checkout -b feature/name           # Create feature branch
git add . && git commit -m "message"   # Stage and commit
git push origin branch-name            # Push to remote
git checkout clean-production          # Switch to production
git merge unstable                     # Merge changes
git push origin clean-production       # Deploy to production
```

#### Debugging
```bash
npm outdated                   # Check for package updates
npm audit                      # Check for security issues
npm run build 2>&1 | tee log   # Build with logging
curl -I https://your-domain.com # Check headers
```

### Environment Variables Reference

| Variable | Development | Production | Purpose |
|----------|-------------|------------|---------|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | `https://api.goevent.online` | Backend API endpoint |
| `VITE_MEDIA_BASE_URL` | `http://127.0.0.1:8000` | `https://api.goevent.online` | Media files endpoint |
| `VITE_ENVIRONMENT` | `development` | `production` | Environment identifier |
| `VITE_GOOGLE_CLIENT_ID` | Dev client ID | Prod client ID | Google OAuth configuration |
| `VITE_GENERATE_SOURCEMAP` | `true` | `true` | Source map generation |

### File Structure Reference
```
GoEvent-Frontend/
├── src/                          # Source code
├── public/                       # Static assets
├── dist/                        # Build output (generated)
├── .env                         # Local environment (ignored)
├── .env.production              # Production template (ignored)
├── wrangler.toml               # Cloudflare configuration
├── _headers                    # Security/performance headers
├── _redirects                  # SPA routing configuration
├── vite.config.ts              # Vite build configuration
├── package.json                # Dependencies and scripts
└── CLOUDFLARE_DEPLOYMENT_GUIDE.md # This documentation
```

---

**Last Updated**: September 14, 2025
**Cloudflare Pages Version**: Latest
**Vue.js Version**: 3.x
**Vite Version**: 7.0.x

For questions or issues, refer to the troubleshooting section or contact the development team.