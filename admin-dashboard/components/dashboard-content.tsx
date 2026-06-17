'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { KPICard } from '@/components/kpi-card'
import { RevenueChart, BookingStatusChart, TopCarsChart } from '@/components/charts'
import { useState, useEffect } from 'react'
import {
  Users,
  Car,
  Building2,
  TrendingUp,
  DollarSign,
  Zap,
  BarChart3,
} from 'lucide-react'

export function DashboardContent() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard-data?type=stats')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard stats:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center text-muted">
          <div className="flex flex-col items-center gap-2">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></span>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const kpi = data?.kpi || {
    totalUsers: 0,
    totalCars: 0,
    totalDealers: 0,
    availableCars: 0,
    rentedCars: 0,
    totalRevenue: 0,
    platformProfit: 0,
    activeBookings: 0
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted">Welcome back! Here's your platform overview.</p>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Users"
            value={kpi.totalUsers.toLocaleString()}
            icon={<Users size={24} />}
            trend={{ direction: 'up', percentage: 12 }}
            color="blue"
          />
          <KPICard
            title="Total Cars"
            value={kpi.totalCars.toLocaleString()}
            icon={<Car size={24} />}
            trend={{ direction: 'up', percentage: 8 }}
            color="green"
          />
          <KPICard
            title="Total Dealers"
            value={kpi.totalDealers.toLocaleString()}
            icon={<Building2 size={24} />}
            trend={{ direction: 'up', percentage: 2 }}
            color="purple"
          />
          <KPICard
            title="Available Cars"
            value={kpi.availableCars.toLocaleString()}
            icon={<Zap size={24} />}
            trend={{ direction: 'up', percentage: 5 }}
            color="orange"
          />
        </div>

        {/* Second row KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Rented Cars"
            value={kpi.rentedCars.toLocaleString()}
            icon={<TrendingUp size={24} />}
            trend={{ direction: 'up', percentage: 15 }}
            color="blue"
          />
          <KPICard
            title="Total Revenue"
            value={`$${kpi.totalRevenue.toLocaleString()}`}
            icon={<DollarSign size={24} />}
            trend={{ direction: 'up', percentage: 23 }}
            color="green"
          />
          <KPICard
            title="Platform Profit"
            value={`$${kpi.platformProfit.toLocaleString()}`}
            icon={<BarChart3 size={24} />}
            trend={{ direction: 'up', percentage: 18 }}
            color="purple"
          />
          <KPICard
            title="Active Bookings"
            value={kpi.activeBookings.toLocaleString()}
            icon={<Zap size={24} />}
            trend={{ direction: 'up', percentage: 7 }}
            color="orange"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart data={data?.revenueTrend} />
          <BookingStatusChart data={data?.bookingStatuses} />
        </div>

        {/* Top Cars Chart */}
        <div>
          <TopCarsChart data={data?.topCars} />
        </div>
      </div>
    </DashboardLayout>
  )
}
