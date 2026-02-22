(()=>{"use strict";var e,n,t,i,o={650(e,n,t){var i=t(848),o=t(540),a=t(338);let r=window.Logger||{info:(e,n)=>console.log("[INFO]",e,n),warn:(e,n)=>console.warn("[WARN]",e,n),error:(e,n)=>console.error("[ERROR]",e,n),debug:(e,n)=>console.debug("[DEBUG]",e,n)};console.log("=== React Application Starting ==="),console.log("Current URL:",window.location.href),console.log("Document readyState:",document.readyState);try{let e=document.getElementById("app");if(console.log("Root element found:",e),e){let n=a.createRoot(e);console.log("React root created"),n.render((0,i.jsx)(o.StrictMode,{children:(0,i.jsx)(()=>{let[e,n]=(0,o.useState)([]),[t,a]=(0,o.useState)([]),[s,d]=(0,o.useState)({users:0,tables:[]}),[l,c]=(0,o.useState)(!1),p=(0,o.useCallback)(()=>{let e=document.getElementById("users-table-body");e&&0!==t.length&&(e.innerHTML=t.map(e=>`
      <tr style="border-bottom: 1px solid #334155;">
        <td style="padding: 10px; color: #e2e8f0;">${e.id}</td>
        <td style="padding: 10px; color: #e2e8f0;">${e.name}</td>
        <td style="padding: 10px; color: #94a3b8;">${e.email}</td>
        <td style="padding: 10px;"><span style="background: ${"Admin"===e.role?"#dc2626":"Editor"===e.role?"#f59e0b":"#3b82f6"}; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${e.role}</span></td>
        <td style="padding: 10px;"><span style="color: ${"Active"===e.status?"#10b981":"Inactive"===e.status?"#ef4444":"#f59e0b"}">● ${e.status}</span></td>
      </tr>
    `).join(""))},[t]),m=(e,t,i)=>{window.WinBox?n(i=>{let o,a=i.find(n=>n.title===e);if(a)return a.minimized&&(a.winboxInstance.restore(),a.minimized=!1),a.winboxInstance.focus(),i;r.info("Opening window",{windowTitle:e});let s="win-"+Date.now();return o=new window.WinBox({title:e,background:"#1e293b",border:4,width:"calc(100% - 200px)",height:"100%",x:"200px",y:"0",minwidth:"300px",minheight:"300px",max:!0,min:!0,mount:document.createElement("div"),oncreate:function(){this.body.innerHTML=t},onminimize:function(){n(e=>e.map(e=>e.id===s?{...e,minimized:!0}:e))},onrestore:function(){n(e=>e.map(e=>e.id===s?{...e,minimized:!1,maximized:!1}:e))},onmaximize:function(){let e=window.innerWidth-200,t=window.innerHeight;this.resize(e,t),this.move(200,0),n(e=>e.map(e=>e.id===s?{...e,maximized:!0}:e))},onclose:function(){n(e=>e.filter(e=>e.id!==s))}}),[...i,{id:s,title:e,minimized:!1,maximized:!1,winboxInstance:o}]}):r.error("WinBox is not loaded yet. Please try again in a moment.")},b=()=>{n(e=>e.map(e=>{if(e.maximized&&!e.minimized){let n=window.innerWidth-200,t=window.innerHeight;e.winboxInstance.resize(n,t),e.winboxInstance.move(200,0)}return e}))};return(0,o.useEffect)(()=>{r.info("Application initialized"),window.refreshUsers=()=>{r.info("Refreshing users from database"),c(!0),window.getUsers&&window.getUsers()},window.searchUsers=()=>{let e=document.getElementById("db-search"),n=(null==e?void 0:e.value.toLowerCase())||"";r.info("Searching users",{term:n});let t=document.getElementById("users-table-body");t&&t.querySelectorAll("tr").forEach(e=>{var t;let i=(null==(t=e.textContent)?void 0:t.toLowerCase())||"";e.style.display=i.includes(n)?"":"none"})};let e=e=>{let n=e.detail;if(n.success){var t;a(n.data||[]),r.info("Users loaded from database",{count:(null==(t=n.data)?void 0:t.length)||0}),p()}else r.error("Failed to load users",{error:n.error});c(!1)},n=e=>{let n=e.detail;n.success&&(d(n.stats),r.info("Database stats loaded",n.stats))};return window.addEventListener("db_response",e),window.addEventListener("stats_response",n),window.addEventListener("resize",b),()=>{window.removeEventListener("db_response",e),window.removeEventListener("stats_response",n),window.removeEventListener("resize",b)}},[p]),(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)("style",{children:`
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
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: row;
        }

        .sidebar {
          width: 200px;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          color: white;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #334155;
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

        .home-icon {
          font-size: 1rem;
        }

        .home-text {
          font-size: 0.85rem;
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

        .wb-dock,
        .wb-taskbar,
        .winbox-dock,
        .winbox-taskbar,
        .winbox-dock-container,
        .wb-dock-container,
        .winbox.minimized ~ .wb-dock,
        .winbox.min ~ .wb-dock,
        .winbox.minimized ~ .wb-taskbar,
        .winbox.min ~ .wb-taskbar {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          position: absolute !important;
          bottom: -9999px !important;
        }

        .winbox.min,
        .winbox.minimized {
          opacity: 0 !important;
          pointer-events: none !important;
          top: -9999px !important;
          left: -9999px !important;
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
      `}),(0,i.jsxs)("div",{className:"app",children:[(0,i.jsxs)("aside",{className:"sidebar",children:[(0,i.jsx)("div",{className:"home-button-container",children:(0,i.jsxs)("button",{onClick:()=>{n(e=>e.map(e=>e.minimized?e:(e.winboxInstance.minimize(),{...e,minimized:!0,maximized:!1}))),r.info("All windows minimized - showing main view")},className:"home-btn",title:"Show Main View",children:[(0,i.jsx)("span",{className:"home-icon",children:"\uD83C\uDFE0"}),(0,i.jsx)("span",{className:"home-text",children:"Home"})]})}),(0,i.jsxs)("div",{className:"sidebar-header",children:[(0,i.jsx)("h2",{children:"Windows"}),(0,i.jsx)("span",{className:"window-count",children:e.length})]}),(0,i.jsxs)("div",{className:"window-list",children:[e.map(e=>(0,i.jsxs)("div",{className:`window-item ${e.minimized?"minimized":""}`,onClick:()=>{e.minimized&&(e.winboxInstance.restore(),n(n=>n.map(n=>n.id===e.id?{...n,minimized:!1}:n))),e.winboxInstance.focus()},children:[(0,i.jsx)("div",{className:"window-icon",children:"\uD83D\uDCF7"}),(0,i.jsxs)("div",{className:"window-info",children:[(0,i.jsx)("span",{className:"window-title",children:e.title}),(0,i.jsx)("span",{className:"window-status",children:e.minimized?"Minimized":"Active"})]}),(0,i.jsx)("button",{className:"window-close",onClick:t=>{t.stopPropagation(),e.winboxInstance.close(),n(n=>n.filter(n=>n.id!==e.id))},title:"Close window",children:"\xd7"})]},e.id)),0===e.length&&(0,i.jsx)("div",{className:"no-windows",children:"No open windows"})]}),(0,i.jsx)("div",{className:"sidebar-footer",children:e.length>0&&(0,i.jsx)("button",{onClick:()=>{e.forEach(e=>{e.winboxInstance.close()}),n([])},className:"close-all-btn",children:"Close All"})})]}),(0,i.jsxs)("div",{className:"main-container",children:[(0,i.jsx)("header",{className:"header",children:(0,i.jsx)("h1",{children:"System Dashboard"})}),(0,i.jsx)("main",{className:"main-content",children:(0,i.jsx)("section",{className:"cards-section",children:(0,i.jsxs)("div",{className:"cards-grid two-cards",children:[(0,i.jsxs)("div",{className:"feature-card",onClick:()=>{let e;m("System Information",(e=new Date,`
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
              <span>${screen.width} \xd7 ${screen.height}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #64748b;">Available Resolution:</span>
              <span>${screen.availWidth} \xd7 ${screen.availHeight}</span>
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
              <span style="color: ${navigator.onLine?"#10b981":"#ef4444"}">${navigator.onLine?"\uD83D\uDFE2 Online":"\uD83D\uDD34 Offline"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #64748b;">Cookies Enabled:</span>
              <span>${navigator.cookieEnabled?"Yes":"No"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #64748b;">Cores:</span>
              <span>${navigator.hardwareConcurrency||"Unknown"}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Memory:</span>
              <span>${navigator.deviceMemory||"Unknown"} GB</span>
            </div>
          </div>
        </div>

        <div>
          <h3 style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 10px;">Current Time</h3>
          <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #64748b;">Local Time:</span>
              <span>${e.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #64748b;">Timezone:</span>
              <span>${Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Timezone Offset:</span>
              <span>UTC${e.getTimezoneOffset()>0?"-":"+"}${Math.abs(e.getTimezoneOffset()/60)}</span>
            </div>
          </div>
        </div>
      </div>
    `),"\uD83D\uDCBB")},children:[(0,i.jsx)("div",{className:"card-icon",children:"\uD83D\uDCBB"}),(0,i.jsxs)("div",{className:"card-content",children:[(0,i.jsx)("h3",{className:"card-title",children:"System Information"}),(0,i.jsx)("p",{className:"card-description",children:"View detailed system information including OS, memory, CPU, and runtime statistics."}),(0,i.jsxs)("div",{className:"card-tags",children:[(0,i.jsx)("span",{className:"tag",children:"Hardware"}),(0,i.jsx)("span",{className:"tag",children:"Stats"})]})]})]}),(0,i.jsxs)("div",{className:"feature-card",onClick:()=>{let e,n;c(!0),r.info("Opening SQLite window, fetching users from backend..."),window.getUsers?(r.info("Calling Rust backend get_users function"),window.getUsers()):(r.warn("Rust backend get_users not available"),c(!1)),window.getDbStats&&window.getDbStats(),m("SQLite Database",(n=(e=t.length>0?t:[{id:1,name:"John Doe",email:"john@example.com",role:"Admin",status:"Active"},{id:2,name:"Jane Smith",email:"jane@example.com",role:"User",status:"Active"},{id:3,name:"Bob Johnson",email:"bob@example.com",role:"User",status:"Inactive"},{id:4,name:"Alice Brown",email:"alice@example.com",role:"Editor",status:"Active"},{id:5,name:"Charlie Wilson",email:"charlie@example.com",role:"User",status:"Pending"}]).map(e=>`
      <tr style="border-bottom: 1px solid #334155;">
        <td style="padding: 10px; color: #e2e8f0;">${e.id}</td>
        <td style="padding: 10px; color: #e2e8f0;">${e.name}</td>
        <td style="padding: 10px; color: #94a3b8;">${e.email}</td>
        <td style="padding: 10px;"><span style="background: ${"Admin"===e.role?"#dc2626":"Editor"===e.role?"#f59e0b":"#3b82f6"}; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${e.role}</span></td>
        <td style="padding: 10px;"><span style="color: ${"Active"===e.status?"#10b981":"Inactive"===e.status?"#ef4444":"#f59e0b"}">● ${e.status}</span></td>
      </tr>
    `).join(""),`
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
            <span>📋 Records: <strong style="color: white;">${e.length}</strong></span>
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
              ${n}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #64748b; font-size: 0.8rem;">Showing ${e.length} record${1!==e.length?"s":""}</span>
          <div style="display: flex; gap: 5px;">
            <button style="padding: 5px 12px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;" disabled>Previous</button>
            <button style="padding: 5px 12px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;" disabled>Next</button>
          </div>
        </div>
      </div>
    `),"\uD83D\uDDC4️")},children:[(0,i.jsx)("div",{className:"card-icon",children:"\uD83D\uDDC4️"}),(0,i.jsxs)("div",{className:"card-content",children:[(0,i.jsx)("h3",{className:"card-title",children:"SQLite Database"}),(0,i.jsx)("p",{className:"card-description",children:"Interactive database viewer with sample data. Connects to backend SQLite integration."}),(0,i.jsxs)("div",{className:"card-tags",children:[(0,i.jsx)("span",{className:"tag",children:"Database"}),(0,i.jsx)("span",{className:"tag",children:"Mockup"})]})]})]})]})})})]})]})]})},{})})),console.log("React render called")}else console.error("Root element #app not found!"),document.body.innerHTML='<div style="padding: 20px; color: red;">Error: Root element #app not found</div>'}catch(e){console.error("Fatal error mounting React:",e),document.body.innerHTML=`<div style="padding: 20px; color: red;">Error: ${e.message}</div>`}window.onerror=function(e,n,t,i,o){return console.error("Global error:",e,"at",n,t,i,o),!1},window.addEventListener("unhandledrejection",function(e){console.error("Unhandled promise rejection:",e.reason)})}},a={};function r(e){var n=a[e];if(void 0!==n)return n.exports;var t=a[e]={exports:{}};return o[e](t,t.exports,r),t.exports}r.m=o,r.o=(e,n)=>Object.prototype.hasOwnProperty.call(e,n),e=[],r.O=(n,t,i,o)=>{if(t){o=o||0;for(var a=e.length;a>0&&e[a-1][2]>o;a--)e[a]=e[a-1];e[a]=[t,i,o];return}for(var s=1/0,a=0;a<e.length;a++){for(var[t,i,o]=e[a],d=!0,l=0;l<t.length;l++)(!1&o||s>=o)&&Object.keys(r.O).every(e=>r.O[e](t[l]))?t.splice(l--,1):(d=!1,o<s&&(s=o));if(d){e.splice(a--,1);var c=i();void 0!==c&&(n=c)}}return n},n={410:0},r.O.j=e=>0===n[e],t=(e,t)=>{var i,o,[a,s,d]=t,l=0;if(a.some(e=>0!==n[e])){for(i in s)r.o(s,i)&&(r.m[i]=s[i]);if(d)var c=d(r)}for(e&&e(t);l<a.length;l++)o=a[l],r.o(n,o)&&n[o]&&n[o][0](),n[o]=0;return r.O(c)},(i=self.webpackChunkrustwebui_frontend=self.webpackChunkrustwebui_frontend||[]).forEach(t.bind(null,0)),i.push=t.bind(null,i.push.bind(i));var s=r.O(void 0,["783"],()=>r(650));s=r.O(s)})();