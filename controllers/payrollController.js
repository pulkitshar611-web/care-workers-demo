const pool = require('../config/database');

/**
 * Get all payroll records
 * GET /api/payroll
 */
const getAllPayroll = async (req, res) => {
  try {
    const { search, region, status } = req.query;
    
    let query = `
      SELECT 
        p.*,
        u.email,
        cwp.name as care_worker_name
      FROM payroll p
      LEFT JOIN users u ON p.care_worker_id = u.id
      LEFT JOIN care_worker_profiles cwp ON u.id = cwp.user_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (p.name LIKE ? OR cwp.name LIKE ? OR u.email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (region && region !== 'All') {
      query += ` AND p.region = ?`;
      params.push(region);
    }

    if (status && status !== 'All') {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY p.created_at DESC`;

    const [payroll] = await pool.execute(query, params);

    res.json({
      success: true,
      data: payroll
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get payroll by ID
 * GET /api/payroll/:id
 */
const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;

    const [payroll] = await pool.execute(
      `SELECT 
        p.*,
        u.email,
        cwp.name as care_worker_name
      FROM payroll p
      LEFT JOIN users u ON p.care_worker_id = u.id
      LEFT JOIN care_worker_profiles cwp ON u.id = cwp.user_id
      WHERE p.id = ?`,
      [id]
    );

    if (payroll.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    res.json({
      success: true,
      data: payroll[0]
    });
  } catch (error) {
    console.error('Get payroll by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Create payroll record
 * POST /api/payroll
 */
const createPayroll = async (req, res) => {
  try {
    const {
      careWorkerId,
      region,
      name,
      clientNo,
      date,
      totalHours,
      ratePerHour,
      totalAmount,
      paid,
      status
    } = req.body;

    // Validate required fields
    if (!careWorkerId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Kiaan Technology ID and name are required'
      });
    }

    // Calculate balance
    const totalAmountValue = totalAmount || (totalHours * ratePerHour) || 0;
    const paidValue = paid || 0;
    const balance = totalAmountValue - paidValue;

    const [result] = await pool.execute(
      `INSERT INTO payroll 
        (care_worker_id, region, name, client_no, date, total_hours, rate_per_hour, total_amount, paid, status, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        careWorkerId,
        region || null,
        name,
        clientNo || null,
        date || null,
        totalHours || 0,
        ratePerHour || 0,
        totalAmountValue,
        paidValue,
        status || 'Unpaid',
        balance
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Payroll record created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update payroll record
 * PUT /api/payroll/:id
 */
const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      region,
      name,
      clientNo,
      date,
      totalHours,
      ratePerHour,
      totalAmount,
      paid,
      status
    } = req.body;

    // Check if payroll exists
    const [existing] = await pool.execute('SELECT * FROM payroll WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    // Calculate balance
    const totalAmountValue = totalAmount !== undefined ? totalAmount : (totalHours * ratePerHour) || existing[0].total_amount;
    const paidValue = paid !== undefined ? paid : existing[0].paid;
    const balance = totalAmountValue - paidValue;

    const updateFields = [];
    const updateValues = [];

    if (region !== undefined) {
      updateFields.push('region = ?');
      updateValues.push(region);
    }
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (clientNo !== undefined) {
      updateFields.push('client_no = ?');
      updateValues.push(clientNo);
    }
    if (date !== undefined) {
      updateFields.push('date = ?');
      updateValues.push(date);
    }
    if (totalHours !== undefined) {
      updateFields.push('total_hours = ?');
      updateValues.push(totalHours);
    }
    if (ratePerHour !== undefined) {
      updateFields.push('rate_per_hour = ?');
      updateValues.push(ratePerHour);
    }
    if (totalAmount !== undefined) {
      updateFields.push('total_amount = ?');
      updateValues.push(totalAmount);
    }
    if (paid !== undefined) {
      updateFields.push('paid = ?');
      updateValues.push(paid);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    
    updateFields.push('balance = ?');
    updateValues.push(balance);
    updateValues.push(id);

    await pool.execute(
      `UPDATE payroll SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Payroll record updated successfully'
    });
  } catch (error) {
    console.error('Update payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete payroll record
 * DELETE /api/payroll/:id
 */
const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM payroll WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    res.json({
      success: true,
      message: 'Payroll record deleted successfully'
    });
  } catch (error) {
    console.error('Delete payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllPayroll,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll
};

