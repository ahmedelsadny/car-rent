'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { Eye, Edit, Trash2, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Car {
  id: string
  name: string
  dealer: string
  price: number
  status: 'Available' | 'Rented'
  rentals: number
  revenue: number
  occupancy: number
  image: string
}

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard-data?type=cars')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCars(data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch cars:', err)
        setLoading(false)
      })
  }, [])

  const getStatusColor = (status: string) => {
    if (status === 'Available') return 'bg-success/20 text-success'
    return 'bg-warning/20 text-warning'
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cars Management</h1>
            <p className="mt-1 text-muted">Manage all vehicles in the platform</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark">
            <Plus size={20} />
            Add Car
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border bg-secondary text-muted">
            <div className="flex flex-col items-center gap-2">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></span>
              <p>Loading cars...</p>
            </div>
          </div>
        ) : cars.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border bg-secondary text-muted">
            No cars found. Run database seed to generate test data.
          </div>
        ) : (
          /* Cars Table */
          <div className="overflow-x-auto rounded-lg border border-border bg-secondary">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Car Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Dealer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Price/Day</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Rentals</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Revenue</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Occupancy</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cars.map((car) => (
                  <tr key={car.id} className="hover:bg-background/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{car.image || '🚗'}</span>
                        <div>
                          <p className="font-medium text-foreground">{car.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">{car.dealer}</td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">${car.price}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(car.status)}`}>
                        {car.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">{car.rentals}</td>
                    <td className="px-6 py-4 text-sm font-medium text-success">${car.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-background">
                          <div
                            className="h-full bg-info transition-all"
                            style={{ width: `${car.occupancy}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted">{car.occupancy}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="rounded p-2 hover:bg-background/50 transition-colors">
                          <Eye size={16} className="text-muted" />
                        </button>
                        <button className="rounded p-2 hover:bg-background/50 transition-colors">
                          <Edit size={16} className="text-muted" />
                        </button>
                        <button className="rounded p-2 hover:bg-background/50 transition-colors">
                          <Trash2 size={16} className="text-danger" />
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
