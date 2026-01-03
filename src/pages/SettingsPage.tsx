import React from 'react';

export default function SettingsPage() {
  return (
    <div className="page">
      <div className="card">
        <div className="cardHeader">
          <h2>Settings</h2>
          <p className="muted">UI shell settings (local-only).</p>
        </div>

        <div className="formGrid">
          <div>
            <label className="label">Appearance</label>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <div className="muted">Theme</div>
                <div>Dark (default)</div>
              </div>
              <button className="btn" type="button" disabled title="Stub">
                Change
              </button>
            </div>
          </div>

          <div>
            <label className="label">Account</label>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <div className="muted">Authorization</div>
                <div>Authorized (dummy)</div>
              </div>
              <button className="btn" type="button" disabled title="Stub">
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
