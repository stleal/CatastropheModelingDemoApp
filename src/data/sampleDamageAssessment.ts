import type { DamageAssessmentDataset } from '../features/damage-assessment/damageAssessment.types'

export type TrajectoryModelKey = 'base' | 'wind' | 'pressure' | 'precipitation'

export const trajectoryModelOptions: Array<{ key: TrajectoryModelKey; label: string }> = [
  { key: 'base', label: 'Base model' },
  { key: 'wind', label: 'Wind speed and direction' },
  { key: 'pressure', label: 'High to low pressure' },
  { key: 'precipitation', label: 'Precipitation factor' },
]

export function getTrajectoryModelKey(datasetId: string): TrajectoryModelKey {
  const matchedOption = trajectoryModelOptions.find(
    (option) => option.key !== 'base' && datasetId.endsWith(`-${option.key}`),
  )

  return matchedOption?.key ?? 'base'
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function round(value: number, precision = 1) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function distanceBetweenPoints(
  start: DamageAssessmentDataset['stormTrack'][number],
  end: DamageAssessmentDataset['stormTrack'][number],
) {
  return Math.hypot(end.x - start.x, end.y - start.y)
}

function computeTrackSvgDistance(stormTrack: DamageAssessmentDataset['stormTrack']) {
  return stormTrack.slice(1).reduce((sum, point, index) => {
    return sum + distanceBetweenPoints(stormTrack[index], point)
  }, 0)
}

function computeDistanceTraveledMiles(
  baseDataset: DamageAssessmentDataset,
  stormTrack: DamageAssessmentDataset['stormTrack'],
) {
  const svgDistance = computeTrackSvgDistance(stormTrack)
  const baseSvgDistance = computeTrackSvgDistance(baseDataset.stormTrack)

  if (baseSvgDistance === 0) {
    return baseDataset.scenario.distanceTraveledMiles
  }

  return Math.round(
    baseDataset.scenario.distanceTraveledMiles * (svgDistance / baseSvgDistance),
  )
}

function getSeverityBand(damageScore: number): DamageAssessmentDataset['impacts'][number]['severityBand'] {
  if (damageScore >= 0.72) {
    return 'major'
  }

  if (damageScore >= 0.45) {
    return 'moderate'
  }

  return 'minor'
}

function getModelLabel(modelKey: Exclude<TrajectoryModelKey, 'base'>) {
  const option = trajectoryModelOptions.find((item) => item.key === modelKey)
  return option?.label ?? modelKey
}

export function buildModeledDamageAssessment(
  baseDataset: DamageAssessmentDataset,
  modelKey: TrajectoryModelKey,
): DamageAssessmentDataset {
  if (modelKey === 'base') {
    return baseDataset
  }

  const lastIndex = Math.max(baseDataset.stormTrack.length - 1, 1)
  const headingRadians = (baseDataset.scenario.windDirectionStartDeg * Math.PI) / 180
  const headingVectorX = Math.cos(headingRadians)
  const headingVectorY = -Math.sin(headingRadians)
  const pressureDrop = baseDataset.scenario.pressureStartMb - baseDataset.scenario.pressureEndMb
  const precipitationSpread =
    baseDataset.scenario.precipitationEndIn - baseDataset.scenario.precipitationStartIn

  const stormTrack = baseDataset.stormTrack.map((point, index) => {
    const progress = index / lastIndex
    const windBias = baseDataset.scenario.windSpeedInitialMph / 100
    const pressureBias = pressureDrop / 30
    const precipitationBias = precipitationSpread / 8

    if (modelKey === 'wind') {
      const driftScale = (4 + windBias * 3) * progress

      return {
        ...point,
        x: round(clamp(point.x + headingVectorX * driftScale * 3.6, 4, 96)),
        y: round(clamp(point.y + headingVectorY * driftScale * 2.8, 4, 96)),
        windSpeedMph: Math.round(point.windSpeedMph * (1 + 0.08 * progress)),
        coneRadius: round(point.coneRadius * (1 + 0.1 * progress)),
      }
    }

    if (modelKey === 'pressure') {
      const xShift = pressureBias * (3 + progress * 10)
      const yShift = (0.5 - progress) * pressureBias * 2.2

      return {
        ...point,
        x: round(clamp(point.x + xShift, 4, 96)),
        y: round(clamp(point.y + yShift, 4, 96)),
        pressureMb: Math.round(point.pressureMb - pressureBias * 3.5 * progress),
        coneRadius: round(point.coneRadius * (1 + 0.14 * progress)),
      }
    }

    const rainShift = precipitationBias * (2 + progress * 7)

    return {
      ...point,
      x: round(clamp(point.x + precipitationBias * (1.2 + progress * 2.4), 4, 96)),
      y: round(clamp(point.y - rainShift * 0.85, 4, 96)),
      precipitationIn: round(point.precipitationIn * (1 + 0.16 * progress)),
      coneRadius: round(point.coneRadius * (1 + 0.18 * progress)),
    }
  })

  const variantDistanceMiles = computeDistanceTraveledMiles(baseDataset, stormTrack)

  const variantImpacts = baseDataset.impacts.map((impact, index) => {
    const progress = index / Math.max(baseDataset.impacts.length - 1, 1)
    const windTrackMax = Math.max(...stormTrack.map((point) => point.windSpeedMph))
    const rainTrackMax = Math.max(...stormTrack.map((point) => point.precipitationIn))
    const pressureTrackMin = Math.min(...stormTrack.map((point) => point.pressureMb))

    const windDelta = windTrackMax - Math.max(...baseDataset.stormTrack.map((point) => point.windSpeedMph))
    const rainDelta = rainTrackMax - Math.max(...baseDataset.stormTrack.map((point) => point.precipitationIn))
    const pressureDelta = Math.min(...baseDataset.stormTrack.map((point) => point.pressureMb)) - pressureTrackMin

    const modelDistanceFactor =
      modelKey === 'wind'
        ? 1 - (0.18 + progress * 0.12)
        : modelKey === 'pressure'
          ? 1 - (0.12 + progress * 0.08)
          : 1 - (0.08 + progress * 0.05)

    const insideConeMultiplier =
      modelKey === 'wind' ? 1.08 : modelKey === 'pressure' ? 1.12 : 1.18

    const peakWindMph = Math.round(
      impact.peakWindMph + windDelta * (modelKey === 'wind' ? 1 : 0.45) + progress * 3,
    )
    const rainfallExposureIn = round(
      impact.rainfallExposureIn + rainDelta * (modelKey === 'precipitation' ? 1.15 : 0.4),
    )
    const pressureSeverity = round(
      clamp(
        impact.pressureSeverity + pressureDelta * (modelKey === 'pressure' ? 0.03 : 0.012),
        0.1,
        0.99,
      ),
      2,
    )
    const distanceToTrackMiles = Math.max(
      2,
      Math.round(impact.distanceToTrackMiles * modelDistanceFactor),
    )
    const insideConeHours = Math.min(
      baseDataset.scenario.durationHours,
      Math.round(impact.insideConeHours * insideConeMultiplier),
    )

    const damageScore = round(
      clamp(
        peakWindMph / 160 * 0.42 +
          rainfallExposureIn / 12 * 0.22 +
          pressureSeverity * 0.2 +
          (insideConeHours / baseDataset.scenario.durationHours) * 0.16,
        0.12,
        0.98,
      ),
      2,
    )

    const exposureBase =
      baseDataset.zips.find((zone) => zone.zip === impact.zip)?.dwellingExposureUsd ??
      impact.estimatedDamageUsd
    const estimatedDamageUsd = Math.round(
      impact.estimatedDamageUsd * (0.82 + damageScore * 0.55) + exposureBase * damageScore * 0.06,
    )

    return {
      ...impact,
      distanceToTrackMiles,
      insideConeHours,
      peakWindMph,
      rainfallExposureIn,
      pressureSeverity,
      damageScore,
      estimatedDamageUsd,
      dwellingDisruptionPercent: Math.round(clamp(damageScore * 48, 8, 72)),
      commercialDisruptionPercent: Math.round(clamp(damageScore * 62, 14, 84)),
      serviceDisruptionPercent: Math.round(clamp(damageScore * 55, 12, 78)),
      severityBand: getSeverityBand(damageScore),
    }
  }).sort((left, right) => right.estimatedDamageUsd - left.estimatedDamageUsd)

  return {
    ...baseDataset,
    id: `${baseDataset.id}-${modelKey}`,
    scenario: {
      ...baseDataset.scenario,
      eventName: `${baseDataset.scenario.eventName} (${getModelLabel(modelKey)})`,
      distanceTraveledMiles: variantDistanceMiles,
    },
    stormTrack,
    impacts: variantImpacts,
  }
}

export function buildTrajectoryModelSet(baseDataset: DamageAssessmentDataset) {
  return trajectoryModelOptions.map((option) => buildModeledDamageAssessment(baseDataset, option.key))
}

const gulfZipZones = [
  {
    zip: '77002',
    city: 'Houston Core',
    lat: 29.756,
    lng: -95.365,
    dwellingExposureUsd: 184000000,
    commercialExposureUsd: 262000000,
    serviceExposureIndex: 72,
  },
  {
    zip: '77550',
    city: 'Galveston',
    lat: 29.301,
    lng: -94.797,
    dwellingExposureUsd: 126000000,
    commercialExposureUsd: 174000000,
    serviceExposureIndex: 68,
  },
  {
    zip: '77650',
    city: 'Port Bolivar',
    lat: 29.477,
    lng: -94.639,
    dwellingExposureUsd: 64000000,
    commercialExposureUsd: 82000000,
    serviceExposureIndex: 59,
  },
  {
    zip: '77590',
    city: 'Texas City',
    lat: 29.4,
    lng: -94.923,
    dwellingExposureUsd: 97000000,
    commercialExposureUsd: 149000000,
    serviceExposureIndex: 64,
  },
]

const atlanticZipZones = [
  {
    zip: '33139',
    city: 'Miami Beach',
    lat: 25.782,
    lng: -80.134,
    dwellingExposureUsd: 211000000,
    commercialExposureUsd: 298000000,
    serviceExposureIndex: 77,
  },
  {
    zip: '33040',
    city: 'Key West',
    lat: 24.555,
    lng: -81.78,
    dwellingExposureUsd: 88000000,
    commercialExposureUsd: 117000000,
    serviceExposureIndex: 61,
  },
  {
    zip: '33037',
    city: 'Key Largo',
    lat: 25.123,
    lng: -80.409,
    dwellingExposureUsd: 73000000,
    commercialExposureUsd: 91000000,
    serviceExposureIndex: 57,
  },
  {
    zip: '33034',
    city: 'Homestead',
    lat: 25.469,
    lng: -80.477,
    dwellingExposureUsd: 142000000,
    commercialExposureUsd: 165000000,
    serviceExposureIndex: 66,
  },
]

export const sampleDamageAssessments: DamageAssessmentDataset[] = [
  {
    id: 'iris-demo-track',
    scenario: {
      eventName: 'Hurricane Iris Demo Track',
      regionLabel: 'Gulf Coastal ZIP corridor',
      windDirectionStartDeg: 62,
      windSpeedInitialMph: 108,
      temperatureStartF: 84,
      temperatureEndF: 76,
      precipitationStartIn: 3.1,
      precipitationEndIn: 8.7,
      pressureStartMb: 984,
      pressureEndMb: 958,
      durationHours: 18,
      distanceTraveledMiles: 242,
    },
    zips: gulfZipZones,
    stormTrack: [
      { step: 0, x: 8, y: 84, windSpeedMph: 108, precipitationIn: 3.1, pressureMb: 984, coneRadius: 24 },
      { step: 1, x: 22, y: 73, windSpeedMph: 112, precipitationIn: 4.2, pressureMb: 979, coneRadius: 28 },
      { step: 2, x: 38, y: 62, windSpeedMph: 118, precipitationIn: 5.6, pressureMb: 973, coneRadius: 33 },
      { step: 3, x: 52, y: 49, windSpeedMph: 114, precipitationIn: 6.9, pressureMb: 968, coneRadius: 38 },
      { step: 4, x: 67, y: 37, windSpeedMph: 106, precipitationIn: 8.1, pressureMb: 962, coneRadius: 42 },
      { step: 5, x: 83, y: 25, windSpeedMph: 94, precipitationIn: 8.7, pressureMb: 958, coneRadius: 48 },
    ],
    impacts: [
      {
        zip: '77550',
        city: 'Galveston',
        distanceToTrackMiles: 7,
        insideConeHours: 14,
        peakWindMph: 118,
        rainfallExposureIn: 8.3,
        pressureSeverity: 0.92,
        damageScore: 0.88,
        estimatedDamageUsd: 133400000,
        dwellingDisruptionPercent: 41,
        commercialDisruptionPercent: 57,
        serviceDisruptionPercent: 49,
        severityBand: 'major',
      },
      {
        zip: '77650',
        city: 'Port Bolivar',
        distanceToTrackMiles: 11,
        insideConeHours: 12,
        peakWindMph: 112,
        rainfallExposureIn: 7.8,
        pressureSeverity: 0.86,
        damageScore: 0.79,
        estimatedDamageUsd: 92100000,
        dwellingDisruptionPercent: 38,
        commercialDisruptionPercent: 46,
        serviceDisruptionPercent: 43,
        severityBand: 'major',
      },
      {
        zip: '77590',
        city: 'Texas City',
        distanceToTrackMiles: 19,
        insideConeHours: 9,
        peakWindMph: 99,
        rainfallExposureIn: 6.1,
        pressureSeverity: 0.67,
        damageScore: 0.63,
        estimatedDamageUsd: 74200000,
        dwellingDisruptionPercent: 24,
        commercialDisruptionPercent: 34,
        serviceDisruptionPercent: 31,
        severityBand: 'moderate',
      },
      {
        zip: '77002',
        city: 'Houston Core',
        distanceToTrackMiles: 34,
        insideConeHours: 5,
        peakWindMph: 81,
        rainfallExposureIn: 4.6,
        pressureSeverity: 0.42,
        damageScore: 0.36,
        estimatedDamageUsd: 58100000,
        dwellingDisruptionPercent: 11,
        commercialDisruptionPercent: 18,
        serviceDisruptionPercent: 16,
        severityBand: 'minor',
      },
    ],
  },
  {
    id: 'sable-fall-1988',
    scenario: {
      eventName: 'Tropical Storm Sable',
      regionLabel: 'South Florida and Keys corridor',
      windDirectionStartDeg: 38,
      windSpeedInitialMph: 86,
      temperatureStartF: 88,
      temperatureEndF: 79,
      precipitationStartIn: 2.4,
      precipitationEndIn: 10.2,
      pressureStartMb: 991,
      pressureEndMb: 970,
      durationHours: 20,
      distanceTraveledMiles: 287,
    },
    zips: atlanticZipZones,
    stormTrack: [
      { step: 0, x: 12, y: 88, windSpeedMph: 86, precipitationIn: 2.4, pressureMb: 991, coneRadius: 18 },
      { step: 1, x: 24, y: 76, windSpeedMph: 93, precipitationIn: 4.8, pressureMb: 985, coneRadius: 24 },
      { step: 2, x: 37, y: 64, windSpeedMph: 101, precipitationIn: 6.4, pressureMb: 980, coneRadius: 30 },
      { step: 3, x: 49, y: 53, windSpeedMph: 97, precipitationIn: 7.8, pressureMb: 976, coneRadius: 36 },
      { step: 4, x: 62, y: 42, windSpeedMph: 89, precipitationIn: 9.2, pressureMb: 973, coneRadius: 41 },
      { step: 5, x: 79, y: 31, windSpeedMph: 78, precipitationIn: 10.2, pressureMb: 970, coneRadius: 46 },
    ],
    impacts: [
      {
        zip: '33040',
        city: 'Key West',
        distanceToTrackMiles: 4,
        insideConeHours: 15,
        peakWindMph: 101,
        rainfallExposureIn: 9.6,
        pressureSeverity: 0.84,
        damageScore: 0.77,
        estimatedDamageUsd: 68400000,
        dwellingDisruptionPercent: 36,
        commercialDisruptionPercent: 44,
        serviceDisruptionPercent: 42,
        severityBand: 'major',
      },
      {
        zip: '33037',
        city: 'Key Largo',
        distanceToTrackMiles: 10,
        insideConeHours: 11,
        peakWindMph: 94,
        rainfallExposureIn: 8.9,
        pressureSeverity: 0.73,
        damageScore: 0.68,
        estimatedDamageUsd: 53300000,
        dwellingDisruptionPercent: 28,
        commercialDisruptionPercent: 33,
        serviceDisruptionPercent: 31,
        severityBand: 'moderate',
      },
      {
        zip: '33034',
        city: 'Homestead',
        distanceToTrackMiles: 21,
        insideConeHours: 8,
        peakWindMph: 84,
        rainfallExposureIn: 7.4,
        pressureSeverity: 0.58,
        damageScore: 0.51,
        estimatedDamageUsd: 60700000,
        dwellingDisruptionPercent: 19,
        commercialDisruptionPercent: 25,
        serviceDisruptionPercent: 22,
        severityBand: 'moderate',
      },
      {
        zip: '33139',
        city: 'Miami Beach',
        distanceToTrackMiles: 36,
        insideConeHours: 4,
        peakWindMph: 69,
        rainfallExposureIn: 5.5,
        pressureSeverity: 0.33,
        damageScore: 0.29,
        estimatedDamageUsd: 49200000,
        dwellingDisruptionPercent: 9,
        commercialDisruptionPercent: 14,
        serviceDisruptionPercent: 12,
        severityBand: 'minor',
      },
    ],
  },
  {
    id: 'osprey-landfall-2003',
    scenario: {
      eventName: 'Hurricane Osprey',
      regionLabel: 'Upper Gulf industrial corridor',
      windDirectionStartDeg: 74,
      windSpeedInitialMph: 124,
      temperatureStartF: 82,
      temperatureEndF: 74,
      precipitationStartIn: 4.5,
      precipitationEndIn: 11.4,
      pressureStartMb: 972,
      pressureEndMb: 949,
      durationHours: 16,
      distanceTraveledMiles: 226,
    },
    zips: gulfZipZones,
    stormTrack: [
      { step: 0, x: 6, y: 86, windSpeedMph: 124, precipitationIn: 4.5, pressureMb: 972, coneRadius: 28 },
      { step: 1, x: 19, y: 74, windSpeedMph: 129, precipitationIn: 5.8, pressureMb: 968, coneRadius: 34 },
      { step: 2, x: 35, y: 60, windSpeedMph: 131, precipitationIn: 7.1, pressureMb: 962, coneRadius: 40 },
      { step: 3, x: 49, y: 47, windSpeedMph: 125, precipitationIn: 8.5, pressureMb: 957, coneRadius: 45 },
      { step: 4, x: 66, y: 34, windSpeedMph: 114, precipitationIn: 10.1, pressureMb: 953, coneRadius: 51 },
      { step: 5, x: 84, y: 21, windSpeedMph: 101, precipitationIn: 11.4, pressureMb: 949, coneRadius: 57 },
    ],
    impacts: [
      {
        zip: '77550',
        city: 'Galveston',
        distanceToTrackMiles: 5,
        insideConeHours: 16,
        peakWindMph: 131,
        rainfallExposureIn: 10.8,
        pressureSeverity: 0.96,
        damageScore: 0.93,
        estimatedDamageUsd: 171300000,
        dwellingDisruptionPercent: 49,
        commercialDisruptionPercent: 63,
        serviceDisruptionPercent: 58,
        severityBand: 'major',
      },
      {
        zip: '77590',
        city: 'Texas City',
        distanceToTrackMiles: 13,
        insideConeHours: 13,
        peakWindMph: 119,
        rainfallExposureIn: 9.4,
        pressureSeverity: 0.88,
        damageScore: 0.82,
        estimatedDamageUsd: 116800000,
        dwellingDisruptionPercent: 35,
        commercialDisruptionPercent: 48,
        serviceDisruptionPercent: 44,
        severityBand: 'major',
      },
      {
        zip: '77650',
        city: 'Port Bolivar',
        distanceToTrackMiles: 17,
        insideConeHours: 10,
        peakWindMph: 112,
        rainfallExposureIn: 8.2,
        pressureSeverity: 0.74,
        damageScore: 0.69,
        estimatedDamageUsd: 84400000,
        dwellingDisruptionPercent: 29,
        commercialDisruptionPercent: 38,
        serviceDisruptionPercent: 36,
        severityBand: 'moderate',
      },
      {
        zip: '77002',
        city: 'Houston Core',
        distanceToTrackMiles: 29,
        insideConeHours: 6,
        peakWindMph: 88,
        rainfallExposureIn: 5.2,
        pressureSeverity: 0.47,
        damageScore: 0.41,
        estimatedDamageUsd: 63600000,
        dwellingDisruptionPercent: 13,
        commercialDisruptionPercent: 21,
        serviceDisruptionPercent: 19,
        severityBand: 'minor',
      },
    ],
  },
]

export const defaultDamageAssessmentId = sampleDamageAssessments[0].id