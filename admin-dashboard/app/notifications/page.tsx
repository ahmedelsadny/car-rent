'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { Send, Trash2, Plus } from 'lucide-react'
import { useState } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  target: 'Users' | 'Dealers' | 'All'
  sentDate: string
  count: number
}

const notificationsData: Notification[] = [
  {
    id: 'NOT001',
    title: 'New Payment Method Available',
    message: 'We now accept Apple Pay for bookings',
    target: 'Users',
    sentDate: '2024-06-13',
    count: 2543,
  },
  {
    id: 'NOT002',
    title: 'Commission Payout Ready',
    message: 'Your June commission is ready for withdrawal',
    target: 'Dealers',
    sentDate: '2024-06-12',
    count: 87,
  },
  {
    id: 'NOT003',
    title: 'Platform Maintenance',
    message: 'Scheduled maintenance on June 15 from 2-4 AM EST',
    target: 'All',
    sentDate: '2024-06-11',
    count: 2630,
  },
  {
    id: 'NOT004',
    title: 'New Feature: Instant Booking',
    message: 'Book a car with one click',
    target: 'Users',
    sentDate: '2024-06-10',
    count: 2543,
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(notificationsData)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState('Users')

  const handleSendNotification = () => {
    if (title && message) {
      const newNotification: Notification = {
        id: `NOT${String(notifications.length + 1).padStart(3, '0')}`,
        title,
        message,
        target: target as 'Users' | 'Dealers' | 'All',
        sentDate: new Date().toISOString().split('T')[0],
        count: target === 'All' ? 2630 : target === 'Users' ? 2543 : 87,
      }
      setNotifications([newNotification, ...notifications])
      setTitle('')
      setMessage('')
    }
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const getTargetColor = (target: string) => {
    switch (target) {
      case 'Users':
        return 'bg-info/20 text-info'
      case 'Dealers':
        return 'bg-purple-500/20 text-purple-400'
      case 'All':
        return 'bg-success/20 text-success'
      default:
        return 'bg-muted/20 text-muted'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="mt-1 text-muted">Send and manage platform notifications</p>
        </div>

        {/* Send Notification Form */}
        <div className="rounded-lg border border-border bg-secondary p-6">
          <h2 className="text-lg font-semibold text-foreground">Send Notification</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Title</label>
              <input
                type="text"
                placeholder="Notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Message</label>
              <textarea
                placeholder="Notification message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Target</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option>Users</option>
                <option>Dealers</option>
                <option>All</option>
              </select>
            </div>
            <button
              onClick={handleSendNotification}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-white transition-colors hover:bg-primary-dark"
            >
              <Send size={20} />
              Send Notification
            </button>
          </div>
        </div>

        {/* Notifications History */}
        <div className="rounded-lg border border-border bg-secondary">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">Notification History</h2>
          </div>
          <div className="space-y-0 divide-y divide-border">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-6 hover:bg-background/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{notification.title}</h3>
                      <p className="mt-1 text-sm text-muted">{notification.message}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getTargetColor(notification.target)}`}>
                          {notification.target}
                        </span>
                        <span className="text-xs text-muted">Sent to {notification.count.toLocaleString()} recipients</span>
                        <span className="text-xs text-muted">{notification.sentDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="ml-4 rounded p-2 hover:bg-background/50 transition-colors"
                >
                  <Trash2 size={18} className="text-danger" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
