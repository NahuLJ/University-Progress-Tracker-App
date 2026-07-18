import { Component, type ReactNode } from 'react';
import { Icon } from '../ui/Icon';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, message: '' };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, message: error.message };
    }

    handleReload = () => {
        this.setState({ hasError: false, message: '' });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="max-w-md w-full card rounded-lg p-6 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-neon-red/15 text-neon-red shadow-neon-soft">
                            <Icon name="warning" className="w-7 h-7" />
                        </div>
                        <h1 className="text-lg font-semibold text-white mb-2">
                            Algo salió mal
                        </h1>
                        <p className="text-sm text-slate-300 mb-4">
                            Ocurrió un error inesperado. Podés reintentar recargando la página.
                        </p>
                        {this.state.message && (
                            <p className="text-xs text-neon-red mb-4 break-words">{this.state.message}</p>
                        )}
                        <button
                            onClick={this.handleReload}
                            className="btn-primary w-full"
                        >
                            Recargar
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
