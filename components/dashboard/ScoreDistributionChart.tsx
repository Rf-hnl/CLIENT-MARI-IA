"use client"

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ScoreData {
  name: string
  value: number
  color: string
}

interface ScoreDistributionChartProps {
  data: ScoreData[]
  loading?: boolean
}

export function ScoreDistributionChart({ data, loading = false }: ScoreDistributionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Distribución de Calificación
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/20 to-orange-50/30 dark:from-slate-900 dark:via-purple-950/10 dark:to-orange-950/20 border border-purple-200/60 dark:border-purple-800/40 rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/15 group">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-orange-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-3 text-lg font-bold">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
            🎯
          </div>
          <span className="bg-gradient-to-r from-purple-600 via-orange-600 to-pink-600 bg-clip-text text-transparent">
            Distribución de Calificación
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={90}
              innerRadius={30}
              fill="#8884d8"
              dataKey="value"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth={3}
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-in-out"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`url(#scoreGradient${index})`}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(147, 51, 234, 0.2)',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                fontSize: '12px',
                fontWeight: '500'
              }}
              labelStyle={{ color: '#374151', fontWeight: '600' }}
              formatter={(value, name) => [`${value} leads (${total > 0 ? ((value as number / total) * 100).toFixed(1) : '0'}%)`, name]}
            />
            <defs>
              <linearGradient id="scoreGradient0" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="scoreGradient1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
              <linearGradient id="scoreGradient2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Enhanced stats summary with gradients */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-purple-100 dark:border-purple-800/50">
          {data.map((item, index) => (
            <div key={index} className="text-center p-3 rounded-xl bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-slate-800/50 dark:to-slate-700/50 hover:shadow-lg transition-all duration-200 group/stat">
              <div className="text-2xl font-bold mb-1 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-200 bg-clip-text text-transparent group-hover/stat:scale-110 transition-transform duration-200">
                {item.value}
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {item.name.split(' ')[0]}
              </div>
              <div className="text-xs font-semibold px-2 py-1 rounded-full" style={{ 
                backgroundColor: `${item.color}20`, 
                color: item.color 
              }}>
                {total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}