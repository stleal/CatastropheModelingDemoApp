import FeatureCard from '../../components/layout/FeatureCard'
import type { FeatureDefinition } from '../../data/features'

type OverviewProps = {
  features: FeatureDefinition[]
  selectedFeature: FeatureDefinition
  onSelectFeature: (featureId: FeatureDefinition['id']) => void
  onSignOut: () => void
}

function Overview({ features, selectedFeature, onSelectFeature, onSignOut }: OverviewProps) {
  const isDamageAssessment = selectedFeature.id === 'damage-assessment'

  return (
    <main className="landing-grid">
      <section className="feature-grid-section" aria-label="Feature selection">
        <div className="section-heading">
          <p className="section-label">Feature modules</p>
          <p className="section-summary">
            Rounded glossy cards for the four experiences planned in demo version 1.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              isSelected={feature.id === selectedFeature.id}
              onSelect={onSelectFeature}
            />
          ))}
        </div>
      </section>

      <aside className="feature-detail-panel" aria-live="polite">
        <div className="detail-surface">
          <p className="section-label">Selected feature</p>
          <div className="detail-heading-row">
            <span className="detail-icon" aria-hidden="true">
              {selectedFeature.icon}
            </span>
            <div>
              <h2>{selectedFeature.title}</h2>
              <p className="detail-summary">{selectedFeature.summary}</p>
            </div>
          </div>

          <div className="metric-strip">
            {selectedFeature.metrics.map((metric) => (
              <div key={metric.label} className="metric-card">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>

          <div className="detail-block">
            <h3>Implementation focus</h3>
            <ul className="detail-list">
              {selectedFeature.focusAreas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="detail-block detail-callout">
            <h3>Next build slice</h3>
            <p>
              Scaffold the page shell, add mock data, and wire the first map,
              chart, and scoring loop for <strong>{selectedFeature.title}</strong>.
            </p>
            <div className="detail-actions">
              {isDamageAssessment ? (
                <a href="#damage-assessment" className="workspace-link">
                  Open Damage Assessment Workspace
                </a>
              ) : (
                <span className="workspace-link workspace-link-disabled">
                  Workspace coming soon
                </span>
              )}

              <button
                type="button"
                className="ghost-link overview-signout-button"
                onClick={onSignOut}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </main>
  )
}

export default Overview