'use client'

import { Bell, Settings, User, Search, LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function Header() {
  const router = useRouter()
  const [showLogout, setShowLogout] = useState(false)

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/sign-in')
          router.refresh()
        }
      }
    })
  }

  return (
    <header className="fixed right-0 top-0 z-40 h-16 border-b border-border bg-secondary/80 backdrop-blur-md md:left-64">
      <div className="flex h-full items-center justify-between px-6">
        <div className="hidden flex-1 md:block">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full max-w-xs rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="rounded-lg p-2 hover:bg-background">
            <Bell size={20} className="text-muted" />
          </button>

          <button className="rounded-lg p-2 hover:bg-background">
            <Settings size={20} className="text-muted" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowLogout(!showLogout)}
              className="flex items-center gap-3 border-l border-border pl-4 hover:opacity-75 transition-opacity"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Admin</p>
                <p className="text-xs text-muted">Administrator</p>
              </div>
              <div className="flex items-center justify-center rounded-lg bg-primary p-2">
                <User size={18} className="text-white" />
              </div>
            </button>

            {showLogout && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-secondary shadow-lg">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-background rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
