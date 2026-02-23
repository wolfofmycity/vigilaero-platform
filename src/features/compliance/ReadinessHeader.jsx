import React from 'react';
import {
  Award,
  AlertTriangle,
  HelpCircle,
  Info,
  ChevronDown,
  FileText,
  Shield,
  CheckCircle,
} from 'lucide-react';

export default function ReadinessHeader({
  activeFrameworkName,
  readinessScore,
  evidenceCoveragePct,
  lastReviewDate,
  controlsMetCount,
  totalControlsCount,
  evidenceBundlesStatusText,
  summaryError,
  lastSummaryFetch,
  statusLabel,
  scoreColorClass,
  statusColorClass,
  controlsWired,
  showRubric,
  onToggleRubric,
  scopeToggleNode,
}) {
  const isSummaryStale = React.useMemo(() => {
    if (!lastSummaryFetch) return false;
    const fetchTime = new Date(lastSummaryFetch);
    const now = new Date();
    const diffMinutes = (now - fetchTime) / 1000 / 60;
    return diffMinutes > 5;
  }, [lastSummaryFetch]);

  const formattedLastUpdate = React.useMemo(() => {
    if (!lastSummaryFetch) return 'Never';
    return new Date(lastSummaryFetch).toUTCString();
  }, [lastSummaryFetch]);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 overflow-hidden shadow-lg">
      <div className="border-b border-slate-800/60 px-6 py-4 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-sm font-bold text-slate-50">Readiness Score</h2>
                {scopeToggleNode}
              </div>

              <p className="text-xs text-slate-400 mt-0.5">
                <span className="text-slate-200 font-semibold">{activeFrameworkName}</span>
                {' '}- Evidence-backed progress toward audit alignment
                {' '}- <span className="text-amber-300">Met controls require evidence to score fully</span>
              </p>

              {summaryError && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-300 font-semibold">
                    Unable to refresh compliance summary - displaying last known results
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className={`text-3xl font-bold tabular-nums ${scoreColorClass}`}>
              {readinessScore}%
            </div>
            <div className={`text-xs ${statusColorClass}`}>
              {statusLabel}
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              Evidence-backed scoring
            </div>
            {lastSummaryFetch && (
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                <span>Last updated: {formattedLastUpdate}</span>
                {isSummaryStale && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    May be stale
                  </span>
                )}
              </div>
            )}
            {controlsWired && (
              <div className="flex items-center justify-end gap-1.5 mt-1.5">
                <span className="text-xs text-slate-400">
                  Evidence Coverage:{' '}
                  <span className="font-semibold text-slate-300">{evidenceCoveragePct}%</span>
                </span>
                <div className="relative group">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help transition-colors" />
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-2.5 text-xs text-slate-300 leading-relaxed opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-150 z-10 shadow-lg">
                    Evidence Coverage reflects the percentage of applicable controls that include attached audit artifacts. Higher coverage strengthens defensibility during regulatory review.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-800/60">
        <button
          type="button"
          onClick={onToggleRubric}
          className="w-full flex items-center gap-2.5 px-6 py-3 bg-slate-950/40 hover:bg-slate-950/60 transition-colors text-left"
        >
          <div className={`flex items-center justify-center w-6 h-6 rounded-md border transition-colors ${
            showRubric
              ? 'bg-blue-500/20 border-blue-500/40'
              : 'bg-blue-500/10 border-blue-500/20'
          }`}>
            <Info className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-xs text-slate-400">How is this score calculated?</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 ml-auto transition-transform ${showRubric ? 'rotate-180' : ''}`} />
        </button>

        {showRubric && (
          <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-800/60">
            <div className="text-xs leading-relaxed text-slate-400 pl-8.5">
              Controls are marked <span className="text-slate-200 font-semibold">Met</span>,{' '}
              <span className="text-slate-200 font-semibold">Partial</span>,{' '}
              <span className="text-slate-200 font-semibold">Not Met</span>, or{' '}
              <span className="text-slate-200 font-semibold">N/A</span>.{' '}
              Scoring: <span className="text-slate-200 font-semibold">Met = 1.0</span> (requires evidence ref),{' '}
              <span className="text-slate-200 font-semibold">Partial = 0.5</span>,{' '}
              <span className="text-slate-200 font-semibold">Not Met = 0</span>.{' '}
              <span className="text-amber-300 font-semibold">
                Met without an evidence reference is automatically scored as Partial until one is attached.
              </span>{' '}
              N/A controls are excluded from the denominator.{' '}
              <span className="text-slate-200 font-semibold">Evidence Coverage</span> is the
              percentage of applicable controls with any evidence reference attached,
              regardless of status.
              <div className="mt-2 pt-2 border-t border-slate-800/60 text-slate-500 italic">
                Disclaimer: This score reflects internal readiness and evidence coverage.
                It is not a legal compliance determination or certification opinion.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <FileText className="w-5 h-5 text-slate-300" />
            <div>
              <div className="text-sm font-bold text-slate-50">{lastReviewDate}</div>
              <div className="text-xs text-slate-500">Last Review</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <Shield className="w-5 h-5 text-slate-300" />
            <div>
              <div className="text-sm font-bold text-slate-50 tabular-nums">
                {controlsMetCount} <span className="text-slate-600">/</span> {totalControlsCount}
              </div>
              <div className="text-xs text-slate-500">Controls Met</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-sm font-bold text-slate-50">{evidenceBundlesStatusText}</div>
              <div className="text-xs text-slate-500">Evidence bundles</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
