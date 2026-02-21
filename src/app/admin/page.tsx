'use client'

import StaffGuard from '../../components/StaffGuard'
import { usePatientStore } from '../../lib/store/patientStore'
import { computeAdminSummary } from '../../lib/utils/adminSummary'
import { MEDIAN_TOTAL_STAY_MINUTES, MEDIAN_TO_PHYSICIAN_MINUTES, MCM_MASTER_MEDIAN_TIME_TO_PHYSICIAN_MINUTES } from '../../lib/model/modelConstants'

export default function AdminDashboardPage() {
  const patients = usePatientStore((state) => state.patients)
  const summary = computeAdminSummary(patients)
  
  const flagLabels: Record<string, { label: string; icon: string }> = {
    mobility: { label: 'Mobility Impairment', icon: '🦽' },
    chronicPain: { label: 'Chronic Pain', icon: '💊' },
    sensory: { label: 'Sensory Sensitivity', icon: '🔊' },
    cognitive: { label: 'Cognitive Overload', icon: '🧠' },
    language: { label: 'Language Barrier', icon: '🌐' },
    alone: { label: 'No Support Person', icon: '👤' },
  }
  
  const getBurdenStatus = (burden: number) => {
    if (burden >= 70) return { label: 'High strain', color: 'text-red-600', bg: 'from-red-100 to-red-200' }
    if (burden >= 30) return { label: 'Normal range', color: 'text-blue-600', bg: 'from-blue-100 to-blue-200' }
    return { label: 'Low burden', color: 'text-green-600', bg: 'from-green-100 to-green-200' }
  }
  
  const burdenStatus = getBurdenStatus(summary.averageBurden)
  
  return (
    <StaffGuard>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-black text-gray-900 mb-1">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Model Health & Equity Overview (Read-Only)
          </p>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Model Health Section */}
        <section className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Model Health
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Alert Distribution */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                Alert Distribution
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-gray-700">GREEN</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-green-600">
                      {summary.alertDistribution.green}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({summary.alertDistribution.total > 0
                        ? Math.round(
                            (summary.alertDistribution.green /
                              summary.alertDistribution.total) *
                              100
                          )
                        : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium text-gray-700">AMBER</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-amber-600">
                      {summary.alertDistribution.amber}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({summary.alertDistribution.total > 0
                        ? Math.round(
                            (summary.alertDistribution.amber /
                              summary.alertDistribution.total) *
                              100
                          )
                        : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-gray-700">RED</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-red-600">
                      {summary.alertDistribution.red}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({summary.alertDistribution.total > 0
                        ? Math.round(
                            (summary.alertDistribution.red /
                              summary.alertDistribution.total) *
                              100
                          )
                        : 0}%)
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t-2 border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-xl font-black text-gray-900">
                      {summary.alertDistribution.total}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Average Burden */}
            <div className={`bg-gradient-to-br ${burdenStatus.bg} rounded-xl p-6 border-2 border-gray-300`}>
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                Average Burden
              </h3>
              <div className="text-5xl font-black mb-2" style={{ color: burdenStatus.color.replace('text-', '') }}>
                {summary.averageBurden}
              </div>
              <div className={`text-sm font-semibold ${burdenStatus.color}`}>
                {burdenStatus.label}
              </div>
              <div className="text-xs text-gray-600 mt-2">
                {summary.averageBurden >= 70
                  ? '70+ indicates high strain'
                  : summary.averageBurden >= 30
                  ? '30-55 is normal range'
                  : '<30 indicates low burden'}
              </div>
            </div>
            
            {/* Missed Check-In Rate */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                Missed Check-In Rate
              </h3>
              <div className="text-5xl font-black text-orange-600 mb-2">
                {Math.round(summary.missedCheckInRate * 100)}%
              </div>
              <div className="text-sm text-gray-600">
                Patients with check-in &gt; 20 min ago
              </div>
            </div>
          </div>
        </section>
        
        {/* Equity Overview Section */}
        <section className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <span className="mr-3">⚖️</span>
            Equity Overview
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Average burden and % RED by accessibility flag
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(summary.equityByFlag).map(([flag, data]) => {
              const flagInfo = flagLabels[flag]
              return (
                <div
                  key={flag}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-2xl">{flagInfo?.icon || '📋'}</span>
                    <h3 className="text-sm font-bold text-gray-900">
                      {flagInfo?.label || flag}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-medium">Avg Burden</span>
                      <span className="text-xl font-black text-indigo-700">
                        {data.avgBurden}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-medium">% RED</span>
                      <span className="text-xl font-black text-red-600">
                        {data.redPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
        
        {/* Footer - Model Anchors */}
        <footer className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📚</span>
            Model Anchors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
              <div className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">📊</span>
                CIHI Medians
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Total stay: <strong>{MEDIAN_TOTAL_STAY_MINUTES} min</strong></li>
                <li>• Time to physician: <strong>{MEDIAN_TO_PHYSICIAN_MINUTES} min</strong></li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
              <div className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🔬</span>
                McMaster Early Risk
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Median time-to-physician: <strong>{MCM_MASTER_MEDIAN_TIME_TO_PHYSICIAN_MINUTES} min</strong></li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
              <div className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🏥</span>
                LWBS Source
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Health Quality Council of Alberta (HQCA)</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
              <div className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">📈</span>
                Weights Source
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Statistics Canada – Disability in Canada (2024)</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t-2 border-gray-200">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <p className="text-xs text-yellow-900 font-semibold flex items-center">
                <span className="mr-2">🔒</span>
                <strong>Safety:</strong> Admin cannot change thresholds, weights, patients, LWBS scaling, or triage.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
    </StaffGuard>
  )
}
