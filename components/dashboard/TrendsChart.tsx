"use client"

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TrendData {
  date: string
  count: number
}

interface TrendsChartProps {
  data: TrendData[]
  loading?: boolean
}

export function TrendsChart({ data, loading = false }: TrendsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Tendencias (Últimos 7 días)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </CardContent>
      </Card>
    )
  }

  // Prepare data with formatted dates
  const chartData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    })
  }))

  const maxValue = Math.max(...data.map(d => d.count), 0)

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/20 to-blue-50/30 dark:from-slate-900 dark:via-emerald-950/10 dark:to-blue-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/15 group">
      {/* Dynamic background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-3 text-lg font-bold">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
            📈
          </div>
          <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-orange-600 bg-clip-text text-transparent">
            Tendencias (Últimos 7 días)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="enhancedTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <filter id="dropShadow">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.1"/>
              </filter>
            </defs>
            <CartesianGrid 
              strokeDasharray="4 4" 
              stroke="#e2e8f0"
              opacity={0.4}
            />
            <XAxis 
              dataKey="formattedDate" 
              fontSize={11}
              fontWeight={500}
              stroke="#64748b"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              fontSize={11}
              fontWeight={500}
              stroke="#64748b"
              axisLine={false}
              tickLine={false}
              domain={[0, maxValue + 2]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                fontSize: '12px',
                fontWeight: '500'
              }}
              labelStyle={{ color: '#374151', fontWeight: '600' }}
              formatter={(value) => [`${value} leads`, 'Nuevos leads']}
              labelFormatter={(label) => `📅 ${label}`}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="url(#lineGradient)"
              strokeWidth={4}
              fill="url(#enhancedTrendGradient)"
              animationBegin={0}
              animationDuration={1500}
              animationEasing="ease-in-out"
              dot={{ 
                fill: '#ffffff', 
                strokeWidth: 3, 
                stroke: 'url(#lineGradient)', 
                r: 5,
                filter: 'url(#dropShadow)'
              }}
              activeDot={{ 
                r: 8, 
                fill: '#ffffff', 
                strokeWidth: 4, 
                stroke: '#f97316',
                filter: 'url(#dropShadow)',
                style: { cursor: 'pointer' }
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Enhanced summary stats with glassmorphism */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-emerald-100 dark:border-emerald-800/50">
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-50/80 via-white/50 to-emerald-100/60 dark:from-emerald-900/30 dark:via-slate-800/50 dark:to-emerald-800/30 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-700/30 hover:shadow-lg transition-all duration-200 group/stat">
            <div className="text-2xl font-bold mb-1 bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-400 dark:to-emerald-200 bg-clip-text text-transparent group-hover/stat:scale-110 transition-transform duration-200">
              {data.reduce((sum, item) => sum + item.count, 0)}
            </div>
            <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Total esta semana
            </div>
          </div>
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50/80 via-white/50 to-blue-100/60 dark:from-blue-900/30 dark:via-slate-800/50 dark:to-blue-800/30 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/30 hover:shadow-lg transition-all duration-200 group/stat">
            <div className="text-2xl font-bold mb-1 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent group-hover/stat:scale-110 transition-transform duration-200">
              {data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item.count, 0) / data.length) : 0}
            </div>
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Promedio diario
            </div>
          </div>
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50/80 via-white/50 to-orange-100/60 dark:from-orange-900/30 dark:via-slate-800/50 dark:to-orange-800/30 backdrop-blur-sm border border-orange-200/50 dark:border-orange-700/30 hover:shadow-lg transition-all duration-200 group/stat">
            <div className="text-2xl font-bold mb-1 bg-gradient-to-r from-orange-600 to-orange-800 dark:from-orange-400 dark:to-orange-200 bg-clip-text text-transparent group-hover/stat:scale-110 transition-transform duration-200">
              {maxValue}
            </div>
            <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Máximo en un día
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}