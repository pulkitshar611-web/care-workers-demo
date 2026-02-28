-- Sample Data for ALL Tables in Kiaan Technology Management System
-- This file inserts at least 1 sample record in each table
-- Run: mysql -u root -p care_worker_db < database/sample_data_all_tables.sql

USE care_worker_db;

-- ============================================
-- 1. USERS TABLE
-- ============================================
-- Admin user (if not exists)
INSERT INTO users (email, password, role, status) 
VALUES ('info@kiaantechnology.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJq', 'admin', 'active')
ON DUPLICATE KEY UPDATE email=email;

-- Kiaan Technology user
INSERT INTO users (email, password, role, status) 
VALUES ('careworker1@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJq', 'care_worker', 'active')
ON DUPLICATE KEY UPDATE email=email;

-- Get IDs for foreign keys
SET @admin_id = (SELECT id FROM users WHERE email = 'info@kiaantechnology.com' LIMIT 1);
SET @care_worker_id = (SELECT id FROM users WHERE email = 'careworker1@example.com' LIMIT 1);

-- ============================================
-- 2. CARE_WORKER_PROFILES TABLE
-- ============================================
INSERT INTO care_worker_profiles (user_id, name, phone, address, emergency_contact_name, emergency_contact_phone)
VALUES (@care_worker_id, 'John Doe', '+44 7700 900123', '123 Main Street, London, UK', 'Jane Doe', '+44 7700 900124')
ON DUPLICATE KEY UPDATE user_id=user_id;

-- ============================================
-- 3. FORM_TEMPLATES TABLE
-- ============================================
INSERT INTO form_templates (name, description, type, version, form_data, is_active, created_by)
VALUES 
('Employment Application', 'Standard employment application form for new Kiaan Technologys', 'Input', '1.0', '{}', TRUE, @admin_id),
('Health & Safety Handbook', 'Health and safety handbook acknowledgment form', 'Document', '2.0', '{}', TRUE, @admin_id),
('Interview Scoring', 'Interview scoring form for Kiaan Technology candidates', 'Input', '1.0', '{}', TRUE, @admin_id)
ON DUPLICATE KEY UPDATE name=name;

-- Get form template IDs
SET @form_template_1 = (SELECT id FROM form_templates WHERE name = 'Employment Application' LIMIT 1);
SET @form_template_2 = (SELECT id FROM form_templates WHERE name = 'Health & Safety Handbook' LIMIT 1);
SET @form_template_3 = (SELECT id FROM form_templates WHERE name = 'Interview Scoring' LIMIT 1);

-- ============================================
-- 4. FORM_ASSIGNMENTS TABLE
-- ============================================
INSERT INTO form_assignments (care_worker_id, form_template_id, status, progress, form_data, assigned_by, assigned_at, due_date)
VALUES 
(@care_worker_id, @form_template_1, 'completed', 100, '{"field1":"value1","field2":"value2"}', @admin_id, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@care_worker_id, @form_template_2, 'signature_pending', 95, '{"acknowledged":true}', @admin_id, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY)),
(@care_worker_id, @form_template_3, 'in_progress', 50, '{"score":75}', @admin_id, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY))
ON DUPLICATE KEY UPDATE care_worker_id=care_worker_id;

-- Get assignment IDs
SET @assignment_completed = (SELECT id FROM form_assignments WHERE status = 'completed' LIMIT 1);
SET @assignment_signature = (SELECT id FROM form_assignments WHERE status = 'signature_pending' LIMIT 1);

-- ============================================
-- 5. SIGNATURES TABLE
-- ============================================
INSERT INTO signatures (form_assignment_id, signature_data, signature_type, signed_at)
VALUES 
(@assignment_completed, 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'draw', DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE form_assignment_id=form_assignment_id;

-- ============================================
-- 6. NOTIFICATIONS TABLE
-- ============================================
INSERT INTO notifications (user_id, type, message, is_read, created_at)
VALUES 
(@care_worker_id, 'form_assigned', 'New form "Employment Application" has been assigned to you', FALSE, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(@care_worker_id, 'signature_required', 'Signature required for "Health & Safety Handbook" form', FALSE, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@care_worker_id, 'admin_reminder', 'Admin reminder: Please update your profile information', TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE user_id=user_id;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
SELECT '✅ Sample data inserted successfully!' AS message;

SELECT 'Users' AS table_name, COUNT(*) AS record_count FROM users
UNION ALL
SELECT 'Kiaan Technology Profiles', COUNT(*) FROM care_worker_profiles
UNION ALL
SELECT 'Form Templates', COUNT(*) FROM form_templates
UNION ALL
SELECT 'Form Assignments', COUNT(*) FROM form_assignments
UNION ALL
SELECT 'Signatures', COUNT(*) FROM signatures
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications;

-- Show sample data
SELECT '\n📋 Sample Data Summary:' AS info;
SELECT 'Admin User:' AS label, email, role, status FROM users WHERE role = 'admin';
SELECT 'Kiaan Technology User:' AS label, email, role, status FROM users WHERE role = 'care_worker';
SELECT 'Kiaan Technology Profile:' AS label, name, phone FROM care_worker_profiles LIMIT 1;
SELECT 'Form Templates:' AS label, name, type, version FROM form_templates LIMIT 3;
SELECT 'Form Assignments:' AS label, status, progress FROM form_assignments LIMIT 3;
SELECT 'Signatures:' AS label, signature_type, signed_at FROM signatures LIMIT 1;
SELECT 'Notifications:' AS label, type, message, is_read FROM notifications LIMIT 3;

