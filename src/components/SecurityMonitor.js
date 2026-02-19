/*
 * VigilAero - Advanced UAV Protection Platform
 * Copyright (c) 2025 VigilAero. All rights reserved.
 *
 * ENTERPRISE EDITION - Refined for regulatory/SOC environments
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Activity, CheckCircle, Shield, Wifi, Lock, Satellite, GraduationCap } from 'lucide-react';
import LiveTelemetry from './LiveTelemetry';
import MapPanel from './MapPanel';

const SecurityMonitor = ({
  alerts = [],
  incidents = [],
  securityEvents = [],
  activeThreat = null,
  focusedDroneId = null,
  fleetRisk = {},
}) => {
  const [securityStatus, setSecurityStatus] = useState({
    communication: { status: 'secure', strength: 98, encryption: 'AES-256' },
    authentication: { status: 'active', sessions: 1, lastLogin: '2 min ago' },
    encryption: { status: 'enabled', protocol: 'AES-256', keyRotation: 'Active' },
    intrusion: { status: 'none', attempts: 0, lastScan: '1 min ago' },
    gps: { status: 'secure', satellites: 12, accuracy: '0.5m' },
    firmware: { status: 'updated', version: 'v2.1.3', lastUpdate: '2 days ago' },
  });

  const [scanning, setScanning] = useState(false);
  const [selectedDrone, setSelectedDrone] = useState(focusedDroneId || null);
  const [systemAlerts, setSystemAlerts] = useState([]);

  // Update when focusedDroneId prop changes
  useEffect(() => {
    if (focusedDroneId) {
      setSelectedDrone(focusedDroneId);
      console.log('📡 Security Monitor now focusing on drone:', focusedDroneId);
    }
  }, [focusedDroneId]);

  // Poll security events from backend
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('vigil_token');
        const res = await fetch('http://127.0.0.1:8010/security/events', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        
        setSystemAlerts(
          data.map((evt) => ({
            id: `${evt.timestamp}-${evt.type}`,
            type: evt.type,
            severity: evt.type.includes('failure')
              ? 'warning'
              : evt.type.includes('violation')
              ? 'danger'
              : evt.type.includes('threat')
              ? 'danger'
              : evt.type.includes('response')
              ? 'success'
              : 'info',
            message: `${evt.type.replace(/_/g, ' ').toUpperCase()} - ${
              evt.details.message || evt.details.threat || evt.details.response || 'Event logged'
            }`,
            timestamp: new Date(evt.timestamp),
            droneId: evt.details?.drone_id || evt.drone_id,
          }))
        );
      } catch (err) {
        console.error('Failed fetching security events', err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const startSecurityScan = async () => {
    setScanning(true);

    try {
      const token = localStorage.getItem('vigil_token');

      const headers = {
        Accept: 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch('http://127.0.0.1:8010/system/scan', {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Security scan failed:', res.status, text);
      } else {
        const data = await res.json();
        setSecurityStatus((prev) => ({
          ...prev,
          communication: {
            ...prev.communication,
            strength:
              typeof data.link_quality === 'number'
                ? data.link_quality
                : prev.communication.strength,
            status:
              data.link_status === 'degraded'
                ? 'vulnerable'
                : prev.communication.status,
          },
          gps: {
            ...prev.gps,
            status: data.gps_anomaly ? 'vulnerable' : prev.gps.status,
            accuracy:
              typeof data.gps_accuracy === 'number'
                ? `${data.gps_accuracy.toFixed(1)}m`
                : prev.gps.accuracy,
          },
          intrusion: {
            ...prev.intrusion,
            status:
              typeof data.intrusion_attempts === 'number' &&
              data.intrusion_attempts > 0
                ? 'detected'
                : 'none',
            attempts:
              typeof data.intrusion_attempts === 'number'
                ? data.intrusion_attempts
                : prev.intrusion.attempts,
            lastScan: 'just now',
          },
        }));
      }
    } catch (err) {
      console.error('Error during security scan:', err);
    } finally {
      setScanning(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'secure':
      case 'active':
      case 'enabled':
      case 'updated':
      case 'none':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'detected':
      case 'vulnerable':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      default:
        return <Activity className="w-5 h-5 text-amber-400" />;
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'threat_detected':
      case 'threat_simulated':
        return AlertTriangle;
      case 'response_executed':
      case 'incident_response':
        return CheckCircle;
      case 'system_status':
        return Activity;
      default:
        return CheckCircle;
    }
  };

  const getAlertColor = (severityRaw) => {
    const severity = (severityRaw || '').toString().toLowerCase();
    switch (severity) {
      case 'critical':
      case 'danger':
        return 'border-rose-500/30 bg-rose-950/30 text-rose-200';
      case 'high':
      case 'warning':
        return 'border-amber-500/30 bg-amber-950/30 text-amber-200';
      case 'medium':
        return 'border-yellow-500/30 bg-yellow-950/30 text-yellow-200';
      case 'info':
      case 'success':
        return 'border-blue-500/30 bg-blue-950/30 text-blue-200';
      default:
        return 'border-slate-700/30 bg-slate-900/30 text-slate-200';
    }
  };

  // Combine alerts from props and backend
  const allAlerts = [...alerts, ...systemAlerts];

  // Filter alerts and incidents by focused drone if one is selected
  const filteredAlerts = selectedDrone
    ? allAlerts.filter((alert) => alert.droneId === selectedDrone || (alert.message && alert.message.includes(selectedDrone)))
    : allAlerts;

  const filteredIncidents = selectedDrone
    ? incidents.filter(
        (incident) =>
          incident.drone_id === selectedDrone || incident.droneId === selectedDrone
      )
    : incidents;

  return (
    <div className="space-y-10">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Focused Drone Context Banner - ENTERPRISE: Refined */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {selectedDrone && (
        <div className="rounded-xl border border-blue-500/30 bg-slate-900/80 px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-blue-300/80 uppercase tracking-wider">
                    Active Monitor Context
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-lg font-bold text-blue-50 font-mono">
                    {selectedDrone}
                  </span>
                  <span className="text-xs text-blue-300/60">
                    Telemetry & security events filtered
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedDrone(null)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-blue-300 hover:text-blue-100 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 hover:border-slate-600 transition-all"
            >
              View Fleet
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Active Threat Alert Banner - ENTERPRISE: Keep critical styling */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeThreat && (
        <div className="rounded-xl border border-rose-500/40 bg-slate-900/90 overflow-hidden shadow-xl">
          {/* Training Label Strip */}
          <div className="bg-amber-500/20 border-b border-amber-500/30 px-6 py-2">
            <div className="flex items-center justify-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                TRAINING SIMULATION — No live drone impacted
              </span>
            </div>
          </div>
          
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-rose-500/20 border border-rose-500/40 animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-rose-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-200 mb-1">
                    🚨 Simulation Active: {activeThreat.name}
                  </h3>
                  <p className="text-xs text-rose-300/80 font-mono">
                    Target: {activeThreat.droneId || 'Unspecified'} · 
                    Severity: <span className="font-bold">{activeThreat.severity}</span> · 
                    Started: {activeThreat.startedAt
                      ? activeThreat.startedAt.toLocaleTimeString()
                      : 'just now'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                <span className="text-xs font-bold text-rose-200 uppercase tracking-wider">
                  In Progress
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Key Metrics Dashboard - ENTERPRISE: Cleaner cards */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Threats */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 p-5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Threats
            </p>
            <p className="text-2xl font-bold text-rose-400 tabular-nums">
              {selectedDrone ? filteredIncidents.length : incidents.length}
            </p>
            <p className="text-xs text-slate-500">Requiring response</p>
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 p-5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              System Health
            </p>
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">
              99.97%
            </p>
            <p className="text-xs text-slate-500">Operational uptime</p>
          </div>
        </div>

        {/* Signal Strength */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 p-5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Wifi className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Link Quality
            </p>
            <p className="text-2xl font-bold text-blue-400 tabular-nums">
              {securityStatus.communication.strength}%
            </p>
            <p className="text-xs text-slate-500">RF signal strength</p>
          </div>
        </div>

        {/* GPS Satellites */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 p-5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Satellite className="w-5 h-5 text-violet-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              GPS Lock
            </p>
            <p className="text-2xl font-bold text-violet-400 tabular-nums">
              {securityStatus.gps.satellites}
            </p>
            <p className="text-xs text-slate-500">Active satellites</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Real-time Security Alerts - ENTERPRISE: Refined */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {filteredAlerts.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 overflow-hidden shadow-lg">
          <div className="border-b border-slate-800/60 px-6 py-4 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-50">Real-time Security Alerts</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedDrone ? `Filtered for ${selectedDrone}` : 'Fleet-wide event stream'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-2.5 max-h-80 overflow-y-auto">
            {filteredAlerts
              .slice(-10)
              .reverse()
              .map((alert) => {
                const Icon = getAlertIcon(alert.type);
                const ts =
                  alert.timestamp instanceof Date
                    ? alert.timestamp
                    : new Date(alert.timestamp || Date.now());
                return (
                  <div
                    key={alert.id}
                    className={`rounded-lg border p-3.5 ${getAlertColor(alert.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm mb-1">{alert.message}</p>
                        <p className="text-xs opacity-75 font-mono">
                          {ts.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Active Security Incidents - ENTERPRISE: Refined with training labels */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {filteredIncidents.length > 0 && (
        <div className="rounded-xl border border-rose-500/30 bg-slate-900/80 overflow-hidden shadow-lg">
          <div className="border-b border-rose-900/30 px-6 py-4 bg-rose-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40">
                  <AlertTriangle className="w-5 h-5 text-rose-300" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-rose-200">Active Security Incidents</h2>
                  <p className="text-xs text-rose-300/80 mt-0.5">
                    {selectedDrone ? `${filteredIncidents.length} incident(s) for ${selectedDrone}` : `${filteredIncidents.length} fleet-wide incident(s)`}
                  </p>
                </div>
              </div>
              
              {/* Training Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                  Training Mode
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-3">
            {filteredIncidents.map((incident, index) => {
              const confidence =
                typeof incident.confidence === 'number' ? incident.confidence : 1;
              const ts =
                incident.timestamp instanceof Date
                  ? incident.timestamp
                  : new Date(incident.timestamp || Date.now());
              const sev = (incident.severity || '').toString().toLowerCase();
              const severityColor =
                sev === 'critical'
                  ? 'bg-rose-500/20 text-rose-200 border-rose-500/40'
                  : sev === 'high'
                  ? 'bg-orange-500/20 text-orange-200 border-orange-500/40'
                  : 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40';

              return (
                <div
                  key={index}
                  className="rounded-lg border border-rose-700/30 bg-rose-950/20 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-rose-200 mb-1.5">{incident.name}</h3>
                      {(incident.drone_id || incident.droneId) && (
                        <p className="text-sm text-slate-300 font-mono mb-1">
                          Target: {incident.drone_id || incident.droneId}
                        </p>
                      )}
                      <p className="text-sm text-slate-300 mb-1">
                        Confidence: <span className="font-mono">{(confidence * 100).toFixed(1)}%</span>
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        Detected: {ts.toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${severityColor}`}>
                      {sev.toUpperCase()}
                    </span>
                  </div>
                  {incident.pattern && (
                    <div className="mt-2.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <p className="text-xs text-slate-300">
                        <span className="font-semibold text-slate-200">Attack Pattern:</span> {incident.pattern}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Security Subsystem Status Grid - ENTERPRISE: Ultra-clean cards */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-slate-800/60" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Security Subsystems
          </span>
          <div className="h-px flex-1 bg-slate-800/60" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Communication */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4 hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Wifi className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-slate-100 text-sm">Communication</span>
              </div>
              {getStatusIcon(securityStatus.communication.status)}
            </div>
            <div className="space-y-1.5 text-sm text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Signal:</span>
                <span className="font-mono">{securityStatus.communication.strength}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Encryption:</span>
                <span className="font-mono">{securityStatus.communication.encryption}</span>
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4 hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-slate-100 text-sm">Authentication</span>
              </div>
              {getStatusIcon(securityStatus.authentication.status)}
            </div>
            <div className="space-y-1.5 text-sm text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Sessions:</span>
                <span className="font-mono">{securityStatus.authentication.sessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Login:</span>
                <span className="font-mono">{securityStatus.authentication.lastLogin}</span>
              </div>
            </div>
          </div>

          {/* Encryption */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4 hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-slate-100 text-sm">Encryption</span>
              </div>
              {getStatusIcon(securityStatus.encryption.status)}
            </div>
            <div className="space-y-1.5 text-sm text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Protocol:</span>
                <span className="font-mono">{securityStatus.encryption.protocol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Key Rotation:</span>
                <span className="font-mono">{securityStatus.encryption.keyRotation}</span>
              </div>
            </div>
          </div>

          {/* Intrusion Detection */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4 hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span className="font-semibold text-slate-100 text-sm">Intrusion</span>
              </div>
              {getStatusIcon(securityStatus.intrusion.status)}
            </div>
            <div className="space-y-1.5 text-sm text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Attempts:</span>
                <span className="font-mono">{securityStatus.intrusion.attempts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Scan:</span>
                <span className="font-mono">{securityStatus.intrusion.lastScan}</span>
              </div>
            </div>
          </div>

          {/* GPS Security */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4 hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Satellite className="w-5 h-5 text-indigo-400" />
                <span className="font-semibold text-slate-100 text-sm">GPS Security</span>
              </div>
              {getStatusIcon(securityStatus.gps.status)}
            </div>
            <div className="space-y-1.5 text-sm text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Satellites:</span>
                <span className="font-mono">{securityStatus.gps.satellites}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Accuracy:</span>
                <span className="font-mono">{securityStatus.gps.accuracy}</span>
              </div>
            </div>
          </div>

          {/* Firmware */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4 hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-orange-400" />
                <span className="font-semibold text-slate-100 text-sm">Firmware</span>
              </div>
              {getStatusIcon(securityStatus.firmware.status)}
            </div>
            <div className="space-y-1.5 text-sm text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Version:</span>
                <span className="font-mono">{securityStatus.firmware.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Updated:</span>
                <span className="font-mono">{securityStatus.firmware.lastUpdate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TACTICAL MAP - VISUALLY HIDDEN (Code preserved) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <LiveTelemetry droneId={selectedDrone} />
          </div>
          <div className="lg:col-span-2">
            <MapPanel
              focusedDroneId={selectedDrone}
              fleetRisk={fleetRisk}
              onDroneSelect={(droneId) => setSelectedDrone(droneId)}
              variant="tactical"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitor;