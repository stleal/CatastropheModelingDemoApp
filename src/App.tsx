import { useEffect, useState, type FormEvent } from 'react'
import AppShell from './app/AppShell'
import { featureDefinitions } from './data/features'
import {
  buildTrajectoryModelSet,
  defaultDamageAssessmentId,
  getTrajectoryModelKey,
  sampleDamageAssessments,
  type TrajectoryModelKey,
} from './data/sampleDamageAssessment'
import DamageAssessmentWorkspace from './features/damage-assessment/DamageAssessmentWorkspace'
import Overview from './features/overview/Overview'
import './App.css'

type AppView = 'landing' | 'damage-assessment'

const DEMO_USERNAME = 'admin_sl'
const DEMO_PASSWORD = 'admin_sl'

function getViewFromHash(hash: string): AppView {
  return hash === '#damage-assessment' ? 'damage-assessment' : 'landing'
}

function App() {
  const [selectedFeatureId, setSelectedFeatureId] = useState(
    featureDefinitions[0].id,
  )
  const [view, setView] = useState<AppView>(() => getViewFromHash(window.location.hash))
  const [username, setUsername] = useState(DEMO_USERNAME)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [selectedStormId, setSelectedStormId] = useState(defaultDamageAssessmentId)
  const [activeModelKeys, setActiveModelKeys] = useState<TrajectoryModelKey[]>([
    'base',
    'wind',
    'pressure',
    'precipitation',
  ])
  const [showAxisCoordinates, setShowAxisCoordinates] = useState(true)

  useEffect(() => {
    const handleHashChange = () => {
      setView(getViewFromHash(window.location.hash))
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  const selectedFeature =
    featureDefinitions.find((feature) => feature.id === selectedFeatureId) ??
    featureDefinitions[0]

  const selectedDataset =
    sampleDamageAssessments.find((dataset) => dataset.id === selectedStormId) ??
    sampleDamageAssessments[0]
  const modeledDatasets = buildTrajectoryModelSet(selectedDataset)
  const visibleDatasets = modeledDatasets.filter((dataset) => {
    const modelKey = getTrajectoryModelKey(dataset.id)

    return activeModelKeys.includes(modelKey)
  })

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (username.trim() !== DEMO_USERNAME) {
      setLoginError('Use the demo username admin_sl to access the workspace.')
      return
    }

    if (password !== DEMO_PASSWORD) {
      setLoginError('Use the demo password admin_sl to access the workspace.')
      return
    }

    setLoginError('')
    setIsAuthenticated(true)
  }

  const handleSignOut = () => {
    window.location.hash = ''
    setView('landing')
    setPassword(DEMO_PASSWORD)
    setIsAuthenticated(false)
    setLoginError('')
  }

  if (!isAuthenticated) {
    return (
      <AppShell
        eyebrow="Catastrophe Modeling React App"
        title="Sign in to the catastrophe modeling workspace"
        description="Use the same overview environment with a lightweight demo login before opening the feature modules and workspace flows."
      >
        <main className="login-layout">
          <section className="login-panel" aria-label="Login form">
            <div className="section-heading login-heading">
              <p className="section-label">Secure access</p>
              <h2>Demo login</h2>
              <p className="section-summary">
                Sign in with the hardcoded demo user to continue into the overview page.
              </p>
            </div>

            <form className="login-form" onSubmit={handleLoginSubmit}>
              <label className="login-field">
                <span>Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                />
              </label>

              <label className="login-field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </label>

              <div className="login-callout">
                <strong>Demo credentials</strong>
                <p>Username: admin_sl</p>
                <p>Password: admin_sl</p>
              </div>

              {loginError ? (
                <p className="login-error" role="alert">
                  {loginError}
                </p>
              ) : null}

              <button type="submit" className="workspace-link login-submit">
                Continue to Overview
              </button>
            </form>
          </section>
        </main>
      </AppShell>
    )
  }

  if (view === 'damage-assessment') {
    return (
      <DamageAssessmentWorkspace
        dataset={selectedDataset}
        datasets={sampleDamageAssessments}
        visibleDatasets={visibleDatasets}
        activeModelKeys={activeModelKeys}
        showAxisCoordinates={showAxisCoordinates}
        onStormChange={setSelectedStormId}
        onModelToggle={(modelKey) => {
          setActiveModelKeys((currentKeys) => {
            if (currentKeys.includes(modelKey)) {
              return currentKeys.filter((key) => key !== modelKey)
            }

            return [...currentKeys, modelKey]
          })
        }}
        onAxisCoordinatesToggle={() => {
          setShowAxisCoordinates((currentValue) => !currentValue)
        }}
        onBack={() => {
          window.location.hash = ''
          setView('landing')
        }}
      />
    )
  }

  return (
    <AppShell
      eyebrow="Catastrophe Modeling React App"
      title="Select a catastrophe modeling workspace"
      description="Start with one of four coordinated feature modules. Each view keeps the same map-first architecture while changing the scoring model, entity set, and analytics panel."
      action={
        <button type="button" className="ghost-link shell-action-button" onClick={handleSignOut}>
          Sign out
        </button>
      }
    >
      <Overview
        features={featureDefinitions}
        selectedFeature={selectedFeature}
        onSelectFeature={setSelectedFeatureId}
      />
    </AppShell>
  )
}

export default App
