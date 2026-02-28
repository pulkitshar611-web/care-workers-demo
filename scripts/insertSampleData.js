/**
 * Script to insert sample data with proper password hashing
 * Run: node scripts/insertSampleData.js
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/db');
require('dotenv').config();

async function insertSampleData() {
  try {
    console.log('🚀 Starting sample data insertion...');

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get admin user ID
      const [adminUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ? AND role = ?',
        ['info@kiaantechnology.com', 'admin']
      );

      if (adminUsers.length === 0) {
        throw new Error('Admin user not found. Please run: node scripts/setupAdmin.js');
      }

      const adminId = adminUsers[0].id;
      console.log(`✅ Found admin user ID: ${adminId}`);

      // Hash password for Kiaan Technologys
      const careWorkerPassword = await bcrypt.hash('password123', 10);

      // Insert Kiaan Technology Users
      console.log('📝 Inserting Kiaan Technologys...');
      const careWorkers = [
        { email: 'careworker1@example.com', name: 'John Doe', phone: '+44 7700 900123', address: '123 Main Street, London, UK', emergencyName: 'Jane Doe', emergencyPhone: '+44 7700 900124', status: 'active' },
        { email: 'careworker2@example.com', name: 'Jane Smith', phone: '+44 7700 900456', address: '456 Oak Avenue, Manchester, UK', emergencyName: 'John Smith', emergencyPhone: '+44 7700 900457', status: 'active' },
        { email: 'careworker3@example.com', name: 'Mike Johnson', phone: '+44 7700 900789', address: '789 Elm Road, Birmingham, UK', emergencyName: 'Sarah Johnson', emergencyPhone: '+44 7700 900790', status: 'active' },
        { email: 'careworker4@example.com', name: 'Emily Davis', phone: '+44 7700 901012', address: '321 Pine Street, Leeds, UK', emergencyName: 'David Davis', emergencyPhone: '+44 7700 901013', status: 'active' },
        { email: 'careworker5@example.com', name: 'Robert Brown', phone: '+44 7700 901345', address: '654 Maple Drive, Liverpool, UK', emergencyName: 'Mary Brown', emergencyPhone: '+44 7700 901346', status: 'pending' },
        { email: 'sarah.johnson@example.com', name: 'Sarah Johnson', phone: '+44 7700 900123', address: '123 Kiaan Technology Lane, London, UK', emergencyName: 'Emergency Contact', emergencyPhone: '+44 7700 900124', status: 'active' },
        { email: 'michael.chen@example.com', name: 'Michael Chen', phone: '+44 7700 900456', address: '456 Healthcare Street, Manchester, UK', emergencyName: 'Emergency Contact', emergencyPhone: '+44 7700 900457', status: 'pending' },
        { email: 'emma.wilson@example.com', name: 'Emma Wilson', phone: '+44 7700 900789', address: '789 Support Road, Birmingham, UK', emergencyName: 'Emergency Contact', emergencyPhone: '+44 7700 900790', status: 'active' }
      ];

      const insertedWorkerIds = [];

      for (const worker of careWorkers) {
        // Check if user already exists
        const [existing] = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [worker.email]
        );

        if (existing.length > 0) {
          console.log(`⚠️  User ${worker.email} already exists, skipping...`);
          insertedWorkerIds.push(existing[0].id);
          continue;
        }

        // Insert user
        const [userResult] = await connection.execute(
          'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
          [worker.email, careWorkerPassword, 'care_worker', worker.status]
        );

        const userId = userResult.insertId;
        insertedWorkerIds.push(userId);

        // Insert profile
        await connection.execute(
          `INSERT INTO care_worker_profiles 
           (user_id, name, phone, address, emergency_contact_name, emergency_contact_phone) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, worker.name, worker.phone, worker.address, worker.emergencyName, worker.emergencyPhone]
        );
      }

      console.log(`✅ Inserted ${insertedWorkerIds.length} Kiaan Technologys`);

      // Insert Form Templates
      console.log('📝 Inserting form templates...');
      const formTemplates = [
        { name: 'Employment Application', description: 'Standard employment application form for new Kiaan Technologys', type: 'Input', version: '1.0' },
        { name: 'Character Reference', description: 'Character reference form for Kiaan Technology applicants', type: 'Input', version: '1.0' },
        { name: 'Health & Safety Handbook', description: 'Health and safety handbook acknowledgment form', type: 'Document', version: '2.0' },
        { name: 'Job Description', description: 'Job description document for Kiaan Technology position', type: 'Document', version: '1.0' },
        { name: 'Interview Scoring', description: 'Interview scoring form for Kiaan Technology candidates', type: 'Input', version: '1.0' },
        { name: 'Declaration of Health', description: 'Health declaration form for Kiaan Technologys', type: 'Input', version: '1.0' },
        { name: 'Induction Certificate 1', description: 'First induction certificate for new Kiaan Technologys', type: 'Document', version: '1.0' },
        { name: 'Induction Certificate 2', description: 'Second induction certificate for Kiaan Technologys', type: 'Document', version: '1.0' },
        { name: 'Medication Competency', description: 'Medication competency assessment form', type: 'Input', version: '1.0' },
        { name: 'Review Form', description: 'Annual review form for Kiaan Technologys', type: 'Input', version: '1.0' },
        { name: 'Zero Hour Contract', description: 'Zero hour contract document', type: 'Document', version: '1.0' },
        { name: 'Information Sheet', description: 'Information sheet for Kiaan Technologys', type: 'Document', version: '1.0' },
        { name: 'Spot Check Form', description: 'Spot check form for Kiaan Technology supervision', type: 'Input', version: '1.0' },
        { name: 'Supervision Form', description: 'Supervision form for Kiaan Technology management', type: 'Input', version: '1.0' },
        { name: 'Appraisal Form', description: 'Appraisal form for Kiaan Technology evaluation', type: 'Input', version: '1.0' },
        { name: 'Application Form', description: 'General application form', type: 'Input', version: '1.0' },
        { name: 'Medication Management', description: 'Medication management form', type: 'Input', version: '1.0' },
        { name: 'Kiaan Technology Shadowing', description: 'Kiaan Technology shadowing form', type: 'Input', version: '1.0' },
        { name: 'Training Matrix', description: 'Training matrix form for Kiaan Technologys', type: 'Input', version: '1.0' },
        { name: 'Client Profile', description: 'Client profile form', type: 'Input', version: '1.0' },
        { name: 'Unite Care Ltd', description: 'Unite Care Ltd form', type: 'Input', version: '1.0' },
        { name: 'Induction Checklist', description: 'Induction checklist form', type: 'Input', version: '1.0' },
        { name: 'Carer DBS Form', description: 'DBS check form for Kiaan Technologys', type: 'Input', version: '1.0' },
        { name: 'Staff File', description: 'Staff file form', type: 'Input', version: '1.0' }
      ];

      const insertedFormIds = [];

      for (const form of formTemplates) {
        // Check if form already exists
        const [existing] = await connection.execute(
          'SELECT id FROM form_templates WHERE name = ? AND version = ?',
          [form.name, form.version]
        );

        if (existing.length > 0) {
          insertedFormIds.push(existing[0].id);
          continue;
        }

        const [formResult] = await connection.execute(
          `INSERT INTO form_templates (name, description, type, version, form_data, is_active, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [form.name, form.description, form.type, form.version, JSON.stringify({}), true, adminId]
        );

        insertedFormIds.push(formResult.insertId);
      }

      console.log(`✅ Inserted ${insertedFormIds.length} form templates`);

      // Insert Form Assignments
      console.log('📝 Inserting form assignments...');
      const assignments = [
        // Kiaan Technology 1 (John Doe) - Multiple forms
        { workerIdx: 0, formIdx: 0, status: 'completed', progress: 100, daysAgo: 30, dueDaysAgo: 20 },
        { workerIdx: 0, formIdx: 1, status: 'completed', progress: 100, daysAgo: 25, dueDaysAgo: 15 },
        { workerIdx: 0, formIdx: 2, status: 'completed', progress: 100, daysAgo: 20, dueDaysAgo: 10 },
        { workerIdx: 0, formIdx: 3, status: 'signature_pending', progress: 95, daysAgo: 15, dueDaysAgo: 5 },
        { workerIdx: 0, formIdx: 4, status: 'signature_pending', progress: 95, daysAgo: 10, dueDaysAgo: -5 },
        { workerIdx: 0, formIdx: 5, status: 'in_progress', progress: 60, daysAgo: 5, dueDaysAgo: -10 },
        { workerIdx: 0, formIdx: 6, status: 'assigned', progress: 0, daysAgo: 2, dueDaysAgo: -15 },
        // Kiaan Technology 2 (Jane Smith)
        { workerIdx: 1, formIdx: 0, status: 'completed', progress: 100, daysAgo: 28, dueDaysAgo: 18 },
        { workerIdx: 1, formIdx: 1, status: 'completed', progress: 100, daysAgo: 25, dueDaysAgo: 15 },
        { workerIdx: 1, formIdx: 2, status: 'completed', progress: 100, daysAgo: 22, dueDaysAgo: 12 },
        { workerIdx: 1, formIdx: 3, status: 'completed', progress: 100, daysAgo: 18, dueDaysAgo: 8 },
        { workerIdx: 1, formIdx: 4, status: 'signature_pending', progress: 95, daysAgo: 12, dueDaysAgo: 2 },
        { workerIdx: 1, formIdx: 5, status: 'signature_pending', progress: 95, daysAgo: 8, dueDaysAgo: -2 },
        { workerIdx: 1, formIdx: 6, status: 'signature_pending', progress: 95, daysAgo: 5, dueDaysAgo: -5 },
        { workerIdx: 1, formIdx: 7, status: 'in_progress', progress: 45, daysAgo: 3, dueDaysAgo: -12 },
        { workerIdx: 1, formIdx: 8, status: 'assigned', progress: 0, daysAgo: 1, dueDaysAgo: -20 },
        // Kiaan Technology 3 (Mike Johnson)
        { workerIdx: 2, formIdx: 0, status: 'completed', progress: 100, daysAgo: 35, dueDaysAgo: 25 },
        { workerIdx: 2, formIdx: 1, status: 'completed', progress: 100, daysAgo: 32, dueDaysAgo: 22 },
        { workerIdx: 2, formIdx: 2, status: 'completed', progress: 100, daysAgo: 30, dueDaysAgo: 20 },
        { workerIdx: 2, formIdx: 3, status: 'completed', progress: 100, daysAgo: 28, dueDaysAgo: 18 },
        { workerIdx: 2, formIdx: 4, status: 'completed', progress: 100, daysAgo: 25, dueDaysAgo: 15 },
        { workerIdx: 2, formIdx: 5, status: 'completed', progress: 100, daysAgo: 22, dueDaysAgo: 12 },
        { workerIdx: 2, formIdx: 6, status: 'completed', progress: 100, daysAgo: 20, dueDaysAgo: 10 },
        { workerIdx: 2, formIdx: 7, status: 'completed', progress: 100, daysAgo: 18, dueDaysAgo: 8 },
        { workerIdx: 2, formIdx: 8, status: 'signature_pending', progress: 95, daysAgo: 15, dueDaysAgo: 5 },
        { workerIdx: 2, formIdx: 9, status: 'in_progress', progress: 70, daysAgo: 10, dueDaysAgo: -5 }
      ];

      let assignmentCount = 0;
      for (const assignment of assignments) {
        if (insertedWorkerIds[assignment.workerIdx] && insertedFormIds[assignment.formIdx]) {
          const assignedAt = new Date();
          assignedAt.setDate(assignedAt.getDate() - assignment.daysAgo);
          
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() - assignment.dueDaysAgo);

          await connection.execute(
            `INSERT INTO form_assignments 
             (care_worker_id, form_template_id, status, progress, assigned_by, assigned_at, due_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              insertedWorkerIds[assignment.workerIdx],
              insertedFormIds[assignment.formIdx],
              assignment.status,
              assignment.progress,
              adminId,
              assignedAt,
              dueDate
            ]
          );
          assignmentCount++;
        }
      }

      console.log(`✅ Inserted ${assignmentCount} form assignments`);

      // Insert Notifications
      console.log('📝 Inserting notifications...');
      const notifications = [
        { workerIdx: 0, type: 'form_assigned', message: 'New form "Employment Application" has been assigned to you', isRead: false, hoursAgo: 48 },
        { workerIdx: 0, type: 'signature_required', message: 'Signature required for "Health & Safety Handbook" form', isRead: false, hoursAgo: 24 },
        { workerIdx: 1, type: 'form_assigned', message: 'New form "Medication Competency" has been assigned to you', isRead: false, hoursAgo: 24 },
        { workerIdx: 1, type: 'signature_required', message: 'Signature required for "Interview Scoring" form', isRead: false, hoursAgo: 8 },
        { workerIdx: 2, type: 'form_assigned', message: 'New form "Review Form" has been assigned to you', isRead: true, hoursAgo: 240 },
        { workerIdx: 2, type: 'admin_reminder', message: 'Admin reminder: Please update your profile information', isRead: true, hoursAgo: 24 }
      ];

      let notificationCount = 0;
      for (const notif of notifications) {
        if (insertedWorkerIds[notif.workerIdx]) {
          const createdAt = new Date();
          createdAt.setHours(createdAt.getHours() - notif.hoursAgo);

          await connection.execute(
            `INSERT INTO notifications (user_id, type, message, is_read, created_at)
             VALUES (?, ?, ?, ?, ?)`,
            [
              insertedWorkerIds[notif.workerIdx],
              notif.type,
              notif.message,
              notif.isRead,
              createdAt
            ]
          );
          notificationCount++;
        }
      }

      console.log(`✅ Inserted ${notificationCount} notifications`);

      await connection.commit();
      connection.release();

      console.log('\n✅ Sample data inserted successfully!');
      console.log('\n📊 Summary:');
      console.log(`   - Kiaan Technologys: ${insertedWorkerIds.length}`);
      console.log(`   - Form Templates: ${insertedFormIds.length}`);
      console.log(`   - Form Assignments: ${assignmentCount}`);
      console.log(`   - Notifications: ${notificationCount}`);
      console.log('\n🔐 Login Credentials:');
      console.log('   Admin: info@kiaantechnology.com / password');
      console.log('   Kiaan Technologys: careworker1@example.com through careworker8@example.com / password123');

      process.exit(0);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    process.exit(1);
  }
}

insertSampleData();

