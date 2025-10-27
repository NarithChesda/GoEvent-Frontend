@echo off
REM Test Guest Groups API
REM Usage: test-guest-api.bat [username] [password]

SET API_BASE=http://127.0.0.1:8000
SET USERNAME=%1
SET PASSWORD=%2

IF "%USERNAME%"=="" (
    SET USERNAME=admin
)
IF "%PASSWORD%"=="" (
    SET PASSWORD=admin
)

echo ===================================
echo Testing GoEvent Guest Groups API
echo ===================================
echo.

REM Step 1: Login and get access token
echo [1] Logging in as %USERNAME%...
curl -X POST "%API_BASE%/api/auth/login/" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"%USERNAME%\",\"password\":\"%PASSWORD%\"}" ^
  -o token_response.json 2>nul

REM Extract access token from response using PowerShell
for /f "delims=" %%i in ('powershell -Command "(Get-Content token_response.json | ConvertFrom-Json).tokens.access"') do set ACCESS_TOKEN=%%i

IF "%ACCESS_TOKEN%"=="" (
    echo ERROR: Failed to get access token
    type token_response.json
    del token_response.json
    exit /b 1
)

echo Successfully logged in!
echo Access token: %ACCESS_TOKEN:~0,20%...
echo.

REM Step 2: Get events
echo [2] Fetching events...
curl -X GET "%API_BASE%/api/events/" ^
  -H "Authorization: Bearer %ACCESS_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -o events_response.json 2>nul

REM Extract first event ID
for /f "delims=" %%i in ('powershell -Command "(Get-Content events_response.json | ConvertFrom-Json).results[0].id"') do set EVENT_ID=%%i
for /f "delims=" %%i in ('powershell -Command "(Get-Content events_response.json | ConvertFrom-Json).results[0].title"') do set EVENT_TITLE=%%i

echo Found event: %EVENT_TITLE% (ID: %EVENT_ID%)
echo.

REM Step 3: Get guest groups for the event
echo [3] Fetching guest groups for event %EVENT_ID%...
curl -X GET "%API_BASE%/api/events/%EVENT_ID%/guest-groups/" ^
  -H "Authorization: Bearer %ACCESS_TOKEN%" ^
  -H "Content-Type: application/json" 2>nul | python -m json.tool

echo.
echo.

REM Step 4: Get guest group details (first group)
echo [4] Fetching first guest group details...
for /f "delims=" %%i in ('curl -s -X GET "%API_BASE%/api/events/%EVENT_ID%/guest-groups/" -H "Authorization: Bearer %ACCESS_TOKEN%" -H "Content-Type: application/json" ^| powershell -Command "($input | ConvertFrom-Json)[0].id"') do set GROUP_ID=%%i

IF NOT "%GROUP_ID%"=="" (
    echo Group ID: %GROUP_ID%
    curl -X GET "%API_BASE%/api/events/%EVENT_ID%/guest-groups/%GROUP_ID%/" ^
      -H "Authorization: Bearer %ACCESS_TOKEN%" ^
      -H "Content-Type: application/json" 2>nul | python -m json.tool
) ELSE (
    echo No guest groups found for this event.
)

echo.
echo.

REM Step 5: Get guests for the event
echo [5] Fetching guests for event %EVENT_ID%...
curl -X GET "%API_BASE%/api/events/%EVENT_ID%/guests/" ^
  -H "Authorization: Bearer %ACCESS_TOKEN%" ^
  -H "Content-Type: application/json" 2>nul | python -m json.tool

echo.
echo.

REM Cleanup
del token_response.json 2>nul
del events_response.json 2>nul

echo ===================================
echo API Testing Complete
echo ===================================
