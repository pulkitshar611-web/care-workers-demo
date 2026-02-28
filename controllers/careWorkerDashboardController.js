const pool = require('../config/db');

/**
 * Get Kiaan Technology Dashboard Summary
 * GET /api/care-worker/dashboard
 */
const getCareWorkerDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get forms completed count
    const [completedForms] = await pool.execute(
      `SELECT COUNT(*) as count FROM form_assignments 
       WHERE care_worker_id = ? AND status = 'completed'`,
      [userId]
    );

    // Get forms pending count
    const [pendingForms] = await pool.execute(
      `SELECT COUNT(*) as count FROM form_assignments 
       WHERE care_worker_id = ? AND status IN ('assigned', 'in_progress', 'submitted')`,
      [userId]
    );

    // Get signatures needed count
    const [signaturesNeeded] = await pool.execute(
      `SELECT COUNT(*) as count FROM form_assignments 
       WHERE care_worker_id = ? AND status = 'signature_pending'`,
      [userId]
    );

    // Get profile status
    const [users] = await pool.execute(
      'SELECT status FROM users WHERE id = ?',
      [userId]
    );

    const profileStatus = users[0]?.status === 'active' ? 'Active' : 'Pending';

    // Get notifications
    const [notifications] = await pool.execute(
      `SELECT id, type, message, is_read, created_at 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );

    // Get forms data
    const [formsData] = await pool.execute(
      `SELECT 
        fa.id,
        fa.status,
        fa.progress,
        fa.assigned_at,
        fa.submitted_at,
        fa.due_date,
        ft.name as form_name,
        ft.type as form_type
      FROM form_assignments fa
      JOIN form_templates ft ON fa.form_template_id = ft.id
      WHERE fa.care_worker_id = ?
      ORDER BY fa.assigned_at DESC`,
      [userId]
    );

    // Format forms data
    const formattedForms = formsData.map(form => {
      let action = 'Start';
      if (form.status === 'in_progress') {
        action = 'Resume';
      } else if (form.status === 'signature_pending') {
        action = 'Sign';
      } else if (form.status === 'completed') {
        action = 'View';
      }

      return {
        id: form.id,
        name: form.form_name,
        status: form.status === 'completed' ? 'Completed' :
                form.status === 'in_progress' ? 'In Progress' :
                form.status === 'signature_pending' ? 'Pending Signature' :
                'Pending',
        action,
        dueDate: form.due_date || null,
        submissionDate: form.submitted_at || null,
        progress: form.progress || 0
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          formsCompleted: completedForms[0].count,
          formsPending: pendingForms[0].count,
          signaturesNeeded: signaturesNeeded[0].count,
          profileStatus
        },
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          message: n.message,
          read: n.is_read === 1,
          time: n.created_at
        })),
        forms: formattedForms
      }
    });
  } catch (error) {
    console.error('Get Kiaan Technology dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getCareWorkerDashboard
};

