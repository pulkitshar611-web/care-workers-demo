const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

/**
 * Import Kiaan Technologys from CSV (Admin only)
 * POST /api/import-export/import-care-workers
 */
const importCareWorkers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const filePath = req.file.path;
    const careWorkers = [];
    const errors = [];

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          careWorkers.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (careWorkers.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < careWorkers.length; i++) {
        const row = careWorkers[i];
        const { email, password, name, phone, address, emergencyContactName, emergencyContactPhone, status } = row;

        try {
          // Validate required fields
          if (!email || !password || !name) {
            errors.push(`Row ${i + 2}: Missing required fields (email, password, name)`);
            errorCount++;
            continue;
          }

          // Check if email already exists
          const [existing] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
          );

          if (existing.length > 0) {
            errors.push(`Row ${i + 2}: Email ${email} already exists`);
            errorCount++;
            continue;
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(password, 10);

          // Create user
          const [userResult] = await connection.execute(
            'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, 'care_worker', status || 'active']
          );

          const userId = userResult.insertId;

          // Create profile
          await connection.execute(
            `INSERT INTO care_worker_profiles 
             (user_id, name, phone, address, emergency_contact_name, emergency_contact_phone) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              userId,
              name,
              phone || null,
              address || null,
              emergencyContactName || null,
              emergencyContactPhone || null
            ]
          );

          successCount++;
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error.message}`);
          errorCount++;
        }
      }

      await connection.commit();
      connection.release();

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: `Import completed: ${successCount} successful, ${errorCount} errors`,
        data: {
          total: careWorkers.length,
          success: successCount,
          errors: errorCount,
          errorDetails: errors
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  } catch (error) {
    console.error('Import Kiaan Technologys error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Export Kiaan Technologys to CSV (Admin only)
 * GET /api/import-export/export-care-workers
 */
const exportCareWorkers = async (req, res) => {
  try {
    // Get all Kiaan Technologys
    const [careWorkers] = await pool.execute(
      `SELECT 
        u.id,
        u.email,
        u.status,
        u.created_at,
        cwp.name,
        cwp.phone,
        cwp.address,
        cwp.emergency_contact_name,
        cwp.emergency_contact_phone
      FROM users u
      LEFT JOIN care_worker_profiles cwp ON u.id = cwp.user_id
      WHERE u.role = 'care_worker'
      ORDER BY u.id DESC`
    );

    if (careWorkers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No Kiaan Technologys found'
      });
    }

    // Prepare CSV data
    const csvData = careWorkers.map(worker => ({
      id: worker.id,
      email: worker.email,
      name: worker.name || '',
      phone: worker.phone || '',
      address: worker.address || '',
      emergencyContactName: worker.emergency_contact_name || '',
      emergencyContactPhone: worker.emergency_contact_phone || '',
      status: worker.status,
      createdAt: worker.created_at
    }));

    // Create CSV file
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `care_workers_export_${Date.now()}.csv`;
    const filePath = path.join(uploadsDir, fileName);

    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'email', title: 'Email' },
        { id: 'name', title: 'Name' },
        { id: 'phone', title: 'Phone' },
        { id: 'address', title: 'Address' },
        { id: 'emergencyContactName', title: 'Emergency Contact Name' },
        { id: 'emergencyContactPhone', title: 'Emergency Contact Phone' },
        { id: 'status', title: 'Status' },
        { id: 'createdAt', title: 'Created At' }
      ]
    });

    await csvWriter.writeRecords(csvData);

    // Send file
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 1000);
    });
  } catch (error) {
    console.error('Export Kiaan Technologys error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  importCareWorkers,
  exportCareWorkers
};

