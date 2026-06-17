'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const occupancyData = [
  { week: 'Week 1', rate: 65 },
  { week: 'Week 2', rate: 72 },
  { week: 'Week 3', rate: 68 },
  { week: 'Week 4', rate: 78 },
  { week: 'Week 5', rate: 82 },
  { week: 'Week 6', rate: 75 },
]

const cancellationData = [
  { month: 'Jan', rate: 12 },
  { month: 'Feb', rate: 10 },
  { month: 'Mar', rate: 8 },
  { month: 'Apr', rate: 7 },
  { month: 'May', rate: 9 },
  { month: 'Jun', rate: 6 },
]

const topDealersData = [
  { name: 'Elite Motors', bookings: 125 },
  { name: 'EV Rentals', bookings: 98 },
  { name: 'Luxury Cars Co', bookings: 87 },
  { name: 'Premium Vehicles', bookings: 72 },
  { name: 'Exotic Rentals', bookings: 65 },
]

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="mt-1 text-muted">Deep insights into platform performance</p>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Occupancy Rate */}
          <div className="rounded-lg border border-border bg-secondary p-6">
            <h3 className="text-lg font-semibold text-foreground">Occupancy Rate (Weekly)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cancellation Rate */}
          <div className="rounded-lg border border-border bg-secondary p-6">
            <h3 className="text-lg font-semibold text-foreground">Cancellation Rate (Monthly)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cancellationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                />
                <Bar dataKey="rate" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Dealers */}
        <div className="rounded-lg border border-border bg-secondary p-6">
          <h3 className="text-lg font-semibold text-foreground">Top Dealers by Bookings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topDealersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis stroke="#64748b" dataKey="name" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
              />
              <Bar dataKey="bookings" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Analytics Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-secondary p-6">
            <p className="text-sm text-muted">Average Booking Value</p>
            <p className="mt-2 text-3xl font-bold text-foreground">$485</p>
            <p className="mt-2 text-xs text-success">+8% from last month</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary p-6">
            <p className="text-sm text-muted">Customer Retention Rate</p>
            <p className="mt-2 text-3xl font-bold text-foreground">87%</p>
            <p className="mt-2 text-xs text-success">+3% from last month</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary p-6">
            <p className="text-sm text-muted">Average Response Time</p>
            <p className="mt-2 text-3xl font-bold text-foreground">2.5h</p>
            <p className="mt-2 text-xs text-success">-0.5h from last month</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
