"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  description?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  loading?: boolean
  color?: string
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  description, 
  icon, 
  trend = 'neutral',
  loading = false,
  color = 'text-orange-600'
}: MetricCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
          </CardTitle>
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
        </CardContent>
      </Card>
    )
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-orange-100/20 dark:from-slate-900 dark:via-orange-950/20 dark:to-orange-900/10 border border-orange-200/50 dark:border-orange-800/30 rounded-xl transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 hover:transform hover:-translate-y-3 hover:rotate-1 group animate-pulse-slow">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-orange-500/10 dark:to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-orange-300/20 rounded-full blur-3xl opacity-0 group-hover:opacity-50 group-hover:animate-bounce transition-all duration-700"></div>
      <div className="absolute -bottom-20 -right-20 w-32 h-32 bg-amber-300/20 rounded-full blur-2xl opacity-0 group-hover:opacity-40 group-hover:animate-pulse transition-all duration-700"></div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors duration-200">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-xl bg-gradient-to-br ${
          color.includes('orange') ? 'from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50' :
          color.includes('green') ? 'from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50' :
          color.includes('purple') ? 'from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50' :
          color.includes('blue') ? 'from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50' :
          'from-gray-100 to-gray-200 dark:from-gray-800/50 dark:to-gray-700/50'
        } group-hover:scale-110 transition-transform duration-300`}>
          <div className={color}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 via-orange-800 to-orange-900 dark:from-white dark:via-orange-200 dark:to-orange-100 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        
        {change && (
          <div className={`flex items-center gap-2 text-sm font-medium ${getTrendColor()} mb-2`}>
            {getTrendIcon()}
            <span>{change}</span>
          </div>
        )}
        
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {description}
          </p>
        )}
      </CardContent>
      
      {/* Advanced shine and glow effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform translate-x-[-150%] group-hover:translate-x-[150%] transition-all duration-1200 ease-in-out"></div>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400/0 via-orange-400/10 to-orange-400/0 opacity-0 group-hover:opacity-60 transition-opacity duration-500 animate-pulse"></div>
    </Card>
  )
}