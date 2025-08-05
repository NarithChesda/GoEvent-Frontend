# EventInvitationTab Test Scenarios

## Overview
The EventInvitationTab now uses the same payment activation logic as the EventTemplateTab through the `usePaymentTemplateIntegration` composable.

## Payment Check Logic Flow

### 1. No Template Selected
- **Condition**: `event.event_template` is null/undefined
- **Display**: "No Template Selected" message with button to select template
- **Action**: Redirects to template tab

### 2. Template Selected but Not Paid
- **Condition**: 
  - `event.event_template` exists
  - `isTemplateActivated` is false (no confirmed payment for the template name)
- **Display**: "Template Payment Required" message with template name
- **Action**: Redirects to payment tab

### 3. Template Selected and Paid (Activated)
- **Condition**:
  - `event.event_template` exists
  - `isTemplateActivated` is true (confirmed payment exists matching event ID and template name)
- **Display**: Full invitation management interface
  - Send invitations button
  - Guest list management
  - Add/remove guests functionality

## Key Integration Points

1. **Payment Check**: Uses `isTemplateActivated` computed property from `usePaymentTemplateIntegration`
2. **Template Name**: Checks against `event.event_template_details?.name` 
3. **Payment Status**: Only "confirmed" payments activate the template
4. **Event Match**: Payment must match the current event ID

## Testing Steps

1. Navigate to an event without a template selected
   - Should show "No Template Selected" state

2. Select a template without payment
   - Should show "Template Payment Required" state with template name

3. Complete payment for the template
   - Should show full invitation management interface

4. Change to a different template
   - Should reset to payment required state for new template