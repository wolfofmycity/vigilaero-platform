import { Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const STATUS = {
  NA: 'na',
};

export function computeFrameworkSummary(definitions, stateMap, evidenceSummary) {
  const applicable = definitions.filter(
    (def) => stateMap[def.id]?.status !== STATUS.NA
  );
  if (applicable.length === 0) {
    return { score: 0, met: 0, requirements: 0, status: 'in_progress', evidenceCoverage: 0 };
  }

  let met = 0;
  let inReview = 0;

  applicable.forEach((def) => {
    const accepted = evidenceSummary?.accepted_by_control?.[def.id] || 0;
    const pending = evidenceSummary?.pending_by_control?.[def.id] || 0;

    if (accepted >= 1) {
      met++;
    } else if (pending >= 1) {
      inReview++;
    }
  });

  const requirements = applicable.length;
  const evidenceCoverage = Math.round((met / requirements) * 100);
  const score = evidenceCoverage;

  let status = 'needs_work';
  if (score >= 95) {
    status = 'audit_ready';
  } else if (score >= 75) {
    status = 'partial';
  } else if (score >= 50) {
    status = 'in_progress';
  }

  return {
    score,
    met,
    requirements,
    status,
    evidenceCoverage,
    accepted_by_control: evidenceSummary?.accepted_by_control || {},
    pending_by_control: evidenceSummary?.pending_by_control || {},
    rejected_by_control: evidenceSummary?.rejected_by_control || {},
    inReview,
  };
}

export function getFrameworkCardClass(status) {
  switch (status) {
    case 'audit_ready':
      return {
        iconBg: 'bg-emerald-500/10 border-emerald-500/20',
        iconColor: 'text-emerald-400',
        scoreColor: 'text-emerald-400',
        statusColor: 'text-emerald-300',
        barColor: 'bg-emerald-500',
      };
    case 'partial':
      return {
        iconBg: 'bg-amber-500/10 border-amber-500/20',
        iconColor: 'text-amber-400',
        scoreColor: 'text-amber-400',
        statusColor: 'text-amber-300',
        barColor: 'bg-amber-500',
      };
    case 'in_progress':
      return {
        iconBg: 'bg-blue-500/10 border-blue-500/20',
        iconColor: 'text-blue-400',
        scoreColor: 'text-blue-400',
        statusColor: 'text-blue-300',
        barColor: 'bg-blue-500',
      };
    case 'needs_work':
      return {
        iconBg: 'bg-rose-500/10 border-rose-500/20',
        iconColor: 'text-rose-400',
        scoreColor: 'text-rose-400',
        statusColor: 'text-rose-300',
        barColor: 'bg-rose-500',
      };
    default:
      return {
        iconBg: 'bg-slate-500/10 border-slate-500/20',
        iconColor: 'text-slate-400',
        scoreColor: 'text-slate-400',
        statusColor: 'text-slate-300',
        barColor: 'bg-slate-500',
      };
  }
}

export function getStatusIcon(status) {
  switch (status) {
    case 'audit_ready':
      return CheckCircle;
    case 'partial':
    case 'in_progress':
      return Clock;
    case 'needs_work':
      return AlertTriangle;
    default:
      return Shield;
  }
}

export function getStatusLabel(status) {
  switch (status) {
    case 'audit_ready':
      return 'Ready for Audit Review';
    case 'partial':
      return 'Partial Coverage';
    case 'in_progress':
      return 'In Progress';
    case 'needs_work':
      return 'Needs Work';
    default:
      return 'Unknown';
  }
}
