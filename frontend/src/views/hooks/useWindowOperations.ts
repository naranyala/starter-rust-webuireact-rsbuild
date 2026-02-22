// Window management hooks

import { useState, useEffect, useCallback } from 'react';
import { windowManager, WindowInfo } from '../../services/window-manager';
import { Logger } from '../utils/logger';
import { generateSystemInfoHTML, generateSQLiteHTML } from '../utils/window-content';

export const useWindowOperations = (setActiveWindows: React.Dispatch<React.SetStateAction<WindowInfo[]>>) => {
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const openWindow = useCallback((title: string, content: string, icon: string) => {
    if (!(window as any).WinBox) {
      Logger.error('WinBox is not loaded yet. Please try again in a moment.');
      return;
    }

    const windowId = 'win-' + Date.now();
    const sidebarWidth = 200;
    const availableWidth = window.innerWidth - sidebarWidth;
    const availableHeight = window.innerHeight - 40;

    const winboxInstance = new (window as any).WinBox({
      title: title,
      background: '#1e293b',
      border: 4,
      width: availableWidth,
      height: availableHeight,
      x: sidebarWidth,
      y: 0,
      minwidth: '300px',
      minheight: '300px',
      max: true,
      min: true,
      mount: document.createElement('div'),
      oncreate: function() {
        this.body.innerHTML = content;
      },
      onmaximize: function() {
        this.resize(availableWidth, availableHeight);
        this.move(sidebarWidth, 0);
      }
    });

    windowManager.registerWindow(windowId, title, winboxInstance);
    setActiveWindows([...windowManager.getAllWindows()]);
  }, [setActiveWindows]);

  const focusWindow = useCallback((windowInfo: WindowInfo) => {
    if (windowInfo.minimized) {
      windowInfo.winboxInstance.restore();
    }
    windowInfo.winboxInstance.focus();
  }, []);

  const closeWindow = useCallback((windowInfo: WindowInfo) => {
    windowInfo.winboxInstance.close();
  }, []);

  const closeAllWindows = useCallback(() => {
    const windows = windowManager.getAllWindows();
    windows.forEach(windowInfo => {
      windowInfo.winboxInstance.close();
    });
  }, []);

  const hideAllWindows = useCallback(() => {
    const windows = windowManager.getAllWindows();
    windows.forEach(windowInfo => {
      if (!windowInfo.minimized) {
        windowInfo.winboxInstance.minimize();
      }
    });
    Logger.info('All windows minimized - showing main view');
  }, []);

  // Database operations
  const updateSQLiteTable = useCallback(() => {
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody || dbUsers.length === 0) return;

    const rows = dbUsers.map((row: any) => `
      <tr style="border-bottom: 1px solid #334155;">
        <td style="padding: 10px; color: #e2e8f0;">${row.id}</td>
        <td style="padding: 10px; color: #e2e8f0;">${row.name}</td>
        <td style="padding: 10px; color: #94a3b8;">${row.email}</td>
        <td style="padding: 10px;"><span style="background: ${row.role === 'Admin' ? '#dc2626' : row.role === 'Editor' ? '#f59e0b' : '#3b82f6'}; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${row.role}</span></td>
        <td style="padding: 10px;"><span style="color: ${row.status === 'Active' ? '#10b981' : row.status === 'Inactive' ? '#ef4444' : '#f59e0b'}">● ${row.status}</span></td>
      </tr>
    `).join('');

    tableBody.innerHTML = rows;
  }, [dbUsers]);

  const openSystemInfoWindow = useCallback(() => {
    openWindow('System Information', generateSystemInfoHTML(), '💻');
  }, [openWindow]);

  const openSQLiteWindow = useCallback(() => {
    setIsLoadingUsers(true);
    Logger.info('Opening SQLite window, fetching users from backend...');

    if ((window as any).getUsers) {
      Logger.info('Calling Rust backend get_users function');
      (window as any).getUsers();
    } else {
      Logger.warn('Rust backend get_users not available');
      setIsLoadingUsers(false);
    }

    if ((window as any).getDbStats) {
      (window as any).getDbStats();
    }

    openWindow('SQLite Database', generateSQLiteHTML(dbUsers, isLoadingUsers), '🗄️');
  }, [dbUsers, isLoadingUsers, openWindow]);

  return {
    openWindow,
    focusWindow,
    closeWindow,
    closeAllWindows,
    hideAllWindows,
    dbUsers,
    setDbUsers,
    isLoadingUsers,
    setIsLoadingUsers,
    updateSQLiteTable,
    openSystemInfoWindow,
    openSQLiteWindow,
  };
};
