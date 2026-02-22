// Sidebar component for window management

import React from 'react';
import type { WindowInfo } from '../../services/window-manager';

interface SidebarProps {
  activeWindows: WindowInfo[];
  onFocusWindow: (window: WindowInfo) => void;
  onCloseWindow: (window: WindowInfo) => void;
  onCloseAllWindows: () => void;
  onHideAllWindows: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeWindows,
  onFocusWindow,
  onCloseWindow,
  onCloseAllWindows,
  onHideAllWindows,
}) => {
  return (
    <aside className="sidebar">
      <div className="home-button-container">
        <button onClick={onHideAllWindows} className="home-btn" title="Show Main View">
          <span className="home-icon">🏠</span>
          <span className="home-text">Home</span>
        </button>
      </div>

      <div className="sidebar-header">
        <h2>Windows</h2>
        <span className="window-count">{activeWindows.length}</span>
      </div>

      <div className="window-list">
        {activeWindows.map((window) => (
          <div
            key={window.id}
            className={`window-item ${window.minimized ? 'minimized' : ''}`}
            onClick={() => onFocusWindow(window)}
          >
            <div className="window-icon">📷</div>
            <div className="window-info">
              <span className="window-title">{window.title}</span>
              <span className="window-status">{window.minimized ? 'Minimized' : 'Active'}</span>
            </div>
            <button
              className="window-close"
              onClick={(e) => { e.stopPropagation(); onCloseWindow(window); }}
              title="Close window"
            >
              ×
            </button>
          </div>
        ))}

        {activeWindows.length === 0 && (
          <div className="no-windows">
            No open windows
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        {activeWindows.length > 0 && (
          <button onClick={onCloseAllWindows} className="close-all-btn">
            Close All
          </button>
        )}
      </div>
    </aside>
  );
};
