/**
 * Fix Form Templates - Add proper form_data structure
 * Run: node scripts/fixFormTemplatesData.js
 */

const pool = require('../config/db');
require('dotenv').config();

async function fixFormTemplatesData() {
  try {
    console.log('🔧 Fixing form templates with proper form_data...\n');

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Sample form_data structures for different form types
      const formDataTemplates = {
        'Employment Application': {
          firstName: { type: 'text', label: 'First Name', required: true, value: '' },
          lastName: { type: 'text', label: 'Last Name', required: true, value: '' },
          email: { type: 'email', label: 'Email Address', required: true, value: '' },
          phone: { type: 'tel', label: 'Phone Number', required: true, value: '' },
          address: { type: 'textarea', label: 'Address', required: true, value: '' },
          dateOfBirth: { type: 'date', label: 'Date of Birth', required: true, value: '' },
          emergencyContact: { type: 'text', label: 'Emergency Contact Name', required: true, value: '' },
          emergencyPhone: { type: 'tel', label: 'Emergency Contact Phone', required: true, value: '' }
        },
        'Health & Safety Handbook': {
          acknowledged: { type: 'checkbox', label: 'I acknowledge that I have read and understood the Health & Safety Handbook', required: true, value: false },
          dateAcknowledged: { type: 'date', label: 'Date Acknowledged', required: true, value: '' },
          signature: { type: 'signature', label: 'Signature', required: true, value: '' }
        },
        'Interview Scoring': {
          candidateName: { type: 'text', label: 'Candidate Name', required: true, value: '' },
          interviewDate: { type: 'date', label: 'Interview Date', required: true, value: '' },
          communicationSkills: { type: 'number', label: 'Communication Skills (1-10)', required: true, value: 0, min: 1, max: 10 },
          technicalSkills: { type: 'number', label: 'Technical Skills (1-10)', required: true, value: 0, min: 1, max: 10 },
          attitude: { type: 'number', label: 'Attitude (1-10)', required: true, value: 0, min: 1, max: 10 },
          overallScore: { type: 'number', label: 'Overall Score', required: true, value: 0 },
          comments: { type: 'textarea', label: 'Comments', required: false, value: '' }
        }
      };

      // Get all form templates
      const [templates] = await connection.execute(
        'SELECT id, name FROM form_templates WHERE form_data IS NULL OR form_data = "{}" OR form_data = "null"'
      );

      console.log(`Found ${templates.length} form templates to update\n`);

      let updated = 0;
      for (const template of templates) {
        // Check if we have a template for this form name
        let formData = formDataTemplates[template.name];
        
        // If no specific template, create a generic one
        if (!formData) {
          formData = {
            field1: { type: 'text', label: 'Field 1', required: true, value: '' },
            field2: { type: 'text', label: 'Field 2', required: false, value: '' },
            notes: { type: 'textarea', label: 'Notes', required: false, value: '' }
          };
        }

        await connection.execute(
          'UPDATE form_templates SET form_data = ? WHERE id = ?',
          [JSON.stringify(formData), template.id]
        );

        console.log(`✅ Updated "${template.name}" (ID: ${template.id})`);
        updated++;
      }

      // Also update any templates that have empty object
      const [emptyTemplates] = await connection.execute(
        `SELECT id, name FROM form_templates 
         WHERE form_data = '{}' OR form_data = 'null' OR form_data IS NULL`
      );

      for (const template of emptyTemplates) {
        if (!templates.find(t => t.id === template.id)) {
          let formData = formDataTemplates[template.name];
          
          if (!formData) {
            formData = {
              field1: { type: 'text', label: 'Field 1', required: true, value: '' },
              field2: { type: 'text', label: 'Field 2', required: false, value: '' },
              notes: { type: 'textarea', label: 'Notes', required: false, value: '' }
            };
          }

          await connection.execute(
            'UPDATE form_templates SET form_data = ? WHERE id = ?',
            [JSON.stringify(formData), template.id]
          );

          console.log(`✅ Updated "${template.name}" (ID: ${template.id})`);
          updated++;
        }
      }

      await connection.commit();
      connection.release();

      console.log(`\n✅ Successfully updated ${updated} form templates with proper form_data!`);
      
      // Verify
      const [verify] = await pool.execute(
        'SELECT COUNT(*) as count FROM form_templates WHERE form_data IS NOT NULL AND form_data != "{}" AND form_data != "null"'
      );
      
      console.log(`\n📊 Total templates with form_data: ${verify[0].count}`);

      process.exit(0);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('❌ Error fixing form templates:', error);
    process.exit(1);
  }
}

fixFormTemplatesData();

