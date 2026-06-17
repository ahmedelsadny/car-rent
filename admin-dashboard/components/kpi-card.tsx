'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    direction: 'up' | 'down'
    percentage: number
  }
  color?: 'blue' | 'green' | 'purple' | 'orange'
}

const colorMap = {
  blue: 'bg-blue-500/20 text-blue-400',
  green: 'bg-green-500/20 text-green-400',
  purple: 'bg-purple-500/20 text-purple-400',
  orange: 'bg-orange-500/20 text-orange-400',
}

const trendColors = {
  up: 'text-success',
  down: 'text-danger',
}

export function KPICard({ title, value, icon, trend, color = 'blue' }: KPICardProps) {
  return (
    <div className="rounded-lg border border-border bg-secondary p-6 transition-all hover:border-primary hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-foreground">{value}</h3>
          {trend && (
            <div className={cn('mt-2 flex items-center gap-1 text-sm', trendColors[trend.direction])}>
              {trend.direction === 'up' ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              <span>{trend.percentage}% from last month</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-lg p-3', colorMap[color])}>{icon}</div>
      </div>
    </div>
  )
}
