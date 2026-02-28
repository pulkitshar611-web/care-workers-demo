const pool = require('../config/db');

/**
 * Assign forms to Kiaan Technology (Admin only)
 * POST /api/form-assignments
 */
const assignForms = async (req, res) => {
  try {
    const { careWorkerId, formTemplateIds, dueDate } = req.body;
    const adminId = req.user.id;

    if (!careWorkerId || !formTemplateIds || !Array.isArray(formTemplateIds) || formTemplateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Kiaan Technology ID and form template IDs are required'
      });
    }

    // Verify Kiaan Technology exists
    const [workers] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [careWorkerId, 'care_worker']
    );

    if (workers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kiaan Technology not found'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const assignments = [];

      for (const formTemplateId of formTemplateIds) {
        // Check if assignment already exists
        const [existing] = await connection.execute(
          'SELECT id FROM form_assignments WHERE care_worker_id = ? AND form_template_id = ?',
          [careWorkerId, formTemplateId]
        );

        if (existing.length === 0) {
          const [result] = await connection.execute(
            `INSERT INTO form_assignments 
             (care_worker_id, form_template_id, assigned_by, due_date, status)
             VALUES (?, ?, ?, ?, ?)`,
            [careWorkerId, formTemplateId, adminId, dueDate || null, 'assigned']
          );

          assignments.push(result.insertId);

          // Create notification for Kiaan Technology
          await connection.execute(
            `INSERT INTO notifications (user_id, type, message)
             VALUES (?, ?, ?)`,
            [
              careWorkerId,
              'form_assigned',
              `New form has been assigned to you`
            ]
          );
        }
      }

      await connection.commit();
      connection.release();

      res.status(201).json({
        success: true,
        message: 'Forms assigned successfully',
        data: {
          assignmentsCreated: assignments.length
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Assign forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get form assignments for Kiaan Technology
 * GET /api/form-assignments/care-worker/:id
 * GET /api/form-assignments/care-worker/me (uses logged-in user's ID)
 */
const getCareWorkerAssignments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // If id is "me", use logged-in user's ID
    const targetUserId = id === 'me' ? userId : parseInt(id);

    // Check if user has permission (admin or own assignments)
    if (userRole !== 'admin' && targetUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const [assignments] = await pool.execute(
      `SELECT 
        fa.id,
        fa.status,
        fa.progress,
        fa.assigned_at,
        fa.submitted_at,
        fa.completed_at,
        fa.due_date,
        fa.form_data,
        fa.signature_data,
        ft.id as form_template_id,
        ft.name as form_name,
        ft.type as form_type,
        ft.version as form_version,
        ft.description as form_description
      FROM form_assignments fa
      JOIN form_templates ft ON fa.form_template_id = ft.id
      WHERE fa.care_worker_id = ?
      ORDER BY fa.assigned_at DESC`,
      [targetUserId]
    );

    // Format response with nested formTemplate object
    const formattedAssignments = assignments.map(a => {
      // Determine signature status based on signature_data
      let signatureStatus = null;
      if (a.signature_data && a.signature_data.trim() !== '') {
        signatureStatus = 'Completed';
      } else if (a.status === 'signature_pending' || a.status === 'submitted') {
        signatureStatus = 'Pending';
      } else if (a.status === 'completed' && !a.signature_data) {
        signatureStatus = null; // No signature required
      }

      return {
        id: a.id,
        status: a.status,
        progress: a.progress,
        assigned_at: a.assigned_at,
        submitted_at: a.submitted_at,
        completed_at: a.completed_at,
        due_date: a.due_date,
        form_data: a.form_data ? (typeof a.form_data === 'string' ? JSON.parse(a.form_data) : a.form_data) : null,
        signature_status: signatureStatus, // 'Completed', 'Pending', or null
        has_signature: a.signature_data ? true : false,
        formTemplate: {
          id: a.form_template_id,
          name: a.form_name,
          type: a.form_type,
          version: a.form_version,
          description: a.form_description
        }
      };
    });

    res.json({
      success: true,
      data: formattedAssignments
    });
  } catch (error) {
    console.error('Get Kiaan Technology assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update form assignment (start/resume/submit form)
 * PUT /api/form-assignments/:id
 */
const updateFormAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, formData } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get assignment
    const [assignments] = await pool.execute(
      'SELECT * FROM form_assignments WHERE id = ?',
      [id]
    );

    if (assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form assignment not found'
      });
    }

    const assignment = assignments[0];

    // Check permission (Kiaan Technology can only update their own assignments)
    if (userRole === 'care_worker' && assignment.care_worker_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateFields = [];
    const updateValues = [];

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);

      // Set timestamps based on status
      if (status === 'submitted') {
        updateFields.push('submitted_at = NOW()');
      } else if (status === 'completed') {
        updateFields.push('completed_at = NOW()');
      }
    }

    if (progress !== undefined) {
      updateFields.push('progress = ?');
      updateValues.push(progress);
    }

    if (formData !== undefined) {
      updateFields.push('form_data = ?');
      updateValues.push(JSON.stringify(formData));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE form_assignments SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Form assignment updated successfully'
    });
  } catch (error) {
    console.error('Update form assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  assignForms,
  getCareWorkerAssignments,
  updateFormAssignment
};

