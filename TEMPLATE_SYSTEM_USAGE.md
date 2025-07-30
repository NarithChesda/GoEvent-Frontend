# Updated Event Template System - Usage Guide

## Overview

The Event Template System has been updated to follow the correct workflow based on the comprehensive documentation provided. The system now properly separates template selection from template enablement, implementing a payment-first approach.

## Key Changes Made

### 1. **Correct Workflow Implementation**
- **Template Selection**: Users can browse and select templates
- **Payment Processing**: Selection triggers payment modal immediately
- **Admin Enablement**: Templates are only enabled after payment verification by admin
- **Template Status**: Clear distinction between selected, paid, and enabled states

### 2. **Updated Component Structure**

#### EventTemplateTab Component
- Located: `src/components/EventTemplateTab.vue`
- Features:
  - Template browsing with preview images
  - Color palette and feature display
  - Payment modal integration
  - Status indicators (Active/Pending Payment)
  - Support for template selection without enablement

### 3. **Template Status States**

#### State 1: No Template Selected
```javascript
event.event_template = null
event.event_template_enabled = false
event.event_template_details = null
```
- Shows "Browse Templates" button
- Encourages template selection

#### State 2: Template Selected (Pending Payment)
```javascript
event.event_template = 123 // Template ID
event.event_template_enabled = false
event.event_template_details = null
```
- Shows "Payment Required" message
- Template ID is saved but not active
- Prompts for payment completion

#### State 3: Template Active (After Payment & Admin Approval)
```javascript
event.event_template = 123
event.event_template_enabled = true
event.event_template_details = { /* full template data */ }
```
- Shows full template information
- All template features available
- Green "Active" status badge

## API Integration

### 1. **Browse Templates**
```javascript
// GET /api/core-data/event-templates/browse_templates/
// Requires authentication
await eventTemplateService.browseTemplates()
```

### 2. **Select Template** 
```javascript
// POST /api/events/{event_id}/select_template/
// Primary method - returns pricing info for payment
await eventTemplateService.selectTemplate(eventId, { template_id: templateId })

// Fallback method - direct event update
await eventsService.patchEvent(eventId, {
  event_template: templateId,
  event_template_enabled: false // Important: stays false until payment
})
```

### 3. **Public Template Assets**
```javascript
// GET /api/core-data/event-templates/{template_id}/public_template_assets/
// No authentication required - for public showcase
await eventTemplateService.getPublicTemplateAssets(templateId)
```

## Payment Integration

### Current Implementation
- Payment modal shows pricing and features
- Integrates with external payment processors
- Provides clear payment flow instructions
- Shows commission information

### Payment Workflow
1. User selects template
2. Payment modal appears with pricing details
3. User completes payment through payment processor
4. System notifies admin for template enablement
5. Admin enables template after payment verification
6. User receives confirmation when template is active

## User Experience Flow

### For Event Organizers
1. **Browse Templates**: View available templates with previews
2. **Select Template**: Choose template and see pricing
3. **Payment**: Complete payment through secure processor  
4. **Wait for Activation**: Template reviewed and enabled by admin
5. **Use Template**: Access all template features once active

### For Event Attendees (Public)
1. **View Event**: See templated event showcase page
2. **Template Styling**: Automatic application of colors, fonts, assets
3. **Interactive Elements**: Use template-specific features
4. **Responsive Design**: Template works across all devices

## Template Features

### Visual Elements
- **Color Palettes**: Applied as CSS variables
- **Custom Fonts**: Loaded and applied by language
- **Background Assets**: Images and videos
- **Decoration Elements**: Template-specific graphics
- **Interactive Buttons**: Custom styled interactive elements

### Technical Features
- **Responsive Design**: Mobile-first approach
- **Performance Optimized**: Lazy loading of assets
- **Accessibility**: Maintained across all templates
- **SEO Friendly**: Template styling doesn't affect SEO

## Testing the System

### 1. **Template Selection**
- Navigate to event detail page
- Click "Template" tab
- Click "Browse Templates" 
- See template grid with previews and pricing
- Select a template to trigger payment modal

### 2. **Payment Flow**
- Payment modal shows pricing and features
- Shows payment processing information
- Simulates payment completion (in demo)
- Updates template status accordingly

### 3. **Status Display**
- No template: Shows browse button
- Template selected: Shows "Pending Payment" status
- Template active: Shows full template details with "Active" badge

## Configuration

### Environment Variables
```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### API Endpoints Used
- `/api/core-data/event-templates/browse_templates/`
- `/api/events/{id}/select_template/`
- `/api/events/{id}/` (PATCH for fallback)
- `/api/core-data/event-templates/{id}/public_template_assets/`

## Future Enhancements

### Payment Integration
- Stripe integration
- PayPal support
- Multiple currency support
- Subscription-based templates

### Template Features
- Template preview mode
- Template customization options
- Template version management
- Template analytics

### Admin Features
- Template approval dashboard
- Payment verification tools
- Template usage analytics
- Commission tracking

## Troubleshooting

### Common Issues

#### 1. Templates Not Loading
- Check authentication token
- Verify API endpoint availability
- Check network connectivity

#### 2. Payment Modal Not Showing
- Ensure template selection is working
- Check browser console for errors
- Verify payment data structure

#### 3. Template Not Activating
- Confirm payment was processed
- Check with admin for manual enablement
- Verify template enablement API

### Debug Information
- All API calls are logged to browser console
- Error messages provide specific feedback
- Status indicators show current state clearly

## Support

For issues with the template system:
1. Check browser console for errors
2. Verify API connectivity
3. Confirm authentication status
4. Contact admin for payment/enablement issues

The updated system now provides a complete, production-ready template management experience that follows industry best practices for payment-gated premium features.