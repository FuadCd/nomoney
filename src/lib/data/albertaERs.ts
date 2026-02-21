// ─── Alberta ER Facilities Data ─────────────────────────────────────────────

import type { Hospital } from '../../types'

export const ALBERTA_HOSPITALS: Record<string, Hospital> = {
  uofa: {
    key: 'uofa',
    name: 'University of Alberta Hospital',
    city: 'Edmonton',
    waitMinutes: 316,
    lwbsRate: 0.151, // 15.1%
  },
  royalAlexandra: {
    key: 'royalAlexandra',
    name: 'Royal Alexandra Hospital',
    city: 'Edmonton',
    waitMinutes: 291,
    lwbsRate: 0.199, // 19.9%
  },
  greyNuns: {
    key: 'greyNuns',
    name: 'Grey Nuns Community Hospital',
    city: 'Edmonton',
    waitMinutes: 159,
    lwbsRate: 0.134, // 13.4%
  },
  misericordia: {
    key: 'misericordia',
    name: 'Misericordia Community Hospital',
    city: 'Edmonton',
    waitMinutes: 367,
    lwbsRate: 0.172, // 17.2%
  },
  sturgeon: {
    key: 'sturgeon',
    name: 'Sturgeon Community Hospital',
    city: 'St. Albert',
    waitMinutes: 341,
    lwbsRate: 0.093, // 9.3%
  },
}

export function getHospital(key: string): Hospital | undefined {
  return ALBERTA_HOSPITALS[key]
}

export function getAllHospitals(): Hospital[] {
  return Object.values(ALBERTA_HOSPITALS)
}
