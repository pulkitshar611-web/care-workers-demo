const pool = require('../config/db');

/**
 * Get all form templates (Admin only)
 * GET /api/forms
 * This endpoint is kept for backward compatibility
 */
const getAllForms = async (req, res) => {
  try {
    const { search, type } = req.query;

    let query = `
      SELECT id, name, description, type, version, is_active as status, created_at, updated_at
      FROM form_templates
      WHERE form_category = 'template'
    `;

    const params = [];

    if (search) {
      query += ` AND (name LIKE ? OR description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    query += ` ORDER BY name ASC`;

    const [forms] = await pool.execute(query, params);

    // Transform status from boolean to string
    const transformedForms = forms.map(form => ({
      ...form,
      status: form.status ? 'active' : 'inactive'
    }));

    res.json({
      success: true,
      data: transformedForms
    });
  } catch (error) {
    console.error('Get all forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get all template forms (Admin → Forms / Templates)
 * GET /api/forms/templates
 */
const getTemplateForms = async (req, res) => {
  try {
    const { search, type } = req.query;

    let query = `
      SELECT 
        id, 
        name, 
        description, 
        type, 
        version, 
        form_category,
        CASE WHEN is_active = 1 THEN true ELSE false END as is_active
      FROM form_templates
      WHERE form_category = 'template' AND is_active = true
    `;

    const params = [];

    if (search) {
      query += ` AND (name LIKE ? OR description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    query += ` ORDER BY name ASC`;

    const [forms] = await pool.execute(query, params);

    res.json({
      success: true,
      data: forms
    });
  } catch (error) {
    console.error('Get template forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get all client forms (Admin → Clients)
 * GET /api/forms/clients
 */
const getClientForms = async (req, res) => {
  try {
    const { search, type } = req.query;

    let query = `
      SELECT 
        id, 
        name, 
        description, 
        type, 
        version, 
        CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END as status,
        created_at, 
        updated_at
      FROM form_templates
      WHERE form_category = 'client'
    `;

    const params = [];

    if (search) {
      query += ` AND (name LIKE ? OR description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    query += ` ORDER BY name ASC`;

    const [forms] = await pool.execute(query, params);

    res.json({
      success: true,
      data: forms
    });
  } catch (error) {
    console.error('Get client forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get single form template
 * GET /api/forms/:id
 */
const getFormById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is a valid integer
    const formTemplateId = parseInt(id);
    if (isNaN(formTemplateId) || formTemplateId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form template ID'
      });
    }

    const [forms] = await pool.execute(
      'SELECT * FROM form_templates WHERE id = ? AND is_active = true',
      [formTemplateId]
    );

    if (forms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form template not found or is inactive'
      });
    }

    const form = forms[0];
    
    // Parse form_data JSON
    let parsedFormData = null;
    if (form.form_data) {
      try {
        parsedFormData = typeof form.form_data === 'string' 
          ? JSON.parse(form.form_data) 
          : form.form_data;
      } catch (parseError) {
        console.warn('Failed to parse form_data JSON:', parseError.message);
        parsedFormData = null;
      }
    }

    // If form_data is empty, return empty object instead of error
    // This allows forms to be opened even if they don't have form_data yet
    const finalFormData = parsedFormData && (typeof parsedFormData === 'object' && Object.keys(parsedFormData).length > 0) 
      ? parsedFormData 
      : {}; // Return empty object if no form_data

    // Return all fields including form_data (empty object if not available)
    res.status(200).json({
      success: true,
      data: {
        id: form.id,
        name: form.name,
        description: form.description,
        type: form.type,
        version: form.version,
        form_category: form.form_category,
        is_active: form.is_active === 1 || form.is_active === true,
        created_by: form.created_by,
        created_at: form.created_at,
        updated_at: form.updated_at,
        form_data: finalFormData
      }
    });
  } catch (error) {
    console.error('Get form by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Create form template (Admin only)
 * POST /api/forms
 */
const createForm = async (req, res) => {
  try {
    const { name, description, type, version, formData, isActive } = req.body;
    const adminId = req.user.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Form name is required'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO form_templates (name, description, type, version, form_data, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        type || 'Input',
        version || '1.0',
        formData ? JSON.stringify(formData) : null,
        isActive !== undefined ? isActive : true,
        adminId
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Form template created successfully',
      data: {
        id: result.insertId,
        name,
        description,
        type: type || 'Input',
        version: version || '1.0'
      }
    });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update form template (Admin only)
 * PUT /api/forms/:id
 */
const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, version, formData, isActive } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (type) {
      updateFields.push('type = ?');
      updateValues.push(type);
    }
    if (version) {
      updateFields.push('version = ?');
      updateValues.push(version);
    }
    if (formData !== undefined) {
      updateFields.push('form_data = ?');
      updateValues.push(JSON.stringify(formData));
    }
    if (isActive !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(isActive);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE form_templates SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Form template updated successfully'
    });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete form template (Admin only)
 * DELETE /api/forms/:id
 */
const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if form has assignments
    const [assignments] = await pool.execute(
      'SELECT COUNT(*) as count FROM form_assignments WHERE form_template_id = ?',
      [id]
    );

    if (assignments[0].count > 0) {
      // Soft delete - deactivate instead
      await pool.execute(
        'UPDATE form_templates SET is_active = ? WHERE id = ?',
        [false, id]
      );

      return res.json({
        success: true,
        message: 'Form template deactivated (has existing assignments)'
      });
    }

    // Hard delete if no assignments
    await pool.execute('DELETE FROM form_templates WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Form template deleted successfully'
    });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get submitted forms (Admin → Forms / Templates → Submitted tab)
 * GET /api/forms/submissions
 */
const getSubmittedForms = async (req, res) => {
  try {
    const { search, status, dateFrom, dateTo, submittedBy } = req.query;

    let query = `
      SELECT 
        fa.id,
        fa.status,
        fa.progress,
        fa.submitted_at,
        fa.completed_at,
        fa.due_date,
        fa.form_data,
        ft.id as form_template_id,
        ft.name as form_name,
        ft.type as form_type,
        ft.version as form_version,
        ft.description as form_description,
        u.id as care_worker_id,
        u.email as care_worker_email,
        cwp.name as care_worker_name
      FROM form_assignments fa
      JOIN form_templates ft ON fa.form_template_id = ft.id
      JOIN users u ON fa.care_worker_id = u.id
      LEFT JOIN care_worker_profiles cwp ON u.id = cwp.user_id
      WHERE fa.status IN ('submitted', 'completed', 'signature_pending')
        AND ft.form_category = 'template'
    `;

    const params = [];

    if (search) {
      query += ` AND (ft.name LIKE ? OR ft.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (status && status !== 'All') {
      query += ` AND fa.status = ?`;
      params.push(status);
    }

    if (dateFrom) {
      query += ` AND DATE(fa.submitted_at) >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ` AND DATE(fa.submitted_at) <= ?`;
      params.push(dateTo);
    }

    if (submittedBy) {
      query += ` AND (cwp.name LIKE ? OR u.email LIKE ?)`;
      const searchTerm = `%${submittedBy}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ` ORDER BY fa.submitted_at DESC`;

    const [submissions] = await pool.execute(query, params);

    // Format response
    const formattedSubmissions = submissions.map(s => {
      let parsedFormData = null;
      if (s.form_data) {
        try {
          parsedFormData = typeof s.form_data === 'string' 
            ? JSON.parse(s.form_data) 
            : s.form_data;
        } catch (parseError) {
          parsedFormData = null;
        }
      }

      return {
        id: s.id,
        name: s.form_name,
        type: s.form_type,
        version: s.form_version,
        description: s.form_description,
        submittedDate: s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : null,
        submittedBy: s.care_worker_name || s.care_worker_email || 'Unknown',
        status: s.status === 'completed' ? 'Approved' : s.status === 'signature_pending' ? 'Pending' : 'Pending',
        progress: s.progress || 0,
        formData: parsedFormData,
        formTemplateId: s.form_template_id,
        careWorkerId: s.care_worker_id,
        careWorkerName: s.care_worker_name,
        careWorkerEmail: s.care_worker_email,
        dueDate: s.due_date,
        completedAt: s.completed_at
      };
    });

    res.json({
      success: true,
      data: formattedSubmissions
    });
  } catch (error) {
    console.error('Get submitted forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllForms,
  getTemplateForms,
  getClientForms,
  getFormById,
  getSubmittedForms,
  createForm,
  updateForm,
  deleteForm
};

