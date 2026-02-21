'use client'

import { useRouter } from 'next/navigation'
import { usePatientStore } from '../../../lib/store/patientStore'
import { useEffect, useState } from 'react'

export default function PatientWaitingPage() {
  const router = useRouter()
  const patients = usePatientStore((state) => state.patients)
  const [patient, setPatient] = useState(patients[patients.length - 1] || null)
  
  useEffect(() => {
    if (patients.length > 0) {
      setPatient(patients[patients.length - 1])
    }
  }, [patients])
  
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
            <h1 className="text-3xl font-bold text-white mb-2">Waiting Room</h1>
            <p className="text-blue-100">Your Accessibility Passport</p>
          </div>
          
          <div className="p-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 mb-6">
              <div className="text-center mb-4">
                <div className="text-4xl font-mono font-black text-blue-600 mb-2">
                  {patient.passportId}
                </div>
                <p className="text-sm text-gray-600">Your Patient ID</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Hospital:</span>
                  <p className="font-semibold text-gray-900">{patient.assignedHospitalName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Estimated Wait:</span>
                  <p className="font-semibold text-gray-900">{patient.minutesWaited} minutes</p>
                </div>
                <div>
                  <span className="text-gray-600">Current Burden:</span>
                  <p className={`font-bold text-lg ${
                    patient.burden >= 70 ? 'text-red-600'
                    : patient.burden >= 50 ? 'text-amber-600'
                    : 'text-green-600'
                  }`}>
                    {Math.round(patient.burden)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className={`font-semibold ${
                    patient.alertStatus === 'RED' ? 'text-red-600'
                    : patient.alertStatus === 'AMBER' ? 'text-amber-600'
                    : 'text-green-600'
                  }`}>
                    {patient.alertStatus}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => router.push('/patient/checkin')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30"
              >
                Check-In (20-minute interval) →
              </button>
              
              <button
                onClick={() => router.push('/patient/intake')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
