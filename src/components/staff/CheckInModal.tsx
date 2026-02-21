'use client'

import { useState } from 'react'
import type { PatientProfile } from '../../types'
import { api } from '../../lib/api/api'
import { usePatientStore } from '../../lib/store/patientStore'

interface CheckInModalProps {
  patient: PatientProfile
  onClose: () => void
}

export default function CheckInModal({ patient, onClose }: CheckInModalProps) {
  const updatePatient = usePatientStore((state) => state.updatePatient)
  const [discomfortLevel, setDiscomfortLevel] = useState(3)
  const [intendsToStay, setIntendsToStay] = useState(true)
  const [assistanceRequested, setAssistanceRequested] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  const assistanceOptions = [
    { value: 'interpreter', label: 'Interpreter', icon: '🌐' },
    { value: 'mobility', label: 'Mobility Assistance', icon: '🦽' },
    { value: 'quiet-space', label: 'Quiet Space', icon: '🔇' },
    { value: 'info', label: 'Wait Time Info', icon: 'ℹ️' },
  ]
  
  const handleAssistanceToggle = (value: string) => {
    setAssistanceRequested((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    )
  }
  
  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Submit check-in
      await api.submitCheckIn({
        passportId: patient.passportId,
        discomfortLevel,
        assistanceRequested: assistanceRequested.length > 0 ? assistanceRequested : undefined,
        intendsToStay,
        timestamp: new Date().toISOString(),
      })
      
      // Recompute burden with new check-in
      const burdenResponse = await api.computeBurden({
        facilityId: patient.assignedHospitalKey,
        profile: patient.accessibilityProfile,
        estimatedCtasLevel: patient.ctasLevel,
        waitTimeMinutes: patient.minutesWaited,
        checkInResponses: [
          ...patient.checkIns,
          {
            discomfortLevel,
            assistanceRequested: assistanceRequested.length > 0 ? assistanceRequested : undefined,
            intendsToStay,
            timestamp: new Date().toISOString(),
          },
        ],
      })
      
      // Update patient
      updatePatient(patient.id, {
        checkIns: [
          ...patient.checkIns,
          {
            discomfortLevel,
            assistanceRequested,
            intendsToStay,
            timestamp: new Date().toISOString(),
          },
        ],
        burden: burdenResponse.burden,
        alertStatus: burdenResponse.alertStatus,
        suggestAmberCheckIn: burdenResponse.suggestAmberCheckIn,
        disengagementWindowMinutes: burdenResponse.disengagementWindowMinutes,
        burdenCurve: burdenResponse.burdenCurve,
        baselineCurve: burdenResponse.baselineCurve,
        equityGapScore: burdenResponse.equityGapScore,
      })
      
      onClose()
    } catch (error) {
      console.error('Error submitting check-in:', error)
      alert('Failed to submit check-in. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white mb-1">
            20-Minute Check-In
          </h2>
          <p className="text-blue-100 text-sm">
            Patient: <span className="font-mono font-semibold">{patient.passportId}</span>
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Discomfort Level */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Discomfort Level (1-5)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDiscomfortLevel(level)}
                  className={`py-4 px-3 rounded-xl font-bold text-lg transition-all ${
                    discomfortLevel === level
                      ? level <= 2
                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/30 scale-105'
                        : level === 3
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                        : 'bg-red-600 text-white shadow-lg shadow-red-500/30 scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {discomfortLevel <= 2 ? 'Low' : discomfortLevel === 3 ? 'Moderate' : 'High'} discomfort
            </p>
          </div>
          
          {/* Intends to Stay */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Planning to Stay?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIntendsToStay(true)}
                className={`py-4 px-4 rounded-xl font-semibold transition-all ${
                  intendsToStay
                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ✓ Yes, staying
              </button>
              <button
                type="button"
                onClick={() => setIntendsToStay(false)}
                className={`py-4 px-4 rounded-xl font-semibold transition-all ${
                  !intendsToStay
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ⚠ Thinking of leaving
              </button>
            </div>
          </div>
          
          {/* Assistance Requested */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Assistance Requested (optional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {assistanceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleAssistanceToggle(option.value)}
                  className={`py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 ${
                    assistanceRequested.includes(option.value)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Check-In ✓'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
