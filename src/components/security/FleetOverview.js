import React from 'react';
import { Shield, Activity, AlertTriangle, Radio, Battery, Navigation } from 'lucide-react';

const FleetOverview = ({ fleetStats = {}, selectedDrone, onDroneSelect, globalAlerts = [] }) => {
  const drones = [
    {
      id: 'UA-101',
      name: 'Survey-Alpha',
      status: 'online',
      battery: 87,
      altitude: 120,
      speed: 13.5,
      mission: 'Harbor perimeter survey',
      linkQuality: 98,
    },
    {
      id: 'UA-102',
      name: 'Survey-Bravo',
      status: 'online',
      battery: 72,
      altitude: 95,
      speed: 8.2,
      mission: 'Pipeline inspection',
      linkQuality: 94,
    },
    {
      id: 'UA-103',
      name: 'Survey-Charlie',
      status: 'offline',
      battery: 34,
      altitude: 0,
      speed: 0,
      mission: 'Perimeter overwatch',
      linkQuality: 0,
    },
    {
      id: 'UA-104',
      name: 'Patrol-Delta',
      status: 'online',
      battery: 91,
      altitude: 150,
      speed: 11.8,
      mission: 'Perimeter overwatch',
      linkQuality: 97,
    },
  ];

  const getDroneAlerts = (droneId) => {
    return globalAlerts.filter(
      (alert) =>
        alert.status === 'active' &&
        (alert.drone_id === droneId || alert.droneId === droneId)
    );
  };

  return (
    <div className="max-w-[1920px] mx-auto px-6 py-6">
      {/* Fleet Stats Bar - ENTERPRISE: Clean, high contrast */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Assets
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 tabular-nums">
            {fleetStats.totalDrones || 4}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Threats
            </span>
          </div>
          <p className="text-2xl font-bold text-rose-400 tabular-nums">
            {fleetStats.activeThreats || 0}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Degraded Links
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-400 tabular-nums">
            {fleetStats.degradedLinks || 0}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <Activity className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Compliance Issues
            </span>
          </div>
          <p className="text-2xl font-bold text-violet-400 tabular-nums">
            {fleetStats.complianceFailures || 0}
          </p>
        </div>
      </div>

      {/* Drone Cards - ENTERPRISE: Ultra-clean with PROPER conditional classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {drones.map((drone) => {
          const isSelected = selectedDrone === drone.id;
          const isOnline = drone.status === 'online';
          const alerts = getDroneAlerts(drone.id);
          const hasAlerts = alerts.length > 0;
          
          // Battery color logic
          const batteryHigh = drone.battery > 70;
          const batteryMedium = drone.battery > 30 && drone.battery <= 70;
          const batteryLow = drone.battery <= 30;

          return (
            <button
              key={drone.id}
              onClick={() => onDroneSelect(drone.id)}
              className={`text-left rounded-xl border bg-slate-900/60 p-4 transition-all ${
                isSelected
                  ? 'border-blue-500/50 shadow-lg shadow-blue-500/10'
                  : hasAlerts
                  ? 'border-rose-500/30 hover:border-rose-500/50'
                  : 'border-slate-800/60 hover:border-slate-700/80'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-100 mb-0.5">{drone.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{drone.id}</p>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  {/* Status Badge - FIXED: No template literals */}
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold border ${
                      isOnline
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-500/10 text-slate-300 border-slate-500/30'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                    {drone.status.toUpperCase()}
                  </div>

                  {hasAlerts && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3" />
                      {alerts.length}
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics Grid - FIXED: Proper conditional classes */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Battery
                    className={`w-4 h-4 ${
                      batteryHigh
                        ? 'text-emerald-400'
                        : batteryMedium
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  />
                  <div>
                    <p className="text-xs text-slate-500">Battery</p>
                    <p
                      className={`text-sm font-bold tabular-nums ${
                        batteryHigh
                          ? 'text-emerald-400'
                          : batteryMedium
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {drone.battery}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-slate-500">Altitude</p>
                    <p className="text-sm font-bold text-blue-400 tabular-nums">
                      {drone.altitude}m
                    </p>
                  </div>
                </div>
              </div>

              {/* Mission Status */}
              <div className="pt-3 border-t border-slate-800/60">
                <p className="text-xs text-slate-500 mb-1">Active Mission</p>
                <p className="text-sm text-slate-300 font-medium truncate">
                  {drone.mission}
                </p>
              </div>

              {/* Link Quality Bar */}
              <div className="mt-3 pt-3 border-t border-slate-800/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">Link Quality</span>
                  <span className="text-xs font-mono text-slate-400">
                    {drone.linkQuality}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${drone.linkQuality}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FleetOverview;