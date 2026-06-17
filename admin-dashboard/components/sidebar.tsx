'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  LayoutDashboard,
  Car,
  Building2,
  Users,
  Calendar,
  DollarSign,
  Bell,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  AlertCircle,
  UserPlus,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Cars', href: '/cars', icon: <Car size={20} />, badge: 0 },
  { label: 'Dealers', href: '/dealers', icon: <Building2 size={20} /> },
  { label: 'Users', href: '/users', icon: <Users size={20} />, badge: 5 },
  { label: 'Bookings', href: '/bookings', icon: <Calendar size={20} />, badge: 12 },
  { label: 'Finance', href: '/finance', icon: <DollarSign size={20} /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell size={20} /> },
  { label: 'Logs', href: '/logs', icon: <FileText size={20} /> },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const [currentPath, setCurrentPath] = useState('/')

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-md bg-primary p-2 text-white md:hidden"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 border-r border-border bg-secondary transition-transform duration-300 ease-in-out md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="border-b border-border px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-primary p-2">
              <Car className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">CarAdmin</h1>
              <p className="text-xs text-muted">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setCurrentPath(item.href)
                  setIsOpen(false)
                }}
                className={cn(
                  'flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-200',
                  currentPath === item.href
                    ? 'bg-primary text-white'
                    : 'text-muted hover:bg-secondary hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="inline-flex items-center justify-center rounded-full bg-danger px-2 py-1 text-xs font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </nav>

        {/* Quick alerts */}
        <div className="border-t border-border p-4">
          <div className="space-y-2">
            <div className="rounded-lg bg-warning/10 p-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-warning" />
                <span className="text-xs font-medium text-warning">12 Pending</span>
              </div>
              <p className="text-xs text-muted">Bookings awaiting action</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
