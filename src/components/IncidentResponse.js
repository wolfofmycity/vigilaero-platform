import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Shield, RefreshCw, Info } from 'lucide-react';

const MITIGATION_PLAYBOOK = {
  gps_spoofing: [
    {
      id: "rth",
      label: "Return-To-Home",
      description: "Initiate autonomous return to the launch point",
      severity: "high",
      eta: "30s",
    },
    {
      id: "switch_nav",
      label: "Switch Navigation Mode",
      description: "Switch to inertial + visual navigation fallback",
      severity: "medium",
      eta: "45s",
    },
    {
      id: "lock_gps",
      label: "Lock GPS Inputs",
      description: "Freeze GPS input stream and rely on trusted sensors",
      severity: "medium",
      eta: "20s",
    },
  ],
  rf_jamming: [
    {
      id: "freq_hop",
      label: "Enable Frequency Hopping",
      description: "Switch RF channel and enable hopping mode",
      severity: "high",
      eta: "15s",
    },
    {
      id: "failover_lte",
      label: "Failover to LTE/5G Link",
      description: "Switch command & telemetry to cellular link (if available)",
      severity: "high",
      eta: "25s",
    },
    {
      id: "land_safe",
      label: "Land at Safe Point",
      description: "Initiate safe landing routine due to comms instability",
      severity: "medium",
      eta: "40s",
    },
  ],

  command_injection: [
    {
      id: "isolate_operator_session",
      label: "Isolate Operator Session",
      description: "Revoke the operator session/token and force re-authentication",
      severity: "critical",
      eta: "10s",
    },
    {
      id: "block_payload_signature",
      label: "Block Payload Signature",
      description: "Add a temporary rule to block the detected command/payload pattern",
      severity: "high",
      eta: "30s",
    },
    {
      id: "enable_strict_input_validation",
      label: "Enable Strict Input Validation",
      description: "Toggle strict input validation mode for command channels",
      severity: "medium",
      eta: "2m",
    },
  ],

  rf_link_hijack: [
    {
      id: "rotate_link_keys",
      label: "Rotate Link Session Keys",
      description: "Rotate RF/link encryption keys and re-establish secure link",
      severity: "critical",
      eta: "45s",
    },
    {
      id: "force_lost_link_procedure",
      label: "Force Lost-Link Procedure",
      description: "Trigger lost-link procedure (RTH/hover/land) per policy",
      severity: "high",
      eta: "30s",
    },
    {
      id: "lockdown_gcs_access",
      label: "Lockdown GCS Access",
      description: "Restrict GCS access to approved operator identities only",
      severity: "medium",
      eta: "2m",
    },
  ],

  unauthorized_access: [
    {
      id: "revoke_access",
      label: "Revoke Access and Rotate Credentials",
      description: "Revoke access for suspicious identity and rotate credentials",
      severity: "high",
      eta: "1m",
    },
    {
      id: "enable_mfa_stepup",
      label: "Require Step-Up MFA",
      description: "Enable step-up MFA for sensitive drone actions",
      severity: "medium",
      eta: "2m",
    },
  ]
};

const IncidentResponse = () => {
  const [backendIncidents, setBackendIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const fetchActive = async () => {
    setLoadingIncidents(true);
    setLoadError(null);

    try {
      const token = localStorage.getItem("vigil_token");

      const res = await fetch("http://127.0.0.1:8010/api/incidents/active", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Active incidents fetch failed:", res.status, text);
        setBackendIncidents([]);
        setLoadingIncidents(false);
        return;
      }

      const data = await res.json();

      const incidents = Array.isArray(data?.incidents)
        ? data.incidents
        : Array.isArray(data)
          ? data
          : [];

      setBackendIncidents(incidents);
      setLoadingIncidents(false);
    } catch (e) {
      console.error("Active incidents network error:", e);
      setLoadError("Network error contacting backend.");
      setBackendIncidents([]);
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    fetchActive();
    const t = setInterval(fetchActive, 2500);
    return () => clearInterval(t);
  }, []);

  const getSeverityBadgeClass = (severity) => {
    const sev = (severity || '').toString().toLowerCase();
    switch (sev) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-300 border border-rose-500/30';
      case 'high':
        return 'bg-amber-500/10 text-amber-300 border border-amber-500/30';
      case 'medium':
        return 'bg-blue-500/10 text-blue-300 border border-blue-500/30';
      case 'low':
      default:
        return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30';
    }
  };

  const getRecommendedActions = (incident) => {
    const threat = (incident?.threat_type || "").toString().toLowerCase();
    return MITIGATION_PLAYBOOK[threat] || [];
  };

  const handleResponseAction = async (incident, action) => {
    try {
      const token = localStorage.getItem("vigil_token");
      if (!token) throw new Error("Missing token");

      const res = await fetch("http://127.0.0.1:8010/api/incident/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          drone_id: incident?.drone_id || "",
          response_id: action?.id || "",
          response_name: action?.label || action?.name || "",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Incident respond failed:", res.status, text);
        return;
      }

      await fetchActive();
    } catch (e) {
      console.error("Incident respond network error:", e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header - ENTERPRISE: Clean */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 overflow-hidden shadow-lg">
        <div className="border-b border-slate-800/60 px-6 py-4 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-50">Active Security Incidents</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {backendIncidents.length} incident{backendIncidents.length !== 1 ? 's' : ''} requiring response
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {loadingIncidents && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                    Updating
                  </span>
                </div>
              )}
              <button
                onClick={fetchActive}
                disabled={loadingIncidents}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700/60 text-slate-300 hover:bg-slate-800/60 hover:border-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {loadError && (
          <div className="px-6 py-4 border-b border-slate-800/60 bg-rose-500/5">
            <div className="flex items-start gap-3 text-rose-300">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Connection Error</p>
                <p className="text-xs mt-1 opacity-80">{loadError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loadingIncidents && backendIncidents.length === 0 && !loadError && (
          <div className="p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300 mb-1">All Clear</h4>
              <p className="text-xs text-slate-500">No active security incidents detected</p>
            </div>
          </div>
        )}

        {/* Incidents List */}
        {backendIncidents.length > 0 && (
          <div className="p-5 space-y-3">
            {backendIncidents.map((incident) => {
              const severityBadgeClass = getSeverityBadgeClass(incident.severity);
              const recommended = getRecommendedActions(incident);
              const isSelected = selectedIncident?.incident_id === incident.incident_id;

              return (
                <div
                  key={incident.incident_id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`rounded-xl border p-5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-slate-800/60 bg-slate-950/40 hover:border-slate-700/80'
                  }`}
                >
                  {/* Incident Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-slate-100">
                          {incident.threat_type?.replaceAll("_", " ").replace(/\b\w/g, l => l.toUpperCase()) || "Security Incident"}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${severityBadgeClass}`}>
                          {(incident.severity || "low").toString().toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-400">
                          Target: <span className="text-slate-300 font-mono">{incident.drone_id || "—"}</span>
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {incident.created_at ? new Date(incident.created_at).toLocaleString() : "Unknown time"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Actions */}
                  {recommended.length === 0 ? (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-200">No Automated Response Available</p>
                        <p className="text-xs text-amber-300/80 mt-0.5">Manual intervention required</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Recommended Mitigations
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {recommended.map((action) => {
                          const actionClass = getSeverityBadgeClass(action.severity);

                          return (
                            <button
                              key={action.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResponseAction(incident, action);
                              }}
                              className={`text-left rounded-lg px-4 py-3 transition-all ${actionClass} hover:opacity-80`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-1">
                                  <div className="text-sm font-bold">
                                    {action.label}
                                  </div>
                                  <div className="text-xs opacity-80">
                                    {action.description}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/20 border border-white/10">
                                  <Clock className="w-3.5 h-3.5 opacity-60" />
                                  <span className="text-xs font-semibold">{action.eta || "—"}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Response Procedures Guide - ENTERPRISE: Clean documentation */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 overflow-hidden shadow-lg">
        <div className="border-b border-slate-800/60 px-6 py-4 bg-slate-900/60">
          <h2 className="text-sm font-bold text-slate-50">Standard Response Procedures</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Recommended actions by severity level
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <h3 className="text-sm font-bold text-rose-200">Critical Severity</h3>
            </div>
            <p className="text-sm text-slate-300">
              Immediate emergency landing required. Isolate drone from network and initiate full
              forensic analysis.
            </p>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <h3 className="text-sm font-bold text-amber-200">High Severity</h3>
            </div>
            <p className="text-sm text-slate-300">
              Isolate drone and assess threat. Prepare for emergency landing if threat escalates.
            </p>
          </div>

          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <h3 className="text-sm font-bold text-blue-200">Medium Severity</h3>
            </div>
            <p className="text-sm text-slate-300">
              Investigate and collect forensic data. Monitor drone telemetry for anomalies.
            </p>
          </div>

          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-bold text-emerald-200">Low Severity</h3>
            </div>
            <p className="text-sm text-slate-300">
              Acknowledge and document. Continue normal operations with enhanced monitoring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentResponse;