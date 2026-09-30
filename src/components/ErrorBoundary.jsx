import { Component } from "react";

/** Shows a friendly message instead of a blank page if something crashes. */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[VLX] Page crashed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          fontFamily: "var(--font-body)",
          textAlign: "center",
          color: "#021627",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.4rem", margin: "0 0 0.5rem" }}>Something went wrong</h1>
          <p style={{ margin: "0 0 1.2rem", color: "#5b6b7a" }}>
            Please reload the page. If it keeps happening, contact us on WhatsApp.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: 999,
              border: 0,
              background: "#1d4160",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
