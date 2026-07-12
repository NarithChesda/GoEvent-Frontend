# Commission API Frontend Implementation Guide

## Overview

This document provides comprehensive guidance for frontend developers implementing the Commission API in the GoEvent platform. The Commission API manages referral commissions for event organizers when payments are confirmed.

## Base Information

- **Base URL**: `http://localhost:8000/api/payment/` (development) / `https://api.goevent.online/api/payment/` (production)
- **Authentication**: JWT Bearer Token required for all endpoints
- **Content-Type**: `application/json`

## Authentication

All commission endpoints require JWT authentication. Include the JWT token in the Authorization header:

```javascript
const headers = {
  'Authorization': `Bearer ${jwtToken}`,
  'Content-Type': 'application/json'
}
```

## API Endpoints

### 1. List Commissions

**Endpoint**: `GET /commissions/`

**Description**: Lists commissions for the authenticated user (or all commissions for admin users)

**Permission**: Authenticated users (see their own commissions), Admin users (see all)

**Example Request**:
```bash
curl -X GET "http://localhost:8000/api/payment/commissions/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "count": 0,
  "next": null,
  "previous": null,
  "results": []
}
```

**Frontend Implementation**:
```javascript
async function getCommissions() {
  try {
    const response = await fetch('/api/payment/commissions/', {
      headers: {
        'Authorization': `Bearer ${getJWTToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching commissions:', error);
    throw error;
  }
}
```

### 2. My Commissions

**Endpoint**: `GET /commissions/my_commissions/`

**Description**: Get all commissions for the current user (where they are the referrer)

**Permission**: Authenticated users only

**Example Request**:
```bash
curl -X GET "http://localhost:8000/api/payment/commissions/my_commissions/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
[]
```

**Frontend Implementation**:
```javascript
async function getMyCommissions() {
  try {
    const response = await fetch('/api/payment/commissions/my_commissions/', {
      headers: {
        'Authorization': `Bearer ${getJWTToken()}`,
        'Content-Type': 'application/json'
      }
    });

    const commissions = await response.json();
    return commissions;
  } catch (error) {
    console.error('Error fetching my commissions:', error);
    throw error;
  }
}
```

### 3. Commission Statistics

**Endpoint**: `GET /commissions/commission_stats/`

**Description**: Get commission statistics for the current user

**Permission**: Authenticated users only

**Example Request**:
```bash
curl -X GET "http://localhost:8000/api/payment/commissions/commission_stats/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "total_commissions": 0,
  "pending_commissions": 0,
  "claimed_commissions": 0,
  "cancelled_commissions": 0,
  "total_commission_amount": 0.0,
  "claimed_commission_amount": 0.0,
  "pending_commission_amount": 0.0
}
```

**Frontend Implementation**:
```javascript
async function getCommissionStats() {
  try {
    const response = await fetch('/api/payment/commissions/commission_stats/', {
      headers: {
        'Authorization': `Bearer ${getJWTToken()}`,
        'Content-Type': 'application/json'
      }
    });

    const stats = await response.json();
    return stats;
  } catch (error) {
    console.error('Error fetching commission stats:', error);
    throw error;
  }
}

// Usage in React component
function CommissionStatsComponent() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getCommissionStats()
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="commission-stats">
      <h3>Commission Overview</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <label>Total Commissions:</label>
          <span>{stats.total_commissions}</span>
        </div>
        <div className="stat-item">
          <label>Pending Amount:</label>
          <span>${stats.pending_commission_amount}</span>
        </div>
        <div className="stat-item">
          <label>Claimed Amount:</label>
          <span>${stats.claimed_commission_amount}</span>
        </div>
      </div>
    </div>
  );
}
```

### 4. Pending Commissions (Admin Only)

**Endpoint**: `GET /commissions/pending_commissions/`

**Description**: Get all pending commissions (admin only)

**Permission**: Admin users only

**Example Request**:
```bash
curl -X GET "http://localhost:8000/api/payment/commissions/pending_commissions/" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Frontend Implementation**:
```javascript
async function getPendingCommissions() {
  try {
    const response = await fetch('/api/payment/commissions/pending_commissions/', {
      headers: {
        'Authorization': `Bearer ${getJWTToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }

    const commissions = await response.json();
    return commissions;
  } catch (error) {
    console.error('Error fetching pending commissions:', error);
    throw error;
  }
}
```

### 5. Event Commissions

**Endpoint**: `GET /commissions/event_commissions/?event_id={EVENT_ID}`

**Description**: Get all commissions for a specific event

**Permission**: Event organizers, collaborators, referrers, or admin users

**Required Parameter**: `event_id` (UUID)

**Example Request**:
```bash
curl -X GET "http://localhost:8000/api/payment/commissions/event_commissions/?event_id=SAMPLE_EVENT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Error Response** (missing event_id):
```json
{
  "detail": "event_id parameter is required."
}
```

**Frontend Implementation**:
```javascript
async function getEventCommissions(eventId) {
  if (!eventId) {
    throw new Error('Event ID is required');
  }

  try {
    const response = await fetch(`/api/payment/commissions/event_commissions/?event_id=${eventId}`, {
      headers: {
        'Authorization': `Bearer ${getJWTToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch event commissions');
    }

    const commissions = await response.json();
    return commissions;
  } catch (error) {
    console.error('Error fetching event commissions:', error);
    throw error;
  }
}
```

### 6. Request Commission Claim

**Endpoint**: `POST /commissions/{commission_id}/request_claim/`

**Description**: User endpoint to request commission claim (only the referrer can request)

**Permission**: Commission referrer only

**Request Body**:
```json
{
  "requested_notes": "Please process my commission claim for this event"
}
```

**Frontend Implementation**:
```javascript
async function requestCommissionClaim(commissionId, notes = '') {
  try {
    const response = await fetch(`/api/payment/commissions/${commissionId}/request_claim/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getJWTToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requested_notes: notes
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to request commission claim');
    }

    const commission = await response.json();
    return commission;
  } catch (error) {
    console.error('Error requesting commission claim:', error);
    throw error;
  }
}
```

### 7. Approve Commission Claim (Admin Only)

**Endpoint**: `POST /commissions/{commission_id}/claim/`

**Description**: Admin endpoint to approve a commission claim request

**Permission**: Admin users only

**Request Body**:
```json
{
  "claim_notes": "Commission approved and processed"
}
```

**Frontend Implementation**:
```javascript
async function approveCommissionClaim(commissionId, notes = '') {
  try {
    const response = await fetch(`/api/payment/commissions/${commissionId}/claim/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getJWTToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        claim_notes: notes
      })
    });

    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to approve commission claim');
    }

    const commission = await response.json();
    return commission;
  } catch (error) {
    console.error('Error approving commission claim:', error);
    throw error;
  }
}
```

### 8. Reject Commission Claim (Admin Only)

**Endpoint**: `POST /commissions/{commission_id}/reject/`

**Description**: Admin endpoint to reject a commission claim request

**Permission**: Admin users only

**Request Body**:
```json
{
  "rejection_reason": "Insufficient documentation provided"
}
```

**Frontend Implementation**:
```javascript
async function rejectCommissionClaim(commissionId, reason = '') {
  try {
    const response = await fetch(`/api/payment/commissions/${commissionId}/reject/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getJWTToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rejection_reason: reason
      })
    });

    if (response.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to reject commission claim');
    }

    const commission = await response.json();
    return commission;
  } catch (error) {
    console.error('Error rejecting commission claim:', error);
    throw error;
  }
}
```

## Commission Data Model

Based on the model structure, commission objects contain the following fields:

```typescript
interface Commission {
  id: string; // UUID
  commission_reference: string;
  referrer: User;
  event: Event;
  payment: Payment;
  commission_rate: number; // Percentage (e.g., 10.00 for 10%)
  commission_amount: number; // Calculated commission amount
  payment_amount: number; // Original payment amount
  currency: string; // Default: 'USD'
  status: 'pending' | 'requested' | 'claimed' | 'rejected' | 'cancelled';
  requested_at?: string; // ISO date string
  requested_notes?: string;
  claimed_at?: string; // ISO date string
  claim_notes?: string;
  rejected_at?: string; // ISO date string
  rejection_reason?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}
```

## Status Flow

Commission statuses follow this flow:

1. **pending** → **requested** (user requests claim)
2. **requested** → **claimed** (admin approves)
3. **requested** → **rejected** (admin rejects)
4. **any status** → **cancelled** (admin cancels, except claimed)

## Error Handling

### Common Error Responses

1. **Authentication Required**:
```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is invalid"
    }
  ]
}
```

2. **Permission Denied**:
```json
{
  "detail": "You can only request claims for your own commissions."
}
```

3. **Invalid Status**:
```json
{
  "detail": "Commission cannot be requested. Current status: claimed"
}
```

4. **Missing Parameters**:
```json
{
  "detail": "event_id parameter is required."
}
```

### Frontend Error Handling Pattern

```javascript
async function handleApiCall(apiFunction) {
  try {
    const result = await apiFunction();
    return { success: true, data: result };
  } catch (error) {
    console.error('API Error:', error);

    // Handle specific error types
    if (error.message.includes('token_not_valid')) {
      // Redirect to login or refresh token
      handleTokenExpired();
      return { success: false, error: 'Session expired' };
    }

    if (error.message.includes('Access denied')) {
      return { success: false, error: 'Insufficient permissions' };
    }

    return { success: false, error: error.message };
  }
}

// Usage
const result = await handleApiCall(() => getCommissionStats());
if (result.success) {
  setCommissionStats(result.data);
} else {
  setError(result.error);
}
```

## Important Notes

1. **Commission Creation**: Commissions are created automatically when payments are confirmed. Users cannot manually create commissions via the API.

2. **Commission Editing**: Commissions cannot be directly updated. Use the specific action endpoints (request_claim, claim, reject, cancel).

3. **Permission System**:
   - Regular users see only commissions where they are the referrer
   - Admin users see all commissions
   - Event organizers/collaborators can see commissions for their events

4. **JWT Token Management**: Tokens expire after 60 minutes. Implement token refresh logic in your frontend.

5. **Rate Limiting**: Be mindful of API rate limits and implement appropriate retry logic.

## Frontend Framework Examples

### React Hook for Commission Management

```javascript
import { useState, useEffect, useCallback } from 'react';

export function useCommissions() {
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [commissionsData, statsData] = await Promise.all([
        getMyCommissions(),
        getCommissionStats()
      ]);

      setCommissions(commissionsData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestClaim = useCallback(async (commissionId, notes) => {
    try {
      const updatedCommission = await requestCommissionClaim(commissionId, notes);

      // Update local state
      setCommissions(prev =>
        prev.map(commission =>
          commission.id === commissionId ? updatedCommission : commission
        )
      );

      return updatedCommission;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  return {
    commissions,
    stats,
    loading,
    error,
    refetch: fetchCommissions,
    requestClaim
  };
}
```

### Vue.js Composition API

```javascript
import { ref, onMounted } from 'vue';

export function useCommissions() {
  const commissions = ref([]);
  const stats = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const fetchCommissions = async () => {
    loading.value = true;
    error.value = null;

    try {
      const [commissionsData, statsData] = await Promise.all([
        getMyCommissions(),
        getCommissionStats()
      ]);

      commissions.value = commissionsData;
      stats.value = statsData;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const requestClaim = async (commissionId, notes) => {
    try {
      const updatedCommission = await requestCommissionClaim(commissionId, notes);

      const index = commissions.value.findIndex(c => c.id === commissionId);
      if (index !== -1) {
        commissions.value[index] = updatedCommission;
      }

      return updatedCommission;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  onMounted(() => {
    fetchCommissions();
  });

  return {
    commissions,
    stats,
    loading,
    error,
    fetchCommissions,
    requestClaim
  };
}
```

This documentation provides everything needed to implement the Commission API in your frontend application. For additional questions or issues, refer to the backend API code or contact the development team.