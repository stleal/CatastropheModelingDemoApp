import type { PropsWithChildren } from 'react'

type AppShellProps = PropsWithChildren<{
  eyebrow: string
  title: string
  description: string
}>

function AppShell({ eyebrow, title, description, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="hero-banner">
        <div className="hero-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="hero-description">{description}</p>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit-grid"></div>
          <div className="orbit-ring orbit-ring-primary"></div>
          <div className="orbit-ring orbit-ring-secondary"></div>
          <div className="orbit-core"></div>
          <div className="orbit-trail"></div>
        </div>
      </header>

      {children}
    </div>
  )
}

export default AppShell