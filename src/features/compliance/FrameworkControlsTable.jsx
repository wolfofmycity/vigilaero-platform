import React, { useMemo } from 'react';
import { FileText, AlertTriangle, ChevronDown } from 'lucide-react';
import { getFrameworkCardClass } from './scoring';
const STATUS = {
  MET: 'met',
  PARTIAL: 'partial',
  NOT_MET: 'not_met',
  NA: 'na',
};
const STATUS_META = {
  [STATUS.MET]: { label: 'Met', color: 'emerald' },
  [STATUS.PARTIAL]: { label: 'Partial', color: 'amber' },
  [STATUS.NOT_MET]: { label: 'Not Met', color: 'rose' },
  [STATUS.NA]: { label: 'N/A', color: 'slate' },
};const ControlStatusPill = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META[STATUS.NA];

  const pillClass = {
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    amber:   'bg-amber-500/10 text-amber-300 border-amber-500/30',
    rose:    'bg-rose-500/10 text-rose-300 border-rose-500/30',
    slate:   'bg-slate-500/10 text-slate-300 border-slate-500/30',
  }[meta.color] || 'bg-slate-500/10 text-slate-300 border-slate-500/30';

  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold border ${pillClass}`}>
      {meta.label}
    </span>
  );
};

const StatusSelect = ({ value, onChange }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none w-full rounded-lg bg-slate-950/60 border border-slate-700/60 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
    >
      <option value={STATUS.MET}>Met</option>
      <option value={STATUS.PARTIAL}>Partial</option>
      <option value={STATUS.NOT_MET}>Not Met</option>
      <option value={STATUS.NA}>N/A</option>
    </select>
    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

// Extracted so faa_107 and faa_89 share one table definition.
// Props: controls, summary, onUpdate(id, patch), frameworkName.
const FrameworkControlsTable = ({ definitions, stateMap, summary, onUpdate, onViewEvidence, frameworkName, evidenceSummary }) => {
  const styles = getFrameworkCardClass(summary.status);

  // Merge definition + operator state for rendering only.
  // Never stored � recomputed when stateMap changes.
  // Everything below this line uses `controls` exactly as before.
  const controls = useMemo(
    () => definitions.map((def) => ({ ...def, ...(stateMap[def.id] || {}) })),
    [definitions, stateMap]
  );

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-50">{frameworkName} — Control Details</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {controls.length} controls • Mark status and attach evidence references
            </p>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold tabular-nums ${styles.scoreColor}`}>{summary.score}%</div>
            <div className="text-xs text-slate-500">Readiness</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800/60">
          <thead className="bg-slate-950/40">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Control</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Intent & Evidence</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-44">
                <div>Operator Status</div>
                <div className="text-xs font-normal text-slate-500 normal-case mt-0.5">Informational - readiness is evidence-backed</div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-64">Evidence Ref</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-72">Notes</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {controls.map((c) => {
              const softGated = c.status === STATUS.MET && !c.evidenceRef?.trim();
              return (
                <tr key={c.id} className="hover:bg-slate-950/20 transition-colors">
                  <td className="px-6 py-4 align-top">
                    <div className="text-xs font-bold text-slate-100 mb-1">{c.id}</div>
                    <div className="text-xs font-semibold text-slate-200 mb-2">{c.title}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ControlStatusPill status={c.status} />
                      {softGated && (
                        <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          scored as Partial
                        </span>
                      )}
                      {/* Evidence counts */}
                      {(() => {
                        const accepted = evidenceSummary?.accepted_by_control?.[c.id] || summary?.accepted_by_control?.[c.id] || 0;
                        const pending = evidenceSummary?.pending_by_control?.[c.id] || summary?.pending_by_control?.[c.id] || 0;
                        if (accepted > 0 || pending > 0) {
                          return (
                            <span className="text-xs text-slate-500 font-mono">
                              A:{accepted} P:{pending}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="text-xs text-slate-300 leading-relaxed mb-2">{c.intent}</div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      <span className="font-semibold">Suggested:</span> {c.evidenceHints.join(' • ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                    <StatusSelect value={c.status} onChange={(v) => onUpdate(c.id, { status: v })} />
                  </td>
                  <td className="px-6 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                    <input
                      value={c.evidenceRef}
                      onChange={(e) => onUpdate(c.id, { evidenceRef: e.target.value })}
                      placeholder="bundle:INC-xxxx / doc:cert.pdf"
                      className={`w-full rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                        softGated
                          ? 'bg-amber-500/5 border border-amber-500/40 focus:ring-amber-500/40 focus:border-amber-500/50'
                          : 'bg-slate-950/60 border border-slate-700/60 focus:ring-emerald-500/50 focus:border-emerald-500/50'
                      }`}
                    />
                  </td>
                  <td className="px-6 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      value={c.notes}
                      onChange={(e) => onUpdate(c.id, { notes: e.target.value })}
                      placeholder="Rationale / gaps / next action"
                      rows={2}
                      className="w-full rounded-lg bg-slate-950/60 border border-slate-700/60 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none"
                    />
                  </td>

                  {/* View Evidence button */}
                  <td className="px-6 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onViewEvidence && onViewEvidence(c)}
                      disabled={!c.evidenceRef?.trim()}
                      className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                        c.evidenceRef?.trim()
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-slate-800/40 text-slate-500 border border-slate-700/40 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        View
                      </div>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-slate-950/40 border-t border-slate-800/60">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-400">Tip:</span> Keep evidence refs short and structured (e.g.,{' '}
          <span className="text-slate-300 font-mono">bundle:INC-69e1…</span>,{' '}
          <span className="text-slate-300 font-mono">log:flight-2026-01-30</span>,{' '}
          <span className="text-slate-300 font-mono">doc:waiver-night.pdf</span>).{' '}
          <span className="text-amber-300">Met controls require an evidence ref to score at full weight.</span>
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export default FrameworkControlsTable;

