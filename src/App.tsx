import { Component, ReactNode, Suspense, lazy } from "react";

// Error Boundary
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("FractionBall CMS Error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            backgroundColor: "#fef2f2",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="60" height="60" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#EF4444" />
            <path d="M50 15 L80 50 L50 85 L20 50 Z" fill="white" />
          </svg>
          <h1 style={{ color: "#ef4444", marginTop: 20 }}>Something went wrong</h1>
          <p style={{ color: "#666", marginTop: 10, maxWidth: 400 }}>
            {this.state.error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: "12px 24px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Reload CMS
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy load FireCMS for better initial load
const FireCMSApp = lazy(() => import("./FireCMSApp"));

// Loading screen
function LoadingScreen() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#111827",
      }}
    >
      <svg width="60" height="60" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#EF4444" />
        <path d="M50 15 L80 50 L50 85 L20 50 Z" fill="white" />
      </svg>
      <p style={{ color: "white", marginTop: 20, fontFamily: "system-ui" }}>
        Loading FractionBall CMS...
      </p>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <FireCMSApp />
      </Suspense>
    </ErrorBoundary>
  );
}
