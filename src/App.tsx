import { useState } from 'react'
import AppShell from './app/AppShell'
import FeatureCard from './components/layout/FeatureCard'
import { featureDefinitions } from './data/features'
import './App.css'

function App() {
  const [selectedFeatureId, setSelectedFeatureId] = useState(
    featureDefinitions[0].id,
  )

  const selectedFeature =
    featureDefinitions.find((feature) => feature.id === selectedFeatureId) ??
    featureDefinitions[0]

  return (
    <AppShell
      eyebrow="Catastrophe Modeling React App"
      title="Select a catastrophe modeling workspace"
      description="Start with one of four coordinated feature modules. Each view keeps the same map-first architecture while changing the scoring model, entity set, and analytics panel."
    >
      <main className="landing-grid">
        <section className="feature-grid-section" aria-label="Feature selection">
          <div className="section-heading">
            <p className="section-label">Feature modules</p>
            <p className="section-summary">
              Rounded glossy cards for the four experiences planned in demo version 1.
            </p>
          </div>

          <div className="feature-grid">
            {featureDefinitions.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                isSelected={feature.id === selectedFeature.id}
                onSelect={setSelectedFeatureId}
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
            </div>
          </div>
        </aside>
      </main>
    </AppShell>
  )
}

export default App
