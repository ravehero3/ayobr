import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050a13] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
          <p className="text-gray-400 mb-8 max-w-md">
            The application encountered an unexpected error. Don't worry, your files are safe. 
            Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-black/50 rounded-lg text-left text-xs overflow-auto max-w-full text-red-400 border border-red-500/10">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
