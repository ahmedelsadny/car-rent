import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    console.log('Running database setup & seeding...')

    // 1. Create tables if they do not exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
        "image" TEXT,
        "role" TEXT NOT NULL DEFAULT 'admin',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "id" TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMP NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
      );
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "account" (
        "id" TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        "scope" TEXT,
        "password" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `)

    console.log('✓ Tables checked/created successfully')

    // 2. Delete any existing user with admin@admin.com to avoid conflicts
    await db.delete(user).where(eq(user.email, 'admin@admin.com'))
    console.log('✓ Cleaned up any old admin user')

    // 3. Create the admin user using Better Auth server API
    // This will correctly create the user in both "user" and "account" (with hashed password) tables
    await auth.api.signUpEmail({
      body: {
        email: 'admin@admin.com',
        password: 'admincarrentadmin123456789',
        name: 'Admin',
      },
    })
    console.log('✓ Admin user signed up via Better Auth')

    // 4. Force role to 'admin' and make sure email is verified
    await db
      .update(user)
      .set({ role: 'admin', emailVerified: true })
      .where(eq(user.email, 'admin@admin.com'))
    console.log('✓ Role and email verification updated')

    return NextResponse.json({
      success: true,
      message: 'Database tables configured and Admin user seeded successfully!',
      credentials: {
        email: 'admin@admin.com',
        password: 'admincarrentadmin123456789',
      },
    })
  } catch (error) {
    console.error('Setup & Seed error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
