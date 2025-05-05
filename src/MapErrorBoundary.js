import React from 'react';

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Map component failed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          background: 'rgba(255,0,0,0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255,0,0,0.2)',
          margin: '20px 0'
        }}>
          <h3>Map failed to load</h3>
          <p>Try refreshing the page or check your connection.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(0,114,255,0.8)',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;