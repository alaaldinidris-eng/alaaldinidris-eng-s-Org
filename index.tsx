import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical Failure: Root element not found");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err: any) {
    console.error("Mounting Error:", err);
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: system-ui; text-align: center; color: #ef4444; background: white; min-height: 100vh;">
        <h1 style="font-weight: 800; font-size: 24px;">Failed to Launch App</h1>
        <p style="color: #64748b; margin-top: 10px;">${err?.message || "An unexpected error occurred during rendering."}</p>
        <div style="margin-top: 20px; padding: 15px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; font-family: monospace; font-size: 12px; display: inline-block; text-align: left; max-width: 90%;">
          ${err?.stack ? err.stack.split('\n').slice(0, 3).join('<br/>') : ''}
        </div>
        <br/>
        <button onclick="location.reload()" style="margin-top: 25px; padding: 12px 24px; background: #166534; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(22, 101, 52, 0.2);">
          Retry Load
        </button>
      </div>
    `;
  }
}