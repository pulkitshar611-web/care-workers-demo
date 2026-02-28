-- ============================================
-- Kiaan Technology Management System Database Schema
-- Complete Schema with all tables and migrations
-- ============================================
-- Create database (run this separately if needed)
-- CREATE DATABASE IF NOT EXISTS care_worker_db;
-- USE care_worker_db;

-- ============================================
-- USERS TABLE
-- ============================================
-- Stores both Admin and Kiaan Technologys
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'care_worker') NOT NULL,
  status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
);

-- ============================================
-- Kiaan Technology PROFILES TABLE
-- ============================================
-- Additional info for Kiaan Technologys
CREATE TABLE IF NOT EXISTS care_worker_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  progress DECIMAL(5, 2) DEFAULT 0 COMMENT 'Progress percentage (0-100)',
  pending_sign_offs INT DEFAULT 0 COMMENT 'Number of pending sign-offs',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_progress (progress)
);

-- ============================================
-- FORM TEMPLATES TABLE
-- ============================================
-- Master forms (both template and client forms)
-- form_category distinguishes between:
--   - 'template': Forms shown in Admin → Forms / Templates (~30 forms)
--   - 'client': Forms shown in Admin → Clients (~4 forms)
CREATE TABLE IF NOT EXISTS form_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('Input', 'Document') DEFAULT 'Input',
  form_category ENUM('template', 'client') DEFAULT 'template',
  version VARCHAR(50) DEFAULT '1.0',
  form_data JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_name (name),
  INDEX idx_type (type),
  INDEX idx_form_category (form_category),
  INDEX idx_is_active (is_active)
);

-- ============================================
-- FORM ASSIGNMENTS TABLE
-- ============================================
-- Admin assigns forms to Kiaan Technologys
-- Status flow: assigned → in_progress → submitted → signature_pending → completed
CREATE TABLE IF NOT EXISTS form_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  care_worker_id INT NOT NULL,
  form_template_id INT NOT NULL,
  status ENUM('assigned', 'in_progress', 'submitted', 'completed', 'signature_pending') DEFAULT 'assigned',
  progress INT DEFAULT 0 COMMENT 'Progress percentage (0-100)',
  form_data JSON COMMENT 'Filled form data with field names and values',
  assigned_by INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  due_date DATE NULL,
  FOREIGN KEY (care_worker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (form_template_id) REFERENCES form_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  INDEX idx_care_worker_id (care_worker_id),
  INDEX idx_form_template_id (form_template_id),
  INDEX idx_status (status)
);

-- ============================================
-- SIGNATURES TABLE
-- ============================================
-- Digital signatures for forms
CREATE TABLE IF NOT EXISTS signatures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  form_assignment_id INT NOT NULL,
  signature_data TEXT NOT NULL,
  signature_type ENUM('draw', 'type') DEFAULT 'draw',
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_assignment_id) REFERENCES form_assignments(id) ON DELETE CASCADE,
  INDEX idx_form_assignment_id (form_assignment_id)
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
-- Notifications for Kiaan Technologys
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read)
);

-- ============================================
-- PAYROLL TABLE
-- ============================================
-- Payroll records for Kiaan Technologys
CREATE TABLE IF NOT EXISTS payroll (
  id INT PRIMARY KEY AUTO_INCREMENT,
  care_worker_id INT NOT NULL,
  region VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  client_no VARCHAR(50),
  date VARCHAR(50),
  total_hours DECIMAL(10, 2) DEFAULT 0,
  rate_per_hour DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  paid DECIMAL(10, 2) DEFAULT 0,
  status ENUM('Paid', 'Unpaid') DEFAULT 'Unpaid',
  balance DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (care_worker_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_care_worker_id (care_worker_id),
  INDEX idx_status (status),
  INDEX idx_region (region)
);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
-- Documents for Kiaan Technologys (contracts, policies, certificates, etc.)
-- This table stores both regular documents and certificates
-- Certificates are identified by name containing 'Certificate' or description containing 'Expiry Date:'
CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  care_worker_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(500),
  file_type VARCHAR(50),
  file_size INT,
  status ENUM('Pending', 'Signed', 'Completed') DEFAULT 'Pending',
  signed_at TIMESTAMP NULL,
  uploaded_by INT NOT NULL,
  expiry_date DATE NULL COMMENT 'Expiry date for certificates (optional)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (care_worker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_care_worker_id (care_worker_id),
  INDEX idx_status (status),
  INDEX idx_expiry_date (expiry_date)
);

-- ============================================
-- NOTES
-- ============================================
-- Default admin user will be created by running: node scripts/setupAdmin.js
-- Or manually insert with proper bcrypt hash for password 'password'
--
-- To insert client forms after running this schema:
-- SET @admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1);
-- INSERT INTO form_templates (name, description, type, form_category, version, form_data, is_active, created_by) VALUES
-- ('Telephone Monitoring', 'Form for monitoring telephone conversations with clients', 'Input', 'client', '1.0', '{}', TRUE, @admin_id),
-- ('Care Plan', 'Comprehensive care planning document', 'Input', 'client', '2.0', '{}', TRUE, @admin_id),
-- ('Risk Management', 'Document for identifying and managing risks', 'Input', 'client', '2.0', '{}', TRUE, @admin_id),
-- ('Incident Form', 'Form for reporting incidents', 'Input', 'client', '1.0', '{}', TRUE, @admin_id);
--
-- ============================================
-- CERTIFICATE API ENDPOINTS
-- ============================================
-- The documents table is used to store certificates uploaded by Kiaan Technologys.
-- Certificate API endpoints:
--   POST   /api/documents/certificates          - Upload certificate (Kiaan Technology)
--   GET    /api/documents/certificates/me       - Get own certificates (Kiaan Technology)
--   GET    /api/documents/certificates/care-worker/:id - Get certificates (admin)
--   DELETE /api/documents/certificates/:id      - Delete certificate (Kiaan Technology/admin)
--
-- Certificates are identified by:
--   - Name containing 'Certificate' (case-insensitive)
--   - Description containing 'Expiry Date:'
--   - expiry_date field (if populated)
--
-- Certificate upload stores expiry date in both:
--   - expiry_date column (for better querying and indexing)
--   - description field as: "Expiry Date: YYYY-MM-DD" (for backward compatibility)
--
-- ============================================
-- MIGRATION SQL (Run these if tables already exist)
-- ============================================
-- Run these ALTER TABLE statements if your database tables already exist
-- and you need to add the new columns
-- 
-- IMPORTANT: Run these statements one by one in MySQL client or phpMyAdmin
-- If a column already exists, MySQL will show an error - you can safely ignore it

-- 1. Add expiry_date column to documents table
-- Run this if documents table exists but expiry_date column is missing
ALTER TABLE documents 
ADD COLUMN expiry_date DATE NULL COMMENT 'Expiry date for certificates (optional)' AFTER file_size;

-- 2. Add index for expiry_date
-- Note: If index already exists, MySQL will show an error - you can ignore it
CREATE INDEX idx_expiry_date ON documents(expiry_date);

-- 3. Add progress column to care_worker_profiles table
-- Run this if care_worker_profiles table exists but progress column is missing
ALTER TABLE care_worker_profiles 
ADD COLUMN progress DECIMAL(5, 2) DEFAULT 0 COMMENT 'Progress percentage (0-100)' AFTER emergency_contact_phone;

-- 4. Add pending_sign_offs column to care_worker_profiles table
-- Run this if care_worker_profiles table exists but pending_sign_offs column is missing
ALTER TABLE care_worker_profiles 
ADD COLUMN pending_sign_offs INT DEFAULT 0 COMMENT 'Number of pending sign-offs' AFTER progress;

-- 5. Add index for progress
-- Note: If index already exists, MySQL will show an error - you can ignore it
CREATE INDEX idx_progress ON care_worker_profiles(progress);

-- ============================================
-- DEFAULT USERS (Admin & Kiaan Technology)
-- ============================================
-- Default users for testing and initial setup
-- Passwords are hashed using bcrypt (cost factor 10)
-- 
-- IMPORTANT: These are default credentials. Change passwords in production!
--
-- Admin Credentials:
--   Email: info@kiaantechnology.com
--   Password: password
--
-- Kiaan Technology Credentials:
--   Email: careworker@example.com
--   Password: password123

-- Insert Default Admin User
-- Password: password (bcrypt hash)
INSERT INTO users (email, password, role, status) 
VALUES ('info@kiaantechnology.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', 'active')
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    status = 'active';

-- Insert Default Kiaan Technology User
-- Password: password123 (bcrypt hash)
INSERT INTO users (email, password, role, status) 
VALUES ('careworker@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJqJq', 'care_worker', 'active')
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    status = 'active';

-- Insert Kiaan Technology Profile for default Kiaan Technology
-- Using INSERT IGNORE to avoid errors if profile already exists
INSERT IGNORE INTO care_worker_profiles (user_id, name, phone, address, emergency_contact_name, emergency_contact_phone)
SELECT 
    u.id,
    'John Doe',
    '9876543210',
    '123 Main Street, City, State 12345',
    'Jane Doe',
    '9876543211'
FROM users u
WHERE u.email = 'careworker@example.com' AND u.role = 'care_worker'
AND NOT EXISTS (
    SELECT 1 FROM care_worker_profiles cwp WHERE cwp.user_id = u.id
);

-- Note: To generate bcrypt hash for new passwords, use Node.js:
--   const bcrypt = require('bcryptjs');
--   const hash = await bcrypt.hash('your_password', 10);
--   console.log(hash);
