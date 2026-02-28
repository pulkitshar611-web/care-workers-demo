/**
 * Insert sample data into ALL tables
 * Run: node scripts/insertSampleDataAllTables.js
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/db');
require('dotenv').config();

async function insertSampleDataAllTables() {
  try {
    console.log('🚀 Starting sample data insertion for ALL tables...\n');

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // ============================================
      // 1. USERS TABLE
      // ============================================
      console.log('📝 Inserting into USERS table...');
      
      // Admin user
      const adminEmail = 'info@kiaantechnology.com';
      const adminPassword = await bcrypt.hash('password', 10);
      
      const [adminExisting] = await connection.execute(
        'SELECT id FROM users WHERE email = ? AND role = ?',
        [adminEmail, 'admin']
      );

      let adminId;
      if (adminExisting.length > 0) {
        adminId = adminExisting[0].id;
        await connection.execute(
          'UPDATE users SET password = ?, status = ? WHERE id = ?',
          [adminPassword, 'active', adminId]
        );
        console.log('   ✅ Admin user updated');
      } else {
        const [adminResult] = await connection.execute(
          'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
          [adminEmail, adminPassword, 'admin', 'active']
        );
        adminId = adminResult.insertId;
        console.log('   ✅ Admin user created (ID: ' + adminId + ')');
      }

      // Kiaan Technology user
      const careWorkerEmail = 'careworker1@example.com';
      const careWorkerPassword = await bcrypt.hash('password123', 10);
      
      const [workerExisting] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [careWorkerEmail]
      );

      let careWorkerId;
      if (workerExisting.length > 0) {
        careWorkerId = workerExisting[0].id;
        console.log('   ✅ Kiaan Technology user already exists (ID: ' + careWorkerId + ')');
      } else {
        const [workerResult] = await connection.execute(
          'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
          [careWorkerEmail, careWorkerPassword, 'care_worker', 'active']
        );
        careWorkerId = workerResult.insertId;
        console.log('   ✅ Kiaan Technology user created (ID: ' + careWorkerId + ')');
      }

      // ============================================
      // 2. CARE_WORKER_PROFILES TABLE
      // ============================================
      console.log('\n📝 Inserting into CARE_WORKER_PROFILES table...');
      
      const [profileExisting] = await connection.execute(
        'SELECT id FROM care_worker_profiles WHERE user_id = ?',
        [careWorkerId]
      );

      if (profileExisting.length > 0) {
        await connection.execute(
          `UPDATE care_worker_profiles 
           SET name = ?, phone = ?, address = ?, emergency_contact_name = ?, emergency_contact_phone = ?
           WHERE user_id = ?`,
          [
            'John Doe',
            '+44 7700 900123',
            '123 Main Street, London, UK',
            'Jane Doe',
            '+44 7700 900124',
            careWorkerId
          ]
        );
        console.log('   ✅ Kiaan Technology profile updated');
      } else {
        await connection.execute(
          `INSERT INTO care_worker_profiles 
           (user_id, name, phone, address, emergency_contact_name, emergency_contact_phone)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            careWorkerId,
            'John Doe',
            '+44 7700 900123',
            '123 Main Street, London, UK',
            'Jane Doe',
            '+44 7700 900124'
          ]
        );
        console.log('   ✅ Kiaan Technology profile created');
      }

      // ============================================
      // 3. FORM_TEMPLATES TABLE
      // ============================================
      console.log('\n📝 Inserting into FORM_TEMPLATES table...');
      
      const formTemplates = [
        {
          name: 'Employment Application',
          description: 'Standard employment application form for new Kiaan Technologys',
          type: 'Input',
          version: '1.0',
          formData: {
            firstName: { type: 'text', label: 'First Name', required: true, value: '' },
            lastName: { type: 'text', label: 'Last Name', required: true, value: '' },
            email: { type: 'email', label: 'Email Address', required: true, value: '' },
            phone: { type: 'tel', label: 'Phone Number', required: true, value: '' },
            address: { type: 'textarea', label: 'Address', required: true, value: '' },
            dateOfBirth: { type: 'date', label: 'Date of Birth', required: true, value: '' },
            emergencyContact: { type: 'text', label: 'Emergency Contact Name', required: true, value: '' },
            emergencyPhone: { type: 'tel', label: 'Emergency Contact Phone', required: true, value: '' }
          }
        },
        {
          name: 'Health & Safety Handbook',
          description: 'Health and safety handbook acknowledgment form',
          type: 'Document',
          version: '2.0',
          formData: {
            acknowledged: { type: 'checkbox', label: 'I acknowledge that I have read and understood the Health & Safety Handbook', required: true, value: false },
            dateAcknowledged: { type: 'date', label: 'Date Acknowledged', required: true, value: '' },
            signature: { type: 'signature', label: 'Signature', required: true, value: '' }
          }
        },
        {
          name: 'Interview Scoring',
          description: 'Interview scoring form for Kiaan Technology candidates',
          type: 'Input',
          version: '1.0',
          formData: {
            candidateName: { type: 'text', label: 'Candidate Name', required: true, value: '' },
            interviewDate: { type: 'date', label: 'Interview Date', required: true, value: '' },
            communicationSkills: { type: 'number', label: 'Communication Skills (1-10)', required: true, value: 0, min: 1, max: 10 },
            technicalSkills: { type: 'number', label: 'Technical Skills (1-10)', required: true, value: 0, min: 1, max: 10 },
            attitude: { type: 'number', label: 'Attitude (1-10)', required: true, value: 0, min: 1, max: 10 },
            overallScore: { type: 'number', label: 'Overall Score', required: true, value: 0 },
            comments: { type: 'textarea', label: 'Comments', required: false, value: '' }
          }
        }
      ];

      const formTemplateIds = [];
      for (const form of formTemplates) {
        const [formExisting] = await connection.execute(
          'SELECT id FROM form_templates WHERE name = ? AND version = ?',
          [form.name, form.version]
        );

        if (formExisting.length > 0) {
          // Update existing template with form_data if it's empty
          const [existingForm] = await connection.execute(
            'SELECT form_data FROM form_templates WHERE id = ?',
            [formExisting[0].id]
          );
          
          const existingFormData = existingForm[0]?.form_data;
          const isEmpty = !existingFormData || existingFormData === '{}' || existingFormData === 'null';
          
          if (isEmpty && form.formData) {
            await connection.execute(
              'UPDATE form_templates SET form_data = ? WHERE id = ?',
              [JSON.stringify(form.formData), formExisting[0].id]
            );
            console.log(`   ✅ Form template "${form.name}" updated with form_data (ID: ${formExisting[0].id})`);
          } else {
            console.log(`   ✅ Form template "${form.name}" already exists (ID: ${formExisting[0].id})`);
          }
          
          formTemplateIds.push(formExisting[0].id);
        } else {
          const [formResult] = await connection.execute(
            `INSERT INTO form_templates (name, description, type, version, form_data, is_active, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [form.name, form.description, form.type, form.version, JSON.stringify(form.formData || {}), true, adminId]
          );
          formTemplateIds.push(formResult.insertId);
          console.log(`   ✅ Form template "${form.name}" created with form_data (ID: ${formResult.insertId})`);
        }
      }

      // ============================================
      // 4. FORM_ASSIGNMENTS TABLE
      // ============================================
      console.log('\n📝 Inserting into FORM_ASSIGNMENTS table...');
      
      const assignments = [
        {
          formTemplateId: formTemplateIds[0],
          status: 'completed',
          progress: 100,
          formData: { field1: 'value1', field2: 'value2' },
          daysAgo: 10,
          dueDaysAgo: 5
        },
        {
          formTemplateId: formTemplateIds[1],
          status: 'signature_pending',
          progress: 95,
          formData: { acknowledged: true },
          daysAgo: 5,
          dueDaysAgo: -5
        },
        {
          formTemplateId: formTemplateIds[2],
          status: 'in_progress',
          progress: 50,
          formData: { score: 75 },
          daysAgo: 2,
          dueDaysAgo: -10
        }
      ];

      const assignmentIds = [];
      for (const assignment of assignments) {
        const assignedAt = new Date();
        assignedAt.setDate(assignedAt.getDate() - assignment.daysAgo);
        
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() - assignment.dueDaysAgo);

        const [assignResult] = await connection.execute(
          `INSERT INTO form_assignments 
           (care_worker_id, form_template_id, status, progress, form_data, assigned_by, assigned_at, due_date, submitted_at, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            careWorkerId,
            assignment.formTemplateId,
            assignment.status,
            assignment.progress,
            JSON.stringify(assignment.formData),
            adminId,
            assignedAt,
            dueDate,
            assignment.status === 'completed' || assignment.status === 'signature_pending' ? assignedAt : null,
            assignment.status === 'completed' ? new Date(assignedAt.getTime() + 2 * 24 * 60 * 60 * 1000) : null
          ]
        );
        assignmentIds.push(assignResult.insertId);
        console.log(`   ✅ Form assignment created (ID: ${assignResult.insertId}, Status: ${assignment.status})`);
      }

      // ============================================
      // 5. SIGNATURES TABLE
      // ============================================
      console.log('\n📝 Inserting into SIGNATURES table...');
      
      const completedAssignmentId = assignmentIds.find((id, idx) => assignments[idx].status === 'completed');
      if (completedAssignmentId) {
        const signedAt = new Date();
        signedAt.setDate(signedAt.getDate() - 3);

        await connection.execute(
          `INSERT INTO signatures (form_assignment_id, signature_data, signature_type, signed_at)
           VALUES (?, ?, ?, ?)`,
          [
            completedAssignmentId,
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'draw',
            signedAt
          ]
        );
        console.log('   ✅ Signature created');
      }

      // ============================================
      // 6. NOTIFICATIONS TABLE
      // ============================================
      console.log('\n📝 Inserting into NOTIFICATIONS table...');
      
      const notifications = [
        {
          type: 'form_assigned',
          message: 'New form "Employment Application" has been assigned to you',
          isRead: false,
          hoursAgo: 240
        },
        {
          type: 'signature_required',
          message: 'Signature required for "Health & Safety Handbook" form',
          isRead: false,
          hoursAgo: 120
        },
        {
          type: 'admin_reminder',
          message: 'Admin reminder: Please update your profile information',
          isRead: true,
          hoursAgo: 24
        }
      ];

      for (const notif of notifications) {
        const createdAt = new Date();
        createdAt.setHours(createdAt.getHours() - notif.hoursAgo);

        await connection.execute(
          `INSERT INTO notifications (user_id, type, message, is_read, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [careWorkerId, notif.type, notif.message, notif.isRead, createdAt]
        );
        console.log(`   ✅ Notification created (Type: ${notif.type})`);
      }

      await connection.commit();
      connection.release();

      // ============================================
      // SUMMARY
      // ============================================
      console.log('\n' + '='.repeat(50));
      console.log('✅ Sample data inserted successfully into ALL tables!');
      console.log('='.repeat(50));
      
      // Get counts
      const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
      const [profileCount] = await pool.execute('SELECT COUNT(*) as count FROM care_worker_profiles');
      const [formCount] = await pool.execute('SELECT COUNT(*) as count FROM form_templates');
      const [assignmentCount] = await pool.execute('SELECT COUNT(*) as count FROM form_assignments');
      const [signatureCount] = await pool.execute('SELECT COUNT(*) as count FROM signatures');
      const [notificationCount] = await pool.execute('SELECT COUNT(*) as count FROM notifications');

      console.log('\n📊 Table Record Counts:');
      console.log(`   Users: ${userCount[0].count}`);
      console.log(`   Kiaan Technology Profiles: ${profileCount[0].count}`);
      console.log(`   Form Templates: ${formCount[0].count}`);
      console.log(`   Form Assignments: ${assignmentCount[0].count}`);
      console.log(`   Signatures: ${signatureCount[0].count}`);
      console.log(`   Notifications: ${notificationCount[0].count}`);

      console.log('\n🔐 Login Credentials:');
      console.log('   Admin: info@kiaantechnology.com / password');
      console.log('   Kiaan Technology: careworker1@example.com / password123');

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

insertSampleDataAllTables();

