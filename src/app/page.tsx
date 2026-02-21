'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '../lib/auth/auth'

export default function HomePage() {
  const router = useRouter()
  const [hospitalCode, setHospitalCode] = useState('')
  const [error, setError] = useState('')
  
  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!authService.validateHospitalCode(hospitalCode)) {
      setError('Invalid hospital code. Please enter 001-005.')
      return
    }
    
    if (authService.setStaffSession(hospitalCode)) {
      router.push('/staff')
    } else {
      setError('Failed to authenticate. Please try again.')
    }
  }
  
  const handlePatientClick = () => {
    authService.setPatientSession()
    router.push('/patient')
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 px-4">
      <div className="text-center max-w-2xl w-full">
        <div className="mb-12">
          <h1 className="text-6xl font-black text-white mb-4 tracking-tight">
            AccessER
          </h1>
          <p className="text-xl text-blue-100 font-light mb-2">
            Accessibility-Adjusted Emergency Room Burden Platform
          </p>
          <p className="text-sm text-blue-200 max-w-lg mx-auto">
            Real-time accessibility equity layer for emergency departments
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Staff Login */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Staff Access</h2>
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={hospitalCode}
                  onChange={(e) => setHospitalCode(e.target.value.toUpperCase())}
                  placeholder="Enter hospital code (001-005)"
                  maxLength={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                />
                {error && (
                  <p className="text-red-300 text-sm mt-2">{error}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-white text-blue-600 py-3 px-6 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg"
              >
                Staff Login →
              </button>
            </form>
            <div className="mt-4 text-xs text-blue-200">
              <p>Hospital Codes:</p>
              <p className="mt-1">001 - U of A • 002 - Royal Alex • 003 - Grey Nuns • 004 - Misericordia • 005 - Sturgeon</p>
            </div>
          </div>
          
          <div className="border-t border-white/20 pt-6">
            <h2 className="text-2xl font-bold text-white mb-4">Patient Access</h2>
            <button
              onClick={handlePatientClick}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 text-lg"
            >
              I'm a Patient →
            </button>
          </div>
        </div>
        
        <div className="mt-12 text-xs text-blue-200/80">
          <p>AccessER does not diagnose, prioritize treatment, or provide medical advice.</p>
          <p className="mt-1">It operates as an accessibility and system-equity support layer.</p>
        </div>
      </div>
    </div>
  )
}
