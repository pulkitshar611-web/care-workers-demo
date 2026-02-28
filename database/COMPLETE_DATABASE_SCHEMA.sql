-- ==========================================================
-- Kiaan Technology MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- ==========================================================
-- This file contains the complete, consolidated schema for the
-- Kiaan Technology Management System, including all tables, columns,
-- indexes, and foreign key relationships.
-- ==========================================================

-- 1. Create Database (Run manually if needed)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Kiaan Technology PROFILES TABLE
-- ============================================
-- Additional demographic and status info for Kiaan Technologys
CREATE TABLE IF NOT EXISTS care_worker_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  progress DECIMAL(5, 2) DEFAULT 0 COMMENT 'Profile completion progress percentage (0-100)',
  pending_sign_offs INT DEFAULT 0 COMMENT 'Number of pending form sign-offs',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_progress (progress)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FORM TEMPLATES TABLE
-- ============================================
-- Master form definitions (templates and client-specific forms)
CREATE TABLE IF NOT EXISTS form_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('Input', 'Document') DEFAULT 'Input',
  form_category ENUM('template', 'client') DEFAULT 'template' COMMENT 'Distinguishes between general templates and client-specific forms',
  version VARCHAR(50) DEFAULT '1.0',
  form_data JSON COMMENT 'Schema/structure of the form fields',
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_name (name),
  INDEX idx_type (type),
  INDEX idx_form_category (form_category),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FORM ASSIGNMENTS TABLE
-- ============================================
-- Tracks forms assigned to Kiaan Technologys and their progress
CREATE TABLE IF NOT EXISTS form_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  care_worker_id INT NOT NULL,
  form_template_id INT NOT NULL,
  status ENUM('assigned', 'in_progress', 'submitted', 'completed', 'signature_pending') DEFAULT 'assigned',
  progress INT DEFAULT 0 COMMENT 'Progress percentage (0-100)',
  form_data JSON COMMENT 'Filled form data with field names and values',
  completed_fields_count INT DEFAULT 0 COMMENT 'Number of fields filled',
  total_fields_count INT DEFAULT 0 COMMENT 'Total number of fields in form',
  assigned_by INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  last_updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last time form was updated',
  due_date DATE NULL,
  signature_data TEXT NULL COMMENT 'Optional inline signature image/data',
  FOREIGN KEY (care_worker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (form_template_id) REFERENCES form_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  INDEX idx_care_worker_id (care_worker_id),
  INDEX idx_form_template_id (form_template_id),
  INDEX idx_status (status),
  INDEX idx_last_updated_at (last_updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SIGNATURES TABLE
-- ============================================
-- Digital signatures linked to form assignments
CREATE TABLE IF NOT EXISTS signatures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  form_assignment_id INT NOT NULL,
  signature_data TEXT NOT NULL COMMENT 'Base64 signature image or digital string',
  signature_type ENUM('draw', 'type') DEFAULT 'draw',
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_assignment_id) REFERENCES form_assignments(id) ON DELETE CASCADE,
  INDEX idx_form_assignment_id (form_assignment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
-- System notifications for users
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(100) NOT NULL COMMENT 'e.g., form_assigned, signature_required, reminder',
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PAYROLL TABLE
-- ============================================
-- Payroll and timesheet records
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
-- Stores certificates, contracts, and other uploaded files
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
  expiry_date DATE NULL COMMENT 'Expiry date (critical for certificates)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (care_worker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_care_worker_id (care_worker_id),
  INDEX idx_status (status),
  INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED DATA: DEFAULT ADMIN
-- ============================================
-- Insert default admin user if not exists
-- Password: 'password' (bcrypt hashed)
INSERT INTO users (email, password, role, status) 
VALUES ('info@kiaantechnology.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', 'active')
ON DUPLICATE KEY UPDATE status = 'active';

-- ============================================
-- SEED DATA: CLIENT FORMS
-- ============================================
-- Insert standard client forms into form_templates
SET @admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

INSERT INTO form_templates (name, description, type, form_category, version, form_data, is_active, created_by)
SELECT * FROM (
    SELECT 'Telephone Monitoring' AS name, 'Form for quality assurance calls' AS description, 'Input' AS type, 'client' AS form_category, '1.0' AS version, '{}' AS form_data, TRUE AS is_active, @admin_id AS created_by
    UNION ALL
    SELECT 'Care Plan', 'Client care planning document' AS description, 'Input', 'client', '2.0', '{}', TRUE, @admin_id
    UNION ALL
    SELECT 'Risk Management', 'Client risk assessment' AS description, 'Input', 'client', '2.0', '{}', TRUE, @admin_id
    UNION ALL
    SELECT 'Incident Form', 'Incident reporting' AS description, 'Input', 'client', '1.0', '{}', TRUE, @admin_id
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM form_templates WHERE name = tmp.name AND form_category = 'client');
