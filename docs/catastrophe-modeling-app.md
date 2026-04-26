# Damage Assessment App Architecture

Author: Mr. Sam Leal
Creation Date: 04/26/2026

## Goal

Build a React app that models catastrophe trajectories, renders an impact cone on a map and SVG overlays, and estimates ZIP-level damage as the event passes through each area.

## Recommended Stack

- React 19 + TypeScript
- Vite for local development and builds
- React Leaflet + Leaflet for maps, markers, and layers
- Chart.js + react-chartjs-2 for trajectory and intensity charts
- Turf.js for geospatial math such as distance, buffers, and point-in-polygon checks
- Plain SVG or a lightweight SVG helper for custom cone overlays and directional paths
- Bootstrap for initial layout and control styling

## Feature Modules

Split the app into five feature areas:

1. Scenario input and validation
2. Path and cone simulation
3. Map and SVG visualization
4. ZIP-level impact estimation
5. Results tables and charts

## Suggested Folder Layout

```text
src/
  app/
    AppShell.tsx
    routes.tsx
    providers.tsx
  components/
    layout/
      AppHeader.tsx
      ThreePanelLayout.tsx
    scenario/
      ScenarioForm.tsx
      ZipInputTable.tsx
      WeatherRangeFields.tsx
    map/
      DamageAssessmentMap.tsx
      ZipMarkersLayer.tsx
      StormTrackLayer.tsx
      ConeOverlay.tsx
      MapLegend.tsx
    charts/
      TrajectoryChart.tsx
      WindSpeedChart.tsx
      PressureChart.tsx
      RainfallChart.tsx
      ZipDamageBarChart.tsx
    results/
      SummaryCards.tsx
      ZipImpactTable.tsx
      ScenarioStatsPanel.tsx
  features/
    damage-assessment/
      DamageAssessmentPage.tsx
      damageAssessment.types.ts
      damageAssessment.constants.ts
      damageAssessment.hooks.ts
  hooks/
    useScenarioState.ts
    useStormSimulation.ts
    useZipDamageModel.ts
  services/
    geocoding.service.ts
    stormModel.service.ts
    damageModel.service.ts
    export.service.ts
  utils/
    geo.ts
    math.ts
    format.ts
  data/
    sampleScenario.ts
    sampleZips.ts
  styles/
    tokens.css
    layout.css
```

## Top-Level Component Structure

The main page should be a three-panel workspace.

```tsx
<AppShell>
  <DamageAssessmentPage>
    <ThreePanelLayout
      left={<ScenarioForm />}
      center={<DamageAssessmentMap />}
      right={<ResultsWorkspace />}
    />
  </DamageAssessmentPage>
</AppShell>
```

### Left Panel

Owns all scenario inputs:

- ZIP list or CSV import
- wind direction start
- wind speed initial
- temperature start and end
- precipitation start and end
- pressure start and end
- optional cone width growth assumptions
- optional simulation duration and time step

Primary components:

- `ScenarioForm`
- `ZipInputTable`
- `WeatherRangeFields`

### Center Panel

Owns the geographic view and SVG overlays:

- base map via React Leaflet
- ZIP markers positioned by centroid coordinates
- storm center line as a polyline
- cone polygon or corridor overlay
- optional directional arrowheads and uncertainty bands

Primary components:

- `DamageAssessmentMap`
- `ZipMarkersLayer`
- `StormTrackLayer`
- `ConeOverlay`

### Right Panel

Owns analysis outputs:

- scenario summary cards
- per-ZIP damage table
- trajectory chart
- wind, pressure, and rainfall charts
- ranked impacted ZIPs chart

Primary components:

- `SummaryCards`
- `ZipImpactTable`
- `TrajectoryChart`
- `ZipDamageBarChart`

## State Design

Keep state centralized at the feature page level, then pass down derived data to presentational components.

### Core State Shape

```ts
type ScenarioInput = {
  zips: ZipScenarioInput[]
  windDirectionStartDeg: number
  windSpeedInitialMph: number
  temperatureStartF: number
  temperatureEndF: number
  precipitationStartIn: number
  precipitationEndIn: number
  pressureStartMb: number
  pressureEndMb: number
  timeStepMinutes: number
  durationHours: number
}

type ZipScenarioInput = {
  zip: string
  lat: number
  lng: number
}

type StormPoint = {
  step: number
  lat: number
  lng: number
  windSpeedMph: number
  temperatureF: number
  precipitationIn: number
  pressureMb: number
  coneRadiusMiles: number
}

type ZipImpact = {
  zip: string
  lat: number
  lng: number
  distanceToTrackMiles: number
  insideConeSteps: number
  peakWindMph: number
  rainfallExposureIn: number
  pressureSeverity: number
  damageScore: number
  estimatedDamageUsd: number
}
```

### Hooks Responsibility Split

- `useScenarioState`: form state, validation, and updates
- `useStormSimulation`: turns scenario inputs into storm path and cone geometry
- `useZipDamageModel`: calculates ZIP exposure and estimated damage outputs

This keeps map rendering separate from the modeling logic.

## Service Layer Responsibilities

### `stormModel.service.ts`

Should:

- interpolate weather values from start to end over the simulation duration
- generate path points from initial heading and speed assumptions
- compute distance traveled from the path geometry
- derive cone width or radius for each step

### `damageModel.service.ts`

Should:

- measure each ZIP's closest approach to the track
- compute whether a ZIP is inside the cone at each step
- derive peak wind, rainfall exposure, and pressure severity
- convert the hazard profile to `damageScore` and `estimatedDamageUsd`

### `geocoding.service.ts`

Should:

- resolve ZIP codes to coordinates
- cache ZIP centroid lookups
- provide a clean fallback when a ZIP cannot be resolved

## Data Flow

The page-level flow should be:

1. User enters ZIPs and weather/path inputs.
2. `useScenarioState` validates and normalizes values.
3. `useStormSimulation` generates storm track points and cone geometry.
4. `useZipDamageModel` evaluates every ZIP against the simulated event.
5. The map, charts, and table render the same derived result set.

That gives you one computational source of truth and avoids divergence between the map and table.

## Rendering Strategy

Use Leaflet for spatial navigation and markers. Use SVG overlays for anything custom that needs precise control over geometry.

Use Leaflet for:

- basemap tiles
- pan and zoom behavior
- pin clustering if needed later
- popups and spatial layers

Use SVG for:

- custom cone outlines
- directional path arrows
- animated uncertainty bands
- highlight states for impacted ZIPs

This hybrid approach keeps the map practical while preserving custom catastrophe visuals.

## Chart Strategy

Start with four charts:

1. `TrajectoryChart`: step-by-step path progression
2. `WindSpeedChart`: wind speed over time
3. `PressureChart`: pressure over time
4. `ZipDamageBarChart`: top impacted ZIPs by estimated damage

All chart inputs should come from the same `StormPoint[]` and `ZipImpact[]` arrays used elsewhere.

## MVP Build Order

Implement the app in this order:

1. Create typed scenario and result models.
2. Build the scenario form with local validation.
3. Add a static map with ZIP markers.
4. Generate a simple directional path and computed distance traveled.
5. Render a first-pass cone overlay.
6. Add ZIP impact scoring and the results table.
7. Add Chart.js views for trajectory and top impacted ZIPs.

## Suggested First Deliverable

The first working slice should prove the full loop, even with simple math:

- user enters a small set of ZIPs
- app resolves those ZIPs to coordinates
- app generates a storm path from direction and initial speed
- app computes distance traveled
- app renders the path and cone on the map
- app estimates a simple damage score for each ZIP
- app shows results in a table and one chart

That slice is enough to validate the architecture before investing in a more advanced catastrophe model.

## Risks To Control Early

- ZIP geocoding quality can become the biggest external dependency.
- Damage estimation should stay clearly labeled as modeled output, not observed loss.
- Cone math and coordinate transforms should be isolated in utilities so the rendering layer stays simple.
- Keep simulation logic outside components to avoid expensive recalculation during render.

## Additional Feature Modules

Keep the app shell, map panel, and analytics panel the same. Add new feature modules by changing the simulation inputs, the entity dataset, and the scoring model behind the shared layout.

### Claims Surge Forecasting

Purpose:

- estimate claim counts by ZIP or region over time
- forecast adjuster demand and staffing pressure
- surface peak operational load windows after storm passage

Recommended outputs:

- projected claims count by ZIP
- projected claims count by day
- minor versus major loss mix
- residential versus commercial claim mix
- staffing need estimate by time window
- top impacted ZIPs ranked by operational load

Suggested components:

- `ClaimsForecastPage`
- `ClaimsLoadChart`
- `ClaimsMixChart`
- `StaffingForecastPanel`
- `ClaimsImpactTable`

Suggested services:

- `claimsForecast.service.ts`
- `portfolioMix.service.ts`

Suggested result shape:

```ts
type ZipClaimsForecast = {
  zip: string
  projectedClaimsTotal: number
  projectedMinorClaims: number
  projectedMajorClaims: number
  projectedResidentialClaims: number
  projectedCommercialClaims: number
  projectedPeakDay: string
  staffingUnitsRequired: number
}
```

Modeling note:

Use the same storm path and cone logic, but replace direct loss estimation with claim frequency curves. A simple first-pass model can derive claim counts from exposure counts, impact severity, and a configurable reporting lag.

### Infrastructure Impact

Purpose:

- track operational disruption across critical assets rather than only ZIP centroids
- score service interruption for hospitals, substations, telecom towers, schools, ports, and warehouses
- combine asset impact with surrounding ZIP disruption for broader regional visibility

Recommended outputs:

- asset-level disruption percent
- service outage risk by category
- commercial property disruption percent
- dwelling property disruption percent
- service availability degradation estimate
- ranked critical assets by severity

Suggested components:

- `InfrastructureImpactPage`
- `InfrastructureAssetsLayer`
- `AssetImpactTable`
- `ServiceDisruptionChart`
- `CriticalAssetsPanel`

Suggested services:

- `infrastructureImpact.service.ts`
- `assetScoring.service.ts`

Suggested result shape:

```ts
type InfrastructureAsset = {
  id: string
  assetType: 'hospital' | 'substation' | 'telecom' | 'school' | 'port' | 'warehouse'
  name: string
  zip: string
  lat: number
  lng: number
  serviceArea?: string
}

type AssetImpactResult = {
  assetId: string
  disruptionPercent: number
  serviceOutagePercent: number
  dwellingPropertyDisruptionPercent: number
  commercialPropertyDisruptionPercent: number
  severityBand: 'minor' | 'moderate' | 'major'
}
```

Mock data recommendation:

Add local data files for ZIP zones and asset inventories so the app can demonstrate impact scoring before any live integration.

Suggested mock datasets:

- `data/mockZipZones.ts` for ZIP centroids and region labels
- `data/mockInfrastructureAssets.ts` for pinned assets and categories
- `data/mockExposureProfiles.ts` for dwelling and commercial exposure weights by ZIP
- `data/mockServiceProfiles.ts` for service criticality and disruption thresholds

For each ZIP or asset, include percentages for:

- minor commercial disruption
- major commercial disruption
- minor dwelling disruption
- major dwelling disruption
- service interruption risk

That lets the model compute disruption outcomes where the storm crosses each zone without requiring external APIs.

### Historical Replay

Purpose:

- load a known historical event and replay it through the same map and analytics shell
- support demos, model validation, and future calibration work
- compare modeled outputs against historical expectations

Recommended outputs:

- timeline playback of storm movement
- changing cone and intensity over time
- replayed ZIP or asset impact at each step
- final summary of impacted areas and modeled disruptions
- optional comparison between historical path and a modified scenario

Suggested components:

- `HistoricalReplayPage`
- `ReplayControls`
- `ReplayTimelineChart`
- `HistoricalTrackLayer`
- `ReplayEventSummary`

Suggested services:

- `historicalReplay.service.ts`
- `replayTimeline.service.ts`

Suggested result shape:

```ts
type HistoricalStormEvent = {
  id: string
  name: string
  season: number
  points: StormPoint[]
  source: string
}
```

Mock data recommendation:

Add replay-ready historical track files under `data/historical/` with normalized `StormPoint[]` records so the same charts and overlays can render them without special casing.

### Shared Feature Strategy

To support these modules, evolve the folder structure from a single feature to a multi-feature platform:

```text
src/
  features/
    damage-assessment/
    claims-forecasting/
    infrastructure-impact/
    historical-replay/
  data/
    mockZipZones.ts
    mockInfrastructureAssets.ts
    mockExposureProfiles.ts
    historical/
      sampleHistoricalStorm.ts
```

The shared shell remains constant:

- left panel for scenario or replay controls
- center panel for Leaflet map and SVG overlays
- right panel for tables, charts, staffing forecasts, and disruption summaries

The only moving parts are:

- the input model
- the entity set being scored
- the service layer formulas
- the right-panel analytics views

## Next Step

After this architecture, the next concrete step should be defining the TypeScript domain model and initial scoring formulas so the UI and computation layers can evolve together.