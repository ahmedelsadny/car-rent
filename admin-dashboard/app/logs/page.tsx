'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { Clock, Filter } from 'lucide-react'
import { useState } from 'react'

interface Log {
  id: string
  entityType: 'User' | 'Admin' | 'Dealer'
  action: string
  performedBy: string
  timestamp: string
  details: string
}

const logsData: Log[] = [
  {
    id: 'LOG001',
    entityType: 'Admin',
    action: 'Updated Commission Rules',
    performedBy: 'Admin User',
    timestamp: '2024-06-13 14:32:15',
    details: 'Changed short-term commission from 5% to 4.5%',
  },
  {
    id: 'LOG002',
    entityType: 'User',
    action: 'Completed Booking',
    performedBy: 'John Smith',
    timestamp: '2024-06-13 12:15:48',
    details: 'Booking BK001 - BMW M3 - 3 days',
  },
  {
    id: 'LOG003',
    entityType: 'Dealer',
    action: 'Suspended Account',
    performedBy: 'Admin User',
    timestamp: '2024-06-13 10:05:22',
    details: 'Exotic Rentals account suspended - Violation of terms',
  },
  {
    id: 'LOG004',
    entityType: 'User',
    action: 'Created Account',
    performedBy: 'Michael Chen',
    timestamp: '2024-06-12 16:42:33',
    details: 'New user registration via mobile app',
  },
  {
    id: 'LOG005',
    entityType: 'Admin',
    action: 'Generated Report',
    performedBy: 'Admin User',
    timestamp: '2024-06-12 09:20:11',
    details: 'Monthly financial report exported to CSV',
  },
  {
    id: 'LOG006',
    entityType: 'Dealer',
    action: 'Added Car',
    performedBy: 'Elite Motors',
    timestamp: '2024-06-11 15:30:45',
    details: 'New listing - Mercedes C63 AMG - $180/day',
  },
  {
    id: 'LOG007',
    entityType: 'User',
    action: 'Left Review',
    performedBy: 'Sarah Johnson',
    timestamp: '2024-06-11 13:15:20',
    details: '5-star review for Tesla Model S from EV Rentals',
  },
  {
    id: 'LOG008',
    entityType: 'Admin',
    action: 'Sent Notification',
    performedBy: 'Admin User',
    timestamp: '2024-06-10 11:00:00',
    details: 'Platform maintenance notification sent to 2630 users',
  },
]

export default function LogsPage() {
  const [logs] = useState<Log[]>(logsData)
  const [selectedType, setSelectedType] = useState<string>('All')

  const types = ['All', 'User', 'Admin', 'Dealer']
  const filteredLogs = selectedType === 'All' ? logs : logs.filter((l) => l.entityType === selectedType)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'User':
        return 'bg-info/20 text-info'
      case 'Admin':
        return 'bg-success/20 text-success'
      case 'Dealer':
        return 'bg-purple-500/20 text-purple-400'
      default:
        return 'bg-muted/20 text-muted'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
            <p className="mt-1 text-muted">Track all system actions and events</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark">
            <Filter size={20} />
            Filter
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedType === type
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-muted hover:bg-background'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Logs Timeline */}
        <div className="space-y-4">
          {filteredLogs.map((log, index) => (
            <div key={log.id} className="relative flex gap-4">
              {/* Timeline line */}
              {index !== filteredLogs.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
              )}

              {/* Timeline dot */}
              <div className="relative flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-secondary">
                  <Clock size={20} className="text-primary" />
                </div>
              </div>

              {/* Log content */}
              <div className="flex-1 rounded-lg border border-border bg-secondary p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getTypeColor(log.entityType)}`}>
                        {log.entityType}
                      </span>
                      <h3 className="font-medium text-foreground">{log.action}</h3>
                    </div>
                    <p className="mt-1 text-sm text-muted">{log.details}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <span>by {log.performedBy}</span>
                      <span>•</span>
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
