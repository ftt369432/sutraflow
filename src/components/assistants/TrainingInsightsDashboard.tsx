import React, { useState, useEffect } from 'react'
import {
  trainingInsights,
  TrainingInsights,
  TrainingRecommendation,
  SemanticMatch
} from '../../services/trainingInsightsService'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

interface Props {
  assistantId: string
}

export const TrainingInsightsDashboard: React.FC<Props> = ({ assistantId }) => {
  const [insights, setInsights] = useState<TrainingInsights | null>(null)
  const [recommendations, setRecommendations] = useState<TrainingRecommendation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SemanticMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [assistantId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [insightsData, recommendationsData] = await Promise.all([
        trainingInsights.getAnalysis(assistantId),
        trainingInsights.getRecommendations(assistantId)
      ])

      setInsights(insightsData)
      setRecommendations(recommendationsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      const results = await trainingInsights.semanticSearch(
        assistantId,
        searchQuery,
        { threshold: 0.7, limit: 5 }
      )
      setSearchResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading insights...</div>
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded">
        Error loading insights: {error}
      </div>
    )
  }

  if (!insights) {
    return <div>No insights available</div>
  }

  // Prepare data for radar chart
  const qualityMetrics = insights.quality.map(q => ({
    category: q.category,
    score: q.score * 100
  }))

  return (
    <div className="space-y-8 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Training Insights</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search training entries..."
            className="px-4 py-2 border rounded"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Search
          </button>
        </div>
      </div>

      {/* Quality Score Radar */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Quality Metrics</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={qualityMetrics}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar
                name="Quality Score"
                dataKey="score"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Recommendations</h3>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-4 rounded ${
                rec.priority === 1
                  ? 'bg-red-50 border-red-200'
                  : rec.priority === 2
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-green-50 border-green-200'
              } border`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{rec.category}</h4>
                  <p className="text-gray-700">{rec.recommendation}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    rec.priority === 1
                      ? 'bg-red-100 text-red-800'
                      : rec.priority === 2
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  Priority {rec.priority}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {rec.action_items.map((item, i) => (
                  <li key={i} className="text-sm text-gray-600">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Semantic Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Search Results</h3>
          <div className="space-y-4">
            {searchResults.map((result) => (
              <div key={result.id} className="border-b pb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{result.entry_type}</span>
                  <span className="text-sm text-blue-500">
                    {(result.similarity * 100).toFixed(1)}% match
                  </span>
                </div>
                <p className="mt-2">{result.text_content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Training Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">
              {insights.insights.entries_last_7d}
            </div>
            <div className="text-gray-600">New Entries (7d)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">
              {insights.insights.used_last_7d}
            </div>
            <div className="text-gray-600">Entries Used (7d)</div>
          </div>
          <div className="text-center">
            <div
              className={`text-3xl font-bold ${
                insights.insights.status === 'active'
                  ? 'text-green-500'
                  : insights.insights.status === 'stale'
                  ? 'text-yellow-500'
                  : 'text-red-500'
              }`}
            >
              {insights.insights.status.charAt(0).toUpperCase() +
                insights.insights.status.slice(1)}
            </div>
            <div className="text-gray-600">Current Status</div>
          </div>
        </div>
      </div>
    </div>
  )
}
