'use client'

import type { PatientProfile } from '../../types'
import { shouldShowDisengagementWarning, getSuggestedAction, hasMissedCheckIn } from '../../lib/utils/burden'
import { CHECK_IN_INTERVAL_MS } from '../../lib/model/modelConstants'

interface PatientCardProps {
  patient: PatientProfile
  onClick: () => void
}

const statusConfig = {
  GREEN: {
    border: 'border-green-400',
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    badge: 'bg-green-600 text-white',
    dot: 'bg-green-500',
  },
  AMBER: {
    border: 'border-amber-400',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    badge: 'bg-amber-600 text-white',
    dot: 'bg-amber-500',
  },
  RED: {
    border: 'border-red-500',
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    badge: 'bg-red-600 text-white',
    dot: 'bg-red-500',
  },
}

const flagIcons: Record<string, string> = {
  chronicPain: '💊',
  mobility: '🦽',
  cognitive: '🧠',
  sensory: '🔊',
  language: '🌐',
  alone: '👤',
}

export default function PatientCard({ patient, onClick }: PatientCardProps) {
  const lastCheckIn = patient.checkIns[patient.checkIns.length - 1]
  const missedCheckIn = lastCheckIn
    ? hasMissedCheckIn(lastCheckIn.timestamp, CHECK_IN_INTERVAL_MS)
    : patient.checkIns.length === 0
  const showDisengagement = shouldShowDisengagementWarning(patient)
  const suggestedAction = getSuggestedAction(patient)
  const config = statusConfig[patient.alertStatus]
  
  const activeFlags = Object.entries(patient.accessibilityProfile)
    .filter(([, v]) => v)
    .map(([k]) => k)
  
  return (
    <div
      className={`group relative border-l-4 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${config.bg} ${config.border}`}
      onClick={onClick}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        {missedCheckIn && (
          <span className="text-xs bg-orange-500 text-white px-3 py-1 rounded-full font-semibold shadow-md animate-pulse">
            ⚠ Missed Check-in
          </span>
        )}
        <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-md ${config.badge}`}>
          {patient.alertStatus}
        </span>
      </div>
      
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className={`w-3 h-3 rounded-full ${config.dot} ${showDisengagement ? 'animate-pulse' : ''}`} />
          <span className="font-mono text-lg font-bold text-gray-800">
            {patient.passportId}
          </span>
          <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded font-bold">
            CTAS {patient.ctasLevel}
          </span>
        </div>
        <p className="text-sm text-gray-600 font-medium">{patient.assignedHospitalName}</p>
      </div>
      
      {/* Chief Complaint */}
      <div className="mb-4">
        <p className="text-base font-semibold text-gray-900">{patient.chiefComplaint}</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/60 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-xs text-gray-500 mb-1">Wait Time</div>
          <div className="text-xl font-bold text-gray-900">{patient.minutesWaited}m</div>
        </div>
        <div className="bg-white/60 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-xs text-gray-500 mb-1">Burden</div>
          <div className={`text-xl font-bold ${
            patient.burden >= 70 ? 'text-red-600'
            : patient.burden >= 50 ? 'text-amber-600'
            : 'text-green-600'
          }`}>
            {Math.round(patient.burden)}
          </div>
        </div>
        <div className="bg-white/60 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-xs text-gray-500 mb-1">Equity Gap</div>
          <div className="text-lg font-semibold text-gray-900">{Math.round(patient.equityGapScore)}</div>
        </div>
        <div className="bg-white/60 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-xs text-gray-500 mb-1">Vulnerability</div>
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(patient.vulnerabilityScore * 100)}%
          </div>
        </div>
      </div>
      
      {/* Accessibility Flags */}
      {activeFlags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFlags.map((flag) => (
            <span
              key={flag}
              className="text-lg bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg"
              title={flag.replace(/([A-Z])/g, ' $1').trim()}
            >
              {flagIcons[flag] || '?'}
            </span>
          ))}
        </div>
      )}
      
      {/* Disengagement Warning */}
      {showDisengagement && (
        <div className="mb-4 p-3 bg-red-100 border-2 border-red-300 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-red-600 font-bold">⚠️</span>
            <span className="text-sm font-bold text-red-800">Disengagement Risk</span>
          </div>
          {patient.disengagementWindowMinutes && (
            <div className="text-xs text-red-700">
              Window: {patient.disengagementWindowMinutes} min
            </div>
          )}
        </div>
      )}
      
      {/* Suggested Action */}
      {suggestedAction && (
        <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-lg">💡</span>
            <p className="text-sm text-gray-700 font-medium">{suggestedAction}</p>
          </div>
        </div>
      )}
    </div>
  )
}
