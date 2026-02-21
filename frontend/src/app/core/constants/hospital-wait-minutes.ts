/**
 * Hospital average wait times (minutes). Mirrors backend alberta-waittimes.snapshot.ts
 * so the waiting page can display "Xh Ym" even when the API is unreachable.
 */
export const HOSPITAL_WAIT_MINUTES: Record<string, number> = {
  uofa: 316,
  royalAlexandra: 291,
  greyNuns: 159,
  misericordia: 367,
  sturgeon: 341,
};
