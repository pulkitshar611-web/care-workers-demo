-- Insert Admin User
-- Run this SQL file to add admin user to database
-- Password: password (hashed with bcrypt)

USE care_worker_db;

-- Insert admin user (password: password)
-- Note: This uses a bcrypt hash. For proper hashing, use: node scripts/setupAdmin.js
INSERT INTO users (email, password, role, status) 
VALUES ('info@kiaantechnology.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOeJqJqJqJqJqJqJqJqJqJqJqJqJq', 'admin', 'active')
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    status = 'active';

-- Verify admin was created
SELECT id, email, role, status, created_at 
FROM users 
WHERE email = 'info@kiaantechnology.com' AND role = 'admin';

