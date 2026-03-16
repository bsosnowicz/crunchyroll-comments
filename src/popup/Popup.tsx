import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

interface ExtensionStatus {
  active: boolean;
  version: string;
}

const popupStyles = `
  body {
    min-width: 280px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .popup {
    padding: 16px;
    background: #fff;
  }

  .popup-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e5e5;
  }

  .popup-logo {
    width: 32px;
    height: 32px;
    background: #f47521;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 800;
    font-size: 14px;
  }

  .popup-title {
    font-size: 15px;
    font-weight: 700;
    color: #0f0f0f;
  }

  .popup-version {
    font-size: 11px;
    color: #909090;
    margin-top: 1px;
  }

  .status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
  }

  .status-label {
    font-size: 13px;
    color: #606060;
  }

  .status-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .status-badge--active {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .status-badge--inactive {
    background: #fce4ec;
    color: #c62828;
  }

  .popup-footer {
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1px solid #e5e5e5;
    font-size: 11px;
    color: #b0b0b0;
    text-align: center;
  }
`;

/**
 * Prosty popup rozszerzenia wyświetlający status i wersję.
 */
function Popup(): React.ReactElement {
  const [status, setStatus] = useState<ExtensionStatus | null>(null);

  useEffect(() => {
    // Zapytaj service worker o status
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response: ExtensionStatus) => {
      if (chrome.runtime.lastError) {
        console.error('[CrunchyrollComments Popup]', chrome.runtime.lastError);
        return;
      }
      setStatus(response);
    });
  }, []);

  const version = status?.version ?? chrome.runtime.getManifest().version;

  return (
    <>
      <style>{popupStyles}</style>
      <div className="popup">
        <div className="popup-header">
          <div className="popup-logo">CC</div>
          <div>
            <div className="popup-title">CrunchyrollComments</div>
            <div className="popup-version">v{version}</div>
          </div>
        </div>

        <div className="status-row">
          <span className="status-label">Status rozszerzenia</span>
          <span className={`status-badge ${status?.active ? 'status-badge--active' : 'status-badge--inactive'}`}>
            {status?.active ? 'Aktywne' : 'Ładowanie...'}
          </span>
        </div>

        <div className="status-row">
          <span className="status-label">Obsługiwane strony</span>
          <span className="status-label">Crunchyroll</span>
        </div>

        <div className="popup-footer">
          Komentarze są widoczne tylko lokalnie
        </div>
      </div>
    </>
  );
}

// Montuj popup
const root = document.getElementById('popup-root');
if (root) {
  createRoot(root).render(<Popup />);
}
