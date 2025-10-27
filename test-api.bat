@echo off
REM Get your auth token from browser:
REM 1. Open DevTools (F12)
REM 2. Go to Console tab
REM 3. Run: localStorage.getItem('access_token')
REM 4. Copy the token (without quotes)
REM 5. Replace YOUR_TOKEN_HERE below with your actual token

set TOKEN=YOUR_TOKEN_HERE
set EVENT_ID=297fda28-73c1-486a-990e-b642fb7e47e6
set BASE_URL=http://127.0.0.1:8000

echo Testing Guest Groups API...
echo ================================
echo.

echo 1. GET /api/events/%EVENT_ID%/guest-groups/
curl -X GET -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" "%BASE_URL%/api/events/%EVENT_ID%/guest-groups/"

echo.
echo ================================
echo.

echo 2. GET /api/events/%EVENT_ID%/guests/
curl -X GET -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" "%BASE_URL%/api/events/%EVENT_ID%/guests/"

echo.
echo ================================

pause
