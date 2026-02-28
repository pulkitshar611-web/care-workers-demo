# Database Migration Instructions

## ⚠️ Error: Unknown column 'form_category'

If you're seeing this error:
```
Error: Unknown column 'form_category' in 'where clause'
```

It means your existing database doesn't have the `form_category` column yet. Follow these steps:

---

## 🔧 Quick Fix (Recommended)

### Option 1: Run Migration Script

```bash
mysql -u root -p care_worker_db < Care_Worker_Bachend/database/migrate_add_form_category.sql
```

This will:
- ✅ Add `form_category` column to `form_templates` table
- ✅ Create index for better performance
- ✅ Update existing forms to 'template' category
- ✅ Insert 4 client forms if they don't exist

---

### Option 2: Manual SQL Commands

If you prefer to run SQL manually:

```sql
USE care_worker_db;

-- Add form_category column
ALTER TABLE form_templates 
ADD COLUMN form_category ENUM('template', 'client') DEFAULT 'template' AFTER type;

-- Create index
CREATE INDEX idx_form_category ON form_templates(form_category);

-- Update existing forms
UPDATE form_templates SET form_category = 'template' WHERE form_category IS NULL;

-- Insert client forms
SET @admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

INSERT INTO form_templates (name, description, type, form_category, version, form_data, is_active, created_by) VALUES
('Telephone Monitoring', 'Form for monitoring telephone conversations with clients', 'Input', 'client', '1.0', '{}', TRUE, @admin_id),
('Care Plan', 'Comprehensive care planning document', 'Input', 'client', '2.0', '{}', TRUE, @admin_id),
('Risk Management', 'Document for identifying and managing risks', 'Input', 'client', '2.0', '{}', TRUE, @admin_id),
('Incident Form', 'Form for reporting incidents', 'Input', 'client', '1.0', '{}', TRUE, @admin_id)
ON DUPLICATE KEY UPDATE form_category = 'client';
```

---

## ✅ Verify Migration

After running the migration, verify it worked:

```sql
USE care_worker_db;

-- Check if column exists
DESCRIBE form_templates;

-- Check form counts
SELECT form_category, COUNT(*) as count 
FROM form_templates 
GROUP BY form_category;
```

You should see:
- `form_category` column in the table structure
- Template forms count (~30)
- Client forms count (4)

---

## 🆕 Fresh Database Setup

If you're setting up a **new database**, use the consolidated schema:

```bash
mysql -u root -p
CREATE DATABASE care_worker_db;
USE care_worker_db;
SOURCE Care_Worker_Bachend/database/schema.sql;
```

The consolidated `schema.sql` already includes the `form_category` column, so no migration needed!

---

## 🐛 Troubleshooting

### Error: Column already exists
If you see "Duplicate column name 'form_category'", the column already exists. Skip the ALTER TABLE command.

### Error: No admin user found
Make sure you have an admin user:
```sql
SELECT * FROM users WHERE role = 'admin';
```

If no admin exists, create one:
```bash
node Care_Worker_Bachend/scripts/setupAdmin.js
```

### Error: Table doesn't exist
If `form_templates` table doesn't exist, run the full schema:
```bash
mysql -u root -p care_worker_db < Care_Worker_Bachend/database/schema.sql
```

---

## 📋 Summary

- **Existing Database:** Run `migrate_add_form_category.sql`
- **New Database:** Use `schema.sql` (already includes form_category)
- **Verify:** Check column exists and forms are categorized correctly

After migration, restart your backend server and test the endpoints:
- `GET /api/forms/templates`
- `GET /api/forms/clients`

