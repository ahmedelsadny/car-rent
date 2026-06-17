'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { Eye, MessageSquare, Plus, CheckCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  phone: string
  verified: boolean
  bookings: number
  spending: number
  status: 'Active' | 'Inactive'
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard-data?type=users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch users:', err)
        setLoading(false)
      })
  }, [])

  const getStatusColor = (status: string) => {
    if (status === 'Active') return 'bg-success/20 text-success'
    return 'bg-muted/20 text-muted'
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="mt-1 text-muted">Manage platform users and their activities</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark">
            <Plus size={20} />
            Add User
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border bg-secondary text-muted">
            <div className="flex flex-col items-center gap-2">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></span>
              <p>Loading users...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border bg-secondary text-muted">
            No users found. Run database seed to generate test data.
          </div>
        ) : (
          /* Users Table */
          <div className="overflow-x-auto rounded-lg border border-border bg-secondary">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Verified</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Bookings</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Total Spending</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-background/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{user.name || 'No Name'}</td>
                    <td className="px-6 py-4 text-sm text-muted">{user.phone}</td>
                    <td className="px-6 py-4">
                      {user.verified ? (
                        <CheckCircle size={18} className="text-success" />
                      ) : (
                        <AlertCircle size={18} className="text-warning" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{user.bookings}</td>
                    <td className="px-6 py-4 text-sm font-medium text-success">${user.spending.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="rounded p-2 hover:bg-background/50 transition-colors">
                          <Eye size={16} className="text-muted" />
                        </button>
                        <button className="rounded p-2 hover:bg-background/50 transition-colors">
                          <MessageSquare size={16} className="text-muted" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
