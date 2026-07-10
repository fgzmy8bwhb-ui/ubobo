import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="container-edge py-24 text-center">
          <p className="text-lg font-bold">Une erreur est survenue.</p>
          <p className="mt-2 text-muted">Merci de recharger la page pour continuer.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-dark mt-6 px-6 py-3"
          >
            Recharger la page
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
