const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const careWorkerRoutes = require('./routes/careWorkerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const formRoutes = require('./routes/formRoutes');
const formAssignmentRoutes = require('./routes/formAssignmentRoutes');
const signatureRoutes = require('./routes/signatureRoutes');
const importExportRoutes = require('./routes/importExportRoutes');
const careWorkerDashboardRoutes = require('./routes/careWorkerDashboardRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const documentsRoutes = require('./routes/documentsRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/care-workers', careWorkerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/form-assignments', formAssignmentRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/care-worker', careWorkerDashboardRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/documents', documentsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Kiaan Technology Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

