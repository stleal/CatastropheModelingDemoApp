export type FeatureDefinition = {
  id: 'damage-assessment' | 'claims-surge' | 'infrastructure-impact' | 'historical-replay'
  title: string
  icon: string
  status: string
  summary: string
  highlight: string
  focusAreas: string[]
  metrics: Array<{
    label: string
    value: string
  }>
}

export const featureDefinitions: FeatureDefinition[] = [
  {
    id: 'damage-assessment',
    title: 'Damage Assessment',
    icon: '◎',
    status: 'Core feature',
    summary:
      'Estimate ZIP-level damage as a storm cone crosses dwelling and commercial exposure zones.',
    highlight: 'ZIP scoring and cone overlap',
    focusAreas: [
      'Track storm path against ZIP centroids and exposure bands.',
      'Estimate damage score, estimated loss, and inside-cone duration.',
      'Rank the top affected ZIPs for dwellings, commercial property, and services.',
    ],
    metrics: [
      { label: 'Primary entities', value: 'ZIP zones' },
      { label: 'Outputs', value: 'Loss and severity' },
      { label: 'Visual layer', value: 'Cone plus heat view' },
    ],
  },
  {
    id: 'claims-surge',
    title: 'Claims Surge Forecasting',
    icon: '◌',
    status: 'Operations view',
    summary:
      'Forecast claims volume by ZIP, reporting lag, and adjuster demand as the event moves inland.',
    highlight: 'Staffing and claims mix',
    focusAreas: [
      'Project minor versus major claims over time.',
      'Estimate residential and commercial claim mix by region.',
      'Surface staffing bottlenecks and peak intake windows.',
    ],
    metrics: [
      { label: 'Primary entities', value: 'ZIP zones' },
      { label: 'Outputs', value: 'Claims and staffing' },
      { label: 'Visual layer', value: 'Path plus ops timeline' },
    ],
  },
  {
    id: 'infrastructure-impact',
    title: 'Infrastructure Impact',
    icon: '◈',
    status: 'Asset view',
    summary:
      'Score disruption across hospitals, substations, telecom towers, schools, ports, and warehouses.',
    highlight: 'Service outage and critical assets',
    focusAreas: [
      'Pin critical assets with asset-type-specific disruption logic.',
      'Score service interruption and dwelling or commercial spillover.',
      'Highlight critical nodes where the cone crosses service corridors.',
    ],
    metrics: [
      { label: 'Primary entities', value: 'Critical assets' },
      { label: 'Outputs', value: 'Outage and disruption' },
      { label: 'Visual layer', value: 'Pins plus impact rings' },
    ],
  },
  {
    id: 'historical-replay',
    title: 'Historical Replay',
    icon: '◍',
    status: 'Validation view',
    summary:
      'Replay historical storm tracks with timeline controls, map animation, and modeled ZIP impacts.',
    highlight: 'Playback, calibration, and demos',
    focusAreas: [
      'Load normalized historical tracks and replay each time step.',
      'Compare modeled impact to a known event path.',
      'Use past storms for demos, testing, and future model calibration.',
    ],
    metrics: [
      { label: 'Primary entities', value: 'Historical events' },
      { label: 'Outputs', value: 'Replay and comparison' },
      { label: 'Visual layer', value: 'Animated track playback' },
    ],
  },
]