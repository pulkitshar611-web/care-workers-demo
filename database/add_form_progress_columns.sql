-- ============================================
-- FORM ASSIGNMENTS PROGRESS TRACKING UPGRADE
-- ============================================
-- Table: form_assignments
-- Purpose:
-- 1. Track completed fields
-- 2. Track total fields
-- 3. Track last update timestamp
-- 4. Store signature data
-- 5. Improve performance with index
-- ============================================

-- 1️⃣ Add completed_fields_count
ALTER TABLE form_assignments
ADD COLUMN IF NOT EXISTS completed_fields_count INT DEFAULT 0
COMMENT 'Number of fields filled'
AFTER progress;

-- 2️⃣ Add total_fields_count
ALTER TABLE form_assignments
ADD COLUMN IF NOT EXISTS total_fields_count INT DEFAULT 0
COMMENT 'Total number of fields in form'
AFTER completed_fields_count;

-- 3️⃣ Add last_updated_at (auto updates on every change)
ALTER TABLE form_assignments
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP
NULL
DEFAULT CURRENT_TIMESTAMP
ON UPDATE CURRENT_TIMESTAMP
COMMENT 'Last time form was updated'
AFTER completed_at;

-- 4️⃣ Add signature_data
ALTER TABLE form_assignments
ADD COLUMN IF NOT EXISTS signature_data TEXT
NULL
COMMENT 'Signature image/data if form requires signature'
AFTER due_date;

-- 5️⃣ Create index for faster sorting/filtering
CREATE INDEX IF NOT EXISTS idx_last_updated_at
ON form_assignments (last_updated_at);

-- ============================================
-- ✅ VERIFICATION QUERIES
-- ============================================

-- Check columns
DESCRIBE form_assignments;

-- Check index
SHOW INDEX FROM form_assignments WHERE Key_name = 'idx_last_updated_at';
