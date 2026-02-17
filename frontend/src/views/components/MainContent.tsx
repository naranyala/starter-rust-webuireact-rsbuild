// Main content area with feature cards

import React from 'react';

interface MainContentProps {
  onOpenSystemInfo: () => void;
  onOpenSQLite: () => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  onOpenSystemInfo,
  onOpenSQLite,
}) => {
  return (
    <main className="main-content">
      <section className="cards-section">
        <div className="cards-grid two-cards">
          <div className="feature-card" onClick={onOpenSystemInfo}>
            <div className="card-icon">💻</div>
            <div className="card-content">
              <h3 className="card-title">System Information</h3>
              <p className="card-description">
                View detailed system information including OS, memory, CPU, and runtime statistics.
              </p>
              <div className="card-tags">
                <span className="tag">Hardware</span>
                <span className="tag">Stats</span>
              </div>
            </div>
          </div>

          <div className="feature-card" onClick={onOpenSQLite}>
            <div className="card-icon">🗄️</div>
            <div className="card-content">
              <h3 className="card-title">SQLite Database</h3>
              <p className="card-description">
                Interactive database viewer with sample data. Connects to backend SQLite integration.
              </p>
              <div className="card-tags">
                <span className="tag">Database</span>
                <span className="tag">Mockup</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
