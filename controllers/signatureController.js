const pool = require('../config/db');

/**
 * Get all signatures (pending and completed) for Kiaan Technology
 * GET /api/signatures/pending
 * GET /api/signatures/me (new endpoint for all signatures)
 */
const getPendingSignatures = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get all forms that need signature or have signature
    // Include forms with status: signature_pending, submitted, or completed (with signature_data)
    let query = `
      SELECT 
        fa.id as assignment_id,
        fa.status,
        fa.submitted_at,
        fa.completed_at,
        fa.due_date,
        fa.signature_data,
        ft.id as form_template_id,
        ft.name as form_name,
        ft.type as form_type,
        ft.version as form_version,
        ft.description as form_description
      FROM form_assignments fa
      JOIN form_templates ft ON fa.form_template_id = ft.id
      WHERE (
        fa.status = 'signature_pending' 
        OR fa.status = 'submitted'
        OR (fa.status = 'completed' AND fa.signature_data IS NOT NULL)
      )
    `;

    const params = [];

    // Kiaan Technologys can only see their own signatures
    if (userRole === 'care_worker') {
      query += ` AND fa.care_worker_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY fa.submitted_at DESC, fa.completed_at DESC`;

    const [signatures] = await pool.execute(query, params);

    // Format response with signature status
    const formattedSignatures = signatures.map(sig => {
      // Determine signature status based on signature_data
      let signatureStatus = 'Pending';
      if (sig.signature_data && sig.signature_data.trim() !== '') {
        signatureStatus = 'Completed';
      } else if (sig.status === 'completed') {
        signatureStatus = 'Completed';
      } else {
        signatureStatus = 'Pending';
      }

      return {
        id: sig.assignment_id,
        assignment_id: sig.assignment_id,
        form_name: sig.form_name,
        form_type: sig.form_type,
        form_description: sig.form_description || '',
        status: signatureStatus, // 'Pending' or 'Completed'
        due_date: sig.due_date,
        submitted_at: sig.submitted_at,
        completed_at: sig.completed_at,
        has_signature: sig.signature_data ? true : false
      };
    });

    res.json({
      success: true,
      data: formattedSignatures
    });
  } catch (error) {
    console.error('Get pending signatures error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Submit signature for form assignment
 * POST /api/signatures
 */
const submitSignature = async (req, res) => {
  try {
    const { assignmentId, signatureData, signatureType } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!assignmentId || !signatureData) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID and signature data are required'
      });
    }

    // Get assignment
    const [assignments] = await pool.execute(
      'SELECT * FROM form_assignments WHERE id = ?',
      [assignmentId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form assignment not found'
      });
    }

    const assignment = assignments[0];

    // Check permission
    if (userRole === 'care_worker' && assignment.care_worker_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if signature is pending or form is submitted (both need signature)
    // Allow both 'signature_pending' and 'submitted' status as they both require signature
        const allowedStatuses = ['signature_pending', 'submitted'];
    if (!allowedStatuses.includes(assignment.status)) {
      console.log('Assignment status:', assignment.status, 'for assignment ID:', assignmentId);
      return res.status(400).json({
        success: false,
        message: `Form is not pending signature. Current status: ${assignment.status}. Allowed statuses: ${allowedStatuses.join(', ')}`,
        currentStatus: assignment.status
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Save signature
      await connection.execute(
        `INSERT INTO signatures (form_assignment_id, signature_data, signature_type)
         VALUES (?, ?, ?)`,
        [assignmentId, signatureData, signatureType || 'draw']
      );

      // Update assignment status to completed and save signature_data
      await connection.execute(
        `UPDATE form_assignments 
         SET status = 'completed', 
             completed_at = NOW(), 
             progress = 100,
             signature_data = ?
         WHERE id = ?`,
        [signatureData, assignmentId]
      );

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Signature submitted successfully'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Submit signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getPendingSignatures,
  submitSignature
};

