-- ============================================
-- MIGRATION: Add Form Progress Tracking Columns
-- ============================================
-- Date: 2024-01-15
-- Description: Adds columns to form_assignments table for tracking form progress,
--              field completion counts, last updated timestamp, and signature data
-- 
-- IMPORTANT: Run this migration only if columns don't already exist
-- If columns exist, MySQL will show an error - you can safely ignore it
-- ============================================

-- Add completed_fields_count column
-- Tracks how many fields have been filled in the form
ALTER TABLE form_assignments 
ADD COLUMN completed_fields_count INT DEFAULT 0 
COMMENT 'Number of fields filled' 
AFTER progress;

-- Add total_fields_count column
-- Tracks total number of fields in the form template
ALTER TABLE form_assignments 
ADD COLUMN total_fields_count INT DEFAULT 0 
COMMENT 'Total number of fields in form' 
AFTER completed_fields_count;

-- Add last_updated_at column
-- Tracks when the form was last updated (auto-updates on any change)
ALTER TABLE form_assignments 
ADD COLUMN last_updated_at TIMESTAMP NULL 
ON UPDATE CURRENT_TIMESTAMP 
COMMENT 'Last time form was updated' 
AFTER completed_at;

-- Add signature_data column
-- Stores signature image/data if form requires signature
ALTER TABLE form_assignments 
ADD COLUMN signature_data TEXT NULL 
COMMENT 'Signature image/data if form requires signature' 
AFTER due_date;

-- Add index for last_updated_at for faster queries
-- This helps with sorting and filtering by last updated time
-- Note: If index already exists, MySQL will show an error - you can ignore it
CREATE INDEX idx_last_updated_at ON form_assignments(last_updated_at);

-- ============================================
-- VERIFICATION QUERIES (Run these to verify migration)
-- ============================================
-- SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = DATABASE() 
-- AND TABLE_NAME = 'form_assignments' 
-- AND COLUMN_NAME IN ('completed_fields_count', 'total_fields_count', 'last_updated_at', 'signature_data');

-- SHOW INDEXES FROM form_assignments WHERE Key_name = 'idx_last_updated_at';

-- ============================================
-- ROLLBACK SCRIPT (In case you need to revert)
-- ============================================
-- DROP INDEX IF EXISTS idx_last_updated_at ON form_assignments;
-- ALTER TABLE form_assignments DROP COLUMN IF EXISTS signature_data;
-- ALTER TABLE form_assignments DROP COLUMN IF EXISTS last_updated_at;
-- ALTER TABLE form_assignments DROP COLUMN IF EXISTS total_fields_count;
-- ALTER TABLE form_assignments DROP COLUMN IF EXISTS completed_fields_count;

