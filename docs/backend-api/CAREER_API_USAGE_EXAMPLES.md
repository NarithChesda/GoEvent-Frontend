# Career API Usage Examples

This document provides practical examples of how to use the career API services in the GoEvent application.

## Table of Contents

1. [Importing Services](#importing-services)
2. [Career Departments](#career-departments)
3. [Career Positions](#career-positions)
4. [Career Applications](#career-applications)
5. [Career Benefits](#career-benefits)
6. [Career Testimonials](#career-testimonials)
7. [Career Page Settings](#career-page-settings)
8. [Error Handling](#error-handling)
9. [Vue Component Examples](#vue-component-examples)

---

## Importing Services

### Import from main API file (recommended for consistency)

```typescript
import {
  careerDepartmentsService,
  careerPositionsService,
  careerApplicationsService,
  careerBenefitsService,
  careerTestimonialsService,
  careerSettingsService,
  type CareerDepartment,
  type CareerPosition,
  type CareerApplication,
  type CareerBenefit,
  type CareerTestimonial,
  type CareerPageSettings,
} from '@/services/api'
```

### Direct import from modules (tree-shakeable)

```typescript
import { careerPositionsService } from '@/services/api/modules/career.service'
import type { CareerPosition, PositionFilters } from '@/services/api/types'
```

---

## Career Departments

### Fetch all departments

```typescript
// Basic fetch
const response = await careerDepartmentsService.getDepartments()
if (response.success && response.data) {
  const departments = response.data.results
  console.log(`Total departments: ${response.data.count}`)
  departments.forEach(dept => {
    console.log(`${dept.icon} ${dept.name} - ${dept.positions_count} positions`)
  })
}

// With filters
const filteredResponse = await careerDepartmentsService.getDepartments({
  search: 'engineering',
  ordering: 'order'
})
```

### Get single department

```typescript
const response = await careerDepartmentsService.getDepartment(1)
if (response.success && response.data) {
  const department = response.data
  console.log(`Department: ${department.name}`)
  console.log(`Description: ${department.description}`)
}
```

### Create department (staff only)

```typescript
const response = await careerDepartmentsService.createDepartment({
  name: 'Product Management',
  description: 'Drive product strategy and vision',
  icon: '🎯',
  order: 3,
  is_active: true
})

if (response.success && response.data) {
  console.log('Department created:', response.data.id)
} else {
  console.error('Error:', response.message)
}
```

### Update department (staff only)

```typescript
// Full update
await careerDepartmentsService.updateDepartment(1, {
  name: 'Engineering & Technology',
  description: 'Updated description',
  icon: '💻',
  order: 1,
  is_active: true
})

// Partial update
await careerDepartmentsService.patchDepartment(1, {
  description: 'New description only'
})
```

### Delete department (staff only)

```typescript
const response = await careerDepartmentsService.deleteDepartment(1)
if (response.success) {
  console.log('Department deleted successfully')
}
```

---

## Career Positions

### Fetch all positions with filters

```typescript
const response = await careerPositionsService.getPositions({
  department: 1,
  employment_type: 'full_time',
  location_type: 'remote',
  experience_level: 'senior',
  featured: true,
  search: 'engineer',
  ordering: '-created_at'
})

if (response.success && response.data) {
  const positions = response.data.results
  console.log(`Found ${response.data.count} positions`)

  positions.forEach(pos => {
    console.log(`${pos.title} - ${pos.location}`)
    console.log(`  Department: ${pos.department.name}`)
    console.log(`  Type: ${pos.employment_type_display}`)
    console.log(`  Views: ${pos.views_count}`)
  })
}
```

### Get single position by slug

```typescript
// This automatically increments view count
const response = await careerPositionsService.getPosition('senior-backend-engineer')
if (response.success && response.data) {
  const position = response.data
  console.log(`Position: ${position.title}`)
  console.log(`Department: ${position.department.name}`)
  console.log(`Description: ${position.description}`)
  console.log(`Salary: ${position.salary_range_min} - ${position.salary_range_max} ${position.salary_currency}`)
  console.log(`Views: ${position.views_count}`)
}
```

### Get featured positions

```typescript
const response = await careerPositionsService.getFeaturedPositions()
if (response.success && response.data) {
  const featured = response.data // Array, not paginated
  console.log(`${featured.length} featured positions`)
}
```

### Search positions

```typescript
const response = await careerPositionsService.searchPositions('frontend developer')
if (response.success && response.data) {
  const results = response.data.results
  console.log(`Search found ${response.data.count} positions`)
}
```

### Create position (staff only)

```typescript
const response = await careerPositionsService.createPosition({
  title: 'Senior Frontend Engineer',
  department_id: 1,
  employment_type: 'full_time',
  experience_level: 'senior',
  location_type: 'remote',
  location: 'Remote',
  short_description: 'Build beautiful user interfaces with React and TypeScript',
  description: 'Full job description here...',
  responsibilities: '- Build React applications\n- Write clean code\n- Mentor junior developers',
  requirements: '- 5+ years React experience\n- TypeScript proficiency\n- Strong communication',
  nice_to_have: '- Next.js experience\n- GraphQL knowledge',
  salary_range_min: '2500.00',
  salary_range_max: '4000.00',
  salary_currency: 'USD',
  benefits: '- Health insurance\n- Stock options\n- Remote work',
  application_deadline: '2025-12-31',
  contact_email: 'careers@goevent.com',
  featured: true,
  is_active: true,
  order: 0
})

if (response.success && response.data) {
  console.log('Position created with slug:', response.data.slug)
}
```

### Update position (staff only)

```typescript
// Full update
await careerPositionsService.updatePosition('senior-frontend-engineer', {
  // All fields required
})

// Partial update (recommended)
await careerPositionsService.patchPosition('senior-frontend-engineer', {
  featured: true,
  application_deadline: '2026-01-31'
})
```

---

## Career Applications

### Submit application (public)

```typescript
// Create FormData
const formData = new FormData()
formData.append('position', '1')
formData.append('first_name', 'John')
formData.append('last_name', 'Doe')
formData.append('email', 'john.doe@example.com')
formData.append('phone', '+855123456789')
formData.append('cover_letter', 'I am excited to apply for this position...')
formData.append('resume', resumeFile) // File object from <input type="file">
formData.append('portfolio_url', 'https://johndoe.dev')
formData.append('linkedin_url', 'https://linkedin.com/in/johndoe')
formData.append('current_location', 'Phnom Penh, Cambodia')
formData.append('willing_to_relocate', 'true')
formData.append('available_start_date', '2025-12-01')
formData.append('salary_expectation', '3000.00')

const response = await careerApplicationsService.submitApplication(formData)

if (response.success && response.data) {
  console.log(response.data.message) // Success message
  console.log('Application ID:', response.data.application.id)
} else {
  // Handle validation errors
  console.error('Error:', response.message)
  if (response.errors) {
    Object.entries(response.errors).forEach(([field, messages]) => {
      console.error(`${field}:`, messages)
    })
  }
}
```

### Get all applications (staff only)

```typescript
const response = await careerApplicationsService.getApplications({
  position: 1,
  status: 'new',
  search: 'john',
  ordering: '-applied_at'
})

if (response.success && response.data) {
  const applications = response.data.results
  console.log(`Total applications: ${response.data.count}`)

  applications.forEach(app => {
    console.log(`${app.full_name} - ${app.position_title}`)
    console.log(`  Status: ${app.status_display}`)
    console.log(`  Applied: ${new Date(app.applied_at).toLocaleDateString()}`)
  })
}
```

### Get single application (staff only)

```typescript
const response = await careerApplicationsService.getApplication(1)
if (response.success && response.data) {
  const app = response.data
  console.log('Applicant:', app.full_name)
  console.log('Resume:', app.resume)
  console.log('Cover Letter:', app.cover_letter)
}
```

### Update application status (staff only)

```typescript
const response = await careerApplicationsService.updateApplicationStatus(1, {
  status: 'interview',
  notes: 'Interview scheduled for next Monday at 10 AM'
})

if (response.success && response.data) {
  console.log(response.data.message) // "Application status updated to Interview Scheduled"
  console.log('Reviewed by:', response.data.application.reviewed_by_name)
}
```

---

## Career Benefits

### Fetch all benefits

```typescript
const response = await careerBenefitsService.getBenefits({
  ordering: 'order'
})

if (response.success && response.data) {
  const benefits = response.data.results
  benefits.forEach(benefit => {
    console.log(`${benefit.icon} ${benefit.title}`)
    console.log(`  ${benefit.description}`)
  })
}
```

### Create benefit with image (staff only)

```typescript
const formData = new FormData()
formData.append('title', 'Learning Budget')
formData.append('description', '$1000 annual learning and development budget')
formData.append('icon', '📚')
formData.append('image', imageFile) // File object from <input type="file">
formData.append('order', '5')
formData.append('is_active', 'true')

const response = await careerBenefitsService.createBenefit(formData)
if (response.success && response.data) {
  console.log('Benefit created:', response.data.id)
  console.log('Image URL:', response.data.image)
}
```

### Update benefit (staff only)

```typescript
const formData = new FormData()
formData.append('description', 'Updated description')
formData.append('is_active', 'false')

await careerBenefitsService.patchBenefit(1, formData)
```

---

## Career Testimonials

### Fetch testimonials with filters

```typescript
const response = await careerTestimonialsService.getTestimonials({
  department: 1,
  is_active: true,
  ordering: '-rating'
})

if (response.success && response.data) {
  const testimonials = response.data.results
  testimonials.forEach(testimonial => {
    console.log(`${testimonial.employee_name} - ${testimonial.job_title}`)
    console.log(`  Department: ${testimonial.department_name}`)
    console.log(`  Rating: ${testimonial.rating}/5`)
    console.log(`  "${testimonial.quote}"`)
  })
}
```

### Create testimonial with photo (staff only)

```typescript
const formData = new FormData()
formData.append('employee_name', 'David Kim')
formData.append('job_title', 'Lead Engineer')
formData.append('department_id', '1')
formData.append('photo', photoFile) // File object
formData.append('quote', 'Amazing company culture and great opportunities to grow!')
formData.append('rating', '5')
formData.append('order', '2')
formData.append('is_active', 'true')

const response = await careerTestimonialsService.createTestimonial(formData)
if (response.success && response.data) {
  console.log('Testimonial created:', response.data.id)
  console.log('Photo URL:', response.data.photo)
}
```

---

## Career Page Settings

### Get settings (public)

```typescript
// Method 1
const response = await careerSettingsService.getSettings()

// Method 2 (alternative endpoint)
const response = await careerSettingsService.getPublicSettings()

if (response.success && response.data) {
  const settings = response.data
  console.log('Hero Title:', settings.hero_title)
  console.log('Hero Subtitle:', settings.hero_subtitle)
  console.log('Show Stats:', settings.show_stats)

  if (settings.show_stats) {
    console.log(`${settings.stat_employees_count} employees`)
    console.log(`${settings.stat_offices_count} offices`)
    console.log(`${settings.stat_countries_count} countries`)
  }
}
```

### Update settings (staff only)

```typescript
const formData = new FormData()
formData.append('hero_title', 'Join Our Amazing Team')
formData.append('hero_subtitle', 'Build innovative solutions')
formData.append('hero_image', heroImageFile) // Optional
formData.append('hero_video_url', 'https://youtube.com/embed/xyz')
formData.append('about_title', 'Why GoEvent?')
formData.append('about_content', 'Our mission is to revolutionize event management...')
formData.append('cta_text', 'Start Your Journey')
formData.append('cta_button_text', 'Explore Opportunities')
formData.append('career_email', 'jobs@goevent.com')
formData.append('career_phone', '+855 12 345 678')
formData.append('show_stats', 'true')
formData.append('stat_employees_count', '75')
formData.append('stat_offices_count', '4')
formData.append('stat_countries_count', '3')

const response = await careerSettingsService.updateSettings(formData)
if (response.success && response.data) {
  console.log('Settings updated successfully')
}
```

---

## Error Handling

### Standard error handling pattern

```typescript
const response = await careerPositionsService.getPositions()

if (!response.success) {
  // User-friendly error message
  console.error('Error:', response.message)

  // Field-specific errors (for forms)
  if (response.errors) {
    Object.entries(response.errors).forEach(([field, messages]) => {
      console.error(`${field}:`, messages.join(', '))
    })
  }

  return
}

// Success - response.data is guaranteed to exist
const positions = response.data.results
```

### Handling validation errors

```typescript
const formData = new FormData()
// ... populate formData

const response = await careerApplicationsService.submitApplication(formData)

if (!response.success) {
  if (response.errors) {
    // Display field-specific errors
    const errors = response.errors

    if (errors.email) {
      console.error('Email error:', errors.email[0])
    }

    if (errors.resume) {
      console.error('Resume error:', errors.resume[0])
    }

    if (errors.non_field_errors) {
      console.error('General error:', errors.non_field_errors[0])
      // e.g., "You have already applied for this position"
    }
  } else {
    console.error('Error:', response.message)
  }
}
```

---

## Vue Component Examples

### Career Positions List Component

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  careerPositionsService,
  careerDepartmentsService,
  type CareerPosition,
  type CareerDepartment,
  type PositionFilters
} from '@/services/api'

const positions = ref<CareerPosition[]>([])
const departments = ref<CareerDepartment[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const totalCount = ref(0)

// Filters
const filters = ref<PositionFilters>({
  department: undefined,
  employment_type: undefined,
  location_type: undefined,
  search: '',
  ordering: '-created_at'
})

async function loadDepartments() {
  const response = await careerDepartmentsService.getDepartments()
  if (response.success && response.data) {
    departments.value = response.data.results
  }
}

async function loadPositions() {
  loading.value = true
  error.value = null

  const response = await careerPositionsService.getPositions(filters.value)

  if (response.success && response.data) {
    positions.value = response.data.results
    totalCount.value = response.data.count
  } else {
    error.value = response.message || 'Failed to load positions'
  }

  loading.value = false
}

async function applyFilters() {
  await loadPositions()
}

onMounted(() => {
  loadDepartments()
  loadPositions()
})
</script>

<template>
  <div>
    <h1>Career Positions</h1>

    <!-- Filters -->
    <div class="filters">
      <select v-model="filters.department" @change="applyFilters">
        <option :value="undefined">All Departments</option>
        <option v-for="dept in departments" :key="dept.id" :value="dept.id">
          {{ dept.name }}
        </option>
      </select>

      <select v-model="filters.employment_type" @change="applyFilters">
        <option :value="undefined">All Types</option>
        <option value="full_time">Full-Time</option>
        <option value="part_time">Part-Time</option>
        <option value="remote">Remote</option>
      </select>

      <input
        v-model="filters.search"
        type="text"
        placeholder="Search positions..."
        @input="applyFilters"
      />
    </div>

    <!-- Loading/Error States -->
    <div v-if="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- Results -->
    <div v-else>
      <p>{{ totalCount }} positions found</p>

      <div v-for="position in positions" :key="position.id" class="position-card">
        <h3>{{ position.title }}</h3>
        <p>{{ position.department.name }} • {{ position.location }}</p>
        <p>{{ position.short_description }}</p>
        <p>{{ position.employment_type_display }} • {{ position.experience_level_display }}</p>
        <router-link :to="`/careers/${position.slug}`">
          View Details
        </router-link>
      </div>
    </div>
  </div>
</template>
```

### Job Application Form Component

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { careerApplicationsService } from '@/services/api'

const props = defineProps<{
  positionId: number
}>()

const formData = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  cover_letter: '',
  portfolio_url: '',
  linkedin_url: '',
  current_location: '',
  willing_to_relocate: false,
  available_start_date: '',
  salary_expectation: ''
})

const resumeFile = ref<File | null>(null)
const submitting = ref(false)
const submitted = ref(false)
const errors = ref<Record<string, string[]>>({})
const successMessage = ref('')

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    resumeFile.value = target.files[0]
  }
}

async function submitApplication() {
  if (!resumeFile.value) {
    alert('Please select a resume file')
    return
  }

  submitting.value = true
  errors.value = {}

  // Create FormData
  const data = new FormData()
  data.append('position', String(props.positionId))
  data.append('first_name', formData.value.first_name)
  data.append('last_name', formData.value.last_name)
  data.append('email', formData.value.email)
  data.append('phone', formData.value.phone)
  data.append('cover_letter', formData.value.cover_letter)
  data.append('resume', resumeFile.value)
  data.append('portfolio_url', formData.value.portfolio_url)
  data.append('linkedin_url', formData.value.linkedin_url)
  data.append('current_location', formData.value.current_location)
  data.append('willing_to_relocate', String(formData.value.willing_to_relocate))
  data.append('available_start_date', formData.value.available_start_date)
  data.append('salary_expectation', formData.value.salary_expectation)

  const response = await careerApplicationsService.submitApplication(data)

  if (response.success && response.data) {
    submitted.value = true
    successMessage.value = response.data.message
  } else {
    if (response.errors) {
      errors.value = response.errors
    } else {
      alert(response.message || 'Failed to submit application')
    }
  }

  submitting.value = false
}
</script>

<template>
  <div v-if="submitted" class="success">
    <h2>Application Submitted!</h2>
    <p>{{ successMessage }}</p>
  </div>

  <form v-else @submit.prevent="submitApplication">
    <div>
      <label>First Name *</label>
      <input v-model="formData.first_name" type="text" required />
      <span v-if="errors.first_name" class="error">{{ errors.first_name[0] }}</span>
    </div>

    <div>
      <label>Last Name *</label>
      <input v-model="formData.last_name" type="text" required />
      <span v-if="errors.last_name" class="error">{{ errors.last_name[0] }}</span>
    </div>

    <div>
      <label>Email *</label>
      <input v-model="formData.email" type="email" required />
      <span v-if="errors.email" class="error">{{ errors.email[0] }}</span>
    </div>

    <div>
      <label>Phone *</label>
      <input v-model="formData.phone" type="tel" required />
      <span v-if="errors.phone" class="error">{{ errors.phone[0] }}</span>
    </div>

    <div>
      <label>Resume * (PDF, DOC, DOCX)</label>
      <input type="file" accept=".pdf,.doc,.docx" @change="handleFileChange" required />
      <span v-if="errors.resume" class="error">{{ errors.resume[0] }}</span>
    </div>

    <div>
      <label>Cover Letter *</label>
      <textarea v-model="formData.cover_letter" rows="5" required></textarea>
      <span v-if="errors.cover_letter" class="error">{{ errors.cover_letter[0] }}</span>
    </div>

    <div>
      <label>Portfolio URL</label>
      <input v-model="formData.portfolio_url" type="url" />
    </div>

    <div>
      <label>LinkedIn URL</label>
      <input v-model="formData.linkedin_url" type="url" />
    </div>

    <div>
      <label>Willing to Relocate?</label>
      <input v-model="formData.willing_to_relocate" type="checkbox" />
    </div>

    <div v-if="errors.non_field_errors" class="error">
      {{ errors.non_field_errors[0] }}
    </div>

    <button type="submit" :disabled="submitting">
      {{ submitting ? 'Submitting...' : 'Submit Application' }}
    </button>
  </form>
</template>
```

---

## Best Practices

1. **Always check response.success** before accessing response.data
2. **Use TypeScript types** for better IDE autocomplete and type safety
3. **Handle errors gracefully** with user-friendly messages
4. **Use FormData** for file uploads (applications, benefits, testimonials, settings)
5. **Cache department data** as it doesn't change frequently
6. **Use query parameters** for filtering and pagination
7. **Implement loading states** for better UX
8. **Validate forms** before submission to reduce API calls
9. **Use public endpoints** (getPublic) for unauthenticated requests
10. **Handle field-specific errors** for form validation feedback

---

## Additional Resources

- [Career API Documentation](./CAREER_API_DOCUMENTATION.md)
- [Main API Documentation](./CLAUDE.md#api-layer-architecture)
- [TypeScript Types](./src/services/api/types/career.types.ts)
- [Service Implementation](./src/services/api/modules/career.service.ts)
