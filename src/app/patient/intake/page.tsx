'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { api } from '../../../lib/api/api'
import { usePatientStore } from '../../../lib/store/patientStore'
import { ALBERTA_HOSPITALS } from '../../../lib/data/albertaERs'
import type { VulnerabilityProfile, AlbertaHospitalKey } from '../../../types'

export default function PatientIntakePage() {
  const router = useRouter()
  const addPatient = usePatientStore((state) => state.addPatient)
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Step 1: Context & Risk
  const [hospitalKey, setHospitalKey] = useState<AlbertaHospitalKey>('uofa')
  const [discomfortLevel, setDiscomfortLevel] = useState(3)
  const [intendsToStay, setIntendsToStay] = useState<boolean | null>(null)
  
  // Step 2: Accessibility Profile
  const [profile, setProfile] = useState<VulnerabilityProfile>({})
  
  const hospital = ALBERTA_HOSPITALS[hospitalKey]
  const estimatedCtasLevel = 6 - discomfortLevel // Maps 1-5 discomfort to CTAS 1-5
  
  const handleProfileChange = (key: keyof VulnerabilityProfile, value: boolean) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }
  
  const handleSubmit = async () => {
    if (intendsToStay === null) {
      alert('Please indicate if you are planning to stay.')
      return
    }
    
    setLoading(true)
    try {
      // Compute vulnerability multiplier
      const vulnResponse = await api.computeVulnerability({ profile })
      const vulnerabilityMultiplier = vulnResponse.vulnerabilityMultiplier
      
      // Compute initial burden
      const burdenResponse = await api.computeBurden({
        facilityId: hospitalKey,
        profile,
        estimatedCtasLevel,
        waitTimeMinutes: 0,
        checkInResponses: [],
      })
      
      // Create patient profile
      const patientId = uuidv4()
      const passportId = `A${Date.now().toString(36).toUpperCase().slice(-7)}`
      
      const patient = {
        id: patientId,
        passportId,
        assignedHospitalKey: hospitalKey,
        assignedHospitalName: hospital.name,
        ctasLevel: estimatedCtasLevel,
        chiefComplaint: '', // Not in step 1 per project description
        selfReportedUrgency: (discomfortLevel <= 2 ? 'low' : discomfortLevel === 3 ? 'medium' : 'high') as 'low' | 'medium' | 'high',
        accessibilityProfile: profile,
        vulnerabilityScore: (vulnerabilityMultiplier - 1) / 1.5,
        arrivedAt: new Date().toISOString(),
        minutesWaited: 0,
        checkIns: [],
        burden: burdenResponse.burden,
        alertStatus: burdenResponse.alertStatus,
        suggestion: null,
        equityGapScore: burdenResponse.equityGapScore,
        disengagementWindowMinutes: burdenResponse.disengagementWindowMinutes,
        suggestAmberCheckIn: burdenResponse.suggestAmberCheckIn,
        burdenCurve: burdenResponse.burdenCurve,
        baselineCurve: burdenResponse.baselineCurve,
      }
      
      addPatient(patient)
      router.push('/patient/waiting')
    } catch (error) {
      console.error('Error submitting intake:', error)
      alert('Failed to submit intake. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const activeFlagsCount = Object.values(profile).filter(Boolean).length
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Context & Risk</span>
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Accessibility</span>
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium">Confirm</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Patient Accessibility Intake
            </h1>
            <p className="text-blue-100">
              {step === 1 && 'Step 1: Context & Risk'}
              {step === 2 && 'Step 2: Accessibility Profile'}
              {step === 3 && 'Step 3: Confirm & Check In'}
            </p>
          </div>
          
          <div className="p-8">
            {/* Step 1: Context & Risk */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hospital
                  </label>
                  <select
                    value={hospitalKey}
                    onChange={(e) => setHospitalKey(e.target.value as AlbertaHospitalKey)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-300"
                  >
                    {Object.values(ALBERTA_HOSPITALS).map((h) => (
                      <option key={h.key} value={h.key}>
                        {h.name} ({h.city})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Expected wait: {hospital.waitMinutes} minutes
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
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
                    {discomfortLevel <= 2 && ' → CTAS 5'} 
                    {discomfortLevel === 3 && ' → CTAS 3'} 
                    {discomfortLevel >= 4 && ' → CTAS 1-2'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Are you thinking about leaving?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIntendsToStay(true)}
                      className={`py-4 px-4 rounded-xl font-semibold transition-all ${
                        intendsToStay === true
                          ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      ✓ Staying
                    </button>
                    <button
                      type="button"
                      onClick={() => setIntendsToStay(false)}
                      className={`py-4 px-4 rounded-xl font-semibold transition-all ${
                        intendsToStay === false
                          ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      ⚠ Thinking of leaving
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => setStep(2)}
                  disabled={intendsToStay === null}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Accessibility Profile →
                </button>
              </div>
            )}
            
            {/* Step 2: Accessibility Profile */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    Please indicate any accessibility needs that may affect your wait experience:
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'mobility' as const, label: 'Mobility Impairment', desc: 'Do you use a wheelchair or walking aid?', icon: '🦽' },
                    { key: 'chronicPain' as const, label: 'Chronic Pain', desc: 'Do you have ongoing pain that makes waiting difficult?', icon: '💊' },
                    { key: 'sensory' as const, label: 'Sensory Sensitivity', desc: 'Do loud environments cause distress? Do you need larger text?', icon: '🔊' },
                    { key: 'cognitive' as const, label: 'Cognitive Overload', desc: 'Do busy environments make it hard to process information?', icon: '🧠' },
                    { key: 'language' as const, label: 'Language Barrier', desc: 'Would you benefit from translation assistance?', icon: '🌐' },
                    { key: 'alone' as const, label: 'No Support Person', desc: 'Would you like a support person to stay with you?', icon: '👤' },
                  ].map(({ key, label, desc, icon }) => (
                    <label
                      key={key}
                      className={`flex items-start space-x-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                        profile[key]
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={profile[key] || false}
                        onChange={(e) => handleProfileChange(key, e.target.checked)}
                        className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-2xl">{icon}</span>
                          <span className="font-semibold text-gray-900">{label}</span>
                        </div>
                        <div className="text-sm text-gray-600">{desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
                
                {activeFlagsCount > 0 && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <p className="text-sm text-indigo-900">
                      <strong>{activeFlagsCount}</strong> accessibility {activeFlagsCount === 1 ? 'need' : 'needs'} selected
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30"
                  >
                    Review & Confirm →
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 3: Confirm */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Accessibility Passport</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hospital:</span>
                      <span className="font-semibold">{hospital.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discomfort Level:</span>
                      <span className="font-semibold">{discomfortLevel}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated CTAS:</span>
                      <span className="font-semibold">{estimatedCtasLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Planning to Stay:</span>
                      <span className="font-semibold">{intendsToStay ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="pt-3 border-t border-blue-200">
                      <span className="text-gray-600">Accessibility Needs:</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(profile).filter(([, v]) => v).map(([key]) => (
                          <span key={key} className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        ))}
                        {activeFlagsCount === 0 && (
                          <span className="text-gray-500 italic">None selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      'Confirm and Check In ✓'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
