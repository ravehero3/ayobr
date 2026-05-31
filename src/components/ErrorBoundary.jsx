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
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
            <span className="text-2xl grayscale opacity-50">!</span>
          </div>
          
          <h1 className="text-2xl font-black mb-3 tracking-tighter" style={{ fontFamily: "'Neue Montreal', sans-serif" }}>
            Something went wrong
          </h1>
          
          <p className="text-gray-500 mb-10 max-w-sm text-sm font-medium leading-relaxed" style={{ fontFamily: "'Neue Montreal', sans-serif" }}>
            The application encountered an unexpected error. Don't worry, your files are safe. 
            Please try refreshing the page.
          </p>
          
          <button 
            onClick={() => window.location.reload()}
            className="px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all bg-white text-black hover:scale-105 active:scale-95"
            style={{ fontFamily: "'Neue Montreal', sans-serif" }}
          >
            Refresh Page
          </button>
          
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-12 p-6 bg-white/5 rounded-2xl text-left text-[10px] overflow-auto max-w-full text-gray-500 border border-white/5 font-mono leading-relaxed">
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
