import { EventBus } from '../event-bus';

interface GlobalError {
  message: string;
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
}

let isErrorModalShown = false;

function showErrorModal(error: GlobalError): void {
  if (isErrorModalShown) return;
  isErrorModalShown = true;

  const existing = document.getElementById('global-error-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'global-error-modal';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="
      background-color: #fff;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow: auto;
    ">
      <div style="
        padding: 20px 24px;
        border-bottom: 1px solid #eee;
        display: flex;
        align-items: center;
        gap: 12px;
        background-color: #fff5f5;
      ">
        <span style="font-size: 28px;">⚠️</span>
        <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #dc2626;">
          JavaScript Error
        </h2>
      </div>
      <div style="padding: 24px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #333; line-height: 1.5;">
          ${error.message || 'An unexpected error occurred'}
        </p>
        ${error.stack ? `
          <details>
            <summary style="cursor: pointer; color: #666; font-size: 14px; margin-bottom: 8px;">
              Stack Trace
            </summary>
            <pre style="
              font-size: 12px;
              background-color: #f5f5f5;
              padding: 12px;
              border-radius: 6px;
              overflow: auto;
              max-height: 200px;
              white-space: pre-wrap;
              word-break: break-word;
            ">${error.stack}</pre>
          </details>
        ` : ''}
      </div>
      <div style="
        padding: 16px 24px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        background-color: #fafafa;
      ">
        <button id="error-dismiss-btn" style="
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          background-color: #fff;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
        ">Dismiss</button>
        <button id="error-reload-btn" style="
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          background-color: #2563eb;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        ">Reload Page</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#error-dismiss-btn')?.addEventListener('click', () => {
    overlay.remove();
    isErrorModalShown = false;
  });

  overlay.querySelector('#error-reload-btn')?.addEventListener('click', () => {
    window.location.reload();
  });
}

export function initGlobalErrorHandlers(): void {
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error:', { message, source, lineno, colno, error });
    showErrorModal({
      message: String(message),
      stack: error?.stack,
      source,
      lineno,
      colno,
    });
    return false;
  };

  window.onunhandledrejection = (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    const error = event.reason;
    showErrorModal({
      message: error?.message || String(error) || 'Unhandled Promise Rejection',
      stack: error?.stack,
    });
  };

  console.log('Global error handlers initialized');
}
