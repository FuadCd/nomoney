'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '../../lib/auth/auth'
import { usePatientStore } from '../../lib/store/patientStore'

export default function PatientHomePage() {
  const router = useRouter()
  const patients = usePatientStore((state) => state.patients)
  
  useEffect(() => {
    // Check if patient is authenticated
    if (!authService.isPatientAuthenticated()) {
      router.push('/')
      return
    }
    
    // Redirect to intake if no patient exists, or waiting room if patient exists
    if (patients.length === 0) {
      router.push('/patient/intake')
    } else {
      router.push('/patient/waiting')
    }
  }, [router, patients])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
