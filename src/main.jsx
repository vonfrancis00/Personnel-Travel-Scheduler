import { Component, StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"

class AppErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ padding: 32, fontFamily: "sans-serif" }}>
          <h1>The application could not start</h1>
          <p>{this.state.error.message}</p>
          <button onClick={() => window.location.reload()}>Reload application</button>
        </main>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
