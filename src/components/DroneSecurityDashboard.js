import React, { useEffect, useMemo, useState } from "react";

import FleetOverview from "./security/FleetOverview";
import SecurityMonitor from "./SecurityMonitor";
import LiveTelemetry from "./LiveTelemetry";
import TelemetryLogs from "./TelemetryLogs";
import ThreatSimulation from "./ThreatSimulation";
import IncidentResponse from "./IncidentResponse";
import ComplianceMonitor from "./ComplianceMonitor";
import ProtectionSystems from "./ProtectionSystems";
import ReportGenerator from "./ReportGenerator";
import SecuritySettings from "./SecuritySettings";
import MapPanel from "./MapPanel";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8010";

// ✅ Auth consistency (single source of truth)
const TOKEN_KEY = "vigil_token";

const getToken = () => localStorage.getItem(TOKEN_KEY) || "";

const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleLogout = () => {
  localStorage.removeItem("vigil_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("dev_admin_token");
  localStorage.removeItem("token");
  window.location.href = "/login";
};

const TABS = [
  "Security Monitor",
  "Threat Simulation",
  "Incident Response",
  "Telemetry",
  "Compliance",
  "Protection Systems",
  "Security Settings",
  "Reports",
];

export default function DroneSecurityDashboard() {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATE - Single source of truth
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [activeTab, setActiveTab] = useState("Security Monitor");
  const [activeDroneId, setActiveDroneId] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState([]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DATA FETCHING - Backend polling
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const refreshIncidents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/incidents/active`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();

      const list = Array.isArray(data?.incidents)
        ? data.incidents
        : Array.isArray(data)
        ? data
        : [];

      const normalized = list.map((i) => ({
        id: i.incident_id,
        incident_id: i.incident_id,
        drone_id: i.drone_id,
        droneId: i.drone_id,
        severity: (i.severity || "high").toString().toLowerCase(),
        message: i.title || i.threat_type || "Security incident",
        name: i.title || i.threat_type || "Security incident",
        threat_type: i.threat_type,
        timestamp: i.created_at || new Date().toISOString(),
        created_at: i.created_at || undefined,
        status: (i.status || "active").toString().toLowerCase(),
      }));

      setIncidents(normalized);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
    }
  };

  useEffect(() => {
    refreshIncidents();
    const interval = setInterval(refreshIncidents, 1500);
    return () => clearInterval(interval);
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleDroneSelect = (droneId) => setActiveDroneId(droneId);

  const handleThreatTriggered = () => refreshIncidents();

  const handleIncidentResolved = (incidentId) => {
    setDismissedAlertIds((prev) => prev.filter((id) => id !== incidentId));
    refreshIncidents();
  };

  const handleBannerDismiss = (alertId) => {
    setDismissedAlertIds((prev) => [...prev, alertId]);
  };

  const handleBannerClick = (alert) => {
    if (alert?.drone_id) {
      setActiveDroneId(alert.drone_id);
      setActiveTab("Security Monitor");
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DERIVED STATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const activeBannerAlert = useMemo(() => {
    const severityRank = { critical: 3, high: 2, medium: 1, low: 0 };

    const candidates = incidents.filter(
      (alert) => alert.status === "active" && !dismissedAlertIds.includes(alert.id)
    );

    if (!candidates.length) return null;

    return candidates
      .slice()
      .sort(
        (a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0)
      )[0];
  }, [incidents, dismissedAlertIds]);

  const bannerSeverityClass =
    activeBannerAlert?.severity === "critical"
      ? "bg-rose-950/80 border-rose-500/60 text-rose-50"
      : activeBannerAlert?.severity === "high"
      ? "bg-amber-950/80 border-amber-500/60 text-amber-50"
      : "bg-slate-900/80 border-slate-700/60 text-slate-100";

  const fleetStats = {
    totalDrones: 4,
    activeThreats: incidents.length,
    degradedLinks: 0,
    complianceFailures: 0,
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HEADER - ENTERPRISE: Cleaner, no gradients */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/95 backdrop-blur-sm">
        <div className="max-w-[1920px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-slate-50">VigilAero</div>
            <div className="text-xs text-slate-500 font-medium">
              UAS Security & Compliance Platform
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-700/60 text-slate-300 hover:bg-slate-800/80 hover:text-white hover:border-slate-600 transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TABS - ENTERPRISE: Clean navigation */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="sticky top-[61px] z-40 border-b border-slate-800/60 bg-slate-950/95 backdrop-blur-sm">
        <div className="max-w-[1920px] mx-auto px-6 py-3">
          <div className="flex gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ALERT BANNER - ENTERPRISE: Simplified, high contrast */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeBannerAlert && (
        <div className="border-b border-slate-800/60 bg-slate-950">
          <div
            className={`max-w-[1920px] mx-auto px-6 py-3 flex items-center justify-between gap-4 border-l-4 ${bannerSeverityClass}`}
          >
            <button
              className="flex-1 text-left flex items-center gap-3 hover:opacity-80 transition-opacity"
              onClick={() => handleBannerClick(activeBannerAlert)}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/30">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              </span>
              <div>
                <div className="text-xs uppercase tracking-wide opacity-75 font-semibold">
                  {activeBannerAlert.severity === "critical"
                    ? "Critical Security Incident"
                    : "High-Severity Security Incident"}
                </div>
                <div className="text-sm font-bold">{activeBannerAlert.message}</div>
                <div className="text-xs opacity-80 mt-0.5">
                  Drone:{" "}
                  <span className="font-mono">
                    {activeBannerAlert.drone_id || "Unknown"}
                  </span>
                  {" • "}
                  {new Date(activeBannerAlert.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </button>

            <button
              onClick={() => handleBannerDismiss(activeBannerAlert.id)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-600/70 hover:bg-slate-800/60 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FLEET OVERVIEW */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="border-b border-slate-900/60">
        <FleetOverview
          fleetStats={fleetStats}
          selectedDrone={activeDroneId}
          onDroneSelect={handleDroneSelect}
          globalAlerts={incidents}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* STRATEGIC MAP */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <MapPanel
        focusedDroneId={activeDroneId}
        onDroneSelect={handleDroneSelect}
        variant="strategic"
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ACTIVE DRONE CONTEXT BAR - ENTERPRISE: Cleaner */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeDroneId && (
        <div className="max-w-[1920px] mx-auto px-6 pb-6">
          <div className="rounded-xl border border-blue-500/30 bg-slate-900/80 px-6 py-4 flex justify-between items-center shadow-lg">
            <div>
              <div className="text-xs uppercase text-blue-300/70 font-semibold tracking-wider">
                Active Drone Context
              </div>
              <div className="text-lg font-bold text-blue-50 font-mono mt-1">
                {activeDroneId}
              </div>
            </div>
            <button
              onClick={() => setActiveDroneId(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-all"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB CONTENT - Main operational area */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-[1920px] mx-auto w-full px-6 py-8 space-y-10">
        
        {/* Security Monitor */}
        {activeTab === "Security Monitor" && (
          <div className="space-y-10">
            <SecurityMonitor 
              focusedDroneId={activeDroneId} 
              alerts={incidents} 
              incidents={incidents} 
            />
            
            {/* 2-Column: LiveTelemetry (left) + Forensic Logs (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LiveTelemetry droneId={activeDroneId} />
              <TelemetryLogs droneId={activeDroneId} />
            </div>
          </div>
        )}

        {/* Threat Simulation */}
        {activeTab === "Threat Simulation" && (
          <ThreatSimulation 
            onThreatTriggered={handleThreatTriggered} 
            initialTargetDroneId={activeDroneId} 
          />
        )}

        {/* Incident Response */}
        {activeTab === "Incident Response" && (
          <IncidentResponse
            currentIncidents={incidents.filter(
              (i) => i.drone_id === activeDroneId || i.droneId === activeDroneId
            )}
            useBackendPolling={false}
            onResponseAction={(evt) => {
              if (evt?.event === "incident_resolved") {
                handleIncidentResolved(evt.incidentId);
              }
            }}
          />
        )}

        {/* Telemetry */}
        {activeTab === "Telemetry" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LiveTelemetry droneId={activeDroneId} />
            <TelemetryLogs droneId={activeDroneId} />
          </div>
        )}

        {/* Compliance */}
        {activeTab === "Compliance" && (
          <ComplianceMonitor
            droneId={activeDroneId}
            selectedDroneId={activeDroneId}
            isAdmin={true}
          />
        )}

        {/* Protection Systems */}
        {activeTab === "Protection Systems" && <ProtectionSystems />}

        {/* Security Settings */}
        {activeTab === "Security Settings" && <SecuritySettings />}

        {/* Reports */}
        {activeTab === "Reports" && <ReportGenerator />}
      </main>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FOOTER - ENTERPRISE: Minimal */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <footer className="mt-auto border-t border-slate-900/80 bg-slate-950/60">
        <div className="max-w-[1920px] mx-auto px-6 py-4 flex justify-between text-xs text-slate-500">
          <span>© 2025 VigilAero. All rights reserved.</span>
          <span>
            Regulatory Alignment: FAA 107/89 • EASA 2019/947 • ISO 27001/21434 (In Progress)
          </span>
          <span className="font-mono">Build 2.1.0.342</span>
        </div>
      </footer>
    </div>
  );
}
