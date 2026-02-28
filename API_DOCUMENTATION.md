# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Authentication Endpoints

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "info@kiaantechnology.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "info@kiaantechnology.com",
      "role": "admin",
      "status": "active"
    }
  }
}
```

### Get Current User
**GET** `/auth/me`

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "info@kiaantechnology.com",
      "role": "admin",
      "status": "active"
    }
  }
}
```

---

## Admin Endpoints

### Get Dashboard
**GET** `/admin/dashboard`

**Headers:** `Authorization: Bearer TOKEN` (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalCarers": 10,
      "pendingForms": 5,
      "completedPacks": 85,
      "pendingSignatures": 7
    },
    "recentCarers": [
      {
        "id": "CW001",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "status": "Active",
        "progress": 85,
        "pendingSignatures": 2
      }
    ]
  }
}
```

---

## Kiaan Technology Management (Admin Only)

### Get All Kiaan Technologys
**GET** `/care-workers?search=john&status=Active&progress=76-100`

**Query Parameters:**
- `search` - Search by name, email, or phone
- `status` - Filter by status (All, Active, Inactive, Pending)
- `progress` - Filter by progress range (0-25, 26-50, 51-75, 76-100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "status": "Active",
      "progress": 85,
      "pendingSignoffs": 2,
      "assignedForms": [1, 2, 3]
    }
  ]
}
```

### Get Kiaan Technology by ID
**GET** `/care-workers/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "status": "Active",
    "progress": 85,
    "pendingSignoffs": 2,
    "assignedForms": [1, 2, 3],
    "forms": [...]
  }
}
```

### Create Kiaan Technology
**POST** `/care-workers`

**Request Body:**
```json
{
  "email": "careworker@example.com",
  "password": "password123",
  "name": "Jane Smith",
  "phone": "0987654321",
  "address": "123 Main St",
  "emergencyContactName": "Emergency Contact",
  "emergencyContactPhone": "1111111111",
  "status": "active"
}
```

### Update Kiaan Technology
**PUT** `/care-workers/:id`

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "phone": "9999999999",
  "status": "active"
}
```

### Delete Kiaan Technology
**DELETE** `/care-workers/:id`

**Note:** Soft delete - sets status to 'inactive'

---

## Form Templates (Admin Only)

### Get All Forms
**GET** `/forms?search=employment&type=Input`

**Query Parameters:**
- `search` - Search by name or description
- `type` - Filter by type (Input, Document)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Employment Application",
      "description": "Standard employment application",
      "type": "Input",
      "version": "1.0",
      "is_active": true
    }
  ]
}
```

### Create Form Template
**POST** `/forms`

**Request Body:**
```json
{
  "name": "New Form",
  "description": "Form description",
  "type": "Input",
  "version": "1.0",
  "formData": {},
  "isActive": true
}
```

### Update Form Template
**PUT** `/forms/:id`

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Form Name",
  "version": "1.1"
}
```

### Delete Form Template
**DELETE** `/forms/:id`

**Note:** If form has assignments, it will be deactivated instead of deleted

---

## Form Assignments

### Assign Forms to Kiaan Technology
**POST** `/form-assignments`

**Headers:** `Authorization: Bearer TOKEN` (Admin only)

**Request Body:**
```json
{
  "careWorkerId": 1,
  "formTemplateIds": [1, 2, 3],
  "dueDate": "2024-12-31"
}
```

### Get Kiaan Technology Assignments
**GET** `/form-assignments/care-worker/:id`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status": "in_progress",
      "progress": 50,
      "form_name": "Employment Application",
      "form_type": "Input",
      "assigned_at": "2024-01-01T00:00:00.000Z",
      "due_date": "2024-12-31"
    }
  ]
}
```

### Update Form Assignment
**PUT** `/form-assignments/:id`

**Request Body:**
```json
{
  "status": "submitted",
  "progress": 100,
  "formData": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

**Status Values:**
- `assigned` - Form assigned but not started
- `in_progress` - Form being filled
- `submitted` - Form submitted, waiting for signature
- `signature_pending` - Signature required
- `completed` - Fully completed

---

## Signatures

### Get Pending Signatures
**GET** `/signatures/pending`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "assignment_id": 1,
      "form_name": "Employment Application",
      "form_type": "Input",
      "submitted_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Submit Signature
**POST** `/signatures`

**Request Body:**
```json
{
  "assignmentId": 1,
  "signatureData": "base64_encoded_signature_or_text",
  "signatureType": "draw"
}
```

**Signature Types:**
- `draw` - Drawn signature (base64 image)
- `type` - Typed signature (text)

---

## Kiaan Technology Dashboard

### Get Dashboard
**GET** `/care-worker/dashboard`

**Headers:** `Authorization: Bearer TOKEN` (Kiaan Technology only)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "formsCompleted": 8,
      "formsPending": 3,
      "signaturesNeeded": 2,
      "profileStatus": "Active"
    },
    "notifications": [
      {
        "id": 1,
        "type": "form_assigned",
        "message": "New form has been assigned to you",
        "read": false,
        "time": "2024-01-01T00:00:00.000Z"
      }
    ],
    "forms": [
      {
        "id": 1,
        "name": "Employment Application",
        "status": "In Progress",
        "action": "Resume",
        "dueDate": "2024-12-31",
        "progress": 50
      }
    ]
  }
}
```

---

## Import/Export (Admin Only)

### Import Kiaan Technologys from CSV
**POST** `/import-export/import-care-workers`

**Headers:** `Authorization: Bearer TOKEN`, `Content-Type: multipart/form-data`

**Request:** Form data with `file` field containing CSV file

**CSV Format:**
```csv
email,password,name,phone,address,emergencyContactName,emergencyContactPhone,status
careworker1@example.com,password123,John Doe,1234567890,123 Main St,Emergency Contact,1111111111,active
careworker2@example.com,password123,Jane Smith,0987654321,456 Oak Ave,Emergency Contact,2222222222,active
```

**Response:**
```json
{
  "success": true,
  "message": "Import completed: 2 successful, 0 errors",
  "data": {
    "total": 2,
    "success": 2,
    "errors": 0,
    "errorDetails": []
  }
}
```

### Export Kiaan Technologys to CSV
**GET** `/import-export/export-care-workers`

**Response:** CSV file download

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error (in development mode)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

