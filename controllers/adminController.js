const pool = require('../config/db');

/**
 * Get Admin Dashboard Summary
 * GET /api/admin/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get total carers count
    const [carersCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = ? AND status = ?',
      ['care_worker', 'active']
    );

    // Get pending forms count (assigned but not completed)
    const [pendingForms] = await pool.execute(
      `SELECT COUNT(*) as count FROM form_assignments 
       WHERE status IN ('assigned', 'in_progress', 'submitted')`
    );

    // Get completed packs count (fully completed forms)
    const [completedPacks] = await pool.execute(
      `SELECT COUNT(*) as count FROM form_assignments 
       WHERE status = 'completed'`
    );

    // Get pending signatures count
    const [pendingSignatures] = await pool.execute(
      `SELECT COUNT(*) as count FROM form_assignments 
       WHERE status = 'signature_pending'`
    );

    // Get recent carers with progress
    const [recentCarers] = await pool.execute(
      `SELECT 
        u.id,
        u.email,
        u.status,
        cwp.name,
        cwp.phone,
        COUNT(DISTINCT fa.id) as total_forms,
        COUNT(DISTINCT CASE WHEN fa.status = 'completed' THEN fa.id END) as completed_forms,
        COUNT(DISTINCT CASE WHEN fa.status = 'signature_pending' THEN fa.id END) as pending_signatures
      FROM users u
      LEFT JOIN care_worker_profiles cwp ON u.id = cwp.user_id
      LEFT JOIN form_assignments fa ON u.id = fa.care_worker_id
      WHERE u.role = 'care_worker'
      GROUP BY u.id, u.email, u.status, cwp.name, cwp.phone
      ORDER BY u.id DESC
      LIMIT 10`
    );

    // Calculate progress for each carer
    const carersWithProgress = recentCarers.map(carer => {
      const progress = carer.total_forms > 0 
        ? Math.round((carer.completed_forms / carer.total_forms) * 100)
        : 0;

      return {
        id: `CW${String(carer.id).padStart(3, '0')}`,
        name: carer.name || 'N/A',
        email: carer.email,
        phone: carer.phone || 'N/A',
        status: carer.status === 'active' ? 'Active' : 'Pending',
        progress,
        pendingSignatures: carer.pending_signatures || 0
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalCarers: carersCount[0].count,
          pendingForms: pendingForms[0].count,
          completedPacks: completedPacks[0].count,
          pendingSignatures: pendingSignatures[0].count
        },
        recentCarers: carersWithProgress
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getDashboard
};

