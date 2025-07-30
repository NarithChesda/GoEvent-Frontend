# Event Template Integration Guide

This guide provides step-by-step workflows for integrating the Event Template system into your frontend application, covering the complete user journey from template selection to public showcase.

## Table of Contents

1. [System Overview](#system-overview)
2. [User Roles and Permissions](#user-roles-and-permissions)
3. [Template Selection Workflow](#template-selection-workflow)
4. [Payment Integration Workflow](#payment-integration-workflow)
5. [Public Showcase Implementation](#public-showcase-implementation)
6. [Admin Template Management](#admin-template-management)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

## System Overview

The Event Template system consists of three main components:

1. **Template Selection**: Organizers browse and select templates
2. **Payment Processing**: Integration with payment systems using pricing data
3. **Public Showcase**: Template-styled event pages accessible to everyone

### Data Flow

```
Organizer → Browse Templates → Select Template → Process Payment → Admin Enables → Public Showcase
```

## User Roles and Permissions

### Organizers
- **Can**: Browse templates, select templates for their events
- **Cannot**: Enable templates (requires payment + admin approval)

### Collaborators (Admin/Editor)
- **Can**: Browse templates, select templates for events they collaborate on
- **Cannot**: Enable templates

### Collaborators (Viewer)
- **Can**: View event details including template info
- **Cannot**: Select or change templates

### Public Users
- **Can**: Access template assets for styled showcase pages
- **Cannot**: Browse template catalog or select templates

### Admins
- **Can**: All template operations, enable templates after payment confirmation

## Template Selection Workflow

### Step 1: Browse Available Templates

**Frontend Implementation:**
```javascript
// Get available templates for selection
async function browseTemplates() {
  try {
    const response = await fetch('/api/core-data/event-templates/browse_templates/', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.templates;
    } else {
      throw new Error('Failed to fetch templates');
    }
  } catch (error) {
    console.error('Error browsing templates:', error);
    throw error;
  }
}
```

**UI Considerations:**
- Display template preview images prominently
- Show pricing information clearly
- Group templates by category
- Provide filtering/search functionality
- Show template features as benefits

### Step 2: Select Template for Event

**Frontend Implementation:**
```javascript
async function selectTemplate(eventId, templateId) {
  try {
    const response = await fetch(`/api/events/${eventId}/select_template/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: templateId
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      // Store pricing info for payment processing
      return {
        template: data.template,
        pricingInfo: data.pricing_info
      };
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to select template');
    }
  } catch (error) {
    console.error('Error selecting template:', error);
    throw error;
  }
}
```

**Business Logic:**
- Template selection does NOT enable the template immediately
- `event_template_enabled` remains `false` until payment + admin approval
- Store selected template data for payment processing

## Payment Integration Workflow

### Step 3: Process Payment

**Using Pricing Information:**
```javascript
async function processTemplatePayment(eventId, pricingInfo) {
  const paymentData = {
    amount: pricingInfo.price,
    commission: pricingInfo.commission,
    description: `Template: ${pricingInfo.plan_name}`,
    features: pricingInfo.features,
    eventId: eventId,
    templateId: pricingInfo.template_id
  };
  
  // Integrate with your payment processor (Stripe, PayPal, etc.)
  const paymentResult = await processPayment(paymentData);
  
  if (paymentResult.success) {
    // Notify admin for template enablement
    await notifyAdminForTemplateApproval(eventId, paymentResult.transactionId);
  }
  
  return paymentResult;
}
```

### Step 4: Admin Enablement (Backend Process)

**Admin Workflow:**
1. Receive payment confirmation
2. Verify transaction
3. Update event: `event_template_enabled = True`
4. Notify organizer of template activation

**API Call for Admin:**
```javascript
// Admin enables template after payment verification
async function enableEventTemplate(eventId) {
  const response = await fetch(`/api/events/${eventId}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event_template_enabled: true
    })
  });
  
  return response.json();
}
```

## Public Showcase Implementation

### Step 5: Template-Styled Event Pages

**Fetch Template Assets (No Auth Required):**
```javascript
async function getTemplateAssets(templateId) {
  try {
    const response = await fetch(`/api/core-data/event-templates/${templateId}/public_template_assets/`);
    
    if (response.ok) {
      const data = await response.json();
      return data.template_data;
    } else {
      throw new Error('Template not found');
    }
  } catch (error) {
    console.error('Error fetching template assets:', error);
    return null;
  }
}
```

**Apply Template Styling:**
```javascript
async function renderEventShowcase(eventId) {
  // Get event details
  const event = await fetchEventDetails(eventId);
  
  // Check if template is enabled
  if (event.event_template_enabled && event.event_template) {
    // Get template assets
    const templateAssets = await getTemplateAssets(event.event_template);
    
    if (templateAssets) {
      // Apply template styling
      applyTemplateStyles(templateAssets);
      loadTemplateAssets(templateAssets.assets);
    }
  }
  
  // Render event with or without template
  renderEvent(event);
}

function applyTemplateStyles(templateData) {
  // Apply color palette
  templateData.colors.forEach(color => {
    document.documentElement.style.setProperty(
      `--template-${color.name.toLowerCase().replace(' ', '-')}`, 
      color.hex_color_code
    );
  });
  
  // Load custom fonts
  templateData.fonts.forEach(font => {
    loadCustomFont(font.font.name, font.font.font_file);
  });
}

function loadTemplateAssets(assets) {
  // Set background images/videos
  if (assets.basic_background_photo) {
    document.body.style.backgroundImage = `url(${assets.basic_background_photo})`;
  }
  
  // Load decoration elements
  if (assets.basic_decoration_photo) {
    const decorElement = document.querySelector('.template-decoration');
    if (decorElement) {
      decorElement.src = assets.basic_decoration_photo;
    }
  }
  
  // Setup video backgrounds
  if (assets.standard_background_video) {
    const videoElement = document.querySelector('.bg-video');
    if (videoElement) {
      videoElement.src = assets.standard_background_video;
    }
  }
}
```

## Admin Template Management

### Managing Templates (Admin Only)

**Create New Template:**
```javascript
async function createTemplate(templateData) {
  const formData = new FormData();
  formData.append('name', templateData.name);
  formData.append('preview_image', templateData.previewImage);
  formData.append('package_plan', templateData.packagePlanId);
  // Add other template fields...
  
  const response = await fetch('/api/core-data/event-templates/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    body: formData
  });
  
  return response.json();
}
```

**Update Template Assets:**
```javascript
async function updateTemplateAssets(templateId, assets) {
  const formData = new FormData();
  
  if (assets.openEnvelopeButton) {
    formData.append('open_envelope_button', assets.openEnvelopeButton);
  }
  if (assets.decorationPhoto) {
    formData.append('basic_decoration_photo', assets.decorationPhoto);
  }
  // Add other assets...
  
  const response = await fetch(`/api/core-data/event-templates/${templateId}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    body: formData
  });
  
  return response.json();
}
```

## Error Handling

### Common Error Scenarios

**Template Selection Errors:**
```javascript
async function handleTemplateSelection(eventId, templateId) {
  try {
    const result = await selectTemplate(eventId, templateId);
    return result;
  } catch (error) {
    if (error.message.includes('Permission denied')) {
      showError('You do not have permission to select templates for this event.');
    } else if (error.message.includes('not found')) {
      showError('The selected template is no longer available.');
    } else {
      showError('Failed to select template. Please try again.');
    }
    throw error;
  }
}
```

**Public Asset Loading Fallbacks:**
```javascript
async function loadTemplateWithFallback(templateId) {
  try {
    const templateAssets = await getTemplateAssets(templateId);
    return templateAssets;
  } catch (error) {
    console.warn('Template assets not available, using default styling');
    return null; // Graceful degradation
  }
}
```

## Best Practices

### Performance Optimization

1. **Cache Template Data**: Cache public template assets to reduce API calls
2. **Lazy Load Assets**: Load template videos/images only when needed
3. **Optimize Images**: Use appropriate image sizes for previews vs. full assets
4. **CDN Integration**: Serve template assets via CDN for better performance

### User Experience

1. **Loading States**: Show loading indicators during template operations
2. **Preview Mode**: Allow users to preview templates before selection
3. **Responsive Design**: Ensure templates work across all device sizes
4. **Accessibility**: Maintain accessibility standards with custom fonts/colors

### Security Considerations

1. **Input Validation**: Validate all template IDs and event IDs
2. **Permission Checks**: Always verify user permissions before operations
3. **File Upload Security**: Validate file types and sizes for template assets
4. **XSS Prevention**: Sanitize any user-generated content in templates

### Development Workflow

1. **Environment Setup**: Use different template sets for dev/staging/production
2. **Version Control**: Track template changes and rollback capabilities
3. **Testing**: Test template functionality across different event types
4. **Documentation**: Keep template documentation updated with changes

## Integration Checklist

- [ ] Template browsing UI implemented
- [ ] Template selection functionality working
- [ ] Payment integration configured
- [ ] Admin approval workflow established
- [ ] Public showcase styling implemented
- [ ] Error handling comprehensive
- [ ] Performance optimizations applied
- [ ] Security measures in place
- [ ] Testing completed across user roles
- [ ] Documentation updated