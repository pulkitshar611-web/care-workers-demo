-- ============================================
-- FORM ASSIGNMENTS TABLE (WITH PROGRESS TRACKING)
-- ============================================
-- Admin assigns forms to Kiaan Technologys
-- Status flow: assigned → in_progress → submitted → signature_pending → completed
-- This is the updated schema with progress tracking columns
-- ============================================

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
  signature_data TEXT NULL COMMENT 'Signature image/data if form requires signature',
  FOREIGN KEY (care_worker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (form_template_id) REFERENCES form_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  INDEX idx_care_worker_id (care_worker_id),
  INDEX idx_form_template_id (form_template_id),
  INDEX idx_status (status),
  INDEX idx_last_updated_at (last_updated_at)
);

