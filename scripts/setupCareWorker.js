const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function setupCareWorker() {
  try {
    console.log('Setting up care worker user...');

    const email = 'careworker@gmail.com';
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      // Update existing user's password and status
      await pool.execute(
        'UPDATE users SET password = ?, status = ? WHERE email = ?',
        [hashedPassword, 'active', email]
      );
      console.log(`✅ User ${email} already exists — password updated to "123456" and status set to active.`);

      const userId = existing[0].id;

      // Check if profile exists
      const [profiles] = await pool.execute(
        'SELECT id FROM care_worker_profiles WHERE user_id = ?',
        [userId]
      );

      if (profiles.length === 0) {
        await pool.execute(
          'INSERT INTO care_worker_profiles (user_id, name, phone) VALUES (?, ?, ?)',
          [userId, 'Care Worker Demo', '+91 97521 00980']
        );
        console.log('✅ Care worker profile created.');
      } else {
        console.log('✅ Care worker profile already exists.');
      }
    } else {
      // Insert new user
      const [result] = await pool.execute(
        'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, 'care_worker', 'active']
      );
      console.log(`✅ User ${email} created with id: ${result.insertId}`);

      // Create profile
      await pool.execute(
        'INSERT INTO care_worker_profiles (user_id, name, phone) VALUES (?, ?, ?)',
        [result.insertId, 'Care Worker Demo', '+91 97521 00980']
      );
      console.log('✅ Care worker profile created.');
    }

    // Also ensure admin@gmail.com exists
    const adminEmail = 'admin@gmail.com';
    const [adminExisting] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (adminExisting.length > 0) {
      await pool.execute(
        'UPDATE users SET password = ?, status = ? WHERE email = ?',
        [hashedPassword, 'active', adminEmail]
      );
      console.log(`✅ Admin user ${adminEmail} — password updated to "123456" and status active.`);
    } else {
      const [adminResult] = await pool.execute(
        'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
        [adminEmail, hashedPassword, 'admin', 'active']
      );
      console.log(`✅ Admin user ${adminEmail} created with id: ${adminResult.insertId}`);
    }

    console.log('\n✅ Setup complete! You can now login with:');
    console.log('   Admin:       admin@gmail.com / 123456');
    console.log('   Care Worker: careworker@gmail.com / 123456');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupCareWorker();
