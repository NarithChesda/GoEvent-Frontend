# Local Development & Deployment Workflow Guide

## Quick Reference for Daily Development

### 🚀 Starting Development Session

```bash
# Navigate to project
cd C:\Users\narit\Code\GoEvent-Frontend

# Check current branch and status
git status

# Switch to development branch
git checkout unstable

# Pull latest changes
git pull origin unstable

# Install/update dependencies (if needed)
npm install

# Start development server
npm run dev
# Access at: http://localhost:5173
```

### 💻 Development Workflow

#### Create New Feature
```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Make your changes...
# Edit files, test functionality

# Regular commits during development
git add .
git commit -m "wip: working on feature description"
```

#### Testing & Quality Checks
```bash
# Type checking
npm run type-check

# Linting (with auto-fix)
npm run lint

# Test production build
npm run build-cloudflare

# Preview production build locally
npm run preview
```

#### Commit & Push Changes
```bash
# Stage all changes
git add .

# Commit with proper message
git commit -m "feat: add new feature description

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push origin feature/your-feature-name
```

### 🌍 Deploy to Production

#### Method 1: Direct Merge (Quick Updates)
```bash
# Switch to production branch
git checkout clean-production

# Pull latest production
git pull origin clean-production

# Merge your development work
git merge unstable

# Push to trigger automatic deployment
git push origin clean-production
```

#### Method 2: Pull Request (Recommended)
```bash
# Push your feature branch
git push origin feature/your-feature-name

# Create PR via GitHub CLI (if installed)
gh pr create --title "Deploy: Feature description" --body "Production deployment" --base clean-production --head feature/your-feature-name

# Or create PR via GitHub web interface
```

### 🔄 Regular Maintenance

#### Weekly Dependency Updates
```bash
# Check for updates
npm outdated

# Update packages
npm update

# Test after updates
npm run build-cloudflare
npm run type-check

# Commit updates
git add package*.json
git commit -m "chore: update dependencies"
```

#### Security Audits
```bash
# Check for vulnerabilities
npm audit

# Auto-fix issues
npm audit fix

# For critical issues, update manually:
npm install package-name@latest
```

### 📊 Monitoring Production

#### Check Deployment Status
1. Visit [Cloudflare Pages Dashboard](https://dash.cloudflare.com)
2. Select `goevent-frontend` project
3. Monitor latest deployment status

#### Verify Live Site
```bash
# Test production site
curl -I https://your-domain.com

# Check API connectivity
curl -s https://api.goevent.online/api/events/ | head -5
```

### 🚨 Emergency Procedures

#### Rollback Production
```bash
# Method 1: Revert commit
git checkout clean-production
git pull origin clean-production
git revert HEAD  # Reverts last commit
git push origin clean-production

# Method 2: Reset to previous commit
git reset --hard HEAD~1  # DANGER: Only if no one else has pulled
git push --force origin clean-production
```

#### Hotfix Critical Issue
```bash
# Create hotfix from production
git checkout clean-production
git pull origin clean-production
git checkout -b hotfix/critical-issue

# Fix the issue quickly
# ... make minimal changes ...

# Test fix
npm run build-cloudflare

# Commit and push
git add .
git commit -m "hotfix: resolve critical issue"
git push origin hotfix/critical-issue

# Merge to production immediately
git checkout clean-production
git merge hotfix/critical-issue
git push origin clean-production

# Don't forget to merge back to development
git checkout unstable
git merge hotfix/critical-issue
git push origin unstable
```

### 🔧 Environment Management

#### Update Production Environment Variables
1. Go to Cloudflare Pages Dashboard
2. Project → Settings → Environment variables
3. Update production variables:
   - `VITE_API_BASE_URL=https://api.goevent.online`
   - `VITE_MEDIA_BASE_URL=https://api.goevent.online`
   - `VITE_GOOGLE_CLIENT_ID=your_client_id`
4. Save changes (triggers automatic redeploy)

#### Update Backend CORS (When Adding New Domain)
```bash
# SSH into backend server
ssh -i goevent_sshkey root@178.128.81.196

# Edit environment
cd /var/www/goevent
nano .env

# Add new domain to CORS_ALLOWED_ORIGINS
CORS_ALLOWED_ORIGINS=existing_domains,https://your-new-domain.com

# Restart backend
supervisorctl restart goevent

# Exit SSH
exit
```

### 📝 Common Commands

#### Git Shortcuts
```bash
# Quick status check
git status -s

# View recent commits
git log --oneline -5

# See branch differences
git diff unstable..clean-production

# Check remote branches
git branch -r
```

#### Development Shortcuts
```bash
# Quick development start
npm run dev

# Full quality check
npm run type-check && npm run lint && npm run build-cloudflare

# Clean reinstall
rm -rf node_modules package-lock.json && npm install
```

#### Debugging Commands
```bash
# View build logs
npm run build-cloudflare 2>&1 | tee build.log

# Check bundle size
npm run build-cloudflare && ls -la dist/assets/

# Test API connectivity
curl -s "https://api.goevent.online/api/events/" | jq '.'
```

### 🎯 Best Practices

#### Daily Workflow
1. ✅ Always start with `git pull origin unstable`
2. ✅ Create feature branches for new work
3. ✅ Test locally before pushing
4. ✅ Use meaningful commit messages
5. ✅ Deploy to production only when thoroughly tested

#### Code Quality
1. ✅ Run `npm run type-check` before committing
2. ✅ Use `npm run lint` to maintain code style
3. ✅ Test production build with `npm run build-cloudflare`
4. ✅ Preview production build locally when possible

#### Deployment Safety
1. ✅ Use preview deployments to test features
2. ✅ Monitor deployments in Cloudflare dashboard
3. ✅ Have rollback plan ready for production changes
4. ✅ Update backend CORS when deploying new domains

### 📞 Emergency Contacts & Resources

#### Quick Links
- **Live Site**: https://your-domain.com
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **GitHub Repository**: https://github.com/NarithChesda/GoEvent-Frontend
- **Backend API**: https://api.goevent.online/api/
- **Backend Admin**: https://api.goevent.online/admin/

#### Documentation
- **Full Deployment Guide**: `CLOUDFLARE_DEPLOYMENT_GUIDE.md`
- **Project Architecture**: `CLAUDE.md`
- **Backend Integration**: `frontend_deployment_guide.md`
- **API Documentation**: Available at backend `/api/` endpoints

#### Support Commands
```bash
# Check all project status
git status && npm run type-check && npm run build-cloudflare

# Full project health check
npm audit && npm outdated && npm run lint

# Environment verification
echo "API: $VITE_API_BASE_URL" && echo "Media: $VITE_MEDIA_BASE_URL"
```

---

**Keep this guide handy for daily development! 🚀**

Last Updated: September 14, 2025