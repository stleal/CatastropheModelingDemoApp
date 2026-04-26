export type ScenarioInput = {
  eventName: string
  regionLabel: string
  windDirectionStartDeg: number
  windSpeedInitialMph: number
  temperatureStartF: number
  temperatureEndF: number
  precipitationStartIn: number
  precipitationEndIn: number
  pressureStartMb: number
  pressureEndMb: number
  durationHours: number
  distanceTraveledMiles: number
}

export type ZipScenarioInput = {
  zip: string
  city: string
  lat: number
  lng: number
  dwellingExposureUsd: number
  commercialExposureUsd: number
  serviceExposureIndex: number
}

export type StormPoint = {
  step: number
  x: number
  y: number
  windSpeedMph: number
  precipitationIn: number
  pressureMb: number
  coneRadius: number
}

export type ZipImpact = {
  zip: string
  city: string
  distanceToTrackMiles: number
  insideConeHours: number
  peakWindMph: number
  rainfallExposureIn: number
  pressureSeverity: number
  damageScore: number
  estimatedDamageUsd: number
  dwellingDisruptionPercent: number
  commercialDisruptionPercent: number
  serviceDisruptionPercent: number
  severityBand: 'minor' | 'moderate' | 'major'
}

export type DamageAssessmentDataset = {
  id: string
  scenario: ScenarioInput
  zips: ZipScenarioInput[]
  stormTrack: StormPoint[]
  impacts: ZipImpact[]
}