import React, { useState } from 'react';
import { Shield, Radio, Satellite, Zap, AlertTriangle, Play, GraduationCap } from 'lucide-react';

const ThreatSimulation = ({ onThreatTriggered, initialTargetDroneId }) => {
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [targetDrone, setTargetDrone] = useState(initialTargetDroneId || 'UA-101');
  const [isRunning, setIsRunning] = useState(false);
  const [simulationLog, setSimulationLog] = useState([]);

  const threats = [
    {
      id: 'gps_spoofing',
      name: 'GPS Spoofing Attack',
      icon: Satellite,
      severity: 'high',
      description: 'Simulates GPS coordinate manipulation attack',
      color: 'amber',
      duration: '30s',
    },
    {
      id: 'rf_jamming',
      name: 'RF Signal Jamming',
      icon: Radio,
      severity: 'critical',
      description: 'Simulates radio frequency interference attack',
      color: 'rose',
      duration: '45s',
    },
    {
      id: 'command_injection',
      name: 'Command Injection',
      icon: Zap,
      severity: 'critical',
      description: 'Simulates unauthorized command injection',
      color: 'rose',
      duration: '20s',
    },
    {
      id: 'link_degradation',
      name: 'Link Degradation',
      icon: Shield,
      severity: 'medium',
      description: 'Simulates communication link quality degradation',
      color: 'yellow',
      duration: '60s',
    },
  ];

  const availableDrones = ['UA-101', 'UA-102', 'UA-103', 'UA-104'];

  const handleStartSimulation = async () => {
    if (!selectedThreat) return;

    setIsRunning(true);
    const logEntry = {
      id: Date.now(),
      timestamp: new Date(),
      threat: selectedThreat.name,
      target: targetDrone,
      status: 'running',
    };

    setSimulationLog((prev) => [logEntry, ...prev]);

    try {
      const token = localStorage.getItem('vigil_token');
      const response = await fetch('http://127.0.0.1:8010/api/threats/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_id: "default",
          drone_id: targetDrone,
          threat_type: selectedThreat.id,
          training: true,
        }),
      });

      if (response.ok) {
        setSimulationLog((prev) =>
          prev.map((entry) =>
            entry.id === logEntry.id ? { ...entry, status: 'completed' } : entry
          )
        );

        if (onThreatTriggered) {
          onThreatTriggered({
            threatType: selectedThreat.id,
            droneId: targetDrone,
            severity: selectedThreat.severity,
          });
        }
      } else {
        setSimulationLog((prev) =>
          prev.map((entry) =>
            entry.id === logEntry.id ? { ...entry, status: 'failed' } : entry
          )
        );
      }
    } catch (error) {
      console.error('Simulation failed:', error);
      setSimulationLog((prev) =>
        prev.map((entry) =>
          entry.id === logEntry.id ? { ...entry, status: 'failed' } : entry
        )
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Training Mode Banner - ENTERPRISE: Professional */}
      <div className="rounded-xl border border-amber-500/30 bg-slate-900/80 overflow-hidden shadow-lg">
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-6 py-3">
          <div className="flex items-center justify-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-300" />
            <span className="text-sm font-bold text-amber-200 uppercase tracking-wider">
              Training Environment — Simulated Threats Only
            </span>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-slate-300 text-center">
            This module enables controlled threat simulation for training and system validation.
            No live drones are affected during simulations.
          </p>
        </div>
      </div>

      {/* Threat Scenarios - ENTERPRISE: Clean cards */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 overflow-hidden shadow-lg">
        <div className="border-b border-slate-800/60 px-6 py-4 bg-slate-900/60">
          <h2 className="text-sm font-bold text-slate-50">Threat Scenarios</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a threat vector to simulate
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {threats.map((threat) => {
            const Icon = threat.icon;
            const isSelected = selectedThreat?.id === threat.id;

            return (
              <button
                key={threat.id}
                onClick={() => setSelectedThreat(threat)}
                disabled={isRunning}
                className={`text-left rounded-xl border p-5 transition-all ${
                  isSelected
                    ? `border-${threat.color}-500/50 bg-${threat.color}-500/10`
                    : 'border-slate-800/60 bg-slate-950/40 hover:border-slate-700/80 hover:bg-slate-900/60'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-lg bg-${threat.color}-500/10 border border-${threat.color}-500/20`}>
                      <Icon className={`w-6 h-6 text-${threat.color}-400`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm mb-0.5">
                        {threat.name}
                      </h3>
                      <p className="text-xs text-slate-500">Duration: {threat.duration}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border bg-${threat.color}-500/10 text-${threat.color}-300 border-${threat.color}-500/30`}
                  >
                    {threat.severity}
                  </span>
                </div>

                <p className="text-sm text-slate-300">{threat.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulation Controls - ENTERPRISE: Clean control panel */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 overflow-hidden shadow-lg">
        <div className="border-b border-slate-800/60 px-6 py-4 bg-slate-900/60">
          <h2 className="text-sm font-bold text-slate-50">Simulation Controls</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure and execute threat simulation
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Target Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Target Drone
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableDrones.map((drone) => (
                <button
                  key={drone}
                  onClick={() => setTargetDrone(drone)}
                  disabled={isRunning}
                  className={`px-4 py-3 rounded-lg text-sm font-semibold border transition-all ${
                    targetDrone === drone
                      ? 'bg-blue-600 text-white border-blue-500/60'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {drone}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Configuration Summary */}
          {selectedThreat && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  Simulation Configuration
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs mb-1">Threat Type</p>
                  <p className="text-slate-200 font-semibold">{selectedThreat.name}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Target</p>
                  <p className="text-slate-200 font-semibold font-mono">{targetDrone}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Severity</p>
                  <p className={`text-${selectedThreat.color}-400 font-semibold uppercase`}>
                    {selectedThreat.severity}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={handleStartSimulation}
            disabled={!selectedThreat || isRunning}
            className={`w-full px-6 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
              !selectedThreat || isRunning
                ? 'bg-slate-800/60 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                : 'bg-blue-600 text-white border border-blue-500/60 hover:bg-blue-700 shadow-lg shadow-blue-600/20'
            }`}
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Simulation Running...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Execute Simulation
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Simulation Log - ENTERPRISE: Clean log entries */}
      {simulationLog.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 overflow-hidden shadow-lg">
          <div className="border-b border-slate-800/60 px-6 py-4 bg-slate-900/60">
            <h2 className="text-sm font-bold text-slate-50">Simulation History</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Recent simulation executions
            </p>
          </div>

          <div className="p-5 space-y-2.5 max-h-80 overflow-auto">
            {simulationLog.map((log) => {
              const statusColor =
                log.status === 'completed'
                  ? 'emerald'
                  : log.status === 'failed'
                  ? 'rose'
                  : 'blue';

              return (
                <div
                  key={log.id}
                  className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-4 hover:border-slate-700/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-200">{log.threat}</span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase bg-${statusColor}-500/10 text-${statusColor}-300 border border-${statusColor}-500/30`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Target: <span className="text-slate-300 font-mono">{log.target}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatSimulation;
