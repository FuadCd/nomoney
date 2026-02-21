// ─── Authentication Service ────────────────────────────────────────────────────

const STAFF_SESSION_KEY = 'accesser_staff_session'
const PATIENT_SESSION_KEY = 'accesser_patient_session'

export interface StaffSession {
  hospitalCode: string
  hospitalKey: string
  hospitalName: string
}

const HOSPITAL_CODES: Record<string, { key: string; name: string }> = {
  '001': { key: 'uofa', name: 'University of Alberta Hospital' },
  '002': { key: 'royalAlexandra', name: 'Royal Alexandra Hospital' },
  '003': { key: 'greyNuns', name: 'Grey Nuns Community Hospital' },
  '004': { key: 'misericordia', name: 'Misericordia Community Hospital' },
  '005': { key: 'sturgeon', name: 'Sturgeon Community Hospital' },
}

export const authService = {
  // Staff authentication
  setStaffSession: (hospitalCode: string): boolean => {
    const hospital = HOSPITAL_CODES[hospitalCode]
    if (!hospital) return false
    
    const session: StaffSession = {
      hospitalCode,
      hospitalKey: hospital.key,
      hospitalName: hospital.name,
    }
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session))
    }
    return true
  },
  
  getStaffSession: (): StaffSession | null => {
    if (typeof window === 'undefined') return null
    const stored = sessionStorage.getItem(STAFF_SESSION_KEY)
    if (!stored) return null
    try {
      return JSON.parse(stored) as StaffSession
    } catch {
      return null
    }
  },
  
  clearStaffSession: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STAFF_SESSION_KEY)
    }
  },
  
  isStaffAuthenticated: (): boolean => {
    return authService.getStaffSession() !== null
  },
  
  // Patient authentication
  setPatientSession: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(PATIENT_SESSION_KEY, 'true')
    }
  },
  
  isPatientAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(PATIENT_SESSION_KEY) === 'true'
  },
  
  clearPatientSession: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(PATIENT_SESSION_KEY)
    }
  },
  
  // Hospital codes
  getHospitalCodes: () => HOSPITAL_CODES,
  
  validateHospitalCode: (code: string): boolean => {
    return code in HOSPITAL_CODES
  },
}
