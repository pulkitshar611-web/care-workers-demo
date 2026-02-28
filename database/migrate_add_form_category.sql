-- ============================================
-- Migration: Add form_category column to form_templates table
-- Run this if your database already exists and doesn't have form_category column
-- ============================================

USE care_worker_db;

-- Check if column already exists, if not add it
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'care_worker_db' 
    AND TABLE_NAME = 'form_templates' 
    AND COLUMN_NAME = 'form_category'
);

-- Add form_category column if it doesn't exist
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE form_templates ADD COLUMN form_category ENUM(''template'', ''client'') DEFAULT ''template'' AFTER type',
    'SELECT ''Column form_category already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_form_category ON form_templates(form_category);

-- Update existing forms to be 'template' category (default)
UPDATE form_templates SET form_category = 'template' WHERE form_category IS NULL;

-- Insert client forms if they don't exist
SET @admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

INSERT INTO form_templates (name, description, type, form_category, version, form_data, is_active, created_by) 
SELECT * FROM (
    SELECT 'Telephone Monitoring' AS name, 
           'Form for monitoring telephone conversations with clients for quality assurance and compliance purposes.' AS description, 
           'Input' AS type, 
           'client' AS form_category, 
           '1.0' AS version, 
           '{}' AS form_data, 
           TRUE AS is_active, 
           @admin_id AS created_by
    UNION ALL
    SELECT 'Care Plan', 
           'Comprehensive care planning document to address client needs, preferences, and support requirements.', 
           'Input', 
           'client',
           '2.0', 
           '{}', 
           TRUE, 
           @admin_id
    UNION ALL
    SELECT 'Risk Management', 
           'Document for identifying, assessing, and managing risks associated with client care and service delivery.', 
           'Input', 
           'client', 
           '2.0', 
           '{}', 
           TRUE, 
           @admin_id
    UNION ALL
    SELECT 'Incident Form', 
           'Form for reporting and documenting any incidents that occur during service delivery.', 
           'Input', 
           'client', 
           '1.0', 
           '{}', 
           TRUE, 
           @admin_id
) AS new_forms
WHERE NOT EXISTS (
    SELECT 1 FROM form_templates 
    WHERE name = new_forms.name AND form_category = 'client'
);

SELECT 'Migration completed successfully!' AS message;
SELECT COUNT(*) AS total_template_forms FROM form_templates WHERE form_category = 'template';
SELECT COUNT(*) AS total_client_forms FROM form_templates WHERE form_category = 'client';

