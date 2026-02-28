const pool = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Get all Kiaan Technologys (Admin only)
 * GET /api/care-workers
 */
const getAllCareWorkers = async (req, res) => {
  try {
    const { search, status, progress } = req.query;

    let query = `
      SELECT 
        u.id,
        u.email,
        u.status,
        u.created_at,
        cwp.name,
        cwp.phone,
        cwp.address,
        cwp.emergency_contact_name,
        cwp.emergency_contact_phone,
        cwp.progress,
        cwp.pending_sign_offs,
        COUNT(DISTINCT fa.id) as total_forms,
        COUNT(DISTINCT CASE WHEN fa.status = 'completed' THEN fa.id END) as completed_forms,
        COUNT(DISTINCT CASE WHEN fa.status = 'signature_pending' THEN fa.id END) as calculated_pending_signoffs
      FROM users u
      LEFT JOIN care_worker_profiles cwp ON u.id = cwp.user_id
      LEFT JOIN form_assignments fa ON u.id = fa.care_worker_id
      WHERE u.role = 'care_worker'
    `;

    const params = [];

    // Apply filters
    if (search) {
      query += ` AND (cwp.name LIKE ? OR u.email LIKE ? OR cwp.phone LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'All') {
      query += ` AND u.status = ?`;
      params.push(status.toLowerCase());
    }

    query += ` GROUP BY u.id, u.email, u.status, u.created_at, cwp.name, cwp.phone, cwp.address, cwp.emergency_contact_name, cwp.emergency_contact_phone, cwp.progress, cwp.pending_sign_offs ORDER BY u.id DESC`;

    const [careWorkers] = await pool.execute(query, params);

    // Format response with all fields
    let formattedWorkers = careWorkers.map(worker => {
      return {
        id: worker.id,
        name: worker.name || 'N/A',
        email: worker.email,
        phone: worker.phone || 'N/A',
        address: worker.address || '',
        status: worker.status === 'active' ? 'Active' : worker.status === 'inactive' ? 'Inactive' : 'Pending',
        progress: worker.progress !== null && worker.progress !== undefined ? parseFloat(worker.progress) : 0,
        pendingSignOffs: worker.pending_sign_offs !== null && worker.pending_sign_offs !== undefined ? parseInt(worker.pending_sign_offs) : 0,
        emergencyContactName: worker.emergency_contact_name || '',
        emergencyContactPhone: worker.emergency_contact_phone || '',
        assignedForms: [], // Will be populated separately if needed
        createdAt: worker.created_at
      };
    });

    // Apply progress filter if provided
    if (progress && progress !== 'All') {
      const [min, max] = progress.split('-').map(Number);
      formattedWorkers = formattedWorkers.filter(worker => {
        return worker.progress >= min && worker.progress <= max;
      });
    }

    res.json({
      success: true,
      data: formattedWorkers
    });
  } catch (error) {
    console.error('Get all Kiaan Technologys error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get single Kiaan Technology by ID
 * GET /api/care-workers/:id
 */
const getCareWorkerById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      `SELECT u.id, u.email, u.status, u.created_at, 
       cwp.name, cwp.phone, cwp.address, 
       cwp.emergency_contact_name, cwp.emergency_contact_phone,
       cwp.progress, cwp.pending_sign_offs
       FROM users u
       LEFT JOIN care_worker_profiles cwp ON u.id = cwp.user_id
       WHERE u.id = ? AND u.role = 'care_worker'`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kiaan Technology not found'
      });
    }

    const worker = users[0];

    // Get assigned forms
    const [assignments] = await pool.execute(
      `SELECT fa.id, fa.status, fa.progress, fa.assigned_at, fa.due_date,
       ft.name as form_name, ft.type as form_type, ft.version
       FROM form_assignments fa
       JOIN form_templates ft ON fa.form_template_id = ft.id
       WHERE fa.care_worker_id = ?
       ORDER BY fa.assigned_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        id: worker.id,
        name: worker.name || 'N/A',
        email: worker.email,
        phone: worker.phone || 'N/A',
        address: worker.address || '',
        status: worker.status === 'active' ? 'Active' : worker.status === 'inactive' ? 'Inactive' : 'Pending',
        progress: worker.progress !== null && worker.progress !== undefined ? parseFloat(worker.progress) : 0,
        pendingSignOffs: worker.pending_sign_offs !== null && worker.pending_sign_offs !== undefined ? parseInt(worker.pending_sign_offs) : 0,
        emergencyContactName: worker.emergency_contact_name || '',
        emergencyContactPhone: worker.emergency_contact_phone || '',
        emergencyContact: {
          name: worker.emergency_contact_name || 'N/A',
          phone: worker.emergency_contact_phone || 'N/A'
        },
        assignedForms: assignments.map(a => a.form_template_id),
        forms: assignments,
        createdAt: worker.created_at
      }
    });
  } catch (error) {
    console.error('Get Kiaan Technology by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Create new Kiaan Technology (Admin only)
 * POST /api/care-workers
 */
const createCareWorker = async (req, res) => {
  try {
    const { email, password, name, phone, address, emergencyContactName, emergencyContactPhone, status, progress, pendingSignOffs } = req.body;
    const adminId = req.user.id;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Check if email already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Parse and validate progress and pendingSignOffs
    const progressValue = parseFloat(progress) || 0;
    const pendingSignOffsValue = parseInt(pendingSignOffs) || 0;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create user
      const [userResult] = await connection.execute(
        'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, 'care_worker', status || 'active']
      );

      const userId = userResult.insertId;

      // Create profile
      await connection.execute(
        `INSERT INTO care_worker_profiles 
         (user_id, name, phone, address, emergency_contact_name, emergency_contact_phone, progress, pending_sign_offs) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, name, phone || null, address || null, emergencyContactName || null, emergencyContactPhone || null, progressValue, pendingSignOffsValue]
      );

      await connection.commit();
      connection.release();

      res.status(201).json({
        success: true,
        message: 'Kiaan Technology created successfully',
        data: {
          id: userId,
          email,
          name,
          phone,
          status: status || 'active',
          progress: progressValue,
          pendingSignOffs: pendingSignOffsValue
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Create Kiaan Technology error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update Kiaan Technology (Admin only)
 * PUT /api/care-workers/:id
 */
const updateCareWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, phone, address, emergencyContactName, emergencyContactPhone, status, password, progress, pendingSignOffs } = req.body;

    // Check if Kiaan Technology exists
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [id, 'care_worker']
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kiaan Technology not found'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update user
      if (email || status || password) {
        const updateFields = [];
        const updateValues = [];

        if (email) {
          // Check if email already exists
          const [existing] = await connection.execute(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, id]
          );
          if (existing.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
              success: false,
              message: 'Email already exists'
            });
          }
          updateFields.push('email = ?');
          updateValues.push(email);
        }

        if (status) {
          updateFields.push('status = ?');
          updateValues.push(status);
        }

        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          updateFields.push('password = ?');
          updateValues.push(hashedPassword);
        }

        if (updateFields.length > 0) {
          updateValues.push(id);
          await connection.execute(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
          );
        }
      }

      // Update profile
      const profileFields = [];
      const profileValues = [];

      if (name) {
        profileFields.push('name = ?');
        profileValues.push(name);
      }
      if (phone !== undefined) {
        profileFields.push('phone = ?');
        profileValues.push(phone);
      }
      if (address !== undefined) {
        profileFields.push('address = ?');
        profileValues.push(address);
      }
      if (emergencyContactName !== undefined) {
        profileFields.push('emergency_contact_name = ?');
        profileValues.push(emergencyContactName);
      }
      if (emergencyContactPhone !== undefined) {
        profileFields.push('emergency_contact_phone = ?');
        profileValues.push(emergencyContactPhone);
      }
      if (progress !== undefined) {
        const progressValue = parseFloat(progress) || 0;
        profileFields.push('progress = ?');
        profileValues.push(progressValue);
      }
      if (pendingSignOffs !== undefined) {
        const pendingSignOffsValue = parseInt(pendingSignOffs) || 0;
        profileFields.push('pending_sign_offs = ?');
        profileValues.push(pendingSignOffsValue);
      }

      if (profileFields.length > 0) {
        profileValues.push(id);
        await connection.execute(
          `UPDATE care_worker_profiles SET ${profileFields.join(', ')} WHERE user_id = ?`,
          profileValues
        );
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Kiaan Technology updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Update Kiaan Technology error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete Kiaan Technology (hard delete - Admin only)
 * DELETE /api/care-workers/:id
 */
const deleteCareWorker = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if Kiaan Technology exists
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [id, 'care_worker']
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kiaan Technology not found'
      });
    }

    // Start transaction for hard delete
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete from care_worker_profiles first (foreign key constraint)
      await connection.execute(
        'DELETE FROM care_worker_profiles WHERE user_id = ?',
        [id]
      );

      // Delete from users
      await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Kiaan Technology deleted successfully'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Delete Kiaan Technology error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllCareWorkers,
  getCareWorkerById,
  createCareWorker,
  updateCareWorker,
  deleteCareWorker
};

