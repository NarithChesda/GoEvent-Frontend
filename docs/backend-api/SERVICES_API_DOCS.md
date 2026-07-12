# Services API Documentation

API documentation for the vendor service listing feature, enabling event vendors to list their services with admin moderation, analytics tracking, and Telegram-based approval workflow.

## Overview

The Services API allows:
- **Vendors**: Create profiles, list services, track analytics
- **Public Users**: Browse approved listings, contact vendors
- **Admins**: Moderate listings, manage categories

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Base URL

```
/api/services/
```

---

## Vendor Profile

### Create Vendor Profile

Creates a vendor profile for the authenticated user. Automatically sets `user.is_partner = True`.

```http
POST /api/services/vendor-profile/
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "business_name": "Elite Photography",
  "description": "Professional event photography services",
  "short_tagline": "Capturing your special moments",
  "phone": "+1234567890",
  "email": "contact@elitephoto.com",
  "website": "https://elitephoto.com",
  "telegram_username": "elitephoto",
  "address": "123 Main Street",
  "city": "New York",
  "country": "USA"
}
```

**Response (201 Created):**
```json
{
  "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "user": 1,
  "user_email": "vendor@example.com",
  "business_name": "Elite Photography",
  "slug": "elite-photography",
  "description": "Professional event photography services",
  "short_tagline": "Capturing your special moments",
  "logo": null,
  "cover_image": null,
  "phone": "+1234567890",
  "email": "contact@elitephoto.com",
  "website": "https://elitephoto.com",
  "telegram_username": "elitephoto",
  "telegram_link": "https://t.me/elitephoto",
  "address": "123 Main Street",
  "city": "New York",
  "country": "USA",
  "verification_status": "unverified",
  "verified_at": null,
  "listings_count": 0,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Errors:**
- `400` - Already has a vendor profile
- `401` - Not authenticated

---

### Get/Update Own Vendor Profile

```http
GET /api/services/vendor-profile/me/
PUT /api/services/vendor-profile/me/
PATCH /api/services/vendor-profile/me/
Authorization: Bearer <token>
```

**PATCH Request Body (partial update):**
```json
{
  "short_tagline": "Award-winning event photography"
}
```

**Response:** Full vendor profile object

---

### Upload Vendor Logo/Cover Image

```http
PATCH /api/services/vendor-profile/me/
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `logo` - Image file (max 5MB, jpg/png/webp)
- `cover_image` - Image file (max 5MB, jpg/png/webp)

Images are automatically optimized to WebP format.

---

### List Verified Vendors

```http
GET /api/services/vendor-profiles/
```

Returns only verified vendors (public endpoint).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by business name, description, city |
| `city` | string | Filter by city |
| `country` | string | Filter by country |

**Response:**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "business_name": "Elite Photography",
      "slug": "elite-photography",
      "short_tagline": "Capturing your special moments",
      "logo": "/media/vendor_logos/logo.webp",
      "city": "New York",
      "country": "USA",
      "telegram_link": "https://t.me/elitephoto",
      "verification_status": "verified",
      "listings_count": 5
    }
  ]
}
```

---

### Get Vendor Profile by ID

```http
GET /api/services/vendor-profiles/{uuid}/
```

Returns any vendor profile (public endpoint).

---

## Service Categories

### List Categories

```http
GET /api/services/categories/
```

**Response:**
```json
{
  "count": 15,
  "results": [
    {
      "id": 1,
      "name": "Photography",
      "description": "Professional photography services for events",
      "icon": "fa-camera",
      "icon_image": null,
      "color": "#E74C3C",
      "order": 1,
      "is_active": true,
      "parent": null,
      "subcategories": [],
      "listings_count": 12
    }
  ]
}
```

### Available Categories

| ID | Name | Icon |
|----|------|------|
| 1 | Photography | fa-camera |
| 2 | Videography | fa-video |
| 3 | Catering | fa-utensils |
| 4 | Venue | fa-building |
| 5 | Music & Entertainment | fa-music |
| 6 | Decoration | fa-paint-brush |
| 7 | Florist | fa-leaf |
| 8 | Planning & Coordination | fa-calendar-check |
| 9 | Rentals & Equipment | fa-chair |
| 10 | Makeup & Styling | fa-magic |
| 11 | Transportation | fa-car |
| 12 | MC & Host | fa-microphone |
| 13 | Printing & Stationery | fa-print |
| 14 | Security | fa-shield-alt |
| 15 | Other Services | fa-ellipsis-h |

### Create/Update/Delete Category (Admin Only)

```http
POST /api/services/categories/
PUT /api/services/categories/{id}/
DELETE /api/services/categories/{id}/
Authorization: Bearer <admin_token>
```

---

## Service Listings

### Create Listing

Creates a new service listing in `draft` status.

```http
POST /api/services/listings/
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "category": 1,
  "title": "Wedding Photography Package",
  "description": "Complete wedding photography coverage including...",
  "short_tagline": "Capture every magical moment",
  "price_min": 500.00,
  "price_max": 2000.00,
  "price_display_text": "Starting from $500",
  "currency": "USD",
  "service_area": "New York, New Jersey, Connecticut",
  "tags": "wedding, photography, portrait, candid"
}
```

**Response (201 Created):**
```json
{
  "id": "b2c3d4e5-6789-01bc-def2-3456789012cd",
  "vendor": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "vendor_details": { ... },
  "category": 1,
  "category_details": { ... },
  "title": "Wedding Photography Package",
  "slug": "wedding-photography-package",
  "description": "Complete wedding photography coverage...",
  "short_tagline": "Capture every magical moment",
  "price_min": "500.00",
  "price_max": "2000.00",
  "price_display_text": "Starting from $500",
  "currency": "USD",
  "service_area": "New York, New Jersey, Connecticut",
  "tags": "wedding, photography, portrait, candid",
  "tags_list": ["wedding", "photography", "portrait", "candid"],
  "status": "draft",
  "admin_notes": "",
  "is_featured": false,
  "media": [],
  "cover_image_url": null,
  "views_count": 0,
  "contact_clicks_count": 0,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Errors:**
- `400` - Must create vendor profile first
- `401` - Not authenticated

---

### List Own Listings (Vendor)

Returns all listings for the authenticated vendor (all statuses).

```http
GET /api/services/listings/
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (draft, pending_review, approved, rejected) |
| `category` | int | Filter by category ID |

---

### Browse Approved Listings (Public)

Returns only approved listings, featured first.

```http
GET /api/services/listings/browse/
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search title, description, tags |
| `category` | int | Filter by category ID |
| `price_min` | decimal | Minimum price filter |
| `price_max` | decimal | Maximum price filter |
| `vendor` | uuid | Filter by vendor ID |
| `is_featured` | boolean | Filter featured listings |
| `ordering` | string | Order by: created_at, -created_at, price_min, title |

**Response:**
```json
{
  "count": 50,
  "next": "http://api.example.com/api/services/listings/browse/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "title": "Wedding Photography Package",
      "slug": "wedding-photography-package",
      "short_tagline": "Capture every magical moment",
      "price_display_text": "Starting from $500",
      "price_min": "500.00",
      "price_max": "2000.00",
      "currency": "USD",
      "vendor_name": "Elite Photography",
      "vendor_slug": "elite-photography",
      "category_name": "Photography",
      "cover_image_url": "/media/service_media/photo.webp",
      "is_featured": true,
      "views_count": 150,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

### Get Listing Details

```http
GET /api/services/listings/{uuid}/
```

Returns full listing details including vendor info and all media.

---

### Update Listing (Owner Only)

```http
PUT /api/services/listings/{uuid}/
PATCH /api/services/listings/{uuid}/
Authorization: Bearer <token>
```

Can only update listings you own. Status cannot be changed directly.

---

### Delete Listing (Owner Only)

```http
DELETE /api/services/listings/{uuid}/
Authorization: Bearer <token>
```

---

### Submit Listing for Review

Submits a draft listing for admin approval. Triggers Telegram notification to admins.

```http
POST /api/services/listings/{uuid}/submit-for-review/
Authorization: Bearer <token>
```

**Requirements:**
- Listing must be in `draft` status
- Listing must have at least one image

**Response (200 OK):**
```json
{
  "message": "Listing submitted for review",
  "listing": { ... }
}
```

**Errors:**
- `400` - Not in draft status
- `400` - Must have at least one image

---

### Approve Listing (Admin Only)

```http
PATCH /api/services/listings/{uuid}/approve/
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body (optional):**
```json
{
  "admin_notes": "Great listing, approved!"
}
```

**Response:**
```json
{
  "message": "Listing approved",
  "listing": { ... }
}
```

---

### Reject Listing (Admin Only)

```http
PATCH /api/services/listings/{uuid}/reject/
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body (required):**
```json
{
  "admin_notes": "Please add more detailed description and pricing information."
}
```

**Errors:**
- `400` - admin_notes is required for rejection

---

## Service Media

### List Media for Listing

```http
GET /api/services/listings/{uuid}/media/
Authorization: Bearer <token>
```

---

### Upload Single Media

```http
POST /api/services/listings/{uuid}/media/
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `image` - Image file (required, max 5MB)
- `caption` - String (optional)
- `is_cover` - Boolean (optional)

**Response (201 Created):**
```json
{
  "id": 1,
  "image": "/media/service_media/photo.webp",
  "caption": "Wedding ceremony setup",
  "order": 0,
  "is_cover": true,
  "created_at": "2025-01-15T10:30:00Z"
}
```

---

### Bulk Upload Media

Upload multiple images at once.

```http
POST /api/services/listings/{uuid}/media/bulk-upload/
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `images` - Multiple image files (max 20)
- `captions` - Array of caption strings (optional, must match image count)

**Response:**
```json
{
  "message": "5 images uploaded",
  "media": [
    { "id": 1, "image": "/media/...", "order": 1 },
    { "id": 2, "image": "/media/...", "order": 2 }
  ]
}
```

---

### Bulk Reorder Media

```http
PATCH /api/services/listings/{uuid}/media/bulk-reorder/
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "order": [
    { "id": 1, "order": 0 },
    { "id": 2, "order": 1 },
    { "id": 3, "order": 2 }
  ]
}
```

---

### Set Cover Image

```http
POST /api/services/listings/{uuid}/media/{id}/set-cover/
Authorization: Bearer <token>
```

Sets the specified media as the cover image. Clears `is_cover` from other media.

---

### Delete Media

```http
DELETE /api/services/listings/{uuid}/media/{id}/
Authorization: Bearer <token>
```

---

## Analytics

### Track View

Call when a user views a listing detail page. Works for anonymous users.

```http
POST /api/services/listings/{uuid}/track-view/
Content-Type: application/json
```

**Request Body:**
```json
{
  "source": "search"
}
```

**Source Options:**
| Value | Description |
|-------|-------------|
| `search` | Found via search |
| `direct` | Direct link |
| `featured` | From featured section |
| `category` | Browsing category |
| `referral` | External referral |

**Response:**
```json
{
  "message": "View tracked"
}
```

---

### Track Contact Click

Call when user clicks contact button (Telegram, phone, email, website).

```http
POST /api/services/listings/{uuid}/track-contact/
Content-Type: application/json
```

**Request Body:**
```json
{
  "contact_type": "telegram"
}
```

**Contact Type Options:** `telegram`, `phone`, `email`, `website`

---

### Get Listing Analytics (Owner Only)

```http
GET /api/services/listings/{uuid}/analytics/
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | daily | Aggregation: daily, weekly, monthly |
| `days` | int | 30 | Number of days to analyze |

**Response:**
```json
{
  "total_views": 1250,
  "total_contact_clicks": 87,
  "conversion_rate": 6.96,
  "views_by_period": [
    { "period": "2025-01-14", "count": 45 },
    { "period": "2025-01-15", "count": 52 }
  ],
  "contact_clicks_by_period": [
    { "period": "2025-01-14", "count": 3 },
    { "period": "2025-01-15", "count": 5 }
  ],
  "views_by_source": {
    "search": 520,
    "direct": 380,
    "featured": 200,
    "category": 150
  },
  "contact_clicks_by_type": {
    "telegram": 65,
    "phone": 12,
    "email": 8,
    "website": 2
  },
  "trends": {
    "view_change_percent": 15.5,
    "period_days": 30
  }
}
```

**Analytics Insights:**
- `conversion_rate`: Percentage of views that resulted in contact clicks
- `view_change_percent`: Growth/decline comparing first half vs second half of period

---

## Telegram Moderation

### Webhook Endpoint

Receives callbacks from Telegram inline buttons.

```http
POST /api/services/telegram/webhook/
```

This endpoint is called by Telegram when admins press approve/reject buttons.

### Notification Flow

1. Vendor submits listing for review
2. System sends Telegram message to admin chat with:
   - Listing details (title, vendor, category, price, description)
   - Inline buttons: **Approve** | **Reject** | **View in Admin**
3. Admin presses button
4. Listing status updates automatically
5. Message is edited to show result

### Message Format

```
New Service Listing Pending Review

Title: Wedding Photography Package
Vendor: Elite Photography
Category: Photography
Price: Starting from $500

Description:
Complete wedding photography coverage including...

Service Area: New York, New Jersey, Connecticut
Tags: wedding, photography, portrait, candid

Images: 5 uploaded
Submitted: 2025-01-15 10:30

Please review and approve/reject this listing.

[✅ Approve] [❌ Reject]
[👀 View in Admin]
```

---

## Listing Status Workflow

```
┌─────────┐     submit_for_review     ┌────────────────┐
│  draft  │ ──────────────────────► │ pending_review │
└─────────┘                          └────────────────┘
     ▲                                      │
     │                          ┌───────────┴───────────┐
     │                          ▼                       ▼
     │                    ┌──────────┐           ┌──────────┐
     │                    │ approved │           │ rejected │
     │                    └──────────┘           └──────────┘
     │                          │                       │
     │                          ▼                       │
     │                    ┌───────────┐                 │
     │                    │ suspended │                 │
     │                    └───────────┘                 │
     │                                                  │
     └──────────────────────────────────────────────────┘
                         (vendor edits and resubmits)
```

**Status Descriptions:**
| Status | Description | Visible to Public |
|--------|-------------|-------------------|
| `draft` | Initial state, vendor can edit | No |
| `pending_review` | Waiting for admin approval | No |
| `approved` | Live on platform | Yes |
| `rejected` | Declined with reason | No |
| `suspended` | Temporarily hidden by admin | No |

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message here"
}
```

Or for validation errors:

```json
{
  "field_name": ["Error message for this field"]
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 500 | Server Error |

---

## Rate Limiting

Analytics tracking endpoints (`track-view`, `track-contact`) do not have rate limiting but record IP addresses for deduplication purposes in frontend.

---

## Example Workflows

### Vendor Onboarding Flow

```bash
# 1. Create vendor profile
curl -X POST /api/services/vendor-profile/ \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"business_name": "My Photography", "telegram_username": "myphoto"}'

# 2. Create a listing
curl -X POST /api/services/listings/ \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"category": 1, "title": "Wedding Package", "description": "..."}'

# 3. Upload images
curl -X POST /api/services/listings/$LISTING_ID/media/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@photo1.jpg" \
  -F "is_cover=true"

# 4. Submit for review
curl -X POST /api/services/listings/$LISTING_ID/submit-for-review/ \
  -H "Authorization: Bearer $TOKEN"
```

### Public Browsing Flow

```bash
# 1. Get categories
curl /api/services/categories/

# 2. Browse listings in category
curl "/api/services/listings/browse/?category=1"

# 3. View listing detail (track view)
curl /api/services/listings/$LISTING_ID/
curl -X POST /api/services/listings/$LISTING_ID/track-view/ \
  -d '{"source": "category"}'

# 4. Click contact (track click)
curl -X POST /api/services/listings/$LISTING_ID/track-contact/ \
  -d '{"contact_type": "telegram"}'
```

---

## Management Commands

```bash
# Populate default service categories
python manage.py populate_service_categories
```
