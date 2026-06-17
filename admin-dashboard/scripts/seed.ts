import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'

async function seedAdmin() {
  try {
    console.log('Seeding admin user...')
    
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(user)
      .where({ email: 'admin@admin.com' })
    
    if (existingAdmin.length > 0) {
      console.log('✓ Admin user already exists')
      return
    }

    // Create admin user
    const adminId = 'admin-' + Date.now().toString()
    
    await db.insert(user).values({
      id: adminId,
      name: 'Admin',
      email: 'admin@admin.com',
      emailVerified: true,
      role: 'admin',
      image: null,
    })

    console.log('✓ Admin user created successfully')
    console.log('Email: admin@admin.com')
    console.log('Password: admincarrentadmin123456789')
  } catch (error) {
    console.error('Error seeding admin user:', error)
    process.exit(1)
  }
}

seedAdmin()
