'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '../lib/auth/auth'

export default function StaffGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  
  useEffect(() => {
    if (!authService.isStaffAuthenticated()) {
      router.push('/')
    }
  }, [router])
  
  if (!authService.isStaffAuthenticated()) {
    return null
  }
  
  return <>{children}</>
}
