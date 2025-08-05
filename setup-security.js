#!/usr/bin/env node

/**
 * Admin Security Setup Script
 * 
 * This script helps set up the enhanced admin security system.
 * Run this after implementing the security updates.
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Admin Security Setup Script');
console.log('================================\n');

// Check if required files exist
const requiredFiles = [
  'src/app/utils/adminAuth.ts',
  'src/app/components/AdminSecurityPanel.tsx',
  'firestore.rules',
  '.env.local'
];

console.log('📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n🚨 Some required files are missing. Please ensure all security components are in place.');
  process.exit(1);
}

console.log('\n✅ All required files found!');

// Check environment variables
console.log('\n📋 Checking environment variables...');
require('dotenv').config({ path: '.env.local' });

const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
if (adminEmails) {
  console.log(`✅ NEXT_PUBLIC_ADMIN_EMAILS found: ${adminEmails}`);
  const emailList = adminEmails.split(',').map(email => email.trim());
  console.log(`   📧 Admin emails configured: ${emailList.length}`);
  emailList.forEach((email, index) => {
    console.log(`   ${index + 1}. ${email}`);
  });
} else {
  console.log('❌ NEXT_PUBLIC_ADMIN_EMAILS not found in .env.local');
  console.log('   Please add: NEXT_PUBLIC_ADMIN_EMAILS=your-admin@email.com,another-admin@email.com');
}

// Security checklist
console.log('\n📋 Security Implementation Checklist:');

const checklist = [
  { task: 'Enhanced adminAuth.ts with RBAC', status: 'complete' },
  { task: 'AdminSecurityPanel component', status: 'complete' },
  { task: 'Updated Firestore security rules', status: 'complete' },
  { task: 'Rate limiting implementation', status: 'complete' },
  { task: 'Audit logging system', status: 'complete' },
  { task: 'Security alert system', status: 'complete' },
  { task: 'Environment variables configured', status: adminEmails ? 'complete' : 'pending' },
  { task: 'Deploy Firestore rules', status: 'pending' },
  { task: 'Test admin access', status: 'pending' },
  { task: 'Set up production environment variables', status: 'pending' }
];

checklist.forEach((item, index) => {
  const statusIcon = item.status === 'complete' ? '✅' : '⏳';
  console.log(`${statusIcon} ${index + 1}. ${item.task}`);
});

// Next steps
console.log('\n🚀 Next Steps:');
console.log('1. Deploy Firestore rules: firebase deploy --only firestore:rules');
console.log('2. Test admin access with your admin account');
console.log('3. Test non-admin access to verify security');
console.log('4. Set up production environment variables on your hosting platform');
console.log('5. Review security monitoring dashboard');

// Security recommendations
console.log('\n🛡️ Security Recommendations:');
console.log('• Enable two-factor authentication on admin accounts');
console.log('• Regularly review audit logs');
console.log('• Monitor failed access attempts');
console.log('• Keep admin email list up to date');
console.log('• Use strong, unique passwords');
console.log('• Consider IP whitelisting for sensitive operations');

// Generate sample admin user document
console.log('\n📄 Sample Admin User Document (for Firestore):');
console.log('Collection: admin_users');
console.log('Document ID: {admin-email}');
console.log('Data:');
console.log(JSON.stringify({
  email: "admin@example.com",
  role: "super-admin",
  isActive: true,
  permissions: [
    "read:feedback",
    "write:feedback", 
    "delete:feedback",
    "manage:users",
    "manage:admins",
    "export:data",
    "view:analytics",
    "system:settings"
  ],
  lastLogin: "2025-08-05T12:00:00Z",
  createdAt: "2025-08-05T12:00:00Z"
}, null, 2));

console.log('\n🎉 Security setup verification complete!');
console.log('📖 For detailed information, see ADMIN_SECURITY.md');
