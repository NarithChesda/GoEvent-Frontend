# Payment API Documentation

## Overview

The GoEvent payment system allows users to purchase event templates and pricing plans. Users must submit payment proof when creating payments, and admins manually confirm or reject payments.

## Payment Workflow

1. **User Creates Payment** → Must include payment proof file → Status: `pending`
2. **User Can Edit** → Only if status is `pending` 
3. **Admin Reviews** → Can confirm or reject `pending` payments
4. **Final Status** → `confirmed` or `failed`

## Payment Statuses

- `pending` - Payment created, waiting for admin review
- `confirmed` - Payment approved by admin
- `failed` - Payment rejected by admin
- `cancelled` - Payment cancelled
- `refunded` - Payment refunded

## Payment Model Fields

### Core Identification
- **`id`** - UUID primary key (read-only)
- **`payment_reference`** - Auto-generated unique reference (e.g., "PAY000001")

### Relationships
- **`user`** - User who created the payment (ForeignKey to User)
- **`event`** - Associated event (ForeignKey to Event)
- **`event_template`** - Template being purchased (ForeignKey to EventTemplate, optional)
- **`pricing_plan`** - Selected pricing plan (ForeignKey to PricingPlan, optional)
- **`payment_method`** - Payment method used (ForeignKey to PaymentMethod, optional)

### Payment Details
- **`amount`** - Payment amount (DecimalField, max 10 digits, 2 decimal places, ≥ 0)
- **`original_price`** - Original package price before discounts (DecimalField, optional)
- **`discount_amount`** - Discount applied from previous payments (DecimalField, default: 0)
- **`currency`** - Currency code (CharField, max 3 chars, default: "USD")
- **`status`** - Payment status (CharField, choices: pending/confirmed/failed/cancelled/refunded)

### Upgrade/Downgrade Tracking
- **`is_upgrade`** - Whether this is an upgrade payment (BooleanField, default: False)
- **`previous_payment`** - Previous payment for upgrades (ForeignKey to self, optional)

### User Submission Fields
- **`payment_proof`** - Payment proof file **[REQUIRED]** (FileField, formats: PDF/JPG/JPEG/PNG/GIF/WebP)
- **`user_notes`** - User notes about payment (TextField, optional, max 1000 chars after sanitization)
- **`transaction_reference`** - User-provided transaction ID (CharField, max 100 chars, optional)

### Admin Fields
- **`confirmed_by`** - Admin who confirmed payment (ForeignKey to User, optional)
- **`confirmed_at`** - Confirmation timestamp (DateTimeField, auto-set on confirmation)
- **`admin_notes`** - Internal admin notes (TextField, optional, supports basic HTML tags)

### Timestamps
- **`created_at`** - Creation timestamp (DateTimeField, auto-set)
- **`updated_at`** - Last update timestamp (DateTimeField, auto-updated)

### Computed Properties
- **`is_confirmed`** - True if status is "confirmed" (read-only)
- **`can_be_confirmed`** - True if status is "pending" (read-only)

## API Endpoints

### Authentication
All payment endpoints require JWT authentication:
```bash
# Get JWT token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

### Payment Methods
```bash
# List available payment methods
GET /api/payment/payment-methods/
```

### Create Payment
**Required**: Payment proof file must be included

**Request Fields:**
- **Required**: `event`, `pricing_plan`, `payment_method`, `amount`, `payment_proof`
- **Optional**: `event_template`, `original_price`, `discount_amount`, `currency`, `user_notes`, `transaction_reference`, `is_upgrade`, `previous_payment`

```bash
curl -X POST http://localhost:8000/api/payment/payments/ \
  -H "Authorization: Bearer <token>" \
  -F "event=<event_uuid>" \
  -F "pricing_plan=<plan_id>" \
  -F "payment_method=<method_id>" \
  -F "amount=50.00" \
  -F "user_notes=Payment for basic plan" \
  -F "transaction_reference=TXN123456" \
  -F "payment_proof=@receipt.png"
```

**Complete Response:**
```json
{
  "success": true,
  "message": "Payment request created successfully. You will receive an email confirmation shortly.",
  "payment": {
    "id": "c3efb6f6-7057-4e1d-abc9-69f306d3b445",
    "payment_reference": "PAY000003",
    "user": {
      "id": 1,
      "email": "admin@goevent.com",
      "username": "admin",
      "full_name": ""
    },
    "event": "945641f1-4013-46b6-af4b-6747875142e1",
    "event_detail": {
      "id": "945641f1-4013-46b6-af4b-6747875142e1",
      "title": "My Test Event",
      "slug": "my-test-event-1",
      "start_date": "2025-08-16T10:00:00Z",
      "end_date": "2025-08-16T18:00:00Z"
    },
    "event_template": null,
    "event_template_detail": null,
    "pricing_plan": 11,
    "pricing_plan_detail": {
      "id": 11,
      "name": "Basic Plan",
      "price": "50.00",
      "features": []
    },
    "payment_method": 1,
    "payment_method_detail": {
      "id": 1,
      "name": "ABA",
      "payment_type": "bank_transfer",
      "payment_type_display": "Bank Transfer",
      "description": "",
      "bank_name": "ABA",
      "account_number": "500 124 383",
      "account_name": "NARITH CHESDA",
      "qr_code_image": "http://localhost:8000/media/payment_qr_codes/NARITHCHESDA_ABA.png",
      "payment_link": "https://link.payway.com.kh/aba?id=B23269C516BD&code=410688&acc=500124383&dynamic=true",
      "currency": "USD",
      "is_active": true,
      "created_at": "2025-08-02T07:07:57.210581Z",
      "updated_at": "2025-08-02T09:21:15.237398Z"
    },
    "amount": "50.00",
    "original_price": "50.00",
    "discount_amount": "0.00",
    "currency": "USD",
    "status": "pending",
    "status_display": "Pending",
    "payment_proof": "http://localhost:8000/media/payment_proofs/payment_receipt.jpg",
    "user_notes": "Payment with image receipt proof",
    "transaction_reference": "IMG-TXN-001",
    "is_upgrade": false,
    "previous_payment": null,
    "confirmed_by": null,
    "confirmed_by_detail": null,
    "confirmed_at": null,
    "admin_notes": "",
    "created_at": "2025-08-02T14:04:03.152318Z",
    "updated_at": "2025-08-02T14:04:03.152326Z",
    "is_confirmed": false,
    "can_be_confirmed": true
  }
}
```

### List Payments
```bash
# List user's payments (simplified view)
GET /api/payment/payments/

# List payments for specific event
GET /api/payment/payments/event_payments/?event_id=<event_uuid>
```

**List Response Fields:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "payment-uuid",
      "payment_reference": "PAY000001",
      "user_email": "user@example.com",
      "event": "event-uuid",
      "event_title": "Event Name",
      "template_name": "Template Name",
      "plan_name": "Basic Plan",
      "payment_method_name": "ABA",
      "amount": "50.00",
      "original_price": "50.00",
      "discount_amount": "0.00",
      "currency": "USD",
      "status": "pending",
      "status_display": "Pending",
      "transaction_reference": "TXN123456",
      "created_at": "2025-08-02T13:13:40.876773Z",
      "is_confirmed": false,
      "is_upgrade": false
    }
  ]
}
```

### Get Payment Details
```bash
GET /api/payment/payments/<payment_id>/
```

**Detail Response** - Returns complete payment object with all fields including:
- User details (id, email, username, full_name)
- Event details (id, title, slug, dates)
- Event template details (id, name, preview_image)
- Pricing plan details (id, name, price, features)
- Payment method details (complete payment method object)
- Confirmed by details (admin who confirmed)
- All payment fields and timestamps

### Update Payment (Users - Pending Only)
Users can only update pending payments with these fields:

**Updatable Fields:**
- `payment_proof` - Replace payment proof file
- `user_notes` - Update user notes (sanitized, max 1000 chars)
- `transaction_reference` - Update transaction reference (max 100 chars)

```bash
curl -X PATCH http://localhost:8000/api/payment/payments/<payment_id>/ \
  -H "Authorization: Bearer <token>" \
  -F "user_notes=Updated notes" \
  -F "transaction_reference=TXN123456-UPDATED" \
  -F "payment_proof=@new_receipt.png"
```

**Update Response:**
```json
{
  "payment_proof": "http://localhost:8000/media/payment_proofs/new_receipt.png",
  "user_notes": "Updated notes",
  "transaction_reference": "TXN123456-UPDATED"
}
```

### Admin Actions

#### Confirm Payment
```bash
curl -X POST http://localhost:8000/api/payment/payments/<payment_id>/confirm/ \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"admin_notes": "Payment verified and approved"}'
```

#### Reject Payment
```bash
curl -X POST http://localhost:8000/api/payment/payments/<payment_id>/reject/ \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"admin_notes": "Invalid payment proof"}'
```

## API Response Format

### Success Response Structure
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "payment": { /* complete payment object */ }
}
```

### Error Response Structure
```json
{
  "error": "Error Type",
  "message": "User-friendly error message",
  "details": { /* field-specific errors */ },
  "code": "ERROR_CODE"
}
```

## Field Validation Rules

### Payment Proof File
- **Required**: Yes (must be included when creating payment)
- **Allowed formats**: PDF, JPG, JPEG, PNG, GIF, WebP
- **Upload path**: `/media/payment_proofs/`
- **Content-Type**: Use `multipart/form-data`
- **Validation**: File extension validator enforced

### Amount Field
- **Type**: Decimal (max 10 digits, 2 decimal places)
- **Range**: ≥ 0, ≤ 999,999.99
- **Validation**: Must match expected pricing plan amount (within 1 cent tolerance)

### Text Fields
- **user_notes**: Max 1000 characters after HTML sanitization
- **transaction_reference**: Max 100 characters, HTML stripped
- **admin_notes**: Supports basic HTML tags (p, br, strong, em, ul, ol, li)

### Security Features
- **XSS Protection**: All text fields sanitized with bleach
- **Rate Limiting**: Max 3 payment requests per user per 5 minutes  
- **Duplicate Prevention**: Prevents multiple pending payments for same plan
- **Permission Checks**: Users can only create payments for their own events

## Error Responses

### Missing Payment Proof
```json
{
  "error": "Invalid Payment Information",
  "message": "Please check your payment details and try again.",
  "details": {
    "payment_proof": ["No file was submitted."]
  },
  "code": "PAYMENT_VALIDATION_ERROR"
}
```

### Update Non-Pending Payment
```json
{
  "detail": "You can only update pending payments."
}
```

### Duplicate Payment
```json
{
  "non_field_errors": [
    "There is already a pending payment (PAY000001) for the Basic Plan package. Please wait for confirmation or cancel the existing payment."
  ]
}
```

## Package Calculation

### Get Package Options
```bash
GET /api/payment/payments/package_options/?event_id=<event_uuid>
```

### Calculate Payment Amount
```bash
curl -X POST http://localhost:8000/api/payment/payments/calculate_payment/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"event_id": "<event_uuid>", "pricing_plan_id": "<plan_id>"}'
```

## Important Notes

1. **Payment Proof is Mandatory**: All payment creation requests must include a payment proof file
2. **Pending Status Only**: Users can only edit payments with `pending` status
3. **Admin Confirmation Required**: Payments stay in `pending` status until admin manually confirms/rejects
4. **No Auto-Status Changes**: Payment status doesn't automatically change when files are uploaded
5. **File Validation**: Only specific file formats are accepted for payment proof
6. **Unique Payment References**: Auto-generated references like `PAY000001`, `PAY000002`, etc.

## Testing

See the payment system in action:
1. Create payment with proof → Status: `pending`
2. Update payment details → File replaced, status stays `pending`
3. Admin confirms → Status changes to `confirmed`
4. Try creating without proof → Validation error returned