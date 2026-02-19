import React, { useEffect, useMemo, useState } from "react";
import { Activity } from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8010";

const getToken = () =>
  localStorage.getItem("vigil_token") || localStorage.getItem("access_token") || "";

const authHeaders = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const hardLogout = () => {
  localStorage.removeItem("vigil_token");
  localStorage.removeItem("access_token");
  window.location.href = "/login";
};

function coerceEvents(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.events)) return payload.events;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

export default function TelemetryLogs({ droneId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const url = useMemo(() => {
    const qs = droneId ? `?drone_id=${encodeURIComponent(droneId)}` : "";
    return `${API_BASE}/security/events${qs}`;
  }, [droneId]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(url, { headers: { ...authHeaders() } });

        if (res.status === 401 || res.status === 403) {
          hardLogout();
          return;
        }

        if (!res.ok) {
          if (alive) setLogs([]);
          return;
        }

        const data = await res.json();
        const events = coerceEvents(data);
        if (alive) setLogs(events);
      } catch {
        if (alive) setLogs([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    const t = setInterval(load, 1500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [url]);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 overflow-hidden shadow-lg">
      {/* Header - ENTERPRISE: Clean */}
      <div className="border-b border-slate-800/60 px-6 py-4 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-50">Forensic Log View — {droneId || 'All Drones'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Drone-specific event analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loading && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  Loading
                </span>
              </div>
            )}
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800/60 text-slate-300 border border-slate-700/60">
              {Array.isArray(logs) ? logs.length : 0} EVENTS
            </span>
          </div>
        </div>
      </div>

      {/* Log Entries - ENTERPRISE: Clean list */}
      <div className="p-5 space-y-2.5 max-h-[380px] overflow-auto">
        {(Array.isArray(logs) ? logs : []).map((e) => (
          <div
            key={e.id || `${e.ts}-${e.event_type}-${Math.random()}`}
            className="rounded-lg border border-slate-800/60 bg-slate-950/40 px-4 py-3 hover:border-slate-700/80 transition-colors"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-xs text-slate-400 font-mono">
                {e.ts ? new Date(e.ts).toLocaleString() : "—"}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {e.drone_id || e.droneId || "—"}
              </div>
            </div>

            <div className="text-sm text-slate-100 font-semibold mb-2">
              {e.event_type || "event"}
            </div>

            <div className="text-xs text-slate-400">
              <span className="text-slate-500">actor:</span>{" "}
              <span className="text-slate-300">{e.actor || "—"}</span>
              {" • "}
              <span className="text-slate-500">action:</span>{" "}
              <span className="text-slate-300">{e.action || "—"}</span>
              {" • "}
              <span className="text-slate-500">result:</span>{" "}
              <span className="text-slate-300">{e.result || "—"}</span>
            </div>
          </div>
        ))}

        {Array.isArray(logs) && logs.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-4">
              <Activity className="w-8 h-8 text-slate-500" />
            </div>
            <h4 className="text-sm font-semibold text-slate-300 mb-1">No Events Found</h4>
            <p className="text-xs text-slate-500">No security events recorded for {droneId || 'this drone'}</p>
          </div>
        )}
      </div>
    </div>
  );
}