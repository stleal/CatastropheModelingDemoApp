import type { FeatureDefinition } from '../../data/features'

type FeatureCardProps = {
  feature: FeatureDefinition
  isSelected: boolean
  onSelect: (featureId: FeatureDefinition['id']) => void
}

function FeatureCard({ feature, isSelected, onSelect }: FeatureCardProps) {
  return (
    <button
      type="button"
      className={`feature-card${isSelected ? ' feature-card-selected' : ''}`}
      onClick={() => onSelect(feature.id)}
      aria-pressed={isSelected}
    >
      <div className="feature-card-topline">
        <span className="feature-icon" aria-hidden="true">
          {feature.icon}
        </span>
        <span className="feature-status">{feature.status}</span>
      </div>

      <div className="feature-card-body">
        <h2>{feature.title}</h2>
        <p>{feature.summary}</p>
      </div>

      <div className="feature-card-footer">
        <span className="feature-accent">{feature.highlight}</span>
        <span className="feature-link">Explore</span>
      </div>
    </button>
  )
}

export default FeatureCard