'use client'

import { useState, useEffect } from 'react'
import StaffGuard from '../../components/StaffGuard'
import { usePatientStore } from '../../lib/store/patientStore'
import { api } from '../../lib/api/api'
import PatientCard from '../../components/staff/PatientCard'
import BurdenChart from '../../components/staff/BurdenChart'
import CheckInModal from '../../components/staff/CheckInModal'
import type { PatientProfile } from '../../types'

export default function StaffDashboardPage() {
  const { patients, updatePatient } = usePatientStore()
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [waitTimes, setWaitTimes] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [snapshotTime, setSnapshotTime] = useState<string>('')
  
  // Fetch wait times
  useEffect(() => {
    const fetchWaitTimes = async () => {
      try {
        const data = await api.getWaitTimes()
        const times: Record<string, number> = {}
        Object.entries(data.hospitals).forEach(([key, hospital]: [string, any]) => {
          times[key] = hospital.waitMinutes
        })
        setWaitTimes(times)
        setSnapshotTime(data.snapshotTakenAt || '')
      } catch (error) {
        console.error('Error fetching wait times:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchWaitTimes()
    const interval = setInterval(fetchWaitTimes, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])
  
  // Update patient wait times and recompute burden
  useEffect(() => {
    const interval = setInterval(async () => {
      for (const patient of patients) {
        const minutesWaited = Math.floor(
          (Date.now() - new Date(patient.arrivedAt).getTime()) / 60000
        )
        
        if (minutesWaited !== patient.minutesWaited) {
          try {
            const burdenResponse = await api.computeBurden({
              facilityId: patient.assignedHospitalKey,
              profile: patient.accessibilityProfile,
              estimatedCtasLevel: patient.ctasLevel,
              waitTimeMinutes: minutesWaited,
              checkInResponses: patient.checkIns.map(ci => ({
                discomfortLevel: ci.discomfortLevel,
                assistanceRequested: ci.assistanceRequested,
                intendsToStay: ci.intendsToStay,
                timestamp: ci.timestamp,
              })),
            })
            
            updatePatient(patient.id, {
              minutesWaited,
              burden: burdenResponse.burden,
              alertStatus: burdenResponse.alertStatus,
              suggestAmberCheckIn: burdenResponse.suggestAmberCheckIn,
              disengagementWindowMinutes: burdenResponse.disengagementWindowMinutes,
              equityGapScore: burdenResponse.equityGapScore,
              burdenCurve: burdenResponse.burdenCurve,
              baselineCurve: burdenResponse.baselineCurve,
            })
          } catch (error) {
            console.error(`Error updating patient ${patient.id}:`, error)
          }
        }
      }
    }, 60000)
    
    return () => clearInterval(interval)
  }, [patients, updatePatient])
  
  // Sort patients by priority (RED > AMBER > GREEN, then by burden)
  const sortedPatients = [...patients].sort((a, b) => {
    const statusOrder = { RED: 0, AMBER: 1, GREEN: 2 }
    if (statusOrder[a.alertStatus] !== statusOrder[b.alertStatus]) {
      return statusOrder[a.alertStatus] - statusOrder[b.alertStatus]
    }
    return b.burden - a.burden
  })
  
  const redCount = patients.filter((p) => p.alertStatus === 'RED').length
  const amberCount = patients.filter((p) => p.alertStatus === 'AMBER').length
  const greenCount = patients.filter((p) => p.alertStatus === 'GREEN').length
  
  return (
    <StaffGuard>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-1">
                Staff Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Queue Equity View — Real-Time Burden Monitoring
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl px-5 py-3 text-center min-w-[80px]">
                <div className="text-2xl font-black text-gray-900">{patients.length}</div>
                <div className="text-xs text-gray-600 font-medium">Total</div>
              </div>
              {redCount > 0 && (
                <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-xl px-5 py-3 text-center min-w-[80px] border-2 border-red-300">
                  <div className="text-2xl font-black text-red-700">{redCount}</div>
                  <div className="text-xs text-red-600 font-bold">RED</div>
                </div>
              )}
              {amberCount > 0 && (
                <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl px-5 py-3 text-center min-w-[80px] border-2 border-amber-300">
                  <div className="text-2xl font-black text-amber-700">{amberCount}</div>
                  <div className="text-xs text-amber-600 font-bold">AMBER</div>
                </div>
              )}
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl px-5 py-3 text-center min-w-[80px] border-2 border-green-300">
                <div className="text-2xl font-black text-green-700">{greenCount}</div>
                <div className="text-xs text-green-600 font-bold">GREEN</div>
              </div>
            </div>
          </div>
          
          {/* Snapshot Info */}
          {snapshotTime && (
            <div className="mt-4 flex items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Wait times updated: {new Date(snapshotTime).toLocaleString()}</span>
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {patients.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏥</div>
            <p className="text-2xl font-semibold text-gray-700 mb-2">No patients in queue</p>
            <p className="text-gray-500">
              Patients will appear here after completing intake
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Cards */}
            <div className="lg:col-span-2 space-y-4">
              {sortedPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onClick={() => setSelectedPatient(patient)}
                />
              ))}
            </div>
            
            {/* Sidebar - Selected Patient Details */}
            {selectedPatient && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 sticky top-[200px]">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Patient Details
                    </h2>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="text-sm text-gray-600 mb-1">Passport ID</div>
                      <div className="font-mono font-bold text-lg">{selectedPatient.passportId}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Chief Complaint</div>
                      <div className="font-semibold text-gray-900">{selectedPatient.chiefComplaint}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Wait Time</div>
                        <div className="text-xl font-bold text-gray-900">{selectedPatient.minutesWaited}m</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">CTAS</div>
                        <div className="text-xl font-bold text-gray-900">{selectedPatient.ctasLevel}</div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                      <div className="text-sm text-gray-600 mb-2">Current Burden</div>
                      <div className={`text-4xl font-black ${
                        selectedPatient.burden >= 70 ? 'text-red-600'
                        : selectedPatient.burden >= 50 ? 'text-amber-600'
                        : 'text-green-600'
                      }`}>
                        {Math.round(selectedPatient.burden)}
                      </div>
                    </div>
                    
                    {selectedPatient.burdenCurve && selectedPatient.baselineCurve && (
                      <BurdenChart
                        burdenCurve={selectedPatient.burdenCurve}
                        baselineCurve={selectedPatient.baselineCurve}
                        currentMinute={selectedPatient.minutesWaited}
                        burden={selectedPatient.burden}
                      />
                    )}
                    
                    <button
                      onClick={() => {
                        setShowCheckInModal(true)
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30"
                    >
                      Record Check-In
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Check-In Modal */}
      {showCheckInModal && selectedPatient && (
        <CheckInModal
          patient={selectedPatient}
          onClose={() => {
            setShowCheckInModal(false)
            setSelectedPatient(null)
          }}
        />
      )}
    </div>
    </StaffGuard>
  )
}
