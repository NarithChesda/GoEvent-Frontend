# GoEvent Component Library

## Component Philosophy

Our component library prioritizes consistency, accessibility, and reusability. Every component follows our core design principles and provides clear, predictable interactions that users can learn once and apply everywhere.

## Button System

### Design Principles
1. **Clear Hierarchy**: Primary → Secondary → Tertiary → Danger
2. **Maximum 4 Variants**: Prevents decision paralysis
3. **Consistent States**: Hover, focus, active, disabled, loading
4. **Accessibility First**: Proper contrast, focus indicators, touch targets

### Button Variants

#### 1. Primary Button
**Usage**: Main actions, CTAs, form submissions (limit 1-2 per page)

```css
.btn-primary {
  background: linear-gradient(to right, #2563eb, #9333ea);
  color: white;
  font-weight: 600;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgb(37 99 235 / 0.25);
  transition: all 200ms ease-out;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: linear-gradient(to right, #1d4ed8, #7c3aed);
  box-shadow: 0 20px 25px -5px rgb(37 99 235 / 0.3);
  transform: translateY(-1px);
}

.btn-primary:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgb(37 99 235 / 0.5), 0 0 0 2px white;
}

.btn-primary:active {
  transform: scale(0.98);
  box-shadow: 0 4px 6px -1px rgb(37 99 235 / 0.25);
}
```

#### 2. Secondary Button  
**Usage**: Alternative actions, cancel buttons

```css
.btn-secondary {
  background: white;
  color: #2563eb;
  font-weight: 600;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  border: 2px solid #bfdbfe;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  cursor: pointer;
  transition: all 200ms ease-out;
}

.btn-secondary:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transform: translateY(-1px);
}

.btn-secondary:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgb(37 99 235 / 0.5), 0 0 0 2px white;
}
```

#### 3. Tertiary/Ghost Button
**Usage**: Low-priority actions, navigation

```css
.btn-tertiary {
  background: transparent;
  color: #334155;
  font-weight: 500;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 200ms ease-out;
}

.btn-tertiary:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.btn-tertiary:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgb(100 116 139 / 0.5);
}
```

#### 4. Danger Button
**Usage**: Destructive actions (delete, remove)

```css
.btn-danger {
  background: #dc2626;
  color: white;
  font-weight: 600;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  border: none;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  cursor: pointer;
  transition: all 200ms ease-out;
}

.btn-danger:hover {
  background: #b91c1c;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transform: translateY(-1px);
}

.btn-danger:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgb(220 38 38 / 0.5), 0 0 0 2px white;
}
```

### Button Sizes

```css
.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  min-height: 2rem;
}

.btn-md {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  min-height: 2.5rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  min-height: 3rem;
}
```

### Button States

```css
/* Disabled */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Loading */
.btn-loading {
  pointer-events: none;
  position: relative;
}

.btn-loading .btn-text {
  opacity: 0;
}

.btn-loading::after {
  content: '';
  position: absolute;
  width: 1rem;
  height: 1rem;
  top: 50%;
  left: 50%;
  margin: -0.5rem 0 0 -0.5rem;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: button-spin 1s linear infinite;
}

@keyframes button-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## Form Components

### Input Fields

#### Base Input
```css
.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  color: #1e293b;
  font-weight: 500;
  font-size: 1rem;
  transition: all 200ms ease-out;
}

.form-input::placeholder {
  color: #94a3b8;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1);
}

.form-input:disabled {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
}
```

#### Input States
```css
/* Error state */
.form-input-error {
  border-color: #ef4444;
  background: rgba(254, 242, 242, 0.8);
}

.form-input-error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgb(239 68 68 / 0.1);
}

/* Success state */
.form-input-success {
  border-color: #10b981;
  background: rgba(236, 253, 245, 0.8);
}

.form-input-success:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgb(16 185 129 / 0.1);
}
```

### Labels and Helper Text

```css
.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.form-helper {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.5rem;
}

.form-error-message {
  font-size: 0.875rem;
  color: #dc2626;
  font-weight: 500;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
```

### Select Dropdown

```css
.form-select {
  width: 100%;
  padding: 0.75rem 3rem 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.8) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e") no-repeat right 0.75rem center/1.5em 1.5em;
  backdrop-filter: blur(8px);
  color: #1e293b;
  font-weight: 500;
  cursor: pointer;
  appearance: none;
}

.form-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%232563eb' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
}
```

## Card System

### Base Card Component

```css
.card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  border: 1px solid #f1f5f9;
  overflow: hidden;
  transition: all 300ms ease-out;
}

.card-interactive {
  cursor: pointer;
}

.card-interactive:hover {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  transform: translateY(-2px);
}

.card-interactive:active {
  transform: translateY(0);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
```

### Card Content Structure

```css
.card-header {
  padding: 1.5rem 1.5rem 0;
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 0 1.5rem 1.5rem;
  border-top: 1px solid #f1f5f9;
  margin-top: 1rem;
  padding-top: 1rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.375;
  margin-bottom: 0.5rem;
}

.card-description {
  font-size: 1rem;
  color: #334155;
  line-height: 1.625;
}

.card-meta {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}
```

### Card Actions

```css
.card-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 200ms ease-out;
}

.card:hover .card-actions {
  opacity: 1;
}

.card-action-button {
  padding: 0.5rem;
  color: #94a3b8;
  border-radius: 0.5rem;
  transition: all 200ms ease-out;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-action-button:hover {
  background: #f1f5f9;
  color: #334155;
}

.card-action-button.edit:hover {
  background: #dbeafe;
  color: #2563eb;
}

.card-action-button.delete:hover {
  background: #fee2e2;
  color: #dc2626;
}
```

## Modal System

### Modal Container

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  border: 1px solid rgba(255, 255, 255, 0.5);
  width: 100%;
  max-width: 32rem;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}
```

### Modal Content

```css
.modal-header {
  padding: 2rem 2rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.modal-close {
  padding: 0.5rem;
  color: #94a3b8;
  hover: color: #334155;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 200ms ease-out;
}

.modal-close:hover {
  background: #f1f5f9;
}

.modal-body {
  padding: 2rem;
}

.modal-footer {
  padding: 0 2rem 2rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
```

## Navigation Components

### Navigation Bar

```css
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(37, 99, 235, 0.1);
  box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.1);
  position: sticky;
  top: 0;
  z-index: 1200;
  transition: all 300ms ease-out;
}

.navbar-container {
  max-width: 80rem;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #2563eb, #9333ea);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-decoration: none;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.navbar-link {
  color: #64748b;
  font-weight: 500;
  text-decoration: none;
  padding: 0.5rem 0;
  position: relative;
  transition: color 200ms ease-out;
}

.navbar-link:hover {
  color: #2563eb;
}

.navbar-link.active {
  color: #2563eb;
  background: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}
```

### Breadcrumbs

```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 1.5rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-item:not(:last-child)::after {
  content: '/';
  margin: 0 0.5rem;
  color: #cbd5e1;
}

.breadcrumb-link {
  color: #64748b;
  text-decoration: none;
  transition: color 200ms ease-out;
}

.breadcrumb-link:hover {
  color: #2563eb;
}

.breadcrumb-current {
  color: #1e293b;
  font-weight: 500;
}
```

## Feedback Components

### Toast Notifications

```css
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1700;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 24rem;
  width: 100%;
}

.toast {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  border: 1px solid #f1f5f9;
  padding: 1rem;
  transform: translateX(100%);
  transition: all 300ms ease-out;
}

.toast.show {
  transform: translateX(0);
}

.toast-success {
  border-left: 4px solid #10b981;
  background: rgba(236, 253, 245, 0.95);
}

.toast-error {
  border-left: 4px solid #ef4444;
  background: rgba(254, 242, 242, 0.95);
}

.toast-warning {
  border-left: 4px solid #f59e0b;
  background: rgba(255, 251, 235, 0.95);
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.toast-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.toast-body {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

.toast-message {
  color: #334155;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  line-height: 1.5;
}
```

### Loading States

```css
.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200px 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 0.5rem;
}

@keyframes skeleton-loading {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton-text {
  height: 1rem;
  margin-bottom: 0.5rem;
}

.skeleton-text:last-child {
  width: 75%;
  margin-bottom: 0;
}

.skeleton-title {
  height: 1.5rem;
  margin-bottom: 1rem;
}

.skeleton-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
}
```

## Status Indicators

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-primary {
  background: linear-gradient(to right, #dbeafe, #f3e8ff);
  color: #5b21b6;
}

.badge-success {
  background: #d1fae5;
  color: #059669;
}

.badge-warning {
  background: #fed7aa;
  color: #ea580c;
}

.badge-error {
  background: #fecaca;
  color: #dc2626;
}

.badge-neutral {
  background: #f1f5f9;
  color: #475569;
}
```

### Live Indicators

```css
.live-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(to right, #10b981, #059669);
  color: white;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.live-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: #34d399;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

## Usage Guidelines

### Component Composition
1. **Build up from basics**: Start with base components, add modifiers
2. **Consistent spacing**: Use design tokens for all spacing
3. **Predictable states**: Every interactive component should have hover, focus, active, disabled states
4. **Accessibility**: Include ARIA labels, proper contrast, keyboard navigation

### Best Practices
- **Limit variants**: Stick to defined component variants
- **Consistent behavior**: Same components should behave the same everywhere
- **Performance**: Use CSS transforms for animations, avoid layout changes
- **Testing**: Test with keyboard navigation and screen readers

### Implementation Checklist
- [ ] Component follows design tokens
- [ ] All interactive states are defined
- [ ] ARIA labels and roles are included
- [ ] Keyboard navigation works properly
- [ ] Color contrast meets WCAG AA standards
- [ ] Component is responsive across breakpoints
- [ ] Loading and error states are handled

---

*Last updated: [Current Date]*  
*Version: 1.0*