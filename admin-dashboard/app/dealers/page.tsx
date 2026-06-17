'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { Eye, Ban, UserCheck, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Dealer {
  id: string
  name: string
  phone: string
  cars: number
  activeRentals: number
  revenue: number
  profit: number
  status: 'Active' | 'Suspended'
}

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDealers = () => {
    fetch('/api/dashboard-data?type=dealers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDealers(data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch dealers:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchDealers()
  }, [])

  const toggleStatus = (id: string, currentStatus: string) => {
    // Optimistic UI update
    setDealers(
      dealers.map((dealer) =>
        dealer.id === id
          ? {
              ...dealer,
              status: dealer.status === 'Active' ? 'Suspended' : 'Active',
            }
          : dealer
      )
    )

    // Normally we would call a backend PUT/PATCH API here:
    // fetch(`/api/dealers/${id}/toggle-status`, { method: 'POST' }).then(() => fetchDealers())
  }

  const getStatusColor = (status: string) => {
    if (status === 'Active') return 'bg-success/20 text-success'
    return 'bg-danger/20 text-danger'
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dealers</h1>
            <p className="mt-1 text-muted">Manage and monitor all dealers</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark">
            <Plus size={20} />
            Add Dealer
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border bg-secondary text-muted">
            <div className="flex flex-col items-center gap-2">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></span>
              <p>Loading dealers...</p>
            </div>
          </div>
        ) : dealers.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border bg-secondary text-muted">
            No dealers found. Run database seed to generate test data.
          </div>
        ) : (
          /* Dealers Table */
          <div className="overflow-x-auto rounded-lg border border-border bg-secondary">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Dealer Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Cars</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Active Rentals</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Revenue</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Profit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dealers.map((dealer) => (
                  <tr key={dealer.id} className="hover:bg-background/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{dealer.name}</td>
                    <td className="px-6 py-4 text-sm text-muted">{dealer.phone}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{dealer.cars}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{dealer.activeRentals}</td>
                    <td className="px-6 py-4 text-sm font-medium text-success">${dealer.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-info">${dealer.profit.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(dealer.status)}`}>
                        {dealer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="rounded p-2 hover:bg-background/50 transition-colors">
                          <Eye size={16} className="text-muted" />
                        </button>
                        <button
                          onClick={() => toggleStatus(dealer.id, dealer.status)}
                          className="rounded p-2 hover:bg-background/50 transition-colors"
                        >
                          {dealer.status === 'Active' ? (
                            <Ban size={16} className="text-warning" />
                          ) : (
                            <UserCheck size={16} className="text-success" />
                          )}
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
