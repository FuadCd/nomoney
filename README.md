# AccessER

**Accessibility-Adjusted Emergency Room Burden Platform**

AccessER is a real-time accessibility equity layer for emergency departments. It models how ER wait times disproportionately burden patients with functional accessibility needs and provides frontline staff and administrators with actionable insights to reduce inequity — without replacing triage or making clinical decisions.

---

## Architecture

```
nomoney/
├── backend/          # NestJS API (Node.js + TypeScript)
├── frontend/         # Angular SPA
├── docker-compose.yml
├── package.json      # Monorepo scripts
└── README.md
```

### Backend (NestJS)

- **Base URL**: `http://localhost:3000/api`
- **Endpoints**:
  - `GET /health` — Health check
  - `GET /wait-times` — Full snapshot (hospitals, wait minutes, LWBS rates)
  - `GET /wait-times/facilities` — ER facilities list
  - `GET /wait-times/current` — Current wait times
  - `GET /wait-times/:hospitalKey` — Single hospital (e.g. `uofa`, `royalAlexandra`, `greyNuns`, `misericordia`, `sturgeon`)
  - `GET /accessibility-profiles/templates` — Profile templates
  - `POST /accessibility-profiles/compute` — Compute vulnerability multiplier
  - `POST /burden-modeling/compute` — Compute burden curves, burden score, alert status
  - `POST /check-in` — Submit 20-min check-in

### Frontend (Angular)

- **Routes**:
  - `/patient` — Patient Accessibility Intake
  - `/staff` — Staff Real-Time Burden Dashboard
  - `/admin` — Admin Dashboard (Model Health & Equity Overview, read-only)

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Install & Run

```bash
# Install all dependencies
npm run install:all

# From root directory run:
npm run dev
```

- **API**: http://localhost:3000/api
- **Frontend**: http://localhost:4200

### Docker

```bash
docker-compose up --build
```

- **API**: http://localhost:3000
- **Frontend**: http://localhost:4200 (proxied to backend)

---

## Development

| Command | Description |
|---------|-------------|
| `npm run backend` | Start backend in dev mode |
| `npm run frontend` | Start Angular dev server |
| `npm run backend:build` | Build backend for production |
| `npm run frontend:build` | Build Angular for production |

### Environment

- **Backend**: Uses `PORT` (default 3000), `FRONTEND_URL` (default http://localhost:4200) for CORS
- **Frontend**: `src/environments/environment.ts` — `apiUrl` for development; replaced in production

---

## Data Sources & Backend Logic

### Alberta Wait Times Snapshot

`backend/src/wait-times/alberta-waittimes.snapshot.ts` contains snapshot data for five Alberta hospitals:

| Hospital | City | Wait Minutes | LWBS Rate |
|----------|------|--------------|-----------|
| University of Alberta Hospital | Edmonton | 316 | 15.1% |
| Royal Alexandra Hospital | Edmonton | 291 | 19.9% |
| Grey Nuns Community Hospital | Edmonton | 159 | 13.4% |
| Misericordia Community Hospital | Edmonton | 367 | 17.2% |
| Sturgeon Community Hospital | St. Albert | 341 | 9.3% |

- **Wait times**: Alberta Health Services (AHS)
- **LWBS rates**: Health Quality Council of Alberta (HQCA), Apr–Jun 2025

Update `snapshotTakenAt` and `waitMinutes` / `lwbsRate` before demos as data changes.

### Vulnerability Weights (StatsCan)

`backend/src/burden-modeling/vulnerabilityWeights.ts` — Source: [Statistics Canada – Disability in Canada (2024)](https://www150.statcan.gc.ca/n1/pub/89-654-x/89-654-x2024001-eng.htm). Weights reflect relative burden impact (not raw prevalence): chronicPain 0.25, mobility 0.20, cognitive 0.15, sensory 0.15, language 0.10, alone 0.10. Pass `profile: { chronicPain?: boolean; ... }` in burden compute; when provided, `vulnerabilityMultiplier` is derived from profile (0 → ~0.95). Otherwise use `vulnerabilityMultiplier` directly.

### Model Constants

`backend/src/burden-modeling/modelConstants.ts`:

- **MEDIAN_TOTAL_STAY_MINUTES** = 238 (CIHI NACRS Alberta 2024–25)
- **MEDIAN_TO_PHYSICIAN_MINUTES** = 90
- **MCM_MASTER_MEDIAN_TIME_TO_PHYSICIAN_MINUTES** = 87 — McMaster median time-to-physician; reference for gradual escalation. Source: published ED LWBS study.
- **MEDIAN_LWBS_TRIGGER_MINUTES** = 87 — Gate for disengagement warning (show only when waited this long or planning to leave or burden ≥ 70).

### Burden Calculation

1. **Base waiting impact (CIHI)** — Time-based burden from `computeBaseWaitingImpact(minutesWaited)`:
   - Normalized against median total stay (238 min → ~60 burden)
   - +8 acceleration after 90 min (median time to physician)
   - Capped at 75

2. **Post-87 min gradual escalation (McMaster)** — `applyPostMedianPhysicianDelayAdjustment(burden, minutesWaited)`:
   - +0 to +10 bump when `minutesWaited` exceeds 87 min
   - Capped at 10; then final burden clamped 0–100

3. **LWBS integration (HQCA)** — Environment-level disengagement:
   - `computeLeaveSignalWeight(hospitalKey)` normalizes LWBS around 5% baseline
   - If `intendsToStay === false`: `burden += 15 * leaveSignalWeight`

4. **Vulnerability scaling (StatsCan)** — `burden *= (1 + vulnerabilityMultiplier)` when using profile-derived multiplier.

5. **Alert status** — `RED` if burden > 75 or planning to leave; `AMBER` if burden > 50; else `GREEN`.

6. **Amber check-in suggestion** — `suggestAmberCheckIn: true` when `minutesWaited > 87` and `burden >= 55`.

7. **Disengagement gating (backend)** — `disengagementWindowMinutes` returned only when: `planningToLeave` OR `burden >= 70` OR `minutesWaited >= 87` OR `minutesWaited / expectedWaitMinutes >= 0.30`.

8. **Burden API response** — `burden`, `alertStatus`, `suggestAmberCheckIn`, `disengagementWindowMinutes`, `burdenCurve`, `equityGapScore`, `baselineCurve`

### Admin Dashboard

Read-only view computed from frontend `PatientStoreService` (same data as Staff). No backend endpoint.

- **Model Health** — Alert distribution (% Green/Amber/Red), average burden (30–55 normal, 70+ strain), missed check-in rate.
- **Equity Overview** — Average burden by flag (mobility, chronicPain, sensory, cognitive, language, alone) and % Red by flag.
- **Footer** — Model anchors from `modelConstants.ts` and `vulnerabilityWeights.ts`: CIHI medians (238 min total, 90 min to physician), McMaster early risk (87 min), LWBS source (HQCA), weights source (Statistics Canada).

**Safety** — Admin cannot change thresholds, weights, patients, LWBS scaling, or triage.

### Staff Dashboard UI Logic

**Missed check-in** — Last check-in > 20 min ago (`CHECK_IN_INTERVAL_MS`). Shown as orange badge.

**Disengagement warning** — Shown only when any of: `minutesWaited >= 87` OR `intendsToStay === false` OR `burden >= 70` OR **credible risk pattern**: `missedCheckIn` AND `minutesWaited > 87` AND `burden > 55` (patient stopped engaging + past early-risk window + elevated burden).

**Suggested actions** — Credible risk pattern → "Immediate staff outreach — credible disengagement risk"; otherwise `minutesWaited < 87` and intends to stay → "Accessibility check (optional)"; else flag-based actions.

### Frontend Lib

- `frontend/src/lib/model/modelConstants.ts` — CIHI + McMaster constants
- `frontend/src/lib/model/vulnerabilityWeights.ts` — StatsCan-informed weights
- `frontend/src/lib/data/albertaERs.ts` — Alberta hospital list (AHS, HQCA)
- `frontend/src/lib/model/burden.ts` — `shouldSuggestAmberCheckIn(minutesWaited, burden)`
- `frontend/src/app/core/services/admin-summary.service.ts` — Computes admin summary from PatientStore (alert distribution, avg burden, equity by flag)

---

## Project Context

AccessER does **not** diagnose, prioritize treatment, or provide medical advice. It operates as an accessibility and system-equity support layer alongside existing clinical workflows.

| Layer | Purpose |
|-------|---------|
| **Patient** | Accessibility intake, burden curves, 20-min check-ins |
| **Staff** | Queue Equity View, risk indicators, suggested actions |
| **Admin** | Model health & equity overview — observation only (no thresholds, weights, or patient overrides) |

---

## License

UNLICENSED (private project)
