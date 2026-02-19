import React, { useEffect, useState } from 'react';

const API_BASE = "http://127.0.0.1:8010";

// ✅ Single canonical auth header helper (NO duplicates)
const getAuthHeaders = () => {
  const token = localStorage.getItem("vigil_token");
  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };
};

// ✅ Dev-only helper (does NOT change your real login flow)
const loginAsAdmin = async () => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "admin",
      password: "admin",
    }),
  });

  if (!res.ok) return false;

  const data = await res.json();
  if (data?.access_token) {
    localStorage.setItem("vigil_token", data.access_token);
    return true;
  }

  return false;
};

const logout = () => {
  localStorage.removeItem("vigil_token");
};

const SecuritySettings = () => {
  // ─── Zero Trust state ───
  const [ztEnabled, setZtEnabled] = useState(true);
  const [ztRolesText, setZtRolesText] = useState('Admin,Operator');
  const [ztTimeout, setZtTimeout] = useState(15);
  const [ztLoading, setZtLoading] = useState(false);
  const [ztSaving, setZtSaving] = useState(false);
  const [ztError, setZtError] = useState('');
  const [ztMessage, setZtMessage] = useState('');

  // ─── Load Zero Trust config from backend ───
  const loadZeroTrustConfig = async () => {
    setZtError('');
    setZtMessage('');
    setZtLoading(true);

    try {
      const res = await fetch(`${API_BASE}/security/zerotrust`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (res.status === 401 || res.status === 403) {
        setZtError('Unauthorized — login as admin first.');
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        setZtError(`Failed to load config (${res.status}): ${text}`);
        return;
      }

      const data = await res.json();
      setZtEnabled(!!data.enabled);
      setZtRolesText((data.roles || []).join(','));
      setZtTimeout(Number(data.timeout ?? 15));
      setZtMessage('Zero Trust config loaded from backend.');
    } catch (err) {
      console.error(err);
      setZtError('Error contacting backend.');
    } finally {
      setZtLoading(false);
    }
  };

  // ─── Save Zero Trust config to backend ───
  const saveZeroTrustConfig = async () => {
    setZtError('');
    setZtMessage('');
    setZtSaving(true);

    const roles = ztRolesText
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`${API_BASE}/security/zerotrust`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          enabled: ztEnabled,
          roles,
          timeout: Number(ztTimeout),
        }),
      });

      if (res.status === 401 || res.status === 403) {
        const text = await res.text();
        setZtError(`Save failed (${res.status}): ${text}`);
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        setZtError(`Save failed (${res.status}): ${text}`);
        return;
      }

      const data = await res.json();
      setZtEnabled(!!data.enabled);
      setZtRolesText((data.roles || []).join(','));
      setZtTimeout(Number(data.timeout ?? 15));
      setZtMessage('Zero Trust config saved.');
    } catch (err) {
      console.error(err);
      setZtError('Error contacting backend while saving.');
    } finally {
      setZtSaving(false);
    }
  };

  useEffect(() => {
    loadZeroTrustConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ToggleSwitch = ({ checked = false, onChange }) => (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className={`slider round ${checked ? 'bg-green-500' : 'bg-gray-600'}`}></span>
    </label>
  );

  return (
    <>
      {/* ─── DEV-ONLY login controls (hide in production) ─── */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={async () => {
              try {
                const ok = await loginAsAdmin();
                alert(ok ? 'Logged in as admin' : 'Login failed');
              } catch (e) {
                alert('Login failed');
              }
            }}
            className="px-3 py-2 bg-blue-600 rounded-md text-sm"
          >
            Admin Login (dev)
          </button>

          <button
            onClick={() => {
              logout();
              alert('Token cleared');
            }}
            className="px-3 py-2 bg-gray-700 rounded-md text-sm"
          >
            Clear Token
          </button>

          <span className="text-xs text-white/60">Dev-only — remove before pilot.</span>
        </div>
      )}

      {/* ─── Zero Trust Access Control Card ─── */}
      <div className="space-y-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">Zero Trust Access Control</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300 mr-2">
                {ztEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <ToggleSwitch
                checked={ztEnabled}
                onChange={(e) => setZtEnabled(e.target.checked)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Allowed Roles
              </label>
              <input
                type="text"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={ztRolesText}
                onChange={(e) => setZtRolesText(e.target.value)}
                placeholder="Admin,Operator"
              />
              <p className="mt-1 text-xs text-gray-400">
                Comma-separated list. Only these roles can access protected areas.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={ztTimeout}
                min={5}
                max={240}
                onChange={(e) => setZtTimeout(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-400">
                Between 5 and 240 minutes. Shorter timeouts = stricter Zero Trust.
              </p>
            </div>

            <div className="flex flex-col gap-2 justify-end">
              <button
                onClick={loadZeroTrustConfig}
                disabled={ztLoading}
                className="px-3 py-2 bg-gray-700 rounded-md text-sm disabled:opacity-60"
              >
                {ztLoading ? 'Loading…' : 'Reload from backend'}
              </button>
              <button
                onClick={saveZeroTrustConfig}
                disabled={ztSaving}
                className="px-3 py-2 bg-blue-600 rounded-md text-sm disabled:opacity-60"
              >
                {ztSaving ? 'Saving…' : 'Save Zero Trust Config'}
              </button>
            </div>
          </div>

          {ztError && (
            <p className="mt-3 text-sm text-red-400">
              {ztError}
            </p>
          )}
          {ztMessage && !ztError && (
            <p className="mt-3 text-sm text-green-400">
              {ztMessage}
            </p>
          )}
        </div>

        {/* ─── Existing cards (UI unchanged) ─── */}

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="font-medium mb-4 text-white">Security Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Encryption Level</label>
              <select className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>AES-256</option>
                <option>AES-128</option>
                <option>ChaCha20</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Authentication Method</label>
              <select className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Certificate-based</option>
                <option>Pre-shared Key</option>
                <option>OAuth 2.0</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Geo-fence Radius (m)</label>
              <input
                type="number"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue="1000"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="font-medium mb-4 text-white">Emergency Protocols</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Auto-land on signal loss</span>
              <ToggleSwitch checked={true} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Return-to-home on intrusion</span>
              <ToggleSwitch checked={true} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Data wipe on compromise</span>
              <ToggleSwitch checked={false} onChange={() => {}} />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="font-medium mb-4 text-white">Compliance & Reporting</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">SOC 2 Compliance Logging</span>
              <ToggleSwitch checked={true} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">ISO 27001 Audit Trail</span>
              <ToggleSwitch checked={true} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Automated Compliance Reports</span>
              <ToggleSwitch checked={true} onChange={() => {}} />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="font-medium mb-4 text-white">Notification Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Alert Threshold</label>
              <select className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>High Priority Only</option>
                <option>Medium and High</option>
                <option>All Alerts</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Email Notifications</span>
              <ToggleSwitch checked={true} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">SMS Alerts for Critical Events</span>
              <ToggleSwitch checked={true} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Push Notifications</span>
              <ToggleSwitch checked={true} onChange={() => {}} />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #4b5563;
          transition: 0.4s;
          border-radius: 24px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #10b981;
        }
        input:checked + .slider:before {
          transform: translateX(26px);
        }
      `}</style>
    </>
  );
};

export default SecuritySettings;
