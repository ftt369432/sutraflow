import React, { useState, useEffect } from 'react'
import { trainingAnalytics } from '../../services/trainingAnalyticsService'
import type { TrainingAnalytics, EffectivenessMetrics, UsageTrend } from '../../types/training'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface Props {
  assistantId: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export const TrainingAnalyticsDashboard: React.FC<Props> = ({ assistantId }) => {
  const [analytics, setAnalytics] = useState<TrainingAnalytics | null>(null)
  const [effectiveness, setEffectiveness] = useState<EffectivenessMetrics[]>([])
  const [usageTrends, setUsageTrends] = useState<UsageTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('30 days')

  useEffect(() => {
    loadData()
  }, [assistantId, timeframe])
  const loadData = async () => {
    try {
      setLoading(true)
      const [analyticsData, effectivenessData, trendsData] = await Promise.all([
        trainingAnalytics.getAnalytics(assistantId),
        trainingAnalytics.getEffectiveEntries(assistantId),
        trainingAnalytics.getUsageHistory(assistantId, timeframe)
      ])

      setAnalytics(analyticsData)
      setEffectiveness(effectivenessData)
      setUsageTrends(trendsData)
      setError(null)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unknown error occurred')
      }
    } finally {
      setLoading(false)
    }
  }
  const handleExport = async () => {
    try {
      const analyticsData = await trainingAnalytics.getAnalytics(assistantId)
      const effectivenessData = await trainingAnalytics.getEffectiveEntries(assistantId)
      const trendsData = await trainingAnalytics.getUsageHistory(assistantId)

      const report = {
        analytics: analyticsData,
        effectiveness: effectivenessData,
        usageTrends: trendsData,
        generatedAt: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `training-analytics-${assistantId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to export analytics report')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading analytics...</div>
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded">
        Error loading analytics: {error}
      </div>
    )
  }

  if (!analytics) {
    return <div>No analytics data available</div>
  }

  const entryTypeData = [
    { name: 'Conversations', value: analytics.conversation_examples },
    { name: 'Knowledge', value: analytics.knowledge_facts },
    { name: 'Behavioral', value: analytics.behavioral_prompts },
    { name: 'Capabilities', value: analytics.capability_demos }
  ]

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Training Analytics Dashboard</h2>
        <div className="space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="rounded border p-2"
          >
            <option value="7 days">Last 7 days</option>
            <option value="30 days">Last 30 days</option>
            <option value="90 days">Last 90 days</option>
          </select>
          <button
            onClick={handleExport}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Total Entries</h3>
            <p className="text-3xl">{analytics.total_entries}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Total Uses</h3>
            <p className="text-3xl">{analytics.total_uses}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Avg Effectiveness</h3>
            <p className="text-3xl">
              {(analytics.avg_effectiveness * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Last Updated</h3>
            <p className="text-sm">
              {new Date(analytics.last_entry_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Entry Type Distribution */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-4">Entry Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={entryTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  value,
                  index
                }) => {
                  const RADIAN = Math.PI / 180
                  const radius = 25 + innerRadius + (outerRadius - innerRadius)
                  const x = cx + radius * Math.cos(-midAngle * RADIAN)
                  const y = cy + radius * Math.sin(-midAngle * RADIAN)

                  return (
                    <text
                      x={x}
                      y={y}
                      fill={COLORS[index % COLORS.length]}
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                    >
                      {entryTypeData[index].name} ({value})
                    </text>
                  )
                }}
              >                {entryTypeData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Usage Trends */}
        <div className="bg-white p-4 rounded shadow md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Usage Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                name="Usage Count"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Effectiveness Table */}
        <div className="bg-white p-4 rounded shadow md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Most Effective Entries</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effectiveness
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uses
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {effectiveness
                  .sort((a, b) => b.effectiveness_score - a.effectiveness_score)
                  .slice(0, 5)
                  .map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.entry_type}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {entry.text_content.length > 100
                          ? `${entry.text_content.slice(0, 100)}...`
                          : entry.text_content}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {(entry.effectiveness_score * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.usage_count}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
