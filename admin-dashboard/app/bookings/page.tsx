'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { Calendar, Filter, Eye, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Booking {
  id: string
  user: string
  car: string
  status: 'Pending' | 'Active' | 'Completed' | 'Cancelled' | 'Rejected'
  price: number
  startDate: string
  endDate: string
}

const statusConfig = {
  Pending: { color: 'bg-warning/20 text-warning', icon: Clock },
  Active: { color: 'bg-info/20 text-info', icon: CheckCircle },
  Completed: { color: 'bg-success/20 text-success', icon: CheckCircle },
  Cancelled: { color: 'bg-danger/20 text-danger', icon: XCircle },
  Rejected: { color: 'bg-danger/20 text-danger', icon: XCircle },
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('All')

  useEffect(() => {
    fetch('/api/dashboard-data?type=bookings')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBookings(data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch bookings:', err)
        setLoading(false)
      })
  }, [])

  const statuses = ['All', 'Pending', 'Active', 'Completed', 'Cancelled', 'Rejected']
  const filteredBookings = selectedStatus === 'All' ? bookings : bookings.filter((b) => b.status === selectedStatus)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bookings</h1>
            <p className="mt-1 text-muted">Monitor and manage all bookings</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark">
            <Filter size={20} />
            Filter
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-muted hover:bg-background'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border bg-secondary text-muted">
            <div className="flex flex-col items-center gap-2">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></span>
              <p>Loading bookings...</p>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border bg-secondary text-muted">
            No bookings found for the selected status. Run database seed to generate test data.
          </div>
        ) : (
          /* Bookings Table */
          <div className="overflow-x-auto rounded-lg border border-border bg-secondary">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Booking ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Car</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date Range</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBookings.map((booking) => {
                  const statusConfig_ = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.Pending
                  return (
                    <tr key={booking.id} className="hover:bg-background/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground max-w-[150px] truncate" title={booking.id}>{booking.id}</td>
                      <td className="px-6 py-4 text-sm text-muted">{booking.user}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{booking.car}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${statusConfig_.color}`}>
                          <statusConfig_.icon size={14} />
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-success">${booking.price}</td>
                      <td className="px-6 py-4 text-sm text-muted">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {booking.startDate} to {booking.endDate}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="rounded p-2 hover:bg-background/50 transition-colors">
                          <Eye size={16} className="text-muted" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
