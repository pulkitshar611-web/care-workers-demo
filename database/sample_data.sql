-- Sample Data for Kiaan Technology Management System
-- 
-- IMPORTANT: This SQL file uses placeholder password hashes.
-- For proper password hashing, use the Node.js script instead:
--   node scripts/insertSampleData.js
--
-- If you prefer SQL, you'll need to generate bcrypt hashes for passwords.
-- All Kiaan Technology passwords should be: password123

USE care_worker_db;

-- ============================================
-- SAMPLE Kiaan TechnologyS
-- ============================================

-- Insert Kiaan Technology Users (passwords are all 'password123')
INSERT INTO users (email, password, role, status) VALUES
('careworker1@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJqJq', 'care_worker', 'active'),
('careworker2@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJq', 'care_worker', 'active'),
('careworker3@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJq', 'care_worker', 'active'),
('careworker4@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJq', 'care_worker', 'active'),
('careworker5@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJq', 'care_worker', 'pending'),
('sarah.johnson@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJq', 'care_worker', 'active'),
('michael.chen@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJq', 'care_worker', 'pending'),
('emma.wilson@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJq', 'care_worker', 'active');

-- Insert Kiaan Technology Profiles
INSERT INTO care_worker_profiles (user_id, name, phone, address, emergency_contact_name, emergency_contact_phone) VALUES
(2, 'John Doe', '+44 7700 900123', '123 Main Street, London, UK', 'Jane Doe', '+44 7700 900124'),
(3, 'Jane Smith', '+44 7700 900456', '456 Oak Avenue, Manchester, UK', 'John Smith', '+44 7700 900457'),
(4, 'Mike Johnson', '+44 7700 900789', '789 Elm Road, Birmingham, UK', 'Sarah Johnson', '+44 7700 900790'),
(5, 'Emily Davis', '+44 7700 901012', '321 Pine Street, Leeds, UK', 'David Davis', '+44 7700 901013'),
(6, 'Robert Brown', '+44 7700 901345', '654 Maple Drive, Liverpool, UK', 'Mary Brown', '+44 7700 901346'),
(7, 'Sarah Johnson', '+44 7700 900123', '123 Kiaan Technology Lane, London, UK', 'Emergency Contact', '+44 7700 900124'),
(8, 'Michael Chen', '+44 7700 900456', '456 Healthcare Street, Manchester, UK', 'Emergency Contact', '+44 7700 900457'),
(9, 'Emma Wilson', '+44 7700 900789', '789 Support Road, Birmingham, UK', 'Emergency Contact', '+44 7700 900790');

-- ============================================
-- SAMPLE FORM TEMPLATES
-- ============================================

-- Get admin user ID (assuming admin is user ID 1)
SET @admin_id = (SELECT id FROM users WHERE email = 'info@kiaantechnology.com' LIMIT 1);

-- Insert Form Templates
INSERT INTO form_templates (name, description, type, version, form_data, is_active, created_by) VALUES
('Employment Application', 'Standard employment application form for new Kiaan Technologys', 'Input', '1.0', '{}', TRUE, @admin_id),
('Character Reference', 'Character reference form for Kiaan Technology applicants', 'Input', '1.0', '{}', TRUE, @admin_id),
('Health & Safety Handbook', 'Health and safety handbook acknowledgment form', 'Document', '2.0', '{}', TRUE, @admin_id),
('Job Description', 'Job description document for Kiaan Technology position', 'Document', '1.0', '{}', TRUE, @admin_id),
('Interview Scoring', 'Interview scoring form for Kiaan Technology candidates', 'Input', '1.0', '{}', TRUE, @admin_id),
('Declaration of Health', 'Health declaration form for Kiaan Technologys', 'Input', '1.0', '{}', TRUE, @admin_id),
('Induction Certificate 1', 'First induction certificate for new Kiaan Technologys', 'Document', '1.0', '{}', TRUE, @admin_id),
('Induction Certificate 2', 'Second induction certificate for Kiaan Technologys', 'Document', '1.0', '{}', TRUE, @admin_id),
('Medication Competency', 'Medication competency assessment form', 'Input', '1.0', '{}', TRUE, @admin_id),
('Review Form', 'Annual review form for Kiaan Technologys', 'Input', '1.0', '{}', TRUE, @admin_id),
('Zero Hour Contract', 'Zero hour contract document', 'Document', '1.0', '{}', TRUE, @admin_id),
('Information Sheet', 'Information sheet for Kiaan Technologys', 'Document', '1.0', '{}', TRUE, @admin_id),
('Spot Check Form', 'Spot check form for Kiaan Technology supervision', 'Input', '1.0', '{}', TRUE, @admin_id),
('Supervision Form', 'Supervision form for Kiaan Technology management', 'Input', '1.0', '{}', TRUE, @admin_id),
('Appraisal Form', 'Appraisal form for Kiaan Technology evaluation', 'Input', '1.0', '{}', TRUE, @admin_id),
('Application Form', 'General application form', 'Input', '1.0', '{}', TRUE, @admin_id),
('Medication Management', 'Medication management form', 'Input', '1.0', '{}', TRUE, @admin_id),
('Kiaan Technology Shadowing', 'Kiaan Technology shadowing form', 'Input', '1.0', '{}', TRUE, @admin_id),
('Training Matrix', 'Training matrix form for Kiaan Technologys', 'Input', '1.0', '{}', TRUE, @admin_id),
('Client Profile', 'Client profile form', 'Input', '1.0', '{}', TRUE, @admin_id),
('Unite Care Ltd', 'Unite Care Ltd form', 'Input', '1.0', '{}', TRUE, @admin_id),
('Induction Checklist', 'Induction checklist form', 'Input', '1.0', '{}', TRUE, @admin_id),
('Carer DBS Form', 'DBS check form for Kiaan Technologys', 'Input', '1.0', '{}', TRUE, @admin_id),
('Staff File', 'Staff file form', 'Input', '1.0', '{}', TRUE, @admin_id);

-- ============================================
-- SAMPLE FORM ASSIGNMENTS
-- ============================================

-- Assign forms to Kiaan Technologys
-- Kiaan Technology 1 (John Doe) - Multiple forms with different statuses
INSERT INTO form_assignments (care_worker_id, form_template_id, status, progress, assigned_by, assigned_at, due_date) VALUES
(2, 1, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
(2, 2, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY)),
(2, 3, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2, 4, 'signature_pending', 95, @admin_id, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 5, 'signature_pending', 95, @admin_id, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY)),
(2, 6, 'in_progress', 60, @admin_id, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY)),
(2, 7, 'assigned', 0, @admin_id, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 15 DAY));

-- Kiaan Technology 2 (Jane Smith) - Mix of completed and pending
INSERT INTO form_assignments (care_worker_id, form_template_id, status, progress, assigned_by, assigned_at, due_date) VALUES
(3, 1, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 28 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY)),
(3, 2, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY)),
(3, 3, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 22 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)),
(3, 4, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
(3, 5, 'signature_pending', 95, @admin_id, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 6, 'signature_pending', 95, @admin_id, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY)),
(3, 7, 'signature_pending', 95, @admin_id, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY)),
(3, 8, 'in_progress', 45, @admin_id, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 12 DAY)),
(3, 9, 'assigned', 0, @admin_id, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY));

-- Kiaan Technology 3 (Mike Johnson) - Mostly completed
INSERT INTO form_assignments (care_worker_id, form_template_id, status, progress, assigned_by, assigned_at, due_date) VALUES
(4, 1, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY)),
(4, 2, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 32 DAY), DATE_SUB(NOW(), INTERVAL 22 DAY)),
(4, 3, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
(4, 4, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 28 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY)),
(4, 5, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY)),
(4, 6, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 22 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)),
(4, 7, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
(4, 8, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
(4, 9, 'signature_pending', 95, @admin_id, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 10, 'in_progress', 70, @admin_id, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY));

-- Kiaan Technology 4 (Emily Davis) - New worker, mostly assigned
INSERT INTO form_assignments (care_worker_id, form_template_id, status, progress, assigned_by, assigned_at, due_date) VALUES
(5, 1, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
(5, 2, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
(5, 3, 'in_progress', 30, @admin_id, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY)),
(5, 4, 'assigned', 0, @admin_id, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_ADD(NOW(), INTERVAL 8 DAY)),
(5, 5, 'assigned', 0, @admin_id, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY)),
(5, 6, 'assigned', 0, @admin_id, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_ADD(NOW(), INTERVAL 12 DAY));

-- Kiaan Technology 5 (Robert Brown) - Pending status worker
INSERT INTO form_assignments (care_worker_id, form_template_id, status, progress, assigned_by, assigned_at, due_date) VALUES
(6, 1, 'in_progress', 40, @admin_id, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY)),
(6, 2, 'assigned', 0, @admin_id, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY)),
(6, 3, 'assigned', 0, @admin_id, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY));

-- Kiaan Technology 6 (Sarah Johnson) - Active worker
INSERT INTO form_assignments (care_worker_id, form_template_id, status, progress, assigned_by, assigned_at, due_date) VALUES
(7, 1, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)),
(7, 2, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 38 DAY), DATE_SUB(NOW(), INTERVAL 28 DAY)),
(7, 3, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY)),
(7, 4, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 32 DAY), DATE_SUB(NOW(), INTERVAL 22 DAY)),
(7, 5, 'signature_pending', 95, @admin_id, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(7, 6, 'signature_pending', 95, @admin_id, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY)),
(7, 7, 'in_progress', 55, @admin_id, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY));

-- Kiaan Technology 7 (Michael Chen) - Pending status worker
INSERT INTO form_assignments (care_worker_id, form_template_id, status, progress, assigned_by, assigned_at, due_date) VALUES
(8, 1, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(8, 2, 'in_progress', 50, @admin_id, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY)),
(8, 3, 'assigned', 0, @admin_id, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 8 DAY)),
(8, 4, 'assigned', 0, @admin_id, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY));

-- Kiaan Technology 8 (Emma Wilson) - Active worker
INSERT INTO form_assignments (care_worker_id, form_template_id, status, progress, assigned_by, assigned_at, due_date) VALUES
(9, 1, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 35 DAY)),
(9, 2, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 42 DAY), DATE_SUB(NOW(), INTERVAL 32 DAY)),
(9, 3, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)),
(9, 4, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 38 DAY), DATE_SUB(NOW(), INTERVAL 28 DAY)),
(9, 5, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY)),
(9, 6, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 32 DAY), DATE_SUB(NOW(), INTERVAL 22 DAY)),
(9, 7, 'completed', 100, @admin_id, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
(9, 8, 'signature_pending', 95, @admin_id, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(9, 9, 'in_progress', 75, @admin_id, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY));

-- ============================================
-- SAMPLE SIGNATURES
-- ============================================

-- Add some signatures for completed forms
INSERT INTO signatures (form_assignment_id, signature_data, signature_type, signed_at) VALUES
((SELECT id FROM form_assignments WHERE care_worker_id = 2 AND form_template_id = 1 LIMIT 1), 'signature_data_here', 'draw', DATE_SUB(NOW(), INTERVAL 20 DAY)),
((SELECT id FROM form_assignments WHERE care_worker_id = 2 AND form_template_id = 2 LIMIT 1), 'signature_data_here', 'draw', DATE_SUB(NOW(), INTERVAL 15 DAY)),
((SELECT id FROM form_assignments WHERE care_worker_id = 3 AND form_template_id = 1 LIMIT 1), 'signature_data_here', 'draw', DATE_SUB(NOW(), INTERVAL 18 DAY)),
((SELECT id FROM form_assignments WHERE care_worker_id = 3 AND form_template_id = 2 LIMIT 1), 'signature_data_here', 'draw', DATE_SUB(NOW(), INTERVAL 15 DAY)),
((SELECT id FROM form_assignments WHERE care_worker_id = 4 AND form_template_id = 1 LIMIT 1), 'signature_data_here', 'draw', DATE_SUB(NOW(), INTERVAL 25 DAY));

-- ============================================
-- SAMPLE NOTIFICATIONS
-- ============================================

-- Notifications for Kiaan Technologys
INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES
(2, 'form_assigned', 'New form "Employment Application" has been assigned to you', FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'signature_required', 'Signature required for "Health & Safety Handbook" form', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 'form_assigned', 'New form "Medication Competency" has been assigned to you', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 'signature_required', 'Signature required for "Interview Scoring" form', FALSE, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(4, 'form_assigned', 'New form "Review Form" has been assigned to you', TRUE, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(4, 'admin_reminder', 'Admin reminder: Please update your profile information', TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 'form_assigned', 'New form "Induction Certificate 1" has been assigned to you', FALSE, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(7, 'signature_required', 'Signature required for "Appraisal Form" form', FALSE, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(7, 'deadline_alert', 'Medication Management form due in 3 days', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(9, 'signature_required', 'Signature required for "Induction Certificate 2" form', FALSE, DATE_SUB(NOW(), INTERVAL 12 DAY));

-- ============================================
-- UPDATE SUBMITTED AT TIMESTAMPS
-- ============================================

-- Update submitted_at for forms that are submitted or signature_pending
UPDATE form_assignments 
SET submitted_at = DATE_SUB(assigned_at, INTERVAL -7 DAY)
WHERE status IN ('submitted', 'signature_pending', 'completed') AND submitted_at IS NULL;

-- Update completed_at for completed forms
UPDATE form_assignments 
SET completed_at = DATE_SUB(submitted_at, INTERVAL -2 DAY)
WHERE status = 'completed' AND completed_at IS NULL;

-- ============================================
-- SUMMARY
-- ============================================

SELECT 'Sample data inserted successfully!' AS message;
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'care_worker') AS total_care_workers,
    (SELECT COUNT(*) FROM form_templates) AS total_form_templates,
    (SELECT COUNT(*) FROM form_assignments) AS total_assignments,
    (SELECT COUNT(*) FROM form_assignments WHERE status = 'completed') AS completed_forms,
    (SELECT COUNT(*) FROM form_assignments WHERE status = 'signature_pending') AS pending_signatures,
    (SELECT COUNT(*) FROM signatures) AS total_signatures,
    (SELECT COUNT(*) FROM notifications) AS total_notifications;

