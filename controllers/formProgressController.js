const pool = require('../config/db');

/**
 * Update form progress (field-level update)
 * PUT /api/care-worker/forms/update-progress
 * Auto-saves when Kiaan Technology fills any field
 */
const updateFormProgress = async (req, res) => {
  try {
    const { assignedFormId, careWorkerId, fieldName, fieldValue, status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate required fields
    if (!assignedFormId || !fieldName) {
      return res.status(400).json({
        success: false,
        message: 'Assigned form ID and field name are required'
      });
    }

    // Verify assignment exists
    const [assignments] = await pool.execute(
      'SELECT * FROM form_assignments WHERE id = ?',
      [assignedFormId]
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

    // Get current form data
    let formData = assignment.form_data 
      ? (typeof assignment.form_data === 'string' ? JSON.parse(assignment.form_data) : assignment.form_data)
      : {};

    // Update field value
    formData[fieldName] = fieldValue;

    // Calculate progress
    const filledFields = Object.keys(formData).filter(key => {
      const value = formData[key];
      return value !== null && value !== undefined && value !== '';
    }).length;

    // Get total fields count from form template if not set
    let totalFields = assignment.total_fields_count || 0;
    if (totalFields === 0) {
      const [templates] = await pool.execute(
        'SELECT form_data FROM form_templates WHERE id = ?',
        [assignment.form_template_id]
      );
      
      if (templates.length > 0 && templates[0].form_data) {
        const templateData = typeof templates[0].form_data === 'string' 
          ? JSON.parse(templates[0].form_data) 
          : templates[0].form_data;
        
        // Count fields in template
        if (templateData.fields && Array.isArray(templateData.fields)) {
          totalFields = templateData.fields.length;
        } else if (templateData.sections) {
          totalFields = templateData.sections.reduce((count, section) => {
            return count + (section.fields ? section.fields.length : 0);
          }, 0);
        } else {
          // Fallback: estimate based on form_data keys
          totalFields = Math.max(filledFields, Object.keys(formData).length + 10);
        }
      } else {
        // Fallback: estimate
        totalFields = Math.max(filledFields, Object.keys(formData).length + 10);
      }
    }

    const progressPercentage = totalFields > 0 
      ? Math.round((filledFields / totalFields) * 100)
      : 0;

    // Determine status
    let newStatus = status || assignment.status;
    if (newStatus === 'assigned' && filledFields > 0) {
      newStatus = 'in_progress';
    }

    // Update assignment
    await pool.execute(
      `UPDATE form_assignments 
       SET form_data = ?, 
           completed_fields_count = ?,
           total_fields_count = ?,
           progress = ?,
           status = ?,
           last_updated_at = NOW()
       WHERE id = ?`,
      [
        JSON.stringify(formData),
        filledFields,
        totalFields,
        progressPercentage,
        newStatus,
        assignedFormId
      ]
    );

    res.json({
      success: true,
      message: 'Form progress updated successfully',
      data: {
        assignedFormId,
        fieldName,
        fieldValue,
        completedFieldsCount: filledFields,
        totalFieldsCount: totalFields,
        progress: progressPercentage,
        status: newStatus
      }
    });
  } catch (error) {
    console.error('Update form progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Save form draft
 * PUT /api/care-worker/forms/save-draft
 */
const saveFormDraft = async (req, res) => {
  try {
    const { assignedFormId, careWorkerId, filledFormData, status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate required fields
    if (!assignedFormId || !filledFormData) {
      return res.status(400).json({
        success: false,
        message: 'Assigned form ID and filled form data are required'
      });
    }

    // Verify assignment exists
    const [assignments] = await pool.execute(
      'SELECT * FROM form_assignments WHERE id = ?',
      [assignedFormId]
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

    // Calculate progress
    const filledFields = Object.keys(filledFormData).filter(key => {
      const value = filledFormData[key];
      return value !== null && value !== undefined && value !== '';
    }).length;

    let totalFields = assignment.total_fields_count || 0;
    if (totalFields === 0) {
      // Estimate total fields
      totalFields = Math.max(filledFields, Object.keys(filledFormData).length + 10);
    }

    const progressPercentage = totalFields > 0 
      ? Math.round((filledFields / totalFields) * 100)
      : 0;

    // Determine status
    let newStatus = status || 'in_progress';
    if (assignment.status === 'assigned' && filledFields > 0) {
      newStatus = 'in_progress';
    }

    // Update assignment
    await pool.execute(
      `UPDATE form_assignments 
       SET form_data = ?, 
           completed_fields_count = ?,
           total_fields_count = ?,
           progress = ?,
           status = ?,
           last_updated_at = NOW()
       WHERE id = ?`,
      [
        JSON.stringify(filledFormData),
        filledFields,
        totalFields,
        progressPercentage,
        newStatus,
        assignedFormId
      ]
    );

    res.json({
      success: true,
      message: 'Form draft saved successfully',
      data: {
        assignedFormId,
        completedFieldsCount: filledFields,
        totalFieldsCount: totalFields,
        progress: progressPercentage,
        status: newStatus
      }
    });
  } catch (error) {
    console.error('Save form draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Submit completed form
 * POST /api/care-worker/forms/submit
 */
const submitForm = async (req, res) => {
  try {
    const { assignedFormId, careWorkerId, filledFormData, requiresSignature } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate required fields
    if (!assignedFormId || !filledFormData) {
      return res.status(400).json({
        success: false,
        message: 'Assigned form ID and filled form data are required'
      });
    }

    // Verify assignment exists
    const [assignments] = await pool.execute(
      `SELECT fa.*, ft.form_data as template_data 
       FROM form_assignments fa
       JOIN form_templates ft ON fa.form_template_id = ft.id
       WHERE fa.id = ?`,
      [assignedFormId]
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

    // Validate required fields (if template has required fields defined)
    let templateData = null;
    if (assignment.template_data) {
      templateData = typeof assignment.template_data === 'string'
        ? JSON.parse(assignment.template_data)
        : assignment.template_data;
    }

    // Check for required fields
    if (templateData && templateData.fields) {
      const requiredFields = templateData.fields.filter(f => f.required);
      const missingFields = requiredFields.filter(field => {
        const value = filledFormData[field.name];
        return value === null || value === undefined || value === '';
      });

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Please fill all required fields',
          missingFields: missingFields.map(f => f.name)
        });
      }
    }

    // Calculate final progress
    const filledFields = Object.keys(filledFormData).filter(key => {
      const value = filledFormData[key];
      return value !== null && value !== undefined && value !== '';
    }).length;

    let totalFields = assignment.total_fields_count || 0;
    if (totalFields === 0) {
      totalFields = templateData && templateData.fields 
        ? templateData.fields.length 
        : Math.max(filledFields, Object.keys(filledFormData).length);
    }

    const progressPercentage = totalFields > 0 
      ? Math.round((filledFields / totalFields) * 100)
      : 100;

    // Determine status based on signature requirement
    let newStatus = 'submitted';
    if (requiresSignature === true || requiresSignature === 'true') {
      newStatus = 'signature_pending';
    } else if (progressPercentage >= 100) {
      newStatus = 'completed';
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update assignment
      await connection.execute(
        `UPDATE form_assignments 
         SET form_data = ?, 
             completed_fields_count = ?,
             total_fields_count = ?,
             progress = ?,
             status = ?,
             submitted_at = NOW(),
             last_updated_at = NOW()
         WHERE id = ?`,
        [
          JSON.stringify(filledFormData),
          filledFields,
          totalFields,
          progressPercentage,
          newStatus,
          assignedFormId
        ]
      );

      // If completed, set completed_at
      if (newStatus === 'completed') {
        await connection.execute(
          'UPDATE form_assignments SET completed_at = NOW() WHERE id = ?',
          [assignedFormId]
        );
      }

      // Create notification for admin if submitted
      if (newStatus === 'submitted' || newStatus === 'signature_pending') {
        await connection.execute(
          `INSERT INTO notifications (user_id, type, message)
           VALUES (?, ?, ?)`,
          [
            assignment.assigned_by,
            'form_submitted',
            `Form "${assignment.form_template_id}" has been submitted by Kiaan Technology`
          ]
        );
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Form submitted successfully',
        data: {
          assignedFormId,
          status: newStatus,
          completedFieldsCount: filledFields,
          totalFieldsCount: totalFields,
          progress: progressPercentage,
          requiresSignature: newStatus === 'signature_pending'
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Submit form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Sign form (after submission)
 * POST /api/care-worker/forms/sign
 */
const signForm = async (req, res) => {
  try {
    const { assignedFormId, careWorkerId, signatureImage } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate required fields
    if (!assignedFormId || !signatureImage) {
      return res.status(400).json({
        success: false,
        message: 'Assigned form ID and signature are required'
      });
    }

    // Verify assignment exists
    const [assignments] = await pool.execute(
      'SELECT * FROM form_assignments WHERE id = ?',
      [assignedFormId]
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

    // Check if form is in signature_pending or submitted status
    if (assignment.status !== 'signature_pending' && assignment.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Form is not ready for signature'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Save signature in form_assignments
      await connection.execute(
        `UPDATE form_assignments 
         SET signature_data = ?,
             status = 'completed',
             completed_at = NOW(),
             progress = 100,
             last_updated_at = NOW()
         WHERE id = ?`,
        [signatureImage, assignedFormId]
      );

      // Also save in signatures table for history
      await connection.execute(
        `INSERT INTO signatures (form_assignment_id, signature_data, signature_type)
         VALUES (?, ?, ?)`,
        [assignedFormId, signatureImage, 'draw']
      );

      // Create notification for admin
      await connection.execute(
        `INSERT INTO notifications (user_id, type, message)
         VALUES (?, ?, ?)`,
        [
          assignment.assigned_by,
          'form_completed',
          `Form has been completed and signed by Kiaan Technology`
        ]
      );

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Form signed successfully',
        data: {
          assignedFormId,
          status: 'completed',
          progress: 100
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Sign form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get assigned forms status (Admin view)
 * GET /api/admin/forms/assigned-status
 */
const getAssignedFormsStatus = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Only admin can access this
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const [assignments] = await pool.execute(
      `SELECT 
        fa.id as assignedFormId,
        fa.status,
        fa.progress,
        fa.completed_fields_count,
        fa.total_fields_count,
        fa.last_updated_at,
        fa.submitted_at,
        fa.completed_at,
        fa.assigned_at,
        fa.due_date,
        u.id as care_worker_id,
        cwp.name as care_worker_name,
        u.email as care_worker_email,
        ft.id as form_id,
        ft.name as form_name,
        ft.type as form_type
      FROM form_assignments fa
      JOIN users u ON fa.care_worker_id = u.id
      LEFT JOIN care_worker_profiles cwp ON u.id = cwp.user_id
      JOIN form_templates ft ON fa.form_template_id = ft.id
      ORDER BY fa.last_updated_at DESC, fa.assigned_at DESC`
    );

    // Format response
    const formattedAssignments = assignments.map(a => {
      // Map status to display format
      let displayStatus = 'Not Started';
      if (a.status === 'completed') {
        displayStatus = 'Completed';
      } else if (a.status === 'in_progress') {
        displayStatus = 'In Progress';
      } else if (a.status === 'signature_pending' || a.status === 'submitted') {
        displayStatus = 'Sign Required';
      } else if (a.status === 'assigned') {
        displayStatus = 'Not Started';
      }

      return {
        assignedFormId: a.assignedFormId,
        careWorker: {
          id: a.care_worker_id,
          name: a.care_worker_name || 'N/A',
          email: a.care_worker_email
        },
        form: {
          id: a.form_id,
          name: a.form_name,
          type: a.form_type
        },
        status: displayStatus,
        progress: a.progress || 0,
        completedFieldsCount: a.completed_fields_count || 0,
        totalFieldsCount: a.total_fields_count || 0,
        lastUpdatedAt: a.last_updated_at || a.assigned_at,
        submittedAt: a.submitted_at,
        completedAt: a.completed_at,
        assignedAt: a.assigned_at,
        dueDate: a.due_date
      };
    });

    res.json({
      success: true,
      data: formattedAssignments,
      summary: {
        total: formattedAssignments.length,
        notStarted: formattedAssignments.filter(a => a.status === 'Not Started').length,
        inProgress: formattedAssignments.filter(a => a.status === 'In Progress').length,
        signRequired: formattedAssignments.filter(a => a.status === 'Sign Required').length,
        completed: formattedAssignments.filter(a => a.status === 'Completed').length
      }
    });
  } catch (error) {
    console.error('Get assigned forms status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  updateFormProgress,
  saveFormDraft,
  submitForm,
  signForm,
  getAssignedFormsStatus
};

