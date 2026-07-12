# Event Showcase SSR Meta Tags Implementation

## Overview

This implementation provides Server-Side Rendered (SSR) meta tags for event showcase pages to ensure proper social media sharing and messaging app previews. The solution works by creating a separate SSR endpoint that renders the meta tags before redirecting to the Vue.js frontend.

## Implementation Details

### 1. SSR Template (`templates/events/showcase_meta.html`)

Located at: `C:\Users\narit\OneDrive\Desktop\goevent-master\templates\events\showcase_meta.html`

Features:
- **Complete Meta Tag Coverage**: Primary, Open Graph, Twitter, and WhatsApp/Telegram tags
- **Event-Specific Tags**: Start/end times, location, event status
- **Personalization**: Guest name support for personalized invitations
- **Multi-language**: Language parameter support
- **SEO Optimization**: Structured data (JSON-LD) for search engines
- **Auto-redirect**: Redirects to Vue.js frontend after meta tags are loaded
- **Fallback**: Manual redirect link for users with JavaScript disabled

### 2. Django View (`events/views.py`)

Function: `event_showcase_ssr(request, event_id)` (lines 1086-1152)

Features:
- **Security**: Only shows published events, respects privacy settings
- **Access Control**: Supports private events for authorized users
- **Parameter Handling**: Language and guest name validation
- **Frontend Integration**: Builds proper redirect URLs with query parameters

### 3. URL Configuration (`events/urls.py`)

New route added:
```python
path('<str:pk>/meta/', views.event_showcase_ssr, name='event-showcase-meta'),
```

### 4. Settings Configuration (`goevent/settings.py`)

Added setting:
```python
FRONTEND_URL = "http://localhost:3000"
```

## Usage

### Basic URL Structure

```
# SSR Meta Page (for social media crawlers)
http://localhost:8000/api/events/{event_id}/meta/

# With personalization
http://localhost:8000/api/events/{event_id}/meta/?guest_name=John&lang=en
```

### Social Media Sharing

When users share the `/meta/` URL on social media platforms or messaging apps:

1. **Social media crawler** accesses the SSR URL
2. **Server renders** HTML with proper meta tags containing event info
3. **Platform extracts** title, description, image, and other metadata
4. **User sees** rich preview with event details
5. **Click redirects** to Vue.js frontend for full functionality

### Integration with Frontend

The Vue.js frontend should use the SSR meta URL for sharing:

```javascript
// Instead of sharing the frontend URL directly
const frontendUrl = `http://localhost:3000/events/${eventSlug}`;

// Share the SSR meta URL
const shareUrl = `http://localhost:8000/api/events/${eventId}/meta/`;

// With personalization
const personalizedUrl = `http://localhost:8000/api/events/${eventId}/meta/?guest_name=${encodeURIComponent(guestName)}&lang=${language}`;
```

### Meta Tags Generated

- **Title**: Event title with optional guest personalization
- **Description**: Event short description or truncated description
- **Image**: Event banner image with proper dimensions (1200x630)
- **Event Data**: Start/end times, location, organizer information
- **Structured Data**: JSON-LD for search engine optimization
- **Social Platform Tags**: Open Graph, Twitter Card, etc.

## Configuration

### Frontend URL Configuration

The `FRONTEND_URL` setting controls where users are redirected after meta tags are loaded.

**Current Configuration:**
```python
# In settings.py
import os
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')  # Vue.js dev server default
```

**Environment-based Configuration:**

1. **Local Development (Vue.js dev server - port 5173):**
   ```bash
   # No environment variable needed, uses default
   # Frontend runs on: http://localhost:5173
   ```

2. **Production Deployment:**
   ```bash
   # Set environment variable
   export FRONTEND_URL="https://your-frontend-domain.com"
   
   # Or in your deployment configuration
   FRONTEND_URL=https://goevent-frontend.com
   ```

3. **Different Development Ports:**
   ```bash
   # If your Vue.js runs on different port
   export FRONTEND_URL="http://localhost:3000"
   ```

**Production Deployment Options:**

- **Static Hosting (Netlify, Vercel):** `https://your-app.netlify.app`
- **Custom Domain:** `https://yourdomain.com`  
- **Subdomain:** `https://app.yourdomain.com`
- **Same Domain as API:** `https://api.yourdomain.com` (if serving both from same server)

### Template Directory

Ensure templates directory is configured in settings:

```python
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],  # Add this
        # ... rest of config
    },
]
```

## Benefits

1. **Social Media Compatibility**: Works with Facebook, Twitter, WhatsApp, Telegram, LinkedIn, etc.
2. **Personalization**: Supports guest-specific invitations with names
3. **Multi-language**: Supports language-specific sharing
4. **SEO Friendly**: Includes structured data for search engines
5. **Performance**: Lightweight SSR with fast redirect to SPA
6. **Fallback Support**: Works even with JavaScript disabled
7. **Security**: Respects event privacy and access controls

## Testing

### Manual Testing

1. Start Django server: `python manage.py runserver`
2. Visit: `http://localhost:8000/api/events/{event_id}/meta/`
3. Check meta tags in browser developer tools
4. Test social media sharing using tools like:
   - Facebook Sharing Debugger
   - Twitter Card Validator
   - WhatsApp link preview

### Automated Testing

Create tests for the SSR view:

```python
def test_event_showcase_ssr_meta_tags(self):
    response = self.client.get(f'/api/events/{self.event.id}/meta/')
    self.assertEqual(response.status_code, 200)
    self.assertContains(response, f'<title>{self.event.title}</title>')
    self.assertContains(response, 'property="og:title"')
```

## Troubleshooting

### Common Issues

1. **Template not found**: Ensure `templates/events/` directory exists
2. **Static files**: Make sure `STATIC_URL` is configured for images
3. **CORS issues**: Update `CORS_ALLOWED_ORIGINS` for production
4. **Missing events**: Only published events are shown by default

### Debugging

Enable Django debug mode to see detailed error messages:

```python
DEBUG = True  # Only for development
```

Check Django logs for any template or view errors.

## Future Enhancements

1. **Caching**: Add Redis/Memcached caching for meta pages
2. **Image Optimization**: Generate optimized social media images
3. **A/B Testing**: Different meta tag variations
4. **Analytics**: Track social media referrals
5. **Dynamic Images**: Generate custom event preview images