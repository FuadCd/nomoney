'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/api/api'
import { usePatientStore } from '../../../lib/store/patientStore'

export default function PatientCheckInPage() {
  const router = useRouter()
  const patients = usePatientStore((state) => state.patients)
  const updatePatient = usePatientStore((state) => state.updatePatient)
  const [patient, setPatient] = useState(patients[patients.length - 1] || null)
  
  useEffect(() => {
    if (patients.length > 0) {
      setPatient(patients[patients.length - 1])
    }
  }, [patients])
  
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
    if (!patient) return
    
    setLoading(true)
    try {
      // Submit check-in to backend
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
      
      router.push('/patient/waiting')
    } catch (error) {
      console.error('Error submitting check-in:', error)
      alert('Failed to submit check-in. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-4">No patient found</p>
          <button
            onClick={() => router.push('/patient/intake')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
          >
            Start Intake
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">20-Minute Check-In</h1>
            <p className="text-blue-100">Patient: {patient.passportId}</p>
          </div>
          
          <div className="p-8 space-y-6">
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
            
            <div className="flex space-x-4 pt-4">
              <button
                onClick={() => router.push('/patient/waiting')}
                className="flex-1 bg-gray-100 text-gray-800 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Check-In ✓'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
