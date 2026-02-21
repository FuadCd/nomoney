'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { BurdenCurvePoint } from '../../types'

interface BurdenChartProps {
  burdenCurve: BurdenCurvePoint[]
  baselineCurve: Array<{ timeMinutes: number; distressProbability: number; lwbsProbability: number }>
  currentMinute: number
  burden: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-xl">
        <p className="font-bold text-gray-900 mb-2">{label} minutes</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-semibold">{entry.name}:</span>{' '}
            <span className="font-bold">{Math.round(entry.value)}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function BurdenChart({
  burdenCurve,
  baselineCurve,
  currentMinute,
  burden,
}: BurdenChartProps) {
  // Merge curves for chart
  const chartData = burdenCurve.map((point, i) => ({
    minute: point.timeMinutes,
    baseline: Math.round((baselineCurve[i]?.distressProbability || 0) * 100),
    actual: Math.round(point.distressProbability * 100),
    lwbs: Math.round(point.lwbsProbability * 100),
  }))
  
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 p-6 shadow-lg">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Burden Curve</h3>
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-xs text-gray-500">Current Burden</span>
            <span className={`ml-2 text-2xl font-black ${
              burden >= 70 ? 'text-red-600'
              : burden >= 50 ? 'text-amber-600'
              : 'text-green-600'
            }`}>
              {Math.round(burden)}
            </span>
          </div>
          <div className="text-xs text-gray-400">•</div>
          <div>
            <span className="text-xs text-gray-500">Wait Time</span>
            <span className="ml-2 font-bold text-gray-900">{currentMinute}m</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9ca3af" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#9ca3af" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          
          <XAxis
            dataKey="minute"
            label={{ value: 'Minutes Waited', position: 'insideBottom', offset: -5, style: { fill: '#6b7280', fontSize: '12px' } }}
            stroke="#9ca3af"
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis
            label={{ value: 'Burden Index', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: '12px' } }}
            domain={[0, 100]}
            stroke="#9ca3af"
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="line"
          />
          
          {/* Threshold lines */}
          <ReferenceLine 
            y={75} 
            stroke="#dc2626" 
            strokeDasharray="4 3" 
            strokeWidth={2}
            label={{ value: 'RED Threshold', position: 'right', style: { fill: '#dc2626', fontSize: '10px', fontWeight: 'bold' } }}
          />
          <ReferenceLine 
            y={50} 
            stroke="#d97706" 
            strokeDasharray="4 3" 
            strokeWidth={2}
            label={{ value: 'AMBER Threshold', position: 'right', style: { fill: '#d97706', fontSize: '10px', fontWeight: 'bold' } }}
          />
          <ReferenceLine 
            x={currentMinute} 
            stroke="#6b7280" 
            strokeDasharray="5 4" 
            strokeWidth={2}
            label={{ value: 'Now', position: 'top', style: { fill: '#6b7280', fontSize: '10px', fontWeight: 'bold' } }}
          />
          
          {/* Baseline */}
          <Line
            type="monotone"
            dataKey="baseline"
            stroke="#9ca3af"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={false}
            name="Baseline (no barriers)"
            strokeOpacity={0.8}
          />
          
          {/* Actual */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#2563eb"
            strokeWidth={3}
            dot={false}
            name="Actual (with barriers)"
            strokeOpacity={0.9}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
