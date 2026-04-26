import type { DamageAssessmentDataset, ZipImpact } from './damageAssessment.types'
import {
  getTrajectoryModelKey,
  trajectoryModelOptions,
  type TrajectoryModelKey,
} from '../../data/sampleDamageAssessment'

type DamageAssessmentWorkspaceProps = {
  dataset: DamageAssessmentDataset
  datasets: DamageAssessmentDataset[]
  visibleDatasets: DamageAssessmentDataset[]
  activeModelKeys: TrajectoryModelKey[]
  showAxisCoordinates: boolean
  onStormChange: (datasetId: string) => void
  onModelToggle: (modelKey: TrajectoryModelKey) => void
  onAxisCoordinatesToggle: () => void
  onBack: () => void
}

const severityClasses: Record<ZipImpact['severityBand'], string> = {
  minor: 'severity-pill severity-minor',
  moderate: 'severity-pill severity-moderate',
  major: 'severity-pill severity-major',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number) {
  return `${value}%`
}

const axisGridTicks = [0, 20, 40, 60, 80, 100]

function getXAxisMiles(position: number, distanceTraveledMiles: number) {
  return Math.round((distanceTraveledMiles * position) / 100)
}

function getYAxisLabel(position: number, distanceTraveledMiles: number) {
  const axisRangeMiles = distanceTraveledMiles * 0.5
  const offsetMiles = Math.round(((50 - position) / 50) * axisRangeMiles)

  if (offsetMiles === 0) {
    return '0 mi'
  }

  return offsetMiles > 0 ? `${offsetMiles} mi N` : `${Math.abs(offsetMiles)} mi S`
}

function getTotalEstimatedDamage(dataset: DamageAssessmentDataset) {
  return dataset.impacts.reduce((sum, impact) => sum + impact.estimatedDamageUsd, 0)
}

function getModelLabel(modelKey: TrajectoryModelKey) {
  return trajectoryModelOptions.find((option) => option.key === modelKey)?.label ?? modelKey
}

function getModelDescription(modelKey: TrajectoryModelKey) {
  if (modelKey === 'base') {
    return 'Show or hide the original scenario result set and unadjusted reference track.'
  }

  if (modelKey === 'wind') {
    return 'Apply heading and wind-speed drift from the base storm to extend the track and widen the cone.'
  }

  if (modelKey === 'pressure') {
    return 'Bias the x-axis path toward lower-pressure zones and stretch the cone where the gradient steepens.'
  }

  return 'Push the path with rainfall-loading effects and broaden the cone as precipitation intensity increases.'
}

function buildTrackPath(dataset: DamageAssessmentDataset) {
  return dataset.stormTrack.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

function buildConeArea(dataset: DamageAssessmentDataset) {
  const forward = dataset.stormTrack.map((point) => `${point.x},${point.y - point.coneRadius / 2.4}`)
  const reverse = [...dataset.stormTrack]
    .reverse()
    .map((point) => `${point.x},${point.y + point.coneRadius / 2.4}`)

  return [...forward, ...reverse].join(' ')
}

function DamageAssessmentWorkspace({
  dataset,
  datasets,
  visibleDatasets,
  activeModelKeys,
  showAxisCoordinates,
  onStormChange,
  onModelToggle,
  onAxisCoordinatesToggle,
  onBack,
}: DamageAssessmentWorkspaceProps) {
  const totalEstimatedDamage = getTotalEstimatedDamage(dataset)
  const highestImpact = dataset.impacts[0]
  const comparisonOptions = trajectoryModelOptions

  return (
    <div className="workspace-shell">
      <div className="workspace-toolbar">
        <div className="workspace-status">
          <span className="workspace-status-label">Base storm scenario</span>
          <strong>{dataset.scenario.eventName}</strong>
        </div>
      </div>

      <section className="workspace-hero">
        <div className="workspace-hero-copy">
          <p className="section-label">Damage assessment workspace</p>
          <h1>{dataset.scenario.eventName}</h1>
          <p className="hero-description">
            Assess dwelling, commercial, and service disruption as the cone crosses ZIP zones in {dataset.scenario.regionLabel}.
          </p>
        </div>

        <div className="workspace-summary-row">
          <div className="workspace-stat-card">
            <span>Total estimated damage</span>
            <strong>{formatCurrency(totalEstimatedDamage)}</strong>
          </div>
          <div className="workspace-stat-card">
            <span>Distance traveled</span>
            <strong>{dataset.scenario.distanceTraveledMiles} mi</strong>
          </div>
          <div className="workspace-stat-card">
            <span>Highest impact ZIP</span>
            <strong>{highestImpact.zip}</strong>
          </div>
          <div className="workspace-stat-card">
            <span>Visible result sets</span>
            <strong>{visibleDatasets.length}</strong>
          </div>
        </div>
      </section>

      <main className="workspace-grid">
        <section className="workspace-panel workspace-panel-inputs">
          <div className="panel-heading">
            <p className="section-label">Scenario inputs</p>
            <h2>Storm configuration</h2>
          </div>

          <label className="storm-select-field">
            <span className="workspace-status-label">Select storm</span>
            <select
              value={dataset.id}
              onChange={(event) => onStormChange(event.target.value)}
            >
              {datasets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.scenario.eventName}
                </option>
              ))}
            </select>
          </label>

          <div className="definition-grid">
            <div>
              <span>Direction</span>
              <strong>{dataset.scenario.windDirectionStartDeg} deg</strong>
            </div>
            <div>
              <span>Wind start</span>
              <strong>{dataset.scenario.windSpeedInitialMph} mph</strong>
            </div>
            <div>
              <span>Temperature</span>
              <strong>
                {dataset.scenario.temperatureStartF} to {dataset.scenario.temperatureEndF} F
              </strong>
            </div>
            <div>
              <span>Precipitation</span>
              <strong>
                {dataset.scenario.precipitationStartIn} to {dataset.scenario.precipitationEndIn} in
              </strong>
            </div>
            <div>
              <span>Pressure</span>
              <strong>
                {dataset.scenario.pressureStartMb} to {dataset.scenario.pressureEndMb} mb
              </strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>{dataset.scenario.durationHours} hrs</strong>
            </div>
          </div>

          <div className="panel-heading">
            <p className="section-label">Trajectory simulations</p>
            <h3>Apply hypothetical path models</h3>
          </div>

          <div className="model-toggle-grid">
            {comparisonOptions.map((option) => (
              <label key={option.key} className="model-toggle-card">
                <input
                  type="checkbox"
                  checked={activeModelKeys.includes(option.key)}
                  onChange={() => onModelToggle(option.key)}
                />
                <div>
                  <strong>{option.label}</strong>
                  <p>{getModelDescription(option.key)}</p>
                </div>
              </label>
            ))}

            <label className="coordinate-toggle-card">
              <input
                type="checkbox"
                checked={showAxisCoordinates}
                onChange={onAxisCoordinatesToggle}
              />
              <div>
                <strong>Show X/Y coordinates</strong>
                <p>Toggle the mile labels and north-south coordinate guide on the map grid.</p>
              </div>
            </label>
          </div>

          <div className="panel-heading">
            <p className="section-label">ZIP exposure zones</p>
            <h3>Mock data loaded</h3>
          </div>

          <div className="zip-zone-list">
            {dataset.zips.map((zone) => (
              <article key={zone.zip} className="zip-zone-card">
                <div>
                  <h3>{zone.zip}</h3>
                  <p>{zone.city}</p>
                </div>
                <dl>
                  <div>
                    <dt>Dwelling</dt>
                    <dd>{formatCurrency(zone.dwellingExposureUsd)}</dd>
                  </div>
                  <div>
                    <dt>Commercial</dt>
                    <dd>{formatCurrency(zone.commercialExposureUsd)}</dd>
                  </div>
                  <div>
                    <dt>Services</dt>
                    <dd>{zone.serviceExposureIndex} / 100</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="workspace-panel workspace-panel-map">
          <div className="panel-heading">
            <p className="section-label">Track and cone</p>
            <h2>Storm path preview</h2>
          </div>

          <div className="storm-map-card">
            <svg viewBox="0 0 100 100" className="storm-map" role="img" aria-label="Damage assessment storm path and cone preview">
              <rect x="0" y="0" width="100" height="100" rx="10" className="storm-map-bg" />
              <g className="storm-grid">
                <path d="M 0 20 H 100 M 0 40 H 100 M 0 60 H 100 M 0 80 H 100" />
                <path d="M 20 0 V 100 M 40 0 V 100 M 60 0 V 100 M 80 0 V 100" />
              </g>
              {showAxisCoordinates ? (
                <g className="storm-axis-labels" aria-hidden="true">
                  <text x="50" y="6" className="storm-axis-title">North / South miles</text>
                  <text x="50" y="97" className="storm-axis-title">X-axis miles east</text>
                  {axisGridTicks.map((position) => (
                    <text key={`x-${position}`} x={position === 0 ? 5 : position === 100 ? 95 : position} y="92" className="storm-axis-tick">
                      {getXAxisMiles(position, dataset.scenario.distanceTraveledMiles)} mi
                    </text>
                  ))}
                  {axisGridTicks.map((position) => (
                    <text key={`y-${position}`} x="7" y={position === 0 ? 8 : position === 100 ? 94 : position + 1.5} className="storm-axis-tick storm-axis-tick-y">
                      {getYAxisLabel(position, dataset.scenario.distanceTraveledMiles)}
                    </text>
                  ))}
                </g>
              ) : null}
              {visibleDatasets.map((resultSet) => {
                const modelKey = getTrajectoryModelKey(resultSet.id)

                return (
                  <g key={resultSet.id}>
                    <polygon
                      points={buildConeArea(resultSet)}
                      className={`storm-cone storm-cone-${modelKey}`}
                    />
                    <path
                      d={buildTrackPath(resultSet)}
                      className={`storm-track-line storm-track-line-${modelKey}`}
                    />
                    {resultSet.stormTrack.map((point) => (
                      <circle
                        key={`${resultSet.id}-${point.step}`}
                        cx={point.x}
                        cy={point.y}
                        r="1.4"
                        className={`storm-track-point storm-track-point-${modelKey}`}
                      />
                    ))}
                  </g>
                )
              })}
              {dataset.impacts.map((impact, index) => (
                <g key={impact.zip} transform={`translate(${22 + index * 17} ${22 + index * 13})`}>
                  <circle r="3.3" className={`impact-node impact-${impact.severityBand}`} />
                  <text y="-5">{impact.zip}</text>
                </g>
              ))}
            </svg>
          </div>

          <button type="button" className="ghost-link storm-preview-action" onClick={onBack}>
            Return to feature selection
          </button>

          <div className="trajectory-summary-grid">
            {visibleDatasets.map((resultSet) => {
              const modelKey = getTrajectoryModelKey(resultSet.id)
              const topImpact = resultSet.impacts[0]
              const maxWind = Math.max(...resultSet.stormTrack.map((point) => point.windSpeedMph))

              return (
                <article key={resultSet.id} className={`mini-chart-card model-summary-card model-summary-card-${modelKey}`}>
                  <span>{getModelLabel(modelKey)}</span>
                  <strong>{formatCurrency(getTotalEstimatedDamage(resultSet))}</strong>
                  <small>
                    {resultSet.scenario.distanceTraveledMiles} mi, max {maxWind} mph, top ZIP {topImpact.zip}
                  </small>
                </article>
              )
            })}
          </div>
        </section>

        <aside className="workspace-panel workspace-panel-results">
          <div className="panel-heading">
            <p className="section-label">ZIP impact results</p>
            <h2>Modeled result sets</h2>
          </div>

          <div className="result-set-stack">
            {visibleDatasets.map((resultSet) => {
              const modelKey = getTrajectoryModelKey(resultSet.id)

              return (
                <section key={resultSet.id} className="result-set-card">
                  <div className="result-set-header">
                    <div>
                      <p className="workspace-status-label">{getModelLabel(modelKey)}</p>
                      <h3>{resultSet.scenario.eventName}</h3>
                    </div>
                    <div className={`result-set-badge result-set-badge-${modelKey}`}>
                      {resultSet.scenario.distanceTraveledMiles} mi
                    </div>
                  </div>

                  <div className="results-table-wrapper">
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th>ZIP</th>
                          <th>Severity</th>
                          <th>Damage</th>
                          <th>Dwelling</th>
                          <th>Commercial</th>
                          <th>Services</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultSet.impacts.map((impact) => (
                          <tr key={`${resultSet.id}-${impact.zip}`}>
                            <td>
                              <strong>{impact.zip}</strong>
                              <span>{impact.city}</span>
                            </td>
                            <td>
                              <span className={severityClasses[impact.severityBand]}>
                                {impact.severityBand}
                              </span>
                            </td>
                            <td>{formatCurrency(impact.estimatedDamageUsd)}</td>
                            <td>{formatPercent(impact.dwellingDisruptionPercent)}</td>
                            <td>{formatPercent(impact.commercialDisruptionPercent)}</td>
                            <td>{formatPercent(impact.serviceDisruptionPercent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )
            })}
          </div>

          <div className="detail-block detail-callout">
            <h3>Current scoring inputs</h3>
            <p>
              Base and hypothetical runs are scored from ZIP exposure, inside-cone duration, peak wind, rainfall exposure, and pressure severity after each model perturbs the original track.
            </p>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default DamageAssessmentWorkspace