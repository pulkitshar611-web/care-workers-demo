const pool = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

/**
 * Get all documents for Kiaan Technology
 * GET /api/documents/care-worker/:id
 * GET /api/documents/care-worker/me (for logged-in Kiaan Technology)
 */
const getCareWorkerDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // If id is "me", use logged-in user's ID
    const targetUserId = id === 'me' ? userId : parseInt(id);

    // Check if user has permission (admin or own documents)
    if (userRole !== 'admin' && targetUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const [documents] = await pool.execute(
      `SELECT 
        d.*,
        u.email as uploaded_by_email,
        cwp.name as care_worker_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN users u2 ON d.care_worker_id = u2.id
      LEFT JOIN care_worker_profiles cwp ON u2.id = cwp.user_id
      WHERE d.care_worker_id = ?
      ORDER BY d.created_at DESC`,
      [targetUserId]
    );

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get document by ID
 * GET /api/documents/:id
 */
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [documents] = await pool.execute(
      `SELECT 
        d.*,
        u.email as uploaded_by_email,
        cwp.name as care_worker_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN users u2 ON d.care_worker_id = u2.id
      LEFT JOIN care_worker_profiles cwp ON u2.id = cwp.user_id
      WHERE d.id = ?`,
      [id]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const document = documents[0];

    // Check permission
    if (userRole !== 'admin' && document.care_worker_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Get document by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Upload document
 * POST /api/documents
 */
const uploadDocument = async (req, res) => {
  try {
    const { careWorkerId, name, description, fileUrl, fileType, fileSize } = req.body;
    const uploadedBy = req.user.id;

    // Validate required fields
    if (!careWorkerId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Kiaan Technology ID and document name are required'
      });
    }

    // Verify uploaded_by user exists in database
    const [uploaderUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [uploadedBy]
    );

    if (uploaderUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }

    // Verify Kiaan Technology exists
    const [careWorkers] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [careWorkerId, 'care_worker']
    );

    if (careWorkers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kiaan Technology not found'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO documents 
        (care_worker_id, name, description, file_url, file_type, file_size, uploaded_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        careWorkerId,
        name,
        description || null,
        fileUrl || null,
        fileType || null,
        fileSize || null,
        uploadedBy
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    
    // Handle foreign key constraint errors specifically
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.message.includes('foreign key constraint')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID or Kiaan Technology ID. Please verify and try again.',
        error: 'User or Kiaan Technology not found in database'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update document
 * PUT /api/documents/:id
 */
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, signedAt } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if document exists
    const [existing] = await pool.execute('SELECT * FROM documents WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permission (admin or Kiaan Technology who owns the document)
    if (userRole !== 'admin' && existing[0].care_worker_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (signedAt !== undefined) {
      updateFields.push('signed_at = ?');
      updateValues.push(signedAt);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE documents SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete document
 * DELETE /api/documents/:id
 */
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if document exists
    const [existing] = await pool.execute('SELECT * FROM documents WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permission (admin only for delete)
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete documents'
      });
    }

    // Delete file if exists
    if (existing[0].file_url) {
      try {
        const filePath = path.join(__dirname, '..', 'uploads', existing[0].file_url);
        await fs.unlink(filePath);
      } catch (fileError) {
        console.warn('File not found or already deleted:', fileError.message);
      }
    }

    await pool.execute('DELETE FROM documents WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Upload certificate (for Kiaan Technology profile)
 * POST /api/documents/certificates
 */
const uploadCertificate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, expiryDate, fileUrl, fileType, fileSize } = req.body;

    // Validate required fields
    if (!name || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Certificate name and file URL are required'
      });
    }

    // Verify user exists in database
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO documents 
        (care_worker_id, name, description, file_url, file_type, file_size, uploaded_by, status, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Completed', ?)`,
      [
        userId,
        name,
        expiryDate ? `Expiry Date: ${expiryDate}` : 'Certificate',
        fileUrl,
        fileType || 'application/pdf',
        fileSize || 0,
        userId,
        expiryDate || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Certificate uploaded successfully',
      data: { 
        id: result.insertId,
        name,
        expiryDate,
        fileUrl,
        fileType: fileType || 'application/pdf'
      }
    });
  } catch (error) {
    console.error('Upload certificate error:', error);
    
    // Handle foreign key constraint errors specifically
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.message.includes('foreign key constraint')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID. Please login again.',
        error: 'User not found in database'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get certificates for Kiaan Technology
 * GET /api/documents/certificates/me
 * GET /api/documents/certificates/care-worker/:id
 */
const getCertificates = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // If id is "me", use logged-in user's ID
    const targetUserId = id === 'me' ? userId : parseInt(id);

    // Check if user has permission (admin or own certificates)
    if (userRole !== 'admin' && targetUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get certificates (documents with certificate-like names or descriptions)
    const [certificates] = await pool.execute(
      `SELECT 
        d.id,
        d.name,
        d.description,
        d.file_url,
        d.file_type,
        d.file_size,
        d.created_at,
        COALESCE(
          d.expiry_date,
          CASE 
            WHEN d.description LIKE '%Expiry Date:%' THEN 
              STR_TO_DATE(SUBSTRING_INDEX(SUBSTRING_INDEX(d.description, 'Expiry Date: ', -1), ' ', 1), '%Y-%m-%d')
            ELSE NULL
          END
        ) as expiry_date
      FROM documents d
      WHERE d.care_worker_id = ?
        AND (d.name LIKE '%Certificate%' OR d.name LIKE '%certificate%' OR d.description LIKE '%Expiry Date:%' OR d.expiry_date IS NOT NULL)
      ORDER BY d.created_at DESC`,
      [targetUserId]
    );

    // Format response
    const formattedCertificates = certificates.map(cert => ({
      id: cert.id,
      name: cert.name,
      expiryDate: cert.expiry_date ? (cert.expiry_date instanceof Date ? cert.expiry_date.toISOString().split('T')[0] : cert.expiry_date) : null,
      type: cert.file_type?.includes('pdf') ? 'pdf' : 'image',
      url: cert.file_url,
      fileName: cert.name,
      fileSize: cert.file_size,
      createdAt: cert.created_at
    }));

    res.json({
      success: true,
      data: formattedCertificates
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete certificate
 * DELETE /api/documents/certificates/:id
 */
const deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if certificate exists
    const [existing] = await pool.execute('SELECT * FROM documents WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check permission (admin or Kiaan Technology who owns the certificate)
    if (userRole !== 'admin' && existing[0].care_worker_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete file if exists
    if (existing[0].file_url) {
      try {
        const filePath = path.join(__dirname, '..', 'uploads', existing[0].file_url);
        await fs.unlink(filePath);
      } catch (fileError) {
        console.warn('File not found or already deleted:', fileError.message);
      }
    }

    await pool.execute('DELETE FROM documents WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Certificate deleted successfully'
    });
  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getCareWorkerDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
  uploadCertificate,
  getCertificates,
  deleteCertificate
};

