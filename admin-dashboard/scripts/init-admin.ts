import { auth } from '../lib/auth'

async function initializeAdmin() {
  try {
    console.log('Creating admin user...')
    
    const response = await auth.api.signUpEmail({
      email: 'admin@admin.com',
      password: 'admincarrentadmin123456789',
      name: 'Admin',
    } as any)
    
    console.log('✓ Admin user created successfully!')
    console.log('Email: admin@admin.com')
    console.log('Password: admincarrentadmin123456789')
  } catch (error) {
    console.error('Error creating admin user:', error)
    process.exit(1)
  }
}

initializeAdmin()
