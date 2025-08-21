# EventPayment API Quick Reference

Quick reference for common EventPayment API operations during frontend development.

## Quick Start URLs

| Action | Method | URL | Auth Required |
|--------|--------|-----|---------------|
| List | GET | `/api/events/{event_id}/payment-methods/` | Public for public events |
| Get | GET | `/api/events/{event_id}/payment-methods/{id}/` | Public for public events |
| Create | POST | `/api/events/{event_id}/payment-methods/` | Yes (Organizer/Editor) |
| Update | PATCH | `/api/events/{event_id}/payment-methods/{id}/` | Yes (Organizer/Editor) |
| Delete | DELETE | `/api/events/{event_id}/payment-methods/{id}/` | Yes (Organizer/Editor) |
| Reorder | PATCH | `/api/events/{event_id}/payment-methods/bulk-reorder/` | Yes (Organizer/Editor) |

## Common Query Examples

```bash
# Get all active payment methods, ordered by display order
GET /api/events/abc123/payment-methods/?is_active=true&ordering=order

# Search for donation methods
GET /api/events/abc123/payment-methods/?payment_type=donation&search=donate

# Filter bank transfer methods only
GET /api/events/abc123/payment-methods/?payment_method=bank_transfer

# Get USD currency methods sorted by name
GET /api/events/abc123/payment-methods/?currency=USD&ordering=name
```

## Payment Method Types & Required Fields

### Bank Transfer
```json
{
  "name": "Wedding Fund",
  "payment_type": "gift",
  "payment_method": "bank_transfer",
  "bank_name": "Required",
  "account_name": "Required", 
  "account_number": "Required"
}
```

### QR Code Payment
```json
{
  "name": "Mobile Donations",
  "payment_type": "donation",
  "payment_method": "qr_code",
  "qr_code_image": "Required file upload"
}
```

### Payment URL
```json
{
  "name": "Online Sponsorship",
  "payment_type": "sponsorship", 
  "payment_method": "payment_url",
  "payment_url": "https://required.com"
}
```

## Frontend Form Validation

```javascript
const validatePaymentMethod = (data) => {
  const errors = {};
  
  // Common required fields
  if (!data.name) errors.name = 'Name is required';
  if (!data.payment_type) errors.payment_type = 'Payment type is required';
  if (!data.payment_method) errors.payment_method = 'Payment method is required';
  
  // Method-specific validation
  switch (data.payment_method) {
    case 'bank_transfer':
      if (!data.bank_name) errors.bank_name = 'Bank name is required';
      if (!data.account_name) errors.account_name = 'Account name is required';
      if (!data.account_number) errors.account_number = 'Account number is required';
      break;
      
    case 'qr_code':
      if (!data.qr_code_image) errors.qr_code_image = 'QR code image is required';
      break;
      
    case 'payment_url':
      if (!data.payment_url) errors.payment_url = 'Payment URL is required';
      if (data.payment_url && !data.payment_url.startsWith('https://')) {
        errors.payment_url = 'Payment URL must be HTTPS';
      }
      break;
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};
```

## React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const PaymentMethodForm = ({ eventId, paymentMethod, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    payment_type: 'donation',
    payment_method: 'bank_transfer',
    currency: 'USD',
    is_active: true,
    description: '',
    bank_name: '',
    account_name: '',
    account_number: '',
    payment_url: '',
    qr_code_image: null
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (paymentMethod) {
      setFormData(paymentMethod);
    }
  }, [paymentMethod]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const validationErrors = validatePaymentMethod(formData);
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    try {
      const url = paymentMethod 
        ? `/api/events/${eventId}/payment-methods/${paymentMethod.id}/`
        : `/api/events/${eventId}/payment-methods/`;
      
      const method = paymentMethod ? 'PATCH' : 'POST';
      
      let body;
      const headers = {
        'Authorization': `Bearer ${getAuthToken()}`
      };

      if (formData.payment_method === 'qr_code' && formData.qr_code_image) {
        // Use FormData for file upload
        body = new FormData();
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== '') {
            body.append(key, formData[key]);
          }
        });
      } else {
        // Use JSON
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(formData);
      }

      const response = await fetch(url, {
        method,
        headers,
        body
      });

      if (response.ok) {
        const savedPaymentMethod = await response.json();
        onSave(savedPaymentMethod);
      } else {
        const errorData = await response.json();
        setErrors(errorData);
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      setErrors({ general: 'Failed to save payment method' });
    }
  };

  const renderMethodSpecificFields = () => {
    switch (formData.payment_method) {
      case 'bank_transfer':
        return (
          <>
            <input
              type="text"
              placeholder="Bank Name"
              value={formData.bank_name}
              onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Account Name"
              value={formData.account_name}
              onChange={(e) => setFormData({...formData, account_name: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Account Number"
              value={formData.account_number}
              onChange={(e) => setFormData({...formData, account_number: e.target.value})}
              required
            />
          </>
        );

      case 'qr_code':
        return (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({...formData, qr_code_image: e.target.files[0]})}
            required={!paymentMethod}
          />
        );

      case 'payment_url':
        return (
          <input
            type="url"
            placeholder="https://payment-link.com"
            value={formData.payment_url}
            onChange={(e) => setFormData({...formData, payment_url: e.target.value})}
            required
          />
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Payment Method Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />

      <select
        value={formData.payment_type}
        onChange={(e) => setFormData({...formData, payment_type: e.target.value})}
      >
        <option value="donation">Donation</option>
        <option value="gift">Gift</option>
        <option value="sponsorship">Sponsorship</option>
      </select>

      <select
        value={formData.payment_method}
        onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
      >
        <option value="bank_transfer">Bank Transfer</option>
        <option value="qr_code">QR Code</option>
        <option value="payment_url">Payment URL</option>
      </select>

      {renderMethodSpecificFields()}

      <textarea
        placeholder="Description (optional)"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
      />

      <label>
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
        />
        Active
      </label>

      {Object.keys(errors).map(key => (
        <div key={key} className="error">{errors[key]}</div>
      ))}

      <button type="submit">
        {paymentMethod ? 'Update' : 'Create'} Payment Method
      </button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
};

export default PaymentMethodForm;
```

## Common Response Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | No permission |
| 404 | Not Found | Event/payment method not found |

## Testing Checklist

- [ ] Create bank transfer payment method
- [ ] Create QR code payment method (with file upload)  
- [ ] Create payment URL method
- [ ] Test validation for each payment method type
- [ ] Test public access (no auth) for public events
- [ ] Test permission restrictions for private events
- [ ] Test search and filtering
- [ ] Test bulk reorder functionality
- [ ] Verify payment methods appear in event detail/showcase APIs
- [ ] Test file upload size limits and format validation