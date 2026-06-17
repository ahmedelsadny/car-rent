'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { KPICard } from '@/components/kpi-card'
import { DollarSign, TrendingUp, PieChart, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Transaction {
  id: string
  type: 'Booking' | 'Refund' | 'Commission' | 'Withdrawal'
  amount: number
  dealer?: string
  date: string
  status: 'Completed' | 'Pending' | 'Failed'
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    revenueToday: 0,
    revenueThisWeek: 0,
    platformProfit: 0,
    dealerProfit: 0
  })

  useEffect(() => {
    // 1. Fetch transactions
    fetch('/api/dashboard-data?type=transactions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTransactions(data)
        }
      })
      .catch((err) => console.error('Failed to fetch transactions:', err))

    // 2. Fetch stats
    fetch('/api/dashboard-data?type=stats')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.kpi) {
          const k = data.kpi
          setStats({
            revenueToday: Math.round(k.totalRevenue * 0.05), // Simulated daily revenue
            revenueThisWeek: Math.round(k.totalRevenue * 0.25), // Simulated weekly revenue
            platformProfit: Math.round(k.platformProfit),
            dealerProfit: Math.round(k.totalRevenue - k.platformProfit)
          })
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch stats:', err)
        setLoading(false)
      })
  }, [])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Booking':
        return 'bg-success/20 text-success'
      case 'Commission':
        return 'bg-info/20 text-info'
      case 'Refund':
        return 'bg-warning/20 text-warning'
      case 'Withdrawal':
        return 'bg-danger/20 text-danger'
      default:
        return 'bg-muted/20 text-muted'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-success/20 text-success'
      case 'Pending':
        return 'bg-warning/20 text-warning'
      case 'Failed':
        return 'bg-danger/20 text-danger'
      default:
        return 'bg-muted/20 text-muted'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finance</h1>
          <p className="mt-1 text-muted">Monitor revenue, commissions, and financial metrics</p>
        </div>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border bg-secondary text-muted">
            <div className="flex flex-col items-center gap-2">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></span>
              <p>Loading financial data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Finance KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Revenue Today"
                value={`$${stats.revenueToday.toLocaleString()}`}
                icon={<DollarSign size={24} />}
                trend={{ direction: 'up', percentage: 12 }}
                color="blue"
              />
              <KPICard
                title="Revenue This Week"
                value={`$${stats.revenueThisWeek.toLocaleString()}`}
                icon={<TrendingUp size={24} />}
                trend={{ direction: 'up', percentage: 8 }}
                color="green"
              />
              <KPICard
                title="Platform Profit"
                value={`$${stats.platformProfit.toLocaleString()}`}
                icon={<PieChart size={24} />}
                trend={{ direction: 'up', percentage: 15 }}
                color="purple"
              />
              <KPICard
                title="Dealer Profit"
                value={`$${stats.dealerProfit.toLocaleString()}`}
                icon={<Zap size={24} />}
                trend={{ direction: 'up', percentage: 6 }}
                color="orange"
              />
            </div>

            {/* Commission Rules */}
            <div className="rounded-lg border border-border bg-secondary p-6">
              <h2 className="text-lg font-semibold text-foreground">Commission Rules</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-background/50 p-4">
                  <p className="text-sm text-muted">Short-term Bookings</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">5%</p>
                  <p className="mt-1 text-xs text-muted">Less than 7 days</p>
                </div>
                <div className="rounded-lg bg-background/50 p-4">
                  <p className="text-sm text-muted">Long-term Bookings</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">3%</p>
                  <p className="mt-1 text-xs text-muted">7 days or more</p>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="rounded-lg border border-border bg-secondary">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-background/50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Dealer</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-muted">
                          No transactions found. Run database seed to generate payments.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-background/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground max-w-[150px] truncate" title={transaction.id}>{transaction.id}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getTypeColor(transaction.type)}`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted">{transaction.dealer || '-'}</td>
                          <td className={`px-6 py-4 text-sm font-medium ${transaction.amount > 0 ? 'text-success' : 'text-danger'}`}>
                            {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted">{transaction.date || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
