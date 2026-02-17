// Main App component - Simplified and modular

import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { WebSocketStatusPanel } from './components/WebSocketStatusPanel';
import { useWebSocketStatus, useAppInitialization, useWindowManager } from './hooks/useAppLogic';
import { useWindowOperations } from './hooks/useWindowOperations';
import { Logger } from './utils/logger';
import { EventBus, AppEventType } from '../models/event-bus';

const App: React.FC = () => {
  // Initialize app
  useAppInitialization();

  // WebSocket status
  const { wsStatus } = useWebSocketStatus();

  // Window management
  const { activeWindows, setActiveWindows } = useWindowManager();
  const {
    openWindow,
    focusWindow,
    closeWindow,
    closeAllWindows,
    hideAllWindows,
    dbUsers,
    setDbUsers,
    updateSQLiteTable,
    openSystemInfoWindow,
    openSQLiteWindow,
  } = useWindowOperations(setActiveWindows);

  // Handle database response
  useEffect(() => {
    const handleDbResponse = ((event: CustomEvent) => {
      const response = event.detail;
      if (response.success) {
        setDbUsers(response.data || []);
        Logger.info('Users loaded from database', { count: response.data?.length || 0 });
        updateSQLiteTable();

        // Emit data changed event
        const emitEvent = EventBus.global();
        emitEvent.emit_simple('data.changed', {
          table: 'users',
          count: response.data?.length || 0,
          action: 'loaded'
        });
      } else {
        Logger.error('Failed to load users', { error: response.error });
      }
    }) as EventListener;

    const handleStatsResponse = ((event: CustomEvent) => {
      const response = event.detail;
      if (response.success) {
        Logger.info('Database stats loaded', response.stats);
      }
    }) as EventListener;

    window.addEventListener('db_response', handleDbResponse);
    window.addEventListener('stats_response', handleStatsResponse);

    return () => {
      window.removeEventListener('db_response', handleDbResponse);
      window.removeEventListener('stats_response', handleStatsResponse);
    };
  }, [setDbUsers, updateSQLiteTable]);

  // Handle window resize
  useEffect(() => {
    const handleWindowResize = () => {
      const sidebarWidth = 200;
      const availableWidth = window.innerWidth - sidebarWidth;
      const availableHeight = window.innerHeight - 40;
      
      setActiveWindows(prev => prev.map(w => {
        if (w.maximized && !w.minimized) {
          w.winboxInstance.resize(availableWidth, availableHeight);
          w.winboxInstance.move(sidebarWidth, 0);
        }
        return w;
      }));
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [setActiveWindows]);

  // Setup global functions
  useEffect(() => {
    (window as any).refreshUsers = () => {
      Logger.info('Refreshing users from database');
      if ((window as any).getUsers) {
        (window as any).getUsers();
      }
    };

    (window as any).searchUsers = () => {
      const searchInput = document.getElementById('db-search') as HTMLInputElement;
      const searchTerm = searchInput?.value.toLowerCase() || '';
      Logger.info('Searching users', { term: searchTerm });

      const tableBody = document.getElementById('users-table-body');
      if (tableBody) {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row: any) => {
          const text = row.textContent?.toLowerCase() || '';
          row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
      }
    };
  }, []);

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f7fa;
          color: #333;
          font-size: 14px;
          overflow: hidden;
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: row;
          height: 100vh;
        }

        .sidebar {
          width: 200px;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          color: white;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #334155;
          flex-shrink: 0;
          z-index: 1000;
        }

        .home-button-container {
          padding: 0.75rem;
          background: rgba(79, 70, 229, 0.2);
          border-bottom: 1px solid #334155;
        }

        .home-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .home-btn:hover {
          background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
        }

        .sidebar-header {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid #334155;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sidebar-header h2 {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .window-count {
          background: #4f46e5;
          color: white;
          padding: 0.15rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .window-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .window-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          margin-bottom: 0.25rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .window-item:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: #4f46e5;
          transform: translateX(4px);
        }

        .window-item.minimized {
          opacity: 0.6;
          background: rgba(255, 255, 255, 0.02);
        }

        .window-item.minimized:hover {
          opacity: 0.9;
          background: rgba(255, 255, 255, 0.1);
        }

        .window-icon {
          font-size: 1rem;
        }

        .window-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .window-title {
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .window-status {
          font-size: 0.65rem;
          color: #94a3b8;
        }

        .window-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 0.15rem;
          line-height: 1;
          border-radius: 3px;
          transition: all 0.2s ease;
        }

        .window-close:hover {
          background: #dc3545;
          color: white;
        }

        .no-windows {
          text-align: center;
          padding: 1rem;
          color: #64748b;
          font-size: 0.8rem;
          font-style: italic;
        }

        .sidebar-footer {
          padding: 0.75rem;
          border-top: 1px solid #334155;
        }

        .close-all-btn {
          width: 100%;
          padding: 0.5rem;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .close-all-btn:hover {
          background: #c82333;
        }

        .main-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .header {
          background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
          color: white;
          padding: 0.5rem 1rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header h1 {
          font-size: 1.2rem;
          font-weight: 600;
        }

        .main-content {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }

        .cards-section {
          margin-bottom: 1rem;
        }

        .cards-grid {
          display: grid;
          gap: 1.5rem;
        }

        .cards-grid.two-cards {
          grid-template-columns: repeat(2, 1fr);
          max-width: 800px;
          margin: 0 auto;
        }

        .feature-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          min-height: 200px;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }

        .card-icon {
          font-size: 3rem;
          text-align: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ec 100%);
        }

        .card-content {
          padding: 1.25rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .card-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1e293b;
        }

        .card-description {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 1rem;
          line-height: 1.5;
          flex: 1;
        }

        .card-tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .tag {
          background: #e0e7ff;
          color: #4f46e5;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* WinBox windows should respect sidebar width */
        .winbox {
          left: 200px !important;
          width: calc(100% - 200px) !important;
        }

        .winbox.max {
          left: 200px !important;
          top: 0 !important;
          width: calc(100% - 200px) !important;
          height: calc(100% - 40px) !important;
        }

        /* WebSocket status panel - full width at bottom */
        .ws-status-panel {
          width: 100%;
          flex-shrink: 0;
          z-index: 999;
        }

        @media (max-width: 768px) {
          .app {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            max-height: 150px;
          }

          .window-list {
            display: flex;
            flex-direction: row;
            gap: 0.5rem;
            overflow-x: auto;
            padding: 0.5rem;
          }

          .window-item {
            min-width: 150px;
            margin-bottom: 0;
          }

          .cards-grid.two-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="app">
        <Sidebar
          activeWindows={activeWindows}
          onFocusWindow={focusWindow}
          onCloseWindow={closeWindow}
          onCloseAllWindows={closeAllWindows}
          onHideAllWindows={hideAllWindows}
        />

        <div className="main-container">
          <Header />
          
          <MainContent
            onOpenSystemInfo={openSystemInfoWindow}
            onOpenSQLite={openSQLiteWindow}
          />
          
          <WebSocketStatusPanel wsStatus={wsStatus} />
        </div>
      </div>
    </>
  );
};

export default App;
