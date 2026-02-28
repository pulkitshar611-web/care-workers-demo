# Forms API Implementation Summary

## Overview

This document explains the backend API implementation for the Forms module, which supports two distinct types of forms:
1. **Template Forms** - Shown in Admin → Forms / Templates (~30 forms)
2. **Client Forms** - Shown in Admin → Clients (~4 forms)

## Database Changes

### Migration File
**File:** `database/add_form_category.sql`

A new column `form_category` has been added to the `form_templates` table to distinguish between template and client forms.

**SQL Changes:**
```sql
ALTER TABLE form_templates 
ADD COLUMN form_category ENUM('template', 'client') DEFAULT 'template' AFTER type;

CREATE INDEX idx_form_category ON form_templates(form_category);
```

**To apply the migration:**
```bash
mysql -u your_username -p care_worker_db < database/add_form_category.sql
```

## API Endpoints

### 1. Get Template Forms
**Endpoint:** `GET /api/forms/templates`

**Description:** Returns all template forms (used by Admin → Forms / Templates)

**Authentication:** Required (Admin only)

**Query Parameters:**
- `search` (optional) - Search by name or description
- `type` (optional) - Filter by type: 'Input' or 'Document'

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Character Reference",
      "description": "Character reference form for Kiaan Technology applicants",
      "type": "Input",
      "version": "1.0",
      "status": "active",
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    },
    ...
  ]
}
```

**Example Request:**
```bash
GET /api/forms/templates?search=character&type=Input
Authorization: Bearer <admin_jwt_token>
```

**SQL Query:**
```sql
SELECT 
  id, 
  name, 
  description, 
  type, 
  version, 
  CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END as status,
  created_at, 
  updated_at
FROM form_templates
WHERE form_category = 'template'
ORDER BY name ASC
```

---

### 2. Get Client Forms
**Endpoint:** `GET /api/forms/clients`

**Description:** Returns all client forms (used by Admin → Clients)

**Authentication:** Required (Admin only)

**Query Parameters:**
- `search` (optional) - Search by name or description
- `type` (optional) - Filter by type: 'Input' or 'Document'

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 25,
      "name": "Telephone Monitoring",
      "description": "Form for monitoring telephone conversations with clients",
      "type": "Input",
      "version": "1.0",
      "status": "active",
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    },
    {
      "id": 26,
      "name": "Care Plan",
      "description": "Comprehensive care planning document",
      "type": "Input",
      "version": "2.0",
      "status": "active",
      ...
    },
    {
      "id": 27,
      "name": "Risk Management",
      "description": "Document for identifying and managing risks",
      "type": "Input",
      "version": "2.0",
      "status": "active",
      ...
    },
    {
      "id": 28,
      "name": "Incident Form",
      "description": "Form for reporting incidents",
      "type": "Input",
      "version": "1.0",
      "status": "active",
      ...
    }
  ]
}
```

**Example Request:**
```bash
GET /api/forms/clients
Authorization: Bearer <admin_jwt_token>
```

**SQL Query:**
```sql
SELECT 
  id, 
  name, 
  description, 
  type, 
  version, 
  CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END as status,
  created_at, 
  updated_at
FROM form_templates
WHERE form_category = 'client'
ORDER BY name ASC
```

---

### 3. Get All Forms (Backward Compatibility)
**Endpoint:** `GET /api/forms`

**Description:** Returns all template forms (kept for backward compatibility)

**Authentication:** Required (Admin only)

**Note:** This endpoint now only returns template forms by default. Use `/api/forms/templates` or `/api/forms/clients` for specific form types.

---

## File Changes

### 1. Controller: `controllers/formController.js`

**New Functions:**
- `getTemplateForms()` - Handles GET /api/forms/templates
- `getClientForms()` - Handles GET /api/forms/clients

**Updated Functions:**
- `getAllForms()` - Now filters by `form_category = 'template'` by default

### 2. Routes: `routes/formRoutes.js`

**New Routes:**
- `GET /api/forms/templates` → `getTemplateForms` (Admin only)
- `GET /api/forms/clients` → `getClientForms` (Admin only)

**Route Order:**
Routes are ordered correctly with specific routes (`/templates`, `/clients`) before parameterized routes (`/:id`) to avoid conflicts.

---

## Response Field Mapping

| Database Field | API Response Field | Notes |
|---------------|-------------------|-------|
| `id` | `id` | Form ID |
| `name` | `name` | Form name |
| `description` | `description` | Form description |
| `type` | `type` | 'Input' or 'Document' |
| `version` | `version` | Form version (e.g., '1.0', '2.0') |
| `is_active` | `status` | Converted to 'active' or 'inactive' |
| `created_at` | `created_at` | Creation timestamp |
| `updated_at` | `updated_at` | Last update timestamp |

---

## Frontend Integration

The frontend should call these endpoints:

**For Admin → Forms / Templates:**
```javascript
fetch('/api/forms/templates', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**For Admin → Clients:**
```javascript
fetch('/api/forms/clients', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## Testing

### Test Template Forms Endpoint
```bash
curl -X GET http://localhost:5000/api/forms/templates \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Client Forms Endpoint
```bash
curl -X GET http://localhost:5000/api/forms/clients \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test with Search Filter
```bash
curl -X GET "http://localhost:5000/api/forms/templates?search=character&type=Input" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Important Notes

1. **Forms are FIXED:** Admin cannot create, edit, or delete forms. These APIs are READ-ONLY.

2. **Form Categories:**
   - `template` - Forms shown in Admin → Forms / Templates
   - `client` - Forms shown in Admin → Clients

3. **Authentication:** All endpoints require JWT authentication and admin role.

4. **Status Field:** The `status` field in the response is derived from `is_active` boolean:
   - `is_active = 1` → `status = 'active'`
   - `is_active = 0` → `status = 'inactive'`

5. **Default Forms:** The migration script automatically inserts the 4 client forms:
   - Telephone Monitoring
   - Care Plan
   - Risk Management
   - Incident Form

---

## Next Steps

1. Run the database migration: `database/add_form_category.sql`
2. Verify the APIs work correctly using Postman or curl
3. Update frontend to call the new endpoints (if not already done)
4. Test the complete flow: Admin → Forms / Templates and Admin → Clients

---

## Troubleshooting

### Issue: No forms returned
- Check if migration was run successfully
- Verify `form_category` column exists: `DESCRIBE form_templates;`
- Check if forms exist: `SELECT * FROM form_templates WHERE form_category = 'template';`

### Issue: 401 Unauthorized
- Verify JWT token is valid
- Check if user has admin role
- Verify `authenticate` and `requireAdmin` middleware are working

### Issue: Route conflicts
- Ensure route order: specific routes (`/templates`, `/clients`) before `/:id`
- Check Express route matching order

---

## Summary

✅ Database migration created (`add_form_category.sql`)
✅ Two new API endpoints created (`/api/forms/templates` and `/api/forms/clients`)
✅ Controller functions implemented with proper SQL queries
✅ Routes configured with correct authentication and authorization
✅ Response format matches frontend expectations
✅ Backward compatibility maintained

The backend is now fully compatible with the frontend UI requirements!

