import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initGlobalErrorHandlers } from '../services/utils/global-error-handler';

initGlobalErrorHandlers();

const TestErrorButton = () => {
  const triggerError = () => {
    throw new Error('Test error triggered by button!');
  };

  return (
    <button
      onClick={triggerError}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px 20px',
        backgroundColor: '#dc2626',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        zIndex: 9999,
        fontSize: '14px',
      }}
    >
      🧪 Test Error
    </button>
  );
};

const rootElement = document.getElementById('app');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
        <TestErrorButton />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('React rendered successfully');
}
