#!/usr/bin/env node
/**
 * Admin Password Hasher
 * Use this script to generate bcrypt hashed passwords for admin accounts
 * 
 * Usage: node scripts/generate-admin-hash.js "password"
 * Example: node scripts/generate-admin-hash.js "MySecurePassword123"
 */

const bcrypt = require('bcryptjs')

async function generateHash() {
  const args = process.argv.slice(2)
  
  if (!args[0]) {
    console.error('❌ Error: Please provide a password as an argument')
    console.log('\nUsage: node scripts/generate-admin-hash.js "your-password"')
    console.log('Example: node scripts/generate-admin-hash.js "MySecurePassword123"')
    process.exit(1)
  }

  const password = args[0]

  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long')
    process.exit(1)
  }

  try {
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    
    console.log('\n✅ Password hash generated successfully!\n')
    console.log('Use this hash when creating or updating admin accounts:\n')
    console.log('Hash:', hash)
    console.log('\n📋 SQL Example:\n')
    console.log('INSERT INTO public.admins (email, password_hash, full_name, role, is_active)')
    console.log("VALUES (")
    console.log("  'newaad min@taxihollongi.com',")
    console.log(`  '${hash}',`)
    console.log("  'Admin Name',")
    console.log("  'admin',")
    console.log("  true")
    console.log(');')
    console.log('\n')
  } catch (error) {
    console.error('❌ Error generating hash:', error.message)
    process.exit(1)
  }
}

generateHash()
