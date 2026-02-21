// ─── API Client ────────────────────────────────────────────────────────────

// Next.js replaces NEXT_PUBLIC_* env vars at build time
// For TypeScript, we need to handle the client-side case
declare const process: {
  env: {
    NEXT_PUBLIC_API_URL?: string
  }
} | undefined

const API_BASE_URL = 
  (typeof process !== 'undefined' ? process?.env?.NEXT_PUBLIC_API_URL : undefined) ||
  'http://localhost:3001/api'

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  // Health check
  health: () => fetchAPI<{ status: string }>('/health'),

  // Wait times
  getWaitTimes: () => fetchAPI<any>('/wait-times'),
  getFacilities: () => fetchAPI<any[]>('/wait-times/facilities'),
  getCurrentWaitTimes: () => fetchAPI<any>('/wait-times/current'),
  getHospitalWaitTime: (hospitalKey: string) =>
    fetchAPI<any>(`/wait-times/${hospitalKey}`),

  // Accessibility profiles
  getProfileTemplates: () => fetchAPI<any[]>('/accessibility-profiles/templates'),
  computeVulnerability: (profile: any) =>
    fetchAPI<{ vulnerabilityMultiplier: number }>('/accessibility-profiles/compute', {
      method: 'POST',
      body: JSON.stringify({
        mobilitySupport: profile.mobility,
        noiseLightSensitivity: profile.sensory,
        languagePreference: profile.language ? 'other' : undefined,
        chronicConditionsAffectingWait: profile.chronicPain ? ['chronicPain'] : [],
        communicationOrCognitiveNeeds: profile.cognitive,
        caregiverPresent: !profile.alone,
      }),
    }),

  // Burden modeling
  computeBurden: (dto: any) =>
    fetchAPI<any>('/burden-modeling/compute', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  
  getEstimatedWait: (dto: {
    facilityId: string
    vulnerabilityMultiplier: number
    estimatedCtasLevel: number
    waitTimeMinutes: number
  }) =>
    fetchAPI<{ estimatedWaitMinutes: number }>('/burden-modeling/estimated-wait', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  // Check-in
  submitCheckIn: (dto: {
    passportId: string
    discomfortLevel: number
    assistanceRequested?: string[]
    intendsToStay: boolean
    timestamp?: string
  }) =>
    fetchAPI<any>('/check-in', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
}
