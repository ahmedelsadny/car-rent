'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { Save, Lock, Shield, Sliders } from 'lucide-react'
import { useState } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    shortTermCommission: 5,
    longTermCommission: 3,
    minBookingDays: 1,
    maxBookingDays: 365,
    platformFeePercentage: 1,
  })

  const [permissions, setPermissions] = useState({
    canViewAnalytics: true,
    canManageUsers: true,
    canManageDealers: true,
    canManageFinance: true,
    canViewLogs: true,
  })

  const handleSettingChange = (key: string, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handlePermissionChange = (key: string) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted">Configure platform settings and permissions</p>
        </div>

        {/* Commission Configuration */}
        <div className="rounded-lg border border-border bg-secondary p-6">
          <div className="flex items-center gap-3">
            <Sliders size={24} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Commission Rules</h2>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Short-term Commission (%)
              </label>
              <div className="mt-2 flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={settings.shortTermCommission}
                  onChange={(e) =>
                    handleSettingChange('shortTermCommission', Number(e.target.value))
                  }
                  className="flex-1"
                />
                <span className="w-12 rounded-lg border border-border bg-background px-3 py-2 text-center font-medium text-foreground">
                  {settings.shortTermCommission}%
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">For bookings less than 7 days</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Long-term Commission (%)
              </label>
              <div className="mt-2 flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={settings.longTermCommission}
                  onChange={(e) =>
                    handleSettingChange('longTermCommission', Number(e.target.value))
                  }
                  className="flex-1"
                />
                <span className="w-12 rounded-lg border border-border bg-background px-3 py-2 text-center font-medium text-foreground">
                  {settings.longTermCommission}%
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">For bookings 7 days or more</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Minimum Booking Days
              </label>
              <input
                type="number"
                min="1"
                value={settings.minBookingDays}
                onChange={(e) =>
                  handleSettingChange('minBookingDays', Number(e.target.value))
                }
                className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Maximum Booking Days
              </label>
              <input
                type="number"
                max="365"
                value={settings.maxBookingDays}
                onChange={(e) =>
                  handleSettingChange('maxBookingDays', Number(e.target.value))
                }
                className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground">
                Platform Fee (%)
              </label>
              <div className="mt-2 flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={settings.platformFeePercentage}
                  onChange={(e) =>
                    handleSettingChange('platformFeePercentage', Number(e.target.value))
                  }
                  className="flex-1"
                />
                <span className="w-16 rounded-lg border border-border bg-background px-3 py-2 text-center font-medium text-foreground">
                  {settings.platformFeePercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Role Permissions */}
        <div className="rounded-lg border border-border bg-secondary p-6">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-success" />
            <h2 className="text-lg font-semibold text-foreground">Admin Permissions</h2>
          </div>

          <div className="mt-6 space-y-3">
            {Object.entries(permissions).map(([key, value]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background/50 p-4 hover:bg-background transition-colors"
              >
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handlePermissionChange(key)}
                  className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary"
                />
                <span className="flex-1 font-medium text-foreground">
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())
                    .trim()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* System Settings */}
        <div className="rounded-lg border border-border bg-secondary p-6">
          <div className="flex items-center gap-3">
            <Lock size={24} className="text-warning" />
            <h2 className="text-lg font-semibold text-foreground">System Settings</h2>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Support Email
              </label>
              <input
                type="email"
                defaultValue="support@carrental.com"
                className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Support Phone
              </label>
              <input
                type="tel"
                defaultValue="+1 (800) RENTALS"
                className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-4 cursor-pointer hover:bg-background transition-colors">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary"
                />
                <span className="font-medium text-foreground">Maintenance Mode</span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button className="flex items-center gap-2 rounded-lg bg-success px-6 py-3 text-white transition-colors hover:bg-success/90">
          <Save size={20} />
          Save Changes
        </button>
      </div>
    </DashboardLayout>
  )
}
