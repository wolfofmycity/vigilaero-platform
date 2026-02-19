import React, { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8001";

function getToken() {
  return localStorage.getItem("vigil_token");
}

const ZeroTrustAccess = () => {
  const [enabled, setEnabled] = useState(true);
  const [allowedRoles, setAllowedRoles] = useState(["admin", "operator"]);
  const [timeout, setTimeoutMinutes] = useState(15);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // --- Load settings from backend on mount ---
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setInfo("No token found. Use the 'Admin Login (dev)' button above first.");
      return;
    }

    async function fetchSettings() {
      try {
        setLoading(true);
        setError("");
        setInfo("");

        const res = await fetch(`${API_BASE}/security/zerotrust`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 403) {
          setError("Admin role required to view Zero Trust settings.");
          return;
        }

        if (!res.ok) {
          setError("Failed to load Zero Trust settings.");
          return;
        }

        const data = await res.json();
        setEnabled(Boolean(data.enabled));
        setAllowedRoles(Array.isArray(data.roles) ? data.roles : []);
        setTimeoutMinutes(data.timeout ?? 15);
        setInfo("Zero Trust settings loaded from backend.");
      } catch (e) {
        console.error(e);
        setError("Error talking to backend.");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // --- Helpers for roles checkboxes ---
  const toggleRole = (role) => {
    setAllowedRoles((current) =>
      current.includes(role)
        ? current.filter((r) => r !== role)
        : [...current, role]
    );
  };

  const isRoleChecked = (role) => allowedRoles.includes(role);

  // --- Save settings back to backend ---
  const handleSave = async () => {
    const token = getToken();
    if (!token) {
      alert("No token found. Use the 'Admin Login (dev)' button above first.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setInfo("");

      const body = {
        enabled,
        roles: allowedRoles,
        timeout: Number(timeout),
      };

      const res = await fetch(`${API_BASE}/security/zerotrust`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 403) {
        setError("Admin role required to save Zero Trust settings.");
        return;
      }

      if (!res.ok) {
        setError("Failed to save settings.");
        return;
      }

      const data = await res.json();
      setInfo(data.message || "Zero Trust settings saved.");
      alert("Zero Trust settings saved.");
    } catch (e) {
      console.error(e);
      setError("Error talking to backend while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-white">Zero Trust Access Control</h3>

        <label className="flex items-center gap-2 text-sm text-gray-200">
          <input
            type="checkbox"
            className="form-checkbox h-4 w-4"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enable
        </label>
      </div>

      {/* Status messages */}
      {loading && (
        <p className="text-sm text-blue-300 mb-3">
          Loading Zero Trust settings…
        </p>
      )}
      {error && (
        <p className="text-sm text-red-400 mb-3">
          {error}
        </p>
      )}
      {info && !loading && !error && (
        <p className="text-sm text-green-400 mb-3">
          {info}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Allowed roles */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">
            Allowed Roles
          </h4>
          <div className="space-y-2 bg-gray-900 rounded-lg p-3 border border-gray-700">
            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4"
                checked={isRoleChecked("admin")}
                onChange={() => toggleRole("admin")}
              />
              Admin
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4"
                checked={isRoleChecked("operator")}
                onChange={() => toggleRole("operator")}
              />
              Operator
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4"
                checked={isRoleChecked("observer")}
                onChange={() => toggleRole("observer")}
              />
              Observer
            </label>
          </div>
        </div>

        {/* Session timeout */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">
            Session Timeout (minutes)
          </h4>
          <input
            type="number"
            min={1}
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={timeout}
            onChange={(e) => setTimeoutMinutes(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            How long a Zero Trust session stays valid before re-auth is required.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-md text-sm font-medium text-white"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
};

export default ZeroTrustAccess;
