# Postman Collection Guide

## 📥 Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `Care_Worker_API.postman_collection.json`
5. Click **Import**

## 🔑 Setup Variables

After importing, the collection will have these variables:
- `baseUrl` - API base URL (default: `http://localhost:5000/api`)
- `authToken` - Current authentication token
- `adminToken` - Admin user token
- `careWorkerToken` - Kiaan Technology user token
- `careWorkerId` - Kiaan Technology ID for testing
- `formTemplateId` - Form Template ID for testing
- `assignmentId` - Form Assignment ID for testing

## 🚀 Quick Start

### Step 1: Login as Admin
1. Go to **Authentication** folder
2. Run **Admin Login** request
3. Token will be automatically saved to `adminToken` variable

### Step 2: Test Admin APIs
- Use requests in **Admin APIs** folder
- Token is automatically included from collection-level auth

### Step 3: Login as Kiaan Technology
1. Run **Kiaan Technology Login** request
2. Token will be saved to `careWorkerToken` variable

### Step 4: Test Kiaan Technology APIs
- Use requests in **Kiaan Technology Dashboard** folder
- Update collection auth to use `careWorkerToken` if needed

## 📋 Collection Structure

```
Kiaan Technology Management API
├── Authentication
│   ├── Admin Login
│   ├── Kiaan Technology Login
│   └── Get Current User
├── Admin APIs
│   └── Get Admin Dashboard
├── Kiaan Technology Management
│   ├── Get All Kiaan Technologys
│   ├── Get Kiaan Technology by ID
│   ├── Create Kiaan Technology
│   ├── Update Kiaan Technology
│   └── Delete Kiaan Technology
├── Form Templates
│   ├── Get All Forms
│   ├── Get Form by ID
│   ├── Create Form Template
│   ├── Update Form Template
│   └── Delete Form Template
├── Form Assignments
│   ├── Assign Forms to Kiaan Technology
│   ├── Get Kiaan Technology Assignments
│   └── Update Form Assignment
├── Signatures
│   ├── Get Pending Signatures
│   └── Submit Signature
├── Kiaan Technology Dashboard
│   └── Get Kiaan Technology Dashboard
├── Import/Export
│   ├── Export Kiaan Technologys to CSV
│   └── Import Kiaan Technologys from CSV
└── Health Check
```

## 🔧 Tips

1. **Auto Token Management**: Login requests automatically save tokens to variables
2. **Collection Auth**: Bearer token auth is set at collection level
3. **Update Variables**: Change `careWorkerId`, `formTemplateId`, etc. as needed
4. **Environment**: Create Postman Environment for different servers (dev, staging, prod)

## 📝 Sample Data

After running `sample_data.sql`, you can use:
- **Admin**: info@kiaantechnology.com / password
- **Kiaan Technology 1**: careworker1@example.com / password123
- **Kiaan Technology 2**: careworker2@example.com / password123

## 🐛 Troubleshooting

- **401 Unauthorized**: Make sure you've logged in and token is saved
- **403 Forbidden**: Check if you're using the correct role token
- **404 Not Found**: Verify IDs in variables match your database

