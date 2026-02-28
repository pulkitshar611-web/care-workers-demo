/**
 * Setup script to create default admin user
 * Run this after database is created: node scripts/setupAdmin.js
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/db');
require('dotenv').config();

async function setupAdmin() {
  try {
    console.log('🔧 Setting up default admin user...');

    const email = 'info@kiaantechnology.com';
    const password = 'password';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      // Update password
      await pool.execute(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, email]
      );
      console.log('✅ Admin user password updated');
    } else {
      // Create admin user
      await pool.execute(
        'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, 'admin', 'active']
      );
      console.log('✅ Admin user created');
    }

    console.log('\n📋 Default Admin Credentials:');
    console.log('   Email: info@kiaantechnology.com');
    console.log('   Password: password');
    console.log('\n⚠️  IMPORTANT: Change password in production!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  }
}

setupAdmin();

