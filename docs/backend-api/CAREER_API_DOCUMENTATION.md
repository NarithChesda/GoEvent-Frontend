# Career Page API Documentation

Complete API documentation for the GoEvent Career Page system for frontend developers.

## Base URL

```
Development: http://localhost:8000/api/core-data/career/
Production: https://api.goevent.online/api/core-data/career/
```

## Table of Contents

1. [Authentication](#authentication)
2. [Career Departments](#career-departments)
3. [Career Positions](#career-positions)
4. [Career Applications](#career-applications)
5. [Career Benefits](#career-benefits)
6. [Career Testimonials](#career-testimonials)
7. [Career Page Settings](#career-page-settings)
8. [Error Handling](#error-handling)
9. [Examples](#examples)

---

## Authentication

### Public Endpoints (No Auth Required)
- `GET` all list endpoints (departments, positions, benefits, testimonials, settings)
- `GET` individual position details
- `POST` job applications

### Staff-Only Endpoints (Requires Auth + Staff Status)
- `POST/PUT/PATCH/DELETE` for departments, positions, benefits, testimonials
- `GET/PUT/PATCH` application management
- All admin operations

### Authentication Header
```http
Authorization: Bearer <your_jwt_token>
```

---

## Career Departments

### List All Departments
```http
GET /career/departments/
```

**Query Parameters:**
- `search` - Search by name or description
- `ordering` - Sort by: `order`, `name`, `created_at`, `-created_at`

**Response:**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Engineering",
      "description": "Build innovative solutions",
      "icon": "💻",
      "order": 1,
      "is_active": true,
      "created_at": "2025-11-04T10:00:00Z",
      "updated_at": "2025-11-04T10:00:00Z",
      "positions_count": 5
    }
  ]
}
```

### Get Department Details
```http
GET /career/departments/{id}/
```

**Response:** Same as single department object above.

### Create Department (Staff Only)
```http
POST /career/departments/
```

**Request Body:**
```json
{
  "name": "Product Management",
  "description": "Drive product strategy and vision",
  "icon": "🎯",
  "order": 3,
  "is_active": true
}
```

### Update Department (Staff Only)
```http
PUT /career/departments/{id}/
PATCH /career/departments/{id}/
```

### Delete Department (Staff Only)
```http
DELETE /career/departments/{id}/
```

---

## Career Positions

### List All Positions
```http
GET /career/positions/
```

**Query Parameters:**
- `department` - Filter by department ID
- `employment_type` - Filter: `full_time`, `part_time`, `contract`, `internship`, `freelance`
- `experience_level` - Filter: `entry`, `junior`, `mid`, `senior`, `lead`, `manager`, `director`
- `location_type` - Filter: `onsite`, `remote`, `hybrid`
- `featured` - Filter: `true` or `false`
- `is_active` - Filter: `true` or `false` (staff only)
- `search` - Search by title, description, location
- `ordering` - Sort by: `order`, `created_at`, `title`, `views_count`, `-created_at`, etc.

**Response:**
```json
{
  "count": 12,
  "next": "http://localhost:8000/api/core-data/career/positions/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "slug": "senior-backend-engineer",
      "title": "Senior Backend Engineer",
      "department": {
        "id": 1,
        "name": "Engineering",
        "description": "Build innovative solutions",
        "icon": "💻",
        "order": 1,
        "is_active": true,
        "created_at": "2025-11-04T10:00:00Z",
        "updated_at": "2025-11-04T10:00:00Z",
        "positions_count": 5
      },
      "employment_type": "full_time",
      "employment_type_display": "Full-Time",
      "experience_level": "senior",
      "experience_level_display": "Senior",
      "location_type": "hybrid",
      "location_type_display": "Hybrid",
      "location": "Phnom Penh, Cambodia",
      "short_description": "Join our engineering team to build scalable backend systems",
      "featured": true,
      "is_active": true,
      "application_deadline": "2025-12-31",
      "created_at": "2025-11-04T10:00:00Z",
      "updated_at": "2025-11-04T10:00:00Z",
      "applications_count": 15,
      "views_count": 234
    }
  ]
}
```

### Get Position Details (by slug)
```http
GET /career/positions/{slug}/
```

**Note:** This endpoint automatically increments the `views_count` by 1 each time it's called.

**Response:**
```json
{
  "id": 1,
  "slug": "senior-backend-engineer",
  "title": "Senior Backend Engineer",
  "department": {
    "id": 1,
    "name": "Engineering",
    "description": "Build innovative solutions",
    "icon": "💻",
    "order": 1,
    "is_active": true,
    "created_at": "2025-11-04T10:00:00Z",
    "updated_at": "2025-11-04T10:00:00Z",
    "positions_count": 5
  },
  "employment_type": "full_time",
  "employment_type_display": "Full-Time",
  "experience_level": "senior",
  "experience_level_display": "Senior",
  "location_type": "hybrid",
  "location_type_display": "Hybrid",
  "location": "Phnom Penh, Cambodia",
  "short_description": "Join our engineering team to build scalable backend systems",
  "description": "We're looking for a Senior Backend Engineer to join our growing team...",
  "responsibilities": "- Design and implement scalable backend systems\n- Mentor junior engineers\n- Collaborate with product team",
  "requirements": "- 5+ years Python/Django experience\n- Strong database skills\n- Experience with microservices",
  "nice_to_have": "- Experience with Kubernetes\n- Open source contributions",
  "salary_range_min": "2000.00",
  "salary_range_max": "3500.00",
  "salary_currency": "USD",
  "benefits": "- Health insurance\n- Remote work flexibility\n- Learning budget",
  "application_deadline": "2025-12-31",
  "external_application_url": "",
  "contact_email": "careers@goevent.com",
  "featured": true,
  "is_active": true,
  "order": 0,
  "views_count": 235,
  "created_at": "2025-11-04T10:00:00Z",
  "updated_at": "2025-11-04T10:30:00Z",
  "created_by": 1,
  "created_by_name": "admin",
  "applications_count": 15
}
```

### Get Featured Positions
```http
GET /career/positions/featured/
```

Returns up to 6 featured positions (no pagination).

**Response:**
```json
[
  {
    "id": 1,
    "slug": "senior-backend-engineer",
    "title": "Senior Backend Engineer",
    // ... same fields as list response
  }
]
```

### Create Position (Staff Only)
```http
POST /career/positions/
```

**Request Body:**
```json
{
  "title": "Senior Frontend Engineer",
  "department_id": 1,
  "employment_type": "full_time",
  "experience_level": "senior",
  "location_type": "remote",
  "location": "Remote",
  "short_description": "Build beautiful user interfaces",
  "description": "Full job description here...",
  "responsibilities": "- Build React applications\n- Write clean code",
  "requirements": "- 5+ years React experience\n- TypeScript proficiency",
  "nice_to_have": "- Next.js experience",
  "salary_range_min": "2500.00",
  "salary_range_max": "4000.00",
  "salary_currency": "USD",
  "benefits": "- Health insurance\n- Stock options",
  "application_deadline": "2025-12-31",
  "contact_email": "careers@goevent.com",
  "featured": true,
  "is_active": true,
  "order": 0
}
```

**Note:** `slug` is auto-generated from `title`. `created_by` is auto-assigned from the authenticated user.

### Update Position (Staff Only)
```http
PUT /career/positions/{slug}/
PATCH /career/positions/{slug}/
```

### Delete Position (Staff Only)
```http
DELETE /career/positions/{slug}/
```

---

## Career Applications

### Submit Application (Public)
```http
POST /career/applications/
Content-Type: multipart/form-data
```

**Form Data:**
```
position: 1
first_name: John
last_name: Doe
email: john.doe@example.com
phone: +855123456789
cover_letter: I am excited to apply for this position...
resume: [FILE: PDF/DOC/DOCX]
portfolio_url: https://johndoe.dev
linkedin_url: https://linkedin.com/in/johndoe
current_location: Phnom Penh, Cambodia
willing_to_relocate: true
available_start_date: 2025-12-01
salary_expectation: 3000.00
```

**Response:**
```json
{
  "message": "Application submitted successfully! We will review your application and get back to you soon.",
  "application": {
    "id": 1,
    "position": 1,
    "position_title": "Senior Backend Engineer",
    "position_department": "Engineering",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+855123456789",
    "cover_letter": "I am excited to apply...",
    "resume": "http://localhost:8000/media/career/resumes/john_doe_resume.pdf",
    "portfolio_url": "https://johndoe.dev",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "current_location": "Phnom Penh, Cambodia",
    "willing_to_relocate": true,
    "available_start_date": "2025-12-01",
    "salary_expectation": "3000.00",
    "status": "new",
    "status_display": "New",
    "notes": "",
    "applied_at": "2025-11-04T10:45:00Z",
    "updated_at": "2025-11-04T10:45:00Z",
    "reviewed_by": null
  }
}
```

**Validation:**
- Duplicate applications (same email + position) are prevented
- Resume file must be PDF, DOC, or DOCX
- All required fields must be provided

### List Applications (Staff Only)
```http
GET /career/applications/
```

**Query Parameters:**
- `position` - Filter by position ID
- `status` - Filter by: `new`, `reviewing`, `shortlisted`, `interview`, `offer`, `hired`, `rejected`, `withdrawn`
- `search` - Search by name, email, position title
- `ordering` - Sort by: `applied_at`, `updated_at`, `status`, `-applied_at`, etc.

**Response:**
```json
{
  "count": 25,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "position": 1,
      "position_title": "Senior Backend Engineer",
      "position_department": "Engineering",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+855123456789",
      "cover_letter": "I am excited to apply...",
      "resume": "http://localhost:8000/media/career/resumes/john_doe_resume.pdf",
      "portfolio_url": "https://johndoe.dev",
      "linkedin_url": "https://linkedin.com/in/johndoe",
      "current_location": "Phnom Penh, Cambodia",
      "willing_to_relocate": true,
      "available_start_date": "2025-12-01",
      "salary_expectation": "3000.00",
      "status": "new",
      "status_display": "New",
      "notes": "",
      "applied_at": "2025-11-04T10:45:00Z",
      "updated_at": "2025-11-04T10:45:00Z",
      "reviewed_by": null,
      "reviewed_by_name": null
    }
  ]
}
```

### Get Application Details (Staff Only)
```http
GET /career/applications/{id}/
```

### Update Application Status (Staff Only)
```http
PUT /career/applications/{id}/
PATCH /career/applications/{id}/
```

**Request Body:**
```json
{
  "status": "shortlisted",
  "notes": "Strong candidate, schedule interview"
}
```

**Alternative - Quick Status Update:**
```http
POST /career/applications/{id}/update_status/
```

**Request Body:**
```json
{
  "status": "interview",
  "notes": "Interview scheduled for next week"
}
```

**Response:**
```json
{
  "message": "Application status updated to Interview Scheduled",
  "application": {
    // ... full application object
  }
}
```

**Note:** `reviewed_by` is automatically set to the current authenticated user when status changes.

### Delete Application (Staff Only)
```http
DELETE /career/applications/{id}/
```

---

## Career Benefits

### List All Benefits
```http
GET /career/benefits/
```

**Query Parameters:**
- `ordering` - Sort by: `order`, `created_at`, `-created_at`

**Response:**
```json
{
  "count": 6,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Health Insurance",
      "description": "Comprehensive health coverage for you and your family",
      "icon": "🏥",
      "image": "http://localhost:8000/media/career/benefits/health_insurance.jpg",
      "order": 1,
      "is_active": true,
      "created_at": "2025-11-04T10:00:00Z",
      "updated_at": "2025-11-04T10:00:00Z"
    }
  ]
}
```

### Get Benefit Details
```http
GET /career/benefits/{id}/
```

### Create Benefit (Staff Only)
```http
POST /career/benefits/
Content-Type: multipart/form-data
```

**Form Data:**
```
title: Learning Budget
description: $1000 annual learning and development budget
icon: 📚
image: [FILE]
order: 5
is_active: true
```

### Update Benefit (Staff Only)
```http
PUT /career/benefits/{id}/
PATCH /career/benefits/{id}/
```

### Delete Benefit (Staff Only)
```http
DELETE /career/benefits/{id}/
```

---

## Career Testimonials

### List All Testimonials
```http
GET /career/testimonials/
```

**Query Parameters:**
- `department` - Filter by department ID
- `is_active` - Filter: `true` or `false`
- `ordering` - Sort by: `order`, `created_at`, `rating`, `-created_at`, etc.

**Response:**
```json
{
  "count": 8,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "employee_name": "Sarah Chen",
      "job_title": "Senior Product Manager",
      "department": 2,
      "department_name": "Product",
      "photo": "http://localhost:8000/media/career/testimonials/sarah_chen.jpg",
      "quote": "Working at GoEvent has been an incredible journey. The team is supportive and the work is meaningful.",
      "rating": 5,
      "order": 1,
      "is_active": true,
      "created_at": "2025-11-04T10:00:00Z",
      "updated_at": "2025-11-04T10:00:00Z"
    }
  ]
}
```

### Get Testimonial Details
```http
GET /career/testimonials/{id}/
```

### Create Testimonial (Staff Only)
```http
POST /career/testimonials/
Content-Type: multipart/form-data
```

**Form Data:**
```
employee_name: David Kim
job_title: Lead Engineer
department_id: 1
photo: [FILE]
quote: Amazing company culture and great opportunities to grow!
rating: 5
order: 2
is_active: true
```

### Update Testimonial (Staff Only)
```http
PUT /career/testimonials/{id}/
PATCH /career/testimonials/{id}/
```

### Delete Testimonial (Staff Only)
```http
DELETE /career/testimonials/{id}/
```

---

## Career Page Settings

### Get Settings (Public)
```http
GET /career/settings/
```

**Alternative Public Endpoint:**
```http
GET /career/settings/public/
```

**Response:**
```json
{
  "id": 1,
  "hero_title": "Join Our Team",
  "hero_subtitle": "Build the future with us",
  "hero_image": "http://localhost:8000/media/career/hero/team_photo.jpg",
  "hero_video_url": "https://youtube.com/embed/xyz123",
  "about_title": "About GoEvent",
  "about_content": "We're a passionate team building the future of event management...",
  "cta_text": "Ready to make an impact?",
  "cta_button_text": "View Open Positions",
  "career_email": "careers@goevent.com",
  "career_phone": "+855 12 345 678",
  "meta_title": "Careers at GoEvent - Join Our Team",
  "meta_description": "Explore exciting career opportunities at GoEvent...",
  "linkedin_url": "https://linkedin.com/company/goevent",
  "facebook_url": "https://facebook.com/goevent",
  "twitter_url": "https://twitter.com/goevent",
  "instagram_url": "https://instagram.com/goevent",
  "show_stats": true,
  "stat_employees_count": 50,
  "stat_offices_count": 3,
  "stat_countries_count": 2,
  "updated_at": "2025-11-04T10:00:00Z"
}
```

### Update Settings (Staff Only)
```http
PATCH /career/settings/1/
Content-Type: multipart/form-data
```

**Form Data:**
```
hero_title: Join Our Amazing Team
hero_subtitle: Build innovative solutions
hero_image: [FILE]
about_title: Why GoEvent?
about_content: Our mission is to revolutionize event management...
cta_text: Start Your Journey
cta_button_text: Explore Opportunities
career_email: jobs@goevent.com
career_phone: +855 12 345 678
show_stats: true
stat_employees_count: 75
stat_offices_count: 4
stat_countries_count: 3
```

**Note:** Settings is a singleton model (only one instance exists with ID=1).

---

## Error Handling

### Common HTTP Status Codes

**200 OK** - Request successful
```json
{
  "id": 1,
  "title": "Senior Backend Engineer",
  ...
}
```

**201 Created** - Resource created successfully
```json
{
  "message": "Application submitted successfully!",
  "application": { ... }
}
```

**400 Bad Request** - Validation errors
```json
{
  "email": ["This field is required."],
  "resume": ["File extension not allowed. Allowed: pdf, doc, docx"]
}
```

**401 Unauthorized** - Authentication required
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden** - Insufficient permissions
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found** - Resource doesn't exist
```json
{
  "detail": "Not found."
}
```

**500 Internal Server Error** - Server error
```json
{
  "detail": "Internal server error."
}
```

### Validation Errors

**Duplicate Application:**
```json
{
  "non_field_errors": [
    "You have already applied for this position with this email address."
  ]
}
```

**Invalid File Type:**
```json
{
  "resume": [
    "File extension "txt" is not allowed. Allowed extensions are: pdf, doc, docx."
  ]
}
```

---

## Examples

### Example 1: Display Career Page

**Step 1: Fetch Settings**
```javascript
const settings = await fetch('/api/core-data/career/settings/public/')
  .then(res => res.json());
```

**Step 2: Fetch Departments**
```javascript
const departments = await fetch('/api/core-data/career/departments/')
  .then(res => res.json());
```

**Step 3: Fetch Featured Positions**
```javascript
const featured = await fetch('/api/core-data/career/positions/featured/')
  .then(res => res.json());
```

**Step 4: Fetch Benefits**
```javascript
const benefits = await fetch('/api/core-data/career/benefits/')
  .then(res => res.json());
```

**Step 5: Fetch Testimonials**
```javascript
const testimonials = await fetch('/api/core-data/career/testimonials/')
  .then(res => res.json());
```

### Example 2: Job Listings Page

**Fetch with filters:**
```javascript
const url = new URL('/api/core-data/career/positions/', window.location.origin);
url.searchParams.append('department', '1');
url.searchParams.append('employment_type', 'full_time');
url.searchParams.append('location_type', 'remote');
url.searchParams.append('search', 'engineer');
url.searchParams.append('ordering', '-created_at');

const positions = await fetch(url).then(res => res.json());
```

### Example 3: Job Detail Page

**Fetch position by slug:**
```javascript
const slug = 'senior-backend-engineer';
const position = await fetch(`/api/core-data/career/positions/${slug}/`)
  .then(res => res.json());

// Display position details
console.log(position.title);
console.log(position.description);
console.log(position.salary_range_min, position.salary_range_max);
```

### Example 4: Submit Application

**Using FormData:**
```javascript
const formData = new FormData();
formData.append('position', positionId);
formData.append('first_name', 'John');
formData.append('last_name', 'Doe');
formData.append('email', 'john.doe@example.com');
formData.append('phone', '+855123456789');
formData.append('cover_letter', coverLetterText);
formData.append('resume', resumeFile); // File object from input
formData.append('portfolio_url', 'https://johndoe.dev');
formData.append('linkedin_url', 'https://linkedin.com/in/johndoe');
formData.append('current_location', 'Phnom Penh, Cambodia');
formData.append('willing_to_relocate', 'true');
formData.append('available_start_date', '2025-12-01');
formData.append('salary_expectation', '3000.00');

const response = await fetch('/api/core-data/career/applications/', {
  method: 'POST',
  body: formData
});

if (response.ok) {
  const result = await response.json();
  console.log(result.message);
  // Show success message
} else {
  const errors = await response.json();
  console.error(errors);
  // Display validation errors
}
```

### Example 5: Admin - Update Application Status

**With authentication:**
```javascript
const token = localStorage.getItem('access_token');

const response = await fetch(`/api/core-data/career/applications/${applicationId}/update_status/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'interview',
    notes: 'Interview scheduled for next Monday at 10 AM'
  })
});

const result = await response.json();
console.log(result.message); // "Application status updated to Interview Scheduled"
```

### Example 6: Filter Positions by Department

**React example:**
```javascript
const [selectedDept, setSelectedDept] = useState(null);
const [positions, setPositions] = useState([]);

useEffect(() => {
  const url = selectedDept
    ? `/api/core-data/career/positions/?department=${selectedDept}`
    : '/api/core-data/career/positions/';

  fetch(url)
    .then(res => res.json())
    .then(data => setPositions(data.results));
}, [selectedDept]);
```

### Example 7: Search Positions

**Search with debounce:**
```javascript
const searchPositions = async (query) => {
  if (!query) return;

  const url = `/api/core-data/career/positions/?search=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  const data = await response.json();

  return data.results;
};

// Usage with debounce
let debounceTimer;
searchInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchPositions(e.target.value).then(results => {
      displayResults(results);
    });
  }, 300);
});
```

---

## Data Models Reference

### Employment Types
- `full_time` - Full-Time
- `part_time` - Part-Time
- `contract` - Contract
- `internship` - Internship
- `freelance` - Freelance

### Experience Levels
- `entry` - Entry Level
- `junior` - Junior
- `mid` - Mid-Level
- `senior` - Senior
- `lead` - Lead
- `manager` - Manager
- `director` - Director

### Location Types
- `onsite` - On-site
- `remote` - Remote
- `hybrid` - Hybrid

### Application Status
- `new` - New
- `reviewing` - Reviewing
- `shortlisted` - Shortlisted
- `interview` - Interview Scheduled
- `offer` - Offer Extended
- `hired` - Hired
- `rejected` - Rejected
- `withdrawn` - Withdrawn

---

## Best Practices

### 1. File Uploads
Always use `FormData` for endpoints that accept file uploads (applications, benefits, testimonials, settings).

### 2. Pagination
Handle pagination properly:
```javascript
let allPositions = [];
let nextUrl = '/api/core-data/career/positions/';

while (nextUrl) {
  const response = await fetch(nextUrl);
  const data = await response.json();
  allPositions = [...allPositions, ...data.results];
  nextUrl = data.next;
}
```

### 3. Error Handling
Always handle errors gracefully:
```javascript
try {
  const response = await fetch(url);
  if (!response.ok) {
    const errors = await response.json();
    // Display user-friendly error messages
    handleErrors(errors);
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Network error:', error);
  // Show offline message
}
```

### 4. Caching
Cache settings and departments as they don't change frequently:
```javascript
// Cache for 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

const getCachedData = async (key, fetchFn) => {
  const cached = localStorage.getItem(key);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  const data = await fetchFn();
  localStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
  return data;
};

// Usage
const settings = await getCachedData('career_settings', () =>
  fetch('/api/core-data/career/settings/public/').then(r => r.json())
);
```

### 5. SEO Optimization
Use the settings data for meta tags:
```javascript
const settings = await fetch('/api/core-data/career/settings/public/')
  .then(r => r.json());

document.title = settings.meta_title || 'Careers';
document.querySelector('meta[name="description"]')
  .setAttribute('content', settings.meta_description);
```

---

## Support

For API issues or questions:
- Email: dev@goevent.com
- Documentation: https://docs.goevent.online
- GitHub Issues: https://github.com/goevent/api/issues
