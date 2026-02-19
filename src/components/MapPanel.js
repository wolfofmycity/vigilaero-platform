import React, { useState, useMemo } from 'react';
import { Globe, Target } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// UTILITY: Smart tooltip positioning to prevent off-screen rendering
// ═══════════════════════════════════════════════════════════════════
const getTooltipPosition = (mouseX, mouseY, tooltipWidth = 280, tooltipHeight = 200) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let x = mouseX + 15;
  let y = mouseY + 15;
  
  // If tooltip would go off right edge, position it to the left of cursor
  if (x + tooltipWidth > viewportWidth - 20) {
    x = mouseX - tooltipWidth - 15;
  }
  
  // If tooltip would go off bottom edge, position it above cursor
  if (y + tooltipHeight > viewportHeight - 20) {
    y = mouseY - tooltipHeight - 15;
  }
  
  // Ensure tooltip never goes off left or top edges
  x = Math.max(20, x);
  y = Math.max(20, y);
  
  return { x, y };
};

// Simulated fleet data
const FLEET_DATA = [
  {
    id: 'UA-101',
    name: 'Survey-Alpha',
    position: { x: 25, y: 45 },
    status: 'online',
    risk: 'low',
    altitude: 120,
    speed: 13.5,
    battery: 87,
    mission: 'Harbor perimeter survey',
    location: 'Port Facility — Sector A'
  },
  {
    id: 'UA-102',
    name: 'Survey-Bravo',
    position: { x: 55, y: 35 },
    status: 'online',
    risk: 'medium',
    altitude: 95,
    speed: 8.2,
    battery: 72,
    mission: 'Pipeline inspection',
    location: 'Pipeline Route — KM 14'
  },
  {
    id: 'UA-103',
    name: 'Survey-Charlie',
    position: { x: 40, y: 65 },
    status: 'offline',
    risk: 'high',
    altitude: 0,
    speed: 0,
    battery: 34,
    mission: 'Perimeter overwatch',
    location: 'Hangar 3'
  },
  {
    id: 'UA-104',
    name: 'Patrol-Delta',
    position: { x: 75, y: 25 },
    status: 'online',
    risk: 'low',
    altitude: 150,
    speed: 11.8,
    battery: 91,
    mission: 'Perimeter overwatch',
    location: 'Perimeter — North Gate'
  }
];

const MapPanel = ({ focusedDroneId, onDroneSelect, variant = 'strategic' }) => {
  const [hoveredDrone, setHoveredDrone] = useState(null);
  const [filterMode, setFilterMode] = useState('all');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const isStrategic = variant === 'strategic';
  const isTactical = variant === 'tactical';

  // Theme configuration based on variant
  const theme = {
    strategic: {
      icon: Globe,
      badge: 'Global',
      subtitle: 'Global situational awareness',
      accentColor: 'indigo',
    },
    tactical: {
      icon: Target,
      badge: 'Focused',
      subtitle: 'Focused operational view',
      accentColor: 'cyan',
    }
  };

  const currentTheme = theme[variant] || theme.strategic;
  const ThemeIcon = currentTheme.icon;

  // Filter drones based on mode
  const filteredDrones = useMemo(() => {
    if (filterMode === 'all') return FLEET_DATA;
    if (filterMode === 'online') return FLEET_DATA.filter(d => d.status === 'online');
    if (filterMode === 'alerts') return FLEET_DATA.filter(d => d.risk === 'medium' || d.risk === 'high');
    return FLEET_DATA;
  }, [filterMode]);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'emerald';
      case 'medium': return 'amber';
      case 'high': return 'rose';
      default: return 'slate';
    }
  };

  const getStatusColor = (status) => {
    return status === 'online' ? 'emerald' : 'rose';
  };

  const handleDroneClick = (droneId) => {
    if (onDroneSelect) {
      onDroneSelect(droneId);
    }
  };

  const handleMouseMove = (e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="relative" onMouseMove={handleMouseMove}>
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 overflow-hidden shadow-lg">
        {/* Header - ENTERPRISE: Clean, no gradients */}
        <div className="border-b border-slate-800/60 px-6 py-4 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-${currentTheme.accentColor}-500/10 border border-${currentTheme.accentColor}-500/20`}>
                <ThemeIcon className={`w-5 h-5 text-${currentTheme.accentColor}-400`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-50">Strategic Fleet Map</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider bg-${currentTheme.accentColor}-500/10 text-${currentTheme.accentColor}-300 border border-${currentTheme.accentColor}-500/30`}>
                    {currentTheme.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{currentTheme.subtitle} · {filteredDrones.length} of {FLEET_DATA.length} visible</p>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  filterMode === 'all'
                    ? 'bg-blue-600 text-white border-blue-500/60'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('online')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  filterMode === 'online'
                    ? 'bg-emerald-600 text-white border-emerald-500/60'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                Online
              </button>
              <button
                onClick={() => setFilterMode('alerts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  filterMode === 'alerts'
                    ? 'bg-amber-600 text-white border-amber-500/60'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                Alerts
              </button>
            </div>
          </div>
        </div>

        {/* Map Canvas - ENTERPRISE: Clean grid */}
        <div className="relative h-[400px] bg-slate-950/60">
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-500" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Crosshair overlay for focused drone - ENTERPRISE: Simplified */}
          {focusedDroneId && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-32 h-32 rounded-full border-2 border-dashed border-${currentTheme.accentColor}-500/30`} />
              </div>
            </div>
          )}

          {/* Drone markers - ENTERPRISE: Cleaner markers */}
          {filteredDrones.map((drone) => {
            const riskColor = getRiskColor(drone.risk);
            const statusColor = getStatusColor(drone.status);
            const isFocused = focusedDroneId === drone.id;
            const isHovered = hoveredDrone === drone.id;

            return (
              <button
                key={drone.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110"
                style={{
                  left: `${drone.position.x}%`,
                  top: `${drone.position.y}%`,
                }}
                onClick={() => handleDroneClick(drone.id)}
                onMouseEnter={() => setHoveredDrone(drone.id)}
                onMouseLeave={() => setHoveredDrone(null)}
              >
                {/* Inner circle (status) - ENTERPRISE: Simplified */}
                <div className={`relative w-10 h-10 rounded-full bg-${statusColor}-500 border-2 border-${statusColor}-400 shadow-lg shadow-${statusColor}-500/50 flex items-center justify-center ${isHovered || isFocused ? 'ring-4 ring-white/20' : ''}`}>
                  <span className="text-xs font-bold text-white">{drone.id.split('-')[1]}</span>
                </div>

                {/* Drone label */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <div className="text-xs font-semibold text-slate-200 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700/60 backdrop-blur-sm">
                    {drone.id}
                  </div>
                </div>

                {/* Focus indicator */}
                {isFocused && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40 backdrop-blur-sm">
                      <Target className="w-3 h-3 text-blue-300" />
                      <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Focus</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}

          {/* Hover Tooltip - ENTERPRISE: Clean styling */}
          {hoveredDrone && (() => {
            const drone = FLEET_DATA.find(d => d.id === hoveredDrone);
            if (!drone) return null;

            const riskColor = getRiskColor(drone.risk);
            const statusColor = getStatusColor(drone.status);
            const { x, y } = getTooltipPosition(mousePosition.x, mousePosition.y);

            return (
              <div
                style={{
                  position: 'fixed',
                  left: `${x}px`,
                  top: `${y}px`,
                  zIndex: 9999,
                }}
                className="pointer-events-none"
              >
                <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-4 shadow-2xl backdrop-blur-sm min-w-[280px]">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 pb-3 border-b border-slate-800/60">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-50">{drone.name}</h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-${statusColor}-500/10 text-${statusColor}-300 border border-${statusColor}-500/30 text-[10px] font-bold uppercase`}>
                          <div className={`w-1.5 h-1.5 rounded-full bg-${statusColor}-400`} />
                          {drone.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{drone.id}</p>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-${riskColor}-500/10 text-${riskColor}-300 border border-${riskColor}-500/30`}>
                      {drone.risk}
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Altitude</p>
                      <p className="text-sm font-bold text-slate-100 tabular-nums">{drone.altitude}m</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Speed</p>
                      <p className="text-sm font-bold text-slate-100 tabular-nums">{drone.speed} m/s</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Battery</p>
                      <p className="text-sm font-bold text-emerald-400 tabular-nums">{drone.battery}%</p>
                    </div>
                  </div>

                  {/* Mission Info */}
                  <div className="space-y-2 pt-3 border-t border-slate-800/60">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Active Mission</p>
                      <p className="text-xs text-slate-200 font-medium">{drone.mission}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Location</p>
                      <p className="text-xs text-slate-400 font-mono">{drone.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Asset List - ENTERPRISE: Clean roster */}
        <div className="border-t border-slate-800/60 px-6 py-4 bg-slate-950/40">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Roster</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-500">Low</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs text-slate-500">Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs text-slate-500">High</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filteredDrones.map((drone) => {
              const riskColor = getRiskColor(drone.risk);
              const isFocused = focusedDroneId === drone.id;

              return (
                <button
                  key={drone.id}
                  onClick={() => handleDroneClick(drone.id)}
                  className={`text-left px-3 py-2 rounded-lg border transition-all ${
                    isFocused
                      ? 'bg-blue-500/10 border-blue-500/40 ring-2 ring-blue-500/30'
                      : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${riskColor}-500`} />
                      <span className="text-xs font-semibold text-slate-200">{drone.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{drone.id}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPanel;