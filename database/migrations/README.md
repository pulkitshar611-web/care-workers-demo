# Database Migrations

This directory contains database migration scripts for incremental schema updates.

## Migration Files

### 001_add_form_progress_tracking.sql
**Date:** 2024-01-15  
**Description:** Adds form progress tracking columns to `form_assignments` table

**Columns Added:**
- `completed_fields_count` - Number of fields filled
- `total_fields_count` - Total number of fields in form
- `last_updated_at` - Last update timestamp
- `signature_data` - Signature image/data storage

**Index Added:**
- `idx_last_updated_at` - Index on `last_updated_at` for faster queries

## How to Run Migrations

### Option 1: Using MySQL Command Line
```bash
mysql -u your_username -p your_database_name < migrations/001_add_form_progress_tracking.sql
```

### Option 2: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your database
3. Open the migration file
4. Execute the script

### Option 3: Using phpMyAdmin
1. Select your database
2. Go to SQL tab
3. Copy and paste the migration SQL
4. Click "Go"

## Verification

After running the migration, verify the changes:

```sql
-- Check if columns exist
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'form_assignments' 
AND COLUMN_NAME IN ('completed_fields_count', 'total_fields_count', 'last_updated_at', 'signature_data');

-- Check if index exists
SHOW INDEXES FROM form_assignments WHERE Key_name = 'idx_last_updated_at';
```

## Rollback

If you need to rollback this migration, use the rollback script at the bottom of the migration file.

## Notes

- If columns already exist, MySQL will show an error - you can safely ignore it
- Always backup your database before running migrations
- Test migrations on a development database first

