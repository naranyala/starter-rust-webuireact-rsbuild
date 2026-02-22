// HTML generators for WinBox windows

export const generateSystemInfoHTML = (): string => {
  const now = new Date();
  return `
    <div style="padding: 20px; color: white; font-family: 'Segoe UI', sans-serif; max-height: 100%; overflow-y: auto;">
      <h2 style="margin-bottom: 20px; color: #4f46e5;">💻 System Information</h2>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 10px;">Operating System</h3>
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Platform:</span>
            <span>${navigator.platform}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">User Agent:</span>
            <span style="font-size: 0.8rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${navigator.userAgent}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Language:</span>
            <span>${navigator.language}</span>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 10px;">Display & Screen</h3>
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Screen Resolution:</span>
            <span>${screen.width} × ${screen.height}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Available Resolution:</span>
            <span>${screen.availWidth} × ${screen.availHeight}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Color Depth:</span>
            <span>${screen.colorDepth}-bit</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Pixel Ratio:</span>
            <span>${window.devicePixelRatio}x</span>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 10px;">Browser Information</h3>
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Online Status:</span>
            <span style="color: ${navigator.onLine ? '#10b981' : '#ef4444'}">${navigator.onLine ? '🟢 Online' : '🔴 Offline'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Cookies Enabled:</span>
            <span>${navigator.cookieEnabled ? 'Yes' : 'No'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Cores:</span>
            <span>${navigator.hardwareConcurrency || 'Unknown'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Memory:</span>
            <span>${navigator.deviceMemory || 'Unknown'} GB</span>
          </div>
        </div>
      </div>

      <div>
        <h3 style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 10px;">Current Time</h3>
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Local Time:</span>
            <span>${now.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Timezone:</span>
            <span>${Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Timezone Offset:</span>
            <span>UTC${now.getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(now.getTimezoneOffset() / 60)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const generateSQLiteHTML = (users: any[], isLoading: boolean): string => {
  const displayUsers = users.length > 0 ? users : [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Editor', status: 'Active' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'User', status: 'Pending' },
  ];

  const rows = displayUsers.map((row: any) => `
    <tr style="border-bottom: 1px solid #334155;">
      <td style="padding: 10px; color: #e2e8f0;">${row.id}</td>
      <td style="padding: 10px; color: #e2e8f0;">${row.name}</td>
      <td style="padding: 10px; color: #94a3b8;">${row.email}</td>
      <td style="padding: 10px;"><span style="background: ${row.role === 'Admin' ? '#dc2626' : row.role === 'Editor' ? '#f59e0b' : '#3b82f6'}; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${row.role}</span></td>
      <td style="padding: 10px;"><span style="color: ${row.status === 'Active' ? '#10b981' : row.status === 'Inactive' ? '#ef4444' : '#f59e0b'}">● ${row.status}</span></td>
    </tr>
  `).join('');

  return `
    <div style="padding: 20px; color: white; font-family: 'Segoe UI', sans-serif; height: 100%; display: flex; flex-direction: column;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="color: #4f46e5;">🗄️ SQLite Database Viewer</h2>
        <span style="background: #10b981; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem;">Live Data</span>
      </div>

      <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <input type="text" id="db-search" placeholder="Search records..." style="flex: 1; padding: 8px 12px; background: rgba(0,0,0,0.3); border: 1px solid #334155; border-radius: 6px; color: white; font-size: 0.9rem;">
          <button onclick="searchUsers()" style="padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">Search</button>
          <button onclick="refreshUsers()" style="padding: 8px 16px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">↻</button>
        </div>

        <div style="display: flex; gap: 15px; font-size: 0.8rem; color: #94a3b8;">
          <span>📊 Table: <strong style="color: white;">users</strong></span>
          <span>📋 Records: <strong style="color: white;">${displayUsers.length}</strong></span>
          <span>💾 Source: <strong style="color: white;">Rust SQLite</strong></span>
        </div>
      </div>

      <div style="flex: 1; overflow: auto; background: rgba(0,0,0,0.2); border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background: rgba(255,255,255,0.1); position: sticky; top: 0;">
            <tr>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">ID</th>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">Name</th>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">Email</th>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">Role</th>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">Status</th>
            </tr>
          </thead>
          <tbody id="users-table-body">
            ${rows}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #64748b; font-size: 0.8rem;">Showing ${displayUsers.length} record${displayUsers.length !== 1 ? 's' : ''}</span>
        <div style="display: flex; gap: 5px;">
          <button style="padding: 5px 12px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;" disabled>Previous</button>
          <button style="padding: 5px 12px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;" disabled>Next</button>
        </div>
      </div>
    </div>
  `;
};
