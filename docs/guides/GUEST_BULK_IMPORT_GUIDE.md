# Guest List Bulk Import Guide

This guide explains how to use the bulk import feature to quickly add multiple guests to your event.

## Overview

The Guest Bulk Import feature allows event organizers and collaborators to import guest lists from Excel or CSV files. This is particularly useful for:
- Wedding guest lists
- Conference attendees
- Corporate event invitations
- Any event with a large number of guests

## Supported File Formats

- **CSV** (.csv) - Comma-separated values
- **Excel** (.xlsx, .xls) - Microsoft Excel files

**File Size Limit:** 5MB maximum

## File Format Requirements

### CSV Format

Your CSV file must have a header row with a column named `name` (case-insensitive).

**Example CSV:**
```csv
name
John Smith
Jane Doe
Michael Johnson
Sarah Williams
David Brown
```

### Excel Format

Your Excel file must have:
- A header row in the first row
- A column named `name` (case-insensitive)
- Guest names starting from row 2

**Example Excel:**
| name |
|------|
| John Smith |
| Jane Doe |
| Michael Johnson |
| Sarah Williams |
| David Brown |

## API Endpoint

### Bulk Import Guests

**Endpoint:** `POST /api/events/{event_id}/guests/bulk-import/`

**Authentication:** Required (JWT Bearer token)

**Permissions:** Event organizer or collaborator with edit access

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body Parameter: `file` (the CSV or Excel file)

### Example Request

**Using cURL:**
```bash
curl -X POST "https://api.goevent.online/api/events/{event_id}/guests/bulk-import/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@guests.csv"
```

**Using JavaScript/Fetch:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch(`/api/events/${eventId}/guests/bulk-import/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

**Using Python/Requests:**
```python
import requests

url = f"https://api.goevent.online/api/events/{event_id}/guests/bulk-import/"
headers = {
    "Authorization": f"Bearer {access_token}"
}
files = {
    "file": open("guests.csv", "rb")
}

response = requests.post(url, headers=headers, files=files)
print(response.json())
```

## Response Format

### Successful Import

```json
{
  "success": true,
  "message": "Successfully imported 10 guests",
  "created": 10,
  "skipped": 0,
  "errors_count": 0,
  "created_guests": [
    {
      "id": 1,
      "name": "John Smith",
      "showcase_link": "/events/abc-123/showcase/?guest_name=John+Smith&lang=kh"
    },
    {
      "id": 2,
      "name": "Jane Doe",
      "showcase_link": "/events/abc-123/showcase/?guest_name=Jane+Doe&lang=kh"
    }
  ],
  "skipped_guests": [],
  "errors": []
}
```

### Partial Import (Some Duplicates)

```json
{
  "success": true,
  "message": "Successfully imported 5 guests",
  "created": 5,
  "skipped": 5,
  "errors_count": 0,
  "created_guests": [
    {
      "id": 3,
      "name": "New Guest 1",
      "showcase_link": "/events/abc-123/showcase/?guest_name=New+Guest+1&lang=kh"
    }
  ],
  "skipped_guests": [
    {
      "name": "John Smith",
      "reason": "Already exists"
    },
    {
      "name": "Jane Doe",
      "reason": "Already exists"
    }
  ],
  "errors": []
}
```

### Import with Errors

```json
{
  "success": true,
  "message": "Successfully imported 8 guests",
  "created": 8,
  "skipped": 2,
  "errors_count": 2,
  "created_guests": [...],
  "skipped_guests": [...],
  "errors": [
    "Row 5: Empty name",
    "Row 12: Empty name"
  ]
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for valid requests |
| `message` | string | Summary message of the import operation |
| `created` | integer | Number of guests successfully created |
| `skipped` | integer | Number of guests skipped (duplicates) |
| `errors_count` | integer | Number of rows with errors |
| `created_guests` | array | List of newly created guests with IDs and showcase links |
| `skipped_guests` | array | List of guests that were skipped with reasons |
| `errors` | array | List of error messages for problematic rows |

## Error Handling

### File Validation Errors

**Invalid File Format:**
```json
{
  "file": [
    "Invalid file format. Please upload Excel (.xlsx, .xls) or CSV (.csv) file."
  ]
}
```

**File Too Large:**
```json
{
  "file": [
    "File size too large. Maximum size is 5MB."
  ]
}
```

**Missing Name Column:**
```json
{
  "file": [
    "CSV file must have a 'name' column in the first row."
  ]
}
```

**No Valid Names:**
```json
{
  "file": [
    "No valid guest names found in the file. Please check the file format."
  ]
}
```

### Permission Errors

**Unauthorized:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Forbidden:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

## Features

### 1. Duplicate Detection
- The system automatically detects duplicate guest names (case-insensitive)
- Existing guests are skipped and reported in the response
- No duplicate guests will be created

### 2. Automatic Showcase Link Generation
- Each imported guest automatically gets a personalized showcase link
- The link includes the guest's name and default language (Khmer)
- Format: `/events/{event_id}/showcase/?guest_name={name}&lang=kh`

### 3. Invitation Status
- All imported guests start with `invitation_status: "not_sent"`
- You can update the status later using the mark-sent/mark-viewed endpoints

### 4. Error Reporting
- Rows with empty names are reported in the errors array
- The import continues even if some rows have errors
- You receive a detailed report of all issues

## Best Practices

### 1. Prepare Your File
- Use a clear header row with "name" as the column name
- Remove any extra columns if not needed
- Ensure all names are properly formatted
- Remove empty rows

### 2. Check for Duplicates
- Review your file for duplicate names before uploading
- The system will skip duplicates, but it's better to have clean data

### 3. Test with Small Files First
- Try importing a small test file (5-10 guests) first
- Verify the results before importing your full guest list

### 4. Review the Response
- Always check the `created`, `skipped`, and `errors_count` fields
- Review the `skipped_guests` array to see which duplicates were found
- Check the `errors` array for any problematic rows

### 5. Verify Import
- After bulk import, use the guest list endpoint to verify all guests were imported:
  ```bash
  GET /api/events/{event_id}/guests/
  ```
- Check the stats endpoint for a quick summary:
  ```bash
  GET /api/events/{event_id}/guests/stats/
  ```

## Example Workflow

### Complete Import Workflow

1. **Prepare your guest list file**
   ```csv
   name
   John Smith
   Jane Doe
   Michael Johnson
   ```

2. **Get your access token**
   ```bash
   curl -X POST https://api.goevent.online/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "password123"}'
   ```

3. **Import the guest list**
   ```bash
   curl -X POST "https://api.goevent.online/api/events/abc-123/guests/bulk-import/" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@guests.csv"
   ```

4. **Verify the import**
   ```bash
   curl -X GET "https://api.goevent.online/api/events/abc-123/guests/stats/" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

5. **View imported guests**
   ```bash
   curl -X GET "https://api.goevent.online/api/events/abc-123/guests/" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Frontend Integration Example

### React Component Example

```javascript
import React, { useState } from 'react';
import axios from 'axios';

function GuestBulkImport({ eventId, accessToken }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await axios.post(
        `/api/events/${eventId}/guests/bulk-import/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setResult(response.data);
      alert(`Successfully imported ${response.data.created} guests!`);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check your file and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="guest-bulk-import">
      <h3>Import Guest List</h3>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
      />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Importing...' : 'Upload Guest List'}
      </button>

      {result && (
        <div className="import-results">
          <h4>Import Results</h4>
          <p>Created: {result.created}</p>
          <p>Skipped: {result.skipped}</p>
          <p>Errors: {result.errors_count}</p>

          {result.skipped_guests.length > 0 && (
            <div>
              <h5>Skipped Guests (Duplicates):</h5>
              <ul>
                {result.skipped_guests.map((guest, idx) => (
                  <li key={idx}>{guest.name}</li>
                ))}
              </ul>
            </div>
          )}

          {result.errors.length > 0 && (
            <div>
              <h5>Errors:</h5>
              <ul>
                {result.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GuestBulkImport;
```

## Troubleshooting

### Common Issues

**Issue: "CSV file must have a 'name' column in the first row"**
- Solution: Ensure the first row of your CSV/Excel file contains a column header named "name" (case doesn't matter)

**Issue: "No valid guest names found in the file"**
- Solution: Check that your file has data rows below the header row with actual guest names

**Issue: All guests are being skipped**
- Solution: The guests might already exist in the event. Check the existing guest list first

**Issue: "File size too large"**
- Solution: Split your guest list into multiple files, each under 5MB

**Issue: Some names have special characters showing incorrectly**
- Solution: Ensure your CSV file is saved with UTF-8 encoding

**Issue: Permission denied**
- Solution: Ensure you are the event organizer or have editor/admin collaborator access

## Limitations

1. **File Size:** Maximum 5MB per file
2. **File Formats:** Only CSV, .xlsx, and .xls files are supported
3. **Required Column:** The file must have a "name" column
4. **Duplicate Handling:** Duplicates are skipped, not merged or updated
5. **Permissions:** Only event organizers and collaborators with edit access can import guests

## Additional Resources

- [Event Guest Management API Documentation](API_DOCUMENTATION.md)
- [Guest List Features Overview](GUEST_LIST_FEATURES.md)
- [Authentication Guide](AUTHENTICATION_GUIDE.md)

## Support

If you encounter any issues with bulk import:
1. Check this documentation for common solutions
2. Verify your file format matches the requirements
3. Test with a small sample file first
4. Contact support with the specific error message

---

**Last Updated:** October 2025
**API Version:** 1.0
