import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleClose = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.header}>
              <span style={styles.icon}>⚠️</span>
              <h2 style={styles.title}>Something went wrong</h2>
            </div>
            <div style={styles.content}>
              <p style={styles.message}>{this.state.error?.message || 'An unexpected error occurred'}</p>
              {this.state.error?.stack && (
                <details style={styles.details}>
                  <summary style={styles.summary}>Stack Trace</summary>
                  <pre style={styles.stack}>{this.state.error.stack}</pre>
                </details>
              )}
            </div>
            <div style={styles.footer}>
              <button onClick={this.handleClose} style={styles.buttonSecondary}>
                Dismiss
              </button>
              <button onClick={this.handleReload} style={styles.buttonPrimary}>
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#fff5f5',
  },
  icon: {
    fontSize: '28px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: '#dc2626',
  },
  content: {
    padding: '24px',
    overflow: 'auto',
    flex: 1,
  },
  message: {
    margin: 0,
    fontSize: '16px',
    color: '#333',
    lineHeight: 1.5,
  },
  details: {
    marginTop: '16px',
  },
  summary: {
    cursor: 'pointer',
    color: '#666',
    fontSize: '14px',
    marginBottom: '8px',
  },
  stack: {
    fontSize: '12px',
    backgroundColor: '#f5f5f5',
    padding: '12px',
    borderRadius: '6px',
    overflow: 'auto',
    maxHeight: '200px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #eee',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    backgroundColor: '#fafafa',
  },
  buttonPrimary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  buttonSecondary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    backgroundColor: '#fff',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};
