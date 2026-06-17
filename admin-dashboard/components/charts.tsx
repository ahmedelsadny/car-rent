'use client'

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export interface RevenueDataPoint {
  name: string
  revenue: number
}

export interface BookingStatusPoint {
  name: string
  value: number
}

export interface TopCarPoint {
  name: string
  rentals: number
}

export function RevenueChart({ data = [] }: { data?: RevenueDataPoint[] }) {
  const chartData = data.length > 0 ? data : [
    { name: 'Jan', revenue: 0 },
    { name: 'Feb', revenue: 0 },
    { name: 'Mar', revenue: 0 },
    { name: 'Apr', revenue: 0 },
    { name: 'May', revenue: 0 },
    { name: 'Jun', revenue: 0 }
  ]

  return (
    <div className="rounded-lg border border-border bg-secondary p-6">
      <h3 className="text-lg font-semibold text-foreground">Revenue Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
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
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const statusColors = {
  Completed: '#10b981',
  Active: '#3b82f6',
  Pending: '#f59e0b',
  Cancelled: '#ef4444',
  Rejected: '#b91c1c'
}

export function BookingStatusChart({ data = [] }: { data?: BookingStatusPoint[] }) {
  const chartData = data.length > 0 ? data : [
    { name: 'No Bookings', value: 1 }
  ]

  const getSliceColor = (name: string) => {
    return statusColors[name as keyof typeof statusColors] || '#64748b'
  }

  return (
    <div className="rounded-lg border border-border bg-secondary p-6">
      <h3 className="text-lg font-semibold text-foreground">Booking Status Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#3b82f6"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getSliceColor(entry.name)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TopCarsChart({ data = [] }: { data?: TopCarPoint[] }) {
  const chartData = data.length > 0 ? data : [
    { name: 'No Cars Seeded', rentals: 0 }
  ]

  return (
    <div className="rounded-lg border border-border bg-secondary p-6">
      <h3 className="text-lg font-semibold text-foreground">Top Rented Cars</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
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
          <Bar dataKey="rentals" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
