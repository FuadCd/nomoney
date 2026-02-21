// ─── Patient Store (Zustand) ───────────────────────────────────────────────

import { create } from 'zustand'
import type { PatientProfile } from '../../types'

interface PatientStore {
  patients: PatientProfile[]
  addPatient: (patient: PatientProfile) => void
  updatePatient: (id: string, updates: Partial<PatientProfile>) => void
  removePatient: (id: string) => void
  getPatient: (id: string) => PatientProfile | undefined
}

export const usePatientStore = create<PatientStore>((set, get) => ({
  patients: [],

  addPatient: (patient) =>
    set((state) => ({
      patients: [...state.patients, patient],
    })),

  updatePatient: (id, updates) =>
    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  removePatient: (id) =>
    set((state) => ({
      patients: state.patients.filter((p) => p.id !== id),
    })),

  getPatient: (id) => get().patients.find((p) => p.id === id),
}))
