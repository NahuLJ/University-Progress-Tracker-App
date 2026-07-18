import { Component, type ReactNode } from 'react';

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
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h1 className="text-lg font-semibold text-gray-900 mb-2">
                            Algo salió mal
                        </h1>
                        <p className="text-sm text-gray-600 mb-4">
                            Ocurrió un error inesperado. Podés reintentar recargando la página.
                        </p>
                        {this.state.message && (
                            <p className="text-xs text-red-600 mb-4 break-words">{this.state.message}</p>
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
