"use client"

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PipelineData {
  status: string
  count: number
  label: string
}

interface PipelineChartProps {
  data: PipelineData[]
  loading?: boolean
}

export function PipelineChart({ data, loading = false }: PipelineChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Pipeline de Leads
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map(item => ({
    name: item.label,
    leads: item.count,
    fill: getStatusColor(item.status)
  }))

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/20 to-orange-50/30 dark:from-slate-900 dark:via-blue-950/10 dark:to-orange-950/20 border border-blue-200/60 dark:border-blue-800/40 rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/15 group">
      {/* Background animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-orange-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-3 text-lg font-bold">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
            📊
          </div>
          <span className="bg-gradient-to-r from-blue-600 via-orange-600 to-purple-600 bg-clip-text text-transparent">
            Pipeline de Leads
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid 
              strokeDasharray="4 4" 
              stroke="#e2e8f0"
              opacity={0.3}
            />
            <XAxis 
              dataKey="name" 
              fontSize={11}
              fontWeight={500}
              angle={-35}
              textAnchor="end"
              height={80}
              stroke="#64748b"
            />
            <YAxis 
              fontSize={11}
              fontWeight={500}
              stroke="#64748b"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
                fontWeight: '500'
              }}
              labelStyle={{ color: '#374151', fontWeight: '600' }}
              formatter={(value) => [`${value} leads`, '']}
            />
            <Bar 
              dataKey="leads" 
              radius={[12, 12, 0, 0]}
              fill="url(#enhancedPipelineGradient)"
              animationBegin={200}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            <defs>
              <linearGradient id="enhancedPipelineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="30%" stopColor="#8b5cf6" />
                <stop offset="70%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'new': '#10b981',
    'interested': '#8b5cf6',
    'qualified': '#f59e0b',
    'follow_up': '#eab308',
    'proposal_current': '#6366f1',
    'proposal_previous': '#6b7280',
    'negotiation': '#3b82f6',
    'nurturing': '#06b6d4',
    'won': '#059669',
    'lost': '#dc2626',
    'cold': '#64748b'
  }
  return colors[status] || '#6b7280'
}