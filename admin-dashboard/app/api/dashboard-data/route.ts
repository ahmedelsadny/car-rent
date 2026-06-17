import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  // Check session authorization
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    if (type === 'users') {
      const result = await db.execute(sql`
        SELECT 
          u.id, 
          u.name, 
          u.phone, 
          u.verified_at IS NOT NULL as verified,
          COUNT(b.id)::int as bookings,
          COALESCE(SUM(b.subtotal), 0)::float as spending,
          CASE WHEN u.verified_at IS NOT NULL THEN 'Active' ELSE 'Inactive' END as status
        FROM users u
        LEFT JOIN bookings b ON b.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `)
      return NextResponse.json(result.rows)
    }

    if (type === 'cars') {
      const result = await db.execute(sql`
        SELECT 
          c.id,
          CONCAT(c.make, ' ', c.model) as name,
          COALESCE(o.business_name, 'Unknown') as dealer,
          c.price_per_day as price,
          CASE WHEN c.status = 'AVAILABLE' THEN 'Available' ELSE 'Rented' END as status,
          COUNT(b.id)::int as rentals,
          COALESCE(SUM(b.subtotal), 0)::float as revenue,
          CASE WHEN c.status = 'RENTED' THEN 100 ELSE 75 END as occupancy,
          '🚗' as image
        FROM cars c
        LEFT JOIN owners o ON o.id = c.owner_id
        LEFT JOIN bookings b ON b.car_id = c.id
        GROUP BY c.id, o.business_name
        ORDER BY c.created_at DESC
      `)
      return NextResponse.json(result.rows)
    }

    if (type === 'dealers') {
      const result = await db.execute(sql`
        SELECT 
          o.id,
          o.business_name as name,
          u.phone,
          COUNT(DISTINCT c.id)::int as cars,
          COUNT(DISTINCT CASE WHEN b.status = 'ACTIVE' THEN b.id END)::int as "activeRentals",
          COALESCE(SUM(b.subtotal), 0)::float as revenue,
          COALESCE(SUM(b.platform_commission), 0)::float as profit,
          CASE WHEN o.is_verified = true THEN 'Active' ELSE 'Suspended' END as status
        FROM owners o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN cars c ON c.owner_id = o.id
        LEFT JOIN bookings b ON b.car_id = c.id
        GROUP BY o.id, u.phone
        ORDER BY o.created_at DESC
      `)
      return NextResponse.json(result.rows)
    }

    if (type === 'bookings') {
      const result = await db.execute(sql`
        SELECT 
          b.id,
          COALESCE(u.name, 'Customer') as "user",
          CONCAT(c.make, ' ', c.model) as car,
          CASE 
            WHEN b.status IN ('PENDING_PAYMENT', 'PENDING_OWNER_APPROVAL') THEN 'Pending'
            WHEN b.status IN ('CONFIRMED', 'IN_DELIVERY', 'ACTIVE') THEN 'Active'
            WHEN b.status = 'COMPLETED' THEN 'Completed'
            WHEN b.status = 'CANCELLED' THEN 'Cancelled'
            WHEN b.status = 'REJECTED' THEN 'Rejected'
            ELSE 'Pending'
          END as status,
          b.subtotal as price,
          TO_CHAR(b.start_date, 'YYYY-MM-DD') as "startDate",
          TO_CHAR(b.end_date, 'YYYY-MM-DD') as "endDate"
        FROM bookings b
        JOIN users u ON u.id = b.user_id
        JOIN cars c ON c.id = b.car_id
        ORDER BY b.created_at DESC
      `)
      return NextResponse.json(result.rows)
    }

    if (type === 'stats') {
      // 1. KPI Stats
      const kpisQuery = await db.execute(sql`
        SELECT
          (SELECT COUNT(*)::int FROM users) as "totalUsers",
          (SELECT COUNT(*)::int FROM cars) as "totalCars",
          (SELECT COUNT(*)::int FROM owners) as "totalDealers",
          (SELECT COUNT(*)::int FROM cars WHERE status = 'AVAILABLE') as "availableCars",
          (SELECT COUNT(*)::int FROM cars WHERE status = 'RENTED') as "rentedCars",
          (SELECT COALESCE(SUM(subtotal), 0)::float FROM bookings WHERE status = 'COMPLETED') as "totalRevenue",
          (SELECT COALESCE(SUM(platform_commission), 0)::float FROM bookings WHERE status = 'COMPLETED') as "platformProfit",
          (SELECT COUNT(*)::int FROM bookings WHERE status IN ('CONFIRMED', 'IN_DELIVERY', 'ACTIVE')) as "activeBookings"
      `)
      const kpi = kpisQuery.rows[0]

      // 2. Booking Status Distribution
      const bookingStatusesQuery = await db.execute(sql`
        SELECT 
          CASE 
            WHEN status IN ('PENDING_PAYMENT', 'PENDING_OWNER_APPROVAL') THEN 'Pending'
            WHEN status IN ('CONFIRMED', 'IN_DELIVERY', 'ACTIVE') THEN 'Active'
            WHEN status = 'COMPLETED' THEN 'Completed'
            WHEN status = 'CANCELLED' THEN 'Cancelled'
            WHEN status = 'REJECTED' THEN 'Rejected'
          END as name,
          COUNT(*)::int as value
        FROM bookings
        GROUP BY name
      `)
      const bookingStatuses = bookingStatusesQuery.rows.filter(row => row.name !== null)

      // 3. Top Cars Performance
      const topCarsQuery = await db.execute(sql`
        SELECT 
          CONCAT(c.make, ' ', c.model) as name,
          COUNT(b.id)::int as rentals,
          COALESCE(SUM(b.subtotal), 0)::float as revenue
        FROM cars c
        LEFT JOIN bookings b ON b.car_id = c.id
        GROUP BY c.id, c.make, c.model
        ORDER BY rentals DESC
        LIMIT 5
      `)
      const topCars = topCarsQuery.rows

      // 4. Revenue Trend
      const revenueTrendQuery = await db.execute(sql`
        SELECT 
          TO_CHAR(created_at, 'Mon') as name,
          SUM(subtotal)::float as revenue
        FROM bookings
        WHERE status = 'COMPLETED'
        GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
      `)
      const revenueTrend = revenueTrendQuery.rows

      return NextResponse.json({
        kpi,
        bookingStatuses,
        topCars,
        revenueTrend
      })
    }

    if (type === 'transactions') {
      const result = await db.execute(sql`
        SELECT 
          p.id,
          CASE WHEN p.status = 'REFUNDED' THEN 'Refund' ELSE 'Booking' END as type,
          p.amount,
          COALESCE(o.business_name, 'System') as dealer,
          TO_CHAR(p.paid_at, 'YYYY-MM-DD') as date,
          CASE 
            WHEN p.status = 'SUCCESS' THEN 'Completed' 
            WHEN p.status = 'PENDING' THEN 'Pending' 
            ELSE 'Failed' 
          END as status
        FROM payments p
        JOIN bookings b ON b.id = p.booking_id
        JOIN cars c ON c.id = b.car_id
        JOIN owners o ON o.id = c.owner_id
        ORDER BY p.paid_at DESC NULLS LAST
        LIMIT 50
      `)
      return NextResponse.json(result.rows)
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
