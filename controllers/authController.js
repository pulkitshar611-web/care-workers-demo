const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Login - Admin or Kiaan Technology
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const [users] = await pool.execute(
      'SELECT id, email, password, role, status FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get additional profile info for Kiaan Technologys
    let profileData = null;
    if (user.role === 'care_worker') {
      const [profiles] = await pool.execute(
        'SELECT name, phone, address, emergency_contact_name, emergency_contact_phone FROM care_worker_profiles WHERE user_id = ?',
        [user.id]
      );
      if (profiles.length > 0) {
        profileData = profiles[0];
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          ...(profileData && { profile: profileData })
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user info
    const [users] = await pool.execute(
      'SELECT id, email, role, status, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Get profile info (for both admin and care_worker)
    let profileData = null;
    let userName = null;
    const [profiles] = await pool.execute(
      'SELECT name, phone, address, emergency_contact_name, emergency_contact_phone FROM care_worker_profiles WHERE user_id = ?',
      [userId]
    );
    if (profiles.length > 0) {
      profileData = profiles[0];
      userName = profiles[0].name;
    }

    // Return data in a flat structure for easier frontend access
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        name: userName || null,
        phone: profileData?.phone || null,
        address: profileData?.address || null,
        emergency_contact_name: profileData?.emergency_contact_name || null,
        emergency_contact_phone: profileData?.emergency_contact_phone || null,
        profile: profileData || null
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, emergencyContactName, emergencyContactPhone, email } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update user email if provided
      if (email) {
        // Check if email already exists
        const [existing] = await connection.execute(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, userId]
        );
        if (existing.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
        }
        await connection.execute('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
      }

      // Update or create profile (for both admin and care_worker)
      // Admin can also have profile in care_worker_profiles table
      const [profiles] = await connection.execute(
        'SELECT id FROM care_worker_profiles WHERE user_id = ?',
        [userId]
      );

      if (profiles.length > 0) {
        // Update existing profile
        const updateFields = [];
        const updateValues = [];
        if (name !== undefined) {
          updateFields.push('name = ?');
          updateValues.push(name);
        }
        if (phone !== undefined) {
          updateFields.push('phone = ?');
          updateValues.push(phone);
        }
        if (address !== undefined) {
          updateFields.push('address = ?');
          updateValues.push(address);
        }
        if (emergencyContactName !== undefined) {
          updateFields.push('emergency_contact_name = ?');
          updateValues.push(emergencyContactName);
        }
        if (emergencyContactPhone !== undefined) {
          updateFields.push('emergency_contact_phone = ?');
          updateValues.push(emergencyContactPhone);
        }
        if (updateFields.length > 0) {
          updateValues.push(userId);
          await connection.execute(
            `UPDATE care_worker_profiles SET ${updateFields.join(', ')} WHERE user_id = ?`,
            updateValues
          );
        }
      } else {
        // Create profile if doesn't exist (for both admin and care_worker)
        await connection.execute(
          `INSERT INTO care_worker_profiles (user_id, name, phone, address, emergency_contact_name, emergency_contact_phone)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, name || '', phone || null, address || null, emergencyContactName || null, emergencyContactPhone || null]
        );
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get current password hash
    const [users] = await pool.execute('SELECT password FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
  changePassword
};

