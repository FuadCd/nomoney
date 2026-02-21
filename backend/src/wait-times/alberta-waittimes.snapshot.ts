// backend/src/wait-times/alberta-waittimes.snapshot.ts
// LWBS rates from HQCA (April–June 2025): focus.hqa.ca/charts/patients-who-left-without-being-seen-lwbs-by-an-emergency-department-doctor/

export const ALBERTA_WAITTIMES_SNAPSHOT = {
  source: {
    waitTimes: "Alberta Health Services",
    lwbs: "Health Quality Council of Alberta (HQCA)",
  },
  sourceUrl: "https://www.albertahealthservices.ca/waittimes/waittimes.aspx",
  lwbsUrl: "https://focus.hqa.ca/charts/patients-who-left-without-being-seen-lwbs-by-an-emergency-department-doctor/",
  snapshotTakenAt: "2026-02-20T22:30:00-07:00",
  hospitals: {
    uofa: {
      key: "uofa",
      name: "University of Alberta Hospital",
      city: "Edmonton",
      waitMinutes: 316,
      lwbsRate: 0.151, // 15.1% HQCA Apr–Jun 2025
    },
    royalAlexandra: {
      key: "royalAlexandra",
      name: "Royal Alexandra Hospital",
      city: "Edmonton",
      waitMinutes: 291,
      lwbsRate: 0.199, // 19.9% HQCA Apr–Jun 2025
    },
    greyNuns: {
      key: "greyNuns",
      name: "Grey Nuns Community Hospital",
      city: "Edmonton",
      waitMinutes: 159,
      lwbsRate: 0.134, // 13.4% HQCA Apr–Jun 2025
    },
    misericordia: {
      key: "misericordia",
      name: "Misericordia Community Hospital",
      city: "Edmonton",
      waitMinutes: 367,
      lwbsRate: 0.172, // 17.2% HQCA Apr–Jun 2025
    },
    sturgeon: {
      key: "sturgeon",
      name: "Sturgeon Community Hospital",
      city: "St. Albert",
      waitMinutes: 341,
      lwbsRate: 0.093, // 9.3% HQCA Apr–Jun 2025
    },
  },
} as const;

export type AlbertaHospitalKey =
  keyof typeof ALBERTA_WAITTIMES_SNAPSHOT.hospitals;
