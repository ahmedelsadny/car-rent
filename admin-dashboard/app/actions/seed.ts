'use server'

import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'

export async function seedAdminUser() {
  try {
    // Check if admin already exists
    const existing = await db
      .select()
      .from(user)
      .where({ email: 'admin@admin.com' })

    if (existing.length > 0) {
      console.log('Admin user already exists')
      return { success: true, message: 'Admin user already exists' }
    }

    // Create admin user
    const adminId = 'admin-' + Date.now()

    await db.insert(user).values({
      id: adminId,
      name: 'Admin',
      email: 'admin@admin.com',
      emailVerified: true,
      role: 'admin',
      image: null,
    })

    console.log('Admin user created successfully')
    return { success: true, message: 'Admin user created' }
  } catch (error) {
    console.error('Error seeding admin user:', error)
    return { success: false, error: String(error) }
  }
}
