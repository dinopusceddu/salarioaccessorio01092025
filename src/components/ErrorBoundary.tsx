// src/components/ErrorBoundary.tsx
import React from 'react';
import { Fallback } from './shared/Fallback.tsx';

interface Props {
  children: React.ReactNode;
  resetKey?: any;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error !== null && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // If a resetKey is provided, it's a local boundary that can be retried.
      // Otherwise, it's a global boundary and should reload the page.
      if (this.props.resetKey) {
        return (
          <Fallback 
            error={this.state.error} 
            onAction={this.handleRetry} 
            actionText="Riprova"
            title="Errore nel componente"
            message="Si è verificato un errore durante il rendering di questa sezione."
          />
        );
      }
      // Global fallback
      return (
        <div className="h-screen w-screen">
          <Fallback error={this.state.error} />
        </div>
      );
    }

    return this.props.children;
  }
}
