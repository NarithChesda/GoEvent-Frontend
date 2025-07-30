# Template Selection Test Guide

## Step 1: Login and Get Auth Token

First, you need to login to get an authentication token. Replace the credentials with actual ones:

```bash
# Login to get auth token
curl -X POST "http://127.0.0.1:8000/api/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "password": "your-password"}' \
  | python -m json.tool
```

This should return something like:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {...}
}
```

## Step 2: Browse Available Templates

```bash
# Replace YOUR_TOKEN with the access token from step 1
export TOKEN="YOUR_ACCESS_TOKEN_HERE"

curl -X GET "http://127.0.0.1:8000/api/core-data/event-templates/browse_templates/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | python -m json.tool
```

This should return a list of available templates with their details.

## Step 3: Test Template Selection (Method 1 - Dedicated Endpoint)

```bash
# Replace EVENT_ID and TEMPLATE_ID with actual values
export EVENT_ID="e59d660a-3578-4fae-ad18-d37efe906dd8"
export TEMPLATE_ID="1"

curl -X POST "http://127.0.0.1:8000/api/events/$EVENT_ID/select_template/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"template_id\": $TEMPLATE_ID}" \
  | python -m json.tool
```

## Step 4: Test Template Selection (Method 2 - Event Update)

If the dedicated endpoint doesn't exist, try updating the event directly:

```bash
curl -X PATCH "http://127.0.0.1:8000/api/events/$EVENT_ID/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"event_template\": $TEMPLATE_ID, \"event_template_enabled\": true}" \
  | python -m json.tool
```

## Step 5: Verify Template Assignment

Check if the template was applied:

```bash
curl -X GET "http://127.0.0.1:8000/api/events/$EVENT_ID/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | python -m json.tool | grep -A 5 -B 5 template
```

## Step 6: Get Template Info (if available)

```bash
curl -X GET "http://127.0.0.1:8000/api/events/$EVENT_ID/template_info/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | python -m json.tool
```

## Troubleshooting

1. **401 Unauthorized**: Your token might be expired, try logging in again
2. **404 Not Found**: The endpoint might not be implemented yet, try the event update method
3. **403 Forbidden**: You might not have permission to edit this event
4. **400 Bad Request**: Check the request body format

## Current Implementation

The EventTemplateTab component now:
1. First tries the dedicated `/select_template/` endpoint
2. Falls back to updating the event directly with `event_template` and `event_template_enabled` fields
3. Provides better error messages for authentication issues
4. Shows helpful feedback during the selection process