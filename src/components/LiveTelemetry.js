import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Battery, Wifi, MapPin } from 'lucide-react';

const LiveTelemetry = ({ droneId }) => {
  const [telemetry, setTelemetry] = useState({
    altitude: 61.4,
    groundSpeed: 4.6,
    batteryLevel: 95,
    linkQuality: 88,
    gpsLock: true,
    satellites: 13,
    timestamp: new Date(),
  });

  const [isLive, setIsLive] = useState(true);

  // Simulate live telemetry updates
  useEffect(() => {
    if (!droneId) {
      setIsLive(false);
      return;
    }

    setIsLive(true);
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        altitude: Math.max(0, prev.altitude + (Math.random() - 0.5) * 2),
        groundSpeed: Math.max(0, prev.groundSpeed + (Math.random() - 0.5) * 0.5),
        batteryLevel: Math.max(0, Math.min(100, prev.batteryLevel - Math.random() * 0.1)),
        linkQuality: Math.max(60, Math.min(100, prev.linkQuality + (Math.random() - 0.5) * 3)),
        timestamp: new Date(),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [droneId]);

  const getBatteryColor = (level) => {
    if (level > 70) return 'emerald';
    if (level > 30) return 'amber';
    return 'rose';
  };

  const getLinkQualityLabel = (quality) => {
    if (quality >= 90) return { label: 'EXCELLENT', color: 'emerald' };
    if (quality >= 70) return { label: 'GOOD', color: 'blue' };
    if (quality >= 50) return { label: 'FAIR', color: 'amber' };
    return { label: 'POOR', color: 'rose' };
  };

  const batteryColor = getBatteryColor(telemetry.batteryLevel);
  const linkStatus = getLinkQualityLabel(telemetry.linkQuality);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 overflow-hidden shadow-lg">
      {/* Header - ENTERPRISE: Clean */}
      <div className="border-b border-slate-800/60 px-6 py-4 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-50">Live Telemetry Stream</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {droneId || 'No drone selected'}
              </p>
            </div>
          </div>

          {isLive && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Live
              </span>
              <span className="text-xs text-emerald-400 font-mono">
                {telemetry.timestamp.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid - ENTERPRISE: Clean cards */}
      <div className="p-5 space-y-4">
        {/* Altitude & Ground Speed */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Altitude
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-400 tabular-nums">
              {telemetry.altitude.toFixed(1)}
            </p>
            <p className="text-xs text-slate-500 mt-1">meters AGL</p>
          </div>

          <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ground Speed
              </span>
            </div>
            <p className="text-2xl font-bold text-violet-400 tabular-nums">
              {telemetry.groundSpeed.toFixed(1)}
            </p>
            <p className="text-xs text-slate-500 mt-1">meters/sec</p>
          </div>
        </div>

        {/* Battery Level */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Battery className={`w-4 h-4 text-${batteryColor}-400`} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Battery Level
              </span>
            </div>
            <span className={`text-lg font-bold text-${batteryColor}-400 tabular-nums`}>
              {telemetry.batteryLevel.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${batteryColor}-500 transition-all duration-300`}
              style={{ width: `${telemetry.batteryLevel}%` }}
            />
          </div>
        </div>

        {/* Link Quality */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wifi className={`w-4 h-4 text-${linkStatus.color}-400`} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Link Quality
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold text-${linkStatus.color}-400 tabular-nums`}>
                {telemetry.linkQuality.toFixed(0)}%
              </span>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-${linkStatus.color}-500/10 text-${linkStatus.color}-300 border border-${linkStatus.color}-500/30`}>
                {linkStatus.label}
              </span>
            </div>
          </div>
          <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${linkStatus.color}-500 transition-all duration-300`}
              style={{ width: `${telemetry.linkQuality}%` }}
            />
          </div>
        </div>

        {/* GPS Position */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                GPS Position
              </span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">
                {telemetry.satellites} SATS
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            WGS84 Coordinates
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveTelemetry;