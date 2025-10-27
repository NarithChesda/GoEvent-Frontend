#!/bin/bash

# Get your auth token from browser:
# 1. Open DevTools (F12)
# 2. Go to Console tab
# 3. Run: localStorage.getItem('access_token')
# 4. Copy the token (without quotes)
# 5. Replace YOUR_TOKEN_HERE below with your actual token

TOKEN="YOUR_TOKEN_HERE"
EVENT_ID="297fda28-73c1-486a-990e-b642fb7e47e6"
BASE_URL="http://127.0.0.1:8000"

echo "Testing Guest Groups API..."
echo "================================"
echo ""

# Test 1: Get guest groups
echo "1. GET /api/events/$EVENT_ID/guest-groups/"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/events/$EVENT_ID/guest-groups/" | json_pp

echo ""
echo "================================"
echo ""

# Test 2: Get guests
echo "2. GET /api/events/$EVENT_ID/guests/"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/events/$EVENT_ID/guests/" | json_pp

echo ""
echo "================================"
