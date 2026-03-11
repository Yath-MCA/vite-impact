import React from 'react';
import { useErrorTracker } from './ErrorTrackerProvider';

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.props.onError?.(error, {
      componentStack: errorInfo.componentStack,
      boundary: this.props.name || 'Unknown'
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div 
          data-testid="error-boundary"
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <h3 className="text-red-800 font-semibold mb-2">Something went wrong</h3>
          <p data-testid="error-message" className="text-red-600 text-sm">
            {this.state.error?.message}
          </p>
          {this.props.onReset && (
            <button
              onClick={this.props.onReset}
              className="mt-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ErrorBoundary({ children, name, fallback, onReset }) {
  const { logError } = useErrorTracker();

  return (
    <ErrorBoundaryClass 
      name={name} 
      onError={logError}
      fallback={fallback}
      onReset={onReset}
    >
      {children}
    </ErrorBoundaryClass>
  );
}
