import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function ScopeToggle({
  scope,
  onScopeChange,
  drones = [],
  scopedDroneId,
  onDroneChange,
  selectedDroneId,
  showSelectedDroneText = true,
}) {
  const currentDroneId = scopedDroneId ?? selectedDroneId ?? '';

  return (
    <>
      <div className="flex items-center gap-1 rounded-lg bg-slate-950/60 border border-slate-700/60 p-1">
        <button
          onClick={() => onScopeChange('org')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            scope === 'org'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Organization
        </button>
        <button
          onClick={() => onScopeChange('drone')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            scope === 'drone'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Drone
        </button>
      </div>

      {scope === 'drone' && (
        <div className="flex items-center gap-2">
          <span className="text-slate-600">-&gt;</span>
          {drones.length > 0 ? (
            <div className="relative">
              <select
                value={currentDroneId}
                onChange={(e) => onDroneChange(e.target.value)}
                className="appearance-none rounded-lg bg-slate-950/80 border border-slate-700/60 pl-3 pr-8 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              >
                <option value="">Select a drone...</option>
                {drones.map((d) => (
                  <option key={d.id || d} value={d.id || d}>
                    {d.label || d.id || d}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <input
              type="text"
              value={currentDroneId}
              onChange={(e) => onDroneChange(e.target.value)}
              placeholder="Enter drone ID..."
              className="rounded-lg bg-slate-950/80 border border-slate-700/60 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all w-40"
            />
          )}
          {showSelectedDroneText && currentDroneId && (
            <span className="text-xs text-blue-300 font-mono">{currentDroneId}</span>
          )}
          {scope === 'drone' && !currentDroneId && (
            <span className="text-xs text-amber-300">No drone selected</span>
          )}
        </div>
      )}
    </>
  );
}
