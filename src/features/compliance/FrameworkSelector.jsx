import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  getFrameworkCardClass,
  getStatusIcon,
  getStatusLabel,
} from './scoring';

export default function FrameworkSelector({
  frameworks,
  activeFrameworkId,
  onSelectFramework,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {frameworks.map((framework) => {
        const styles = getFrameworkCardClass(framework.status);
        const StatusIcon = getStatusIcon(framework.status);
        const isActive = activeFrameworkId === framework.id;

        return (
          <button
            key={framework.id}
            type="button"
            onClick={() => onSelectFramework(framework.id)}
            className={`rounded-xl border bg-slate-900/80 shadow-lg overflow-hidden text-left transition-all ${
              isActive
                ? 'border-blue-500/40 ring-1 ring-blue-500/20'
                : 'border-slate-800/60 hover:border-slate-700/60'
            }`}
          >
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${styles.iconBg}`}>
                    <StatusIcon className={`w-5 h-5 ${styles.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-50">{framework.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                      {framework.met} of {framework.requirements} controls met
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xl font-bold tabular-nums ${styles.scoreColor}`}>{framework.score}%</div>
                  <div className={`text-xs ${styles.statusColor}`}>{getStatusLabel(framework.status)}</div>
                </div>
              </div>

              <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 ${styles.barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${framework.score}%` }}
                />
              </div>

              {isActive && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-blue-300 font-semibold">
                  <ChevronDown className="w-3.5 h-3.5" />
                  Controls shown below
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
