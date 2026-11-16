import React from 'react';
import { ErrorState } from '../components/ui';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return {
      hasError: true,
      errorMessage:
        error?.message ||
        'Ocorreu uma falha inesperada ao carregar este módulo da página.',
    };
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-8 px-4">
          <ErrorState
            title="Não foi possível carregar esta seção"
            message={this.state.errorMessage}
            nextStep="Verifique sua conexão e tente recarregar o módulo."
            retryLabel="Recarregar Seção"
            onRetry={this.handleRetry}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
