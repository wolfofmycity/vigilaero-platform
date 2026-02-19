import React, { useMemo, useState } from 'react';
import { Shield, FileText, CheckCircle, AlertTriangle, Clock, Award, Info, ChevronDown, HelpCircle } from 'lucide-react';
import EvidenceDrawer from './EvidenceDrawer';

const API_BASE = 'http://127.0.0.1:8010';

/**
 * ComplianceMonitor - Elite Enterprise Edition v1.2
 *
 * v1.2 changes:
 *   1. Top "Readiness Score" tracks the selected framework, not a cross-framework average.
 *      Audits are framework-specific — the score should be too.
 *   2. Framework cards are clickable. Controls table renders only for the active one.
 *   3. Soft-gate: MET without an evidence ref is automatically scored as PARTIAL.
 *      The status pill still shows what the operator selected; the score reflects
 *      the gate. Amber highlight on the evidence-ref input makes the action obvious.
 */

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STATUS = {
  MET: 'met',
  PARTIAL: 'partial',
  NOT_MET: 'not_met',
  NA: 'na',
};

const STATUS_META = {
  [STATUS.MET]:     { label: 'Met',     color: 'emerald' },
  [STATUS.PARTIAL]: { label: 'Partial', color: 'amber'   },
  [STATUS.NOT_MET]: { label: 'Not Met', color: 'rose'    },
  [STATUS.NA]:      { label: 'N/A',     color: 'slate'   },
};

// Seeds a { controlId ? { status, evidenceRef, notes } } map from a
// definitions array.  Called once per framework via lazy useState.
const DEFAULT_CONTROL_STATE = { status: STATUS.PARTIAL, evidenceRef: '', notes: '' };

function initStateMap(definitions) {
  return Object.fromEntries(
    definitions.map((def) => [def.id, { ...DEFAULT_CONTROL_STATE }])
  );
}

const FAA_PART_107_CONTROLS_V1 = [
  {
    id: '107.1',
    title: 'Pilot certification & currency',
    intent: 'Ensure remote pilots are appropriately certified and maintain required currency/training.',
    evidenceHints: ['Remote Pilot Certificate', 'Training records', 'Recurrent training log'],
    weight: 1,
  },
  {
    id: '107.2',
    title: 'Operational authorization tracking',
    intent: 'Document waivers/authorizations (e.g., night ops, controlled airspace) and ensure current approvals.',
    evidenceHints: ['FAA waiver/COA', 'LAANC logs', 'Ops approval register'],
    weight: 1,
  },
  {
    id: '107.3',
    title: 'Pre-flight risk assessment',
    intent: 'Run and retain a structured pre-flight risk assessment (weather, airspace, mission profile).',
    evidenceHints: ['Pre-flight checklist', 'Risk assessment form', 'Mission brief'],
    weight: 1,
  },
  {
    id: '107.4',
    title: 'Flight log retention & integrity',
    intent: 'Maintain tamper-evident flight logs for audit and incident investigation.',
    evidenceHints: ['Flight logs', 'Hash / signature records', 'Export bundles'],
    weight: 1,
  },
  {
    id: '107.5',
    title: 'Maintenance & airworthiness records',
    intent: 'Track maintenance actions, defects, and readiness-to-fly status per asset.',
    evidenceHints: ['Maintenance logs', 'Defect reports', 'Repair tickets'],
    weight: 1,
  },
  {
    id: '107.6',
    title: 'Incident reporting workflow',
    intent: 'Have an incident process and evidence package for reportable events and investigations.',
    evidenceHints: ['Incident records', 'Forensics bundle exports', 'Corrective actions'],
    weight: 1,
  },
  {
    id: '107.7',
    title: 'Remote ID compliance (cross-reference Part 89)',
    intent: 'Ensure Remote ID status is tracked/verified for applicable operations.',
    evidenceHints: ['Remote ID declaration', 'RID module status', 'RID flight evidence'],
    weight: 0.5,
  },
  {
    id: '107.8',
    title: 'Access control & operator accountability',
    intent: 'Restrict system access and attribute actions to authenticated users (non-repudiation).',
    evidenceHints: ['JWT auth logs', 'Role guardrails', 'Operator assignment events'],
    weight: 1,
  },
  {
    id: '107.9',
    title: 'Airspace awareness & geofencing checks',
    intent: 'Validate airspace constraints and geofencing where applicable.',
    evidenceHints: ['Airspace checks', 'Geofence config', 'NOTAM checks'],
    weight: 1,
  },
  {
    id: '107.10',
    title: 'Lost-link / contingency procedures',
    intent: 'Document and validate contingency actions (RTH, fail-safe, link-loss behavior).',
    evidenceHints: ['Contingency SOP', 'RTH test record', 'Mitigation events'],
    weight: 1,
  },
  {
    id: '107.11',
    title: 'Crew brief & comms plan',
    intent: 'Ensure crew roles, comms plan, and mission expectations are documented.',
    evidenceHints: ['Crew brief', 'Comms plan', 'Checklist signoff'],
    weight: 0.75,
  },
  {
    id: '107.12',
    title: 'Data protection & storage hygiene',
    intent: 'Protect flight data, telemetry, and evidence artifacts from unauthorized access/alteration.',
    evidenceHints: ['Encryption at rest/in transit', 'Access logs', 'Retention policy'],
    weight: 1,
  },
  {
    id: '107.13',
    title: 'Third-party component risk tracking',
    intent: 'Track vendor/firmware versions and known issues that may affect mission safety/security.',
    evidenceHints: ['Firmware inventory', 'Vendor advisories', 'Patch records'],
    weight: 0.75,
  },
  {
    id: '107.14',
    title: 'Training vs production separation',
    intent: 'Clearly mark training simulations vs real operations and prevent mixing evidence contexts.',
    evidenceHints: ['Training flag in incidents', 'Simulation started events', 'Policy statement'],
    weight: 0.75,
  },
  {
    id: '107.15',
    title: 'Audit readiness package generation',
    intent: 'Generate an audit-friendly "what happened + evidence" bundle on demand.',
    evidenceHints: ['Forensics bundle', 'Bundle hashing', 'Export log'],
    weight: 1,
  },
];

// FAA Part 89 — Remote ID — 15 controls across 5 categories.
// Weights follow the same logic as 107: primary operational controls at 1.0,
// narrow or conditional controls reduced accordingly.
const FAA_PART_89_CONTROLS_V1 = [
  // ── Category 1: Remote ID Broadcast Integrity ──
  {
    id: '89.1',
    title: 'RID Broadcast Enabled',
    intent: 'All drones in the fleet broadcast Remote ID during active operations.',
    evidenceHints: ['RID transmission logs', 'Flight telemetry', 'Network broadcast capture'],
    weight: 1,
  },
  {
    id: '89.2',
    title: 'RID Data Accuracy',
    intent: 'Broadcast payload includes correct drone ID, location, altitude, and velocity.',
    evidenceHints: ['Telemetry vs RID reconciliation logs', 'Automated validation reports'],
    weight: 1,
  },
  {
    id: '89.3',
    title: 'Tamper Protection',
    intent: 'RID broadcast cannot be disabled or altered by unauthorized users.',
    evidenceHints: ['Configuration lock logs', 'Role-based access records'],
    weight: 1,
  },
  // ── Category 2: Registration & Aircraft Identity ──
  {
    id: '89.4',
    title: 'Aircraft Registration Verified',
    intent: 'Each drone is registered with the FAA and registration status is current.',
    evidenceHints: ['FAA registration records', 'Fleet registry sync'],
    weight: 1,
  },
  {
    id: '89.5',
    title: 'Unique Drone Identity Mapping',
    intent: 'A verified mapping exists between each physical drone and its RID serial.',
    evidenceHints: ['Drone ↔ RID serial mapping table'],
    weight: 0.75,
  },
  {
    id: '89.6',
    title: 'Fleet Inventory Maintained',
    intent: 'An up-to-date asset inventory tracks all drones across their lifecycle.',
    evidenceHints: ['Asset inventory', 'Lifecycle logs'],
    weight: 1,
  },
  // ── Category 3: Operational Transparency ──
  {
    id: '89.7',
    title: 'RID Available to Authorities',
    intent: 'RID data is broadcast in a format accessible to law enforcement and FAA systems.',
    evidenceHints: ['Broadcast test logs', 'Compliance validation runs'],
    weight: 1,
  },
  {
    id: '89.8',
    title: 'Historical RID Retention',
    intent: 'RID broadcast records are retained for post-event investigation and audit.',
    evidenceHints: ['RID storage snapshots', 'Retention policy'],
    weight: 1,
  },
  {
    id: '89.9',
    title: 'Time Synchronization',
    intent: 'Drone timestamps are synchronized to an authoritative time source (NTP/PTP).',
    evidenceHints: ['NTP logs', 'Timestamp validation'],
    weight: 0.5,
  },
  // ── Category 4: Security Alignment ──
  {
    id: '89.10',
    title: 'RID Data Encryption (networked)',
    intent: 'Where RID data traverses a network path, encryption is enforced in transit.',
    evidenceHints: ['Encryption configs', 'TLS validation'],
    weight: 0.75,
  },
  {
    id: '89.11',
    title: 'Spoofing Detection Capability',
    intent: 'The platform can detect and alert on suspected RID spoofing events.',
    evidenceHints: ['Threat simulation bundle', 'Detection logs'],
    weight: 1,
  },
  {
    id: '89.12',
    title: 'Unauthorized Drone Detection',
    intent: 'Anomalous or unauthorized drones in monitored areas trigger alerts.',
    evidenceHints: ['Anomaly alerts', 'Geofence violations'],
    weight: 1,
  },
  // ── Category 5: Governance ──
  {
    id: '89.13',
    title: 'Remote ID Policy Established',
    intent: 'A formal RID policy is documented, versioned, and accessible to all operators.',
    evidenceHints: ['Policy document', 'Version history'],
    weight: 0.75,
  },
  {
    id: '89.14',
    title: 'Operator RID Training',
    intent: 'All operators have completed RID-specific training and records are retained.',
    evidenceHints: ['Training completion logs'],
    weight: 0.75,
  },
  {
    id: '89.15',
    title: 'Readiness Monitoring Process',
    intent: 'An internal process monitors and reports on RID readiness on a regular cadence.',
    evidenceHints: ['Readiness dashboard snapshots', 'Internal audit cadence'],
    weight: 1,
  },
];

// ─────────────────────────────────────────────────────────────
// Scoring — with soft-gate (change 3)
// ─────────────────────────────────────────────────────────────
//
//   MET  +  evidenceRef present  →  1.0   (full weight)
//   MET  +  no evidenceRef       →  0.5   (soft-gate fires; operator must attach evidence)
//   PARTIAL                      →  0.5
//   NOT_MET                      →  0.0
//   N/A                          →  excluded from denominator
//
function computeFrameworkSummary(definitions, stateMap, evidenceSummary) {
  const applicable = definitions.filter(
    (def) => stateMap[def.id]?.status !== STATUS.NA
  );
  if (applicable.length === 0) {
    return { score: 0, met: 0, requirements: 0, status: 'in_progress', evidenceCoverage: 0 };
  }

  // Evidence-driven scoring: count controls with accepted evidence
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
    // If both are 0, it's "Not Met"
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

// -------------------------------------------------------------
// Static style helpers (production-safe � no dynamic Tailwind)
const getFrameworkCardClass = (status) => {
  switch (status) {
    case 'audit_ready':
      return {
        iconBg:      'bg-emerald-500/10 border-emerald-500/20',
        iconColor:   'text-emerald-400',
        scoreColor:  'text-emerald-400',
        statusColor: 'text-emerald-300',
        barColor:    'bg-emerald-500',
    };
    case 'partial':
      return {
        iconBg:      'bg-amber-500/10 border-amber-500/20',
        iconColor:   'text-amber-400',
        scoreColor:  'text-amber-400',
        statusColor: 'text-amber-300',
        barColor:    'bg-amber-500',
    };
    case 'in_progress':
      return {
        iconBg:      'bg-blue-500/10 border-blue-500/20',
        iconColor:   'text-blue-400',
        scoreColor:  'text-blue-400',
        statusColor: 'text-blue-300',
        barColor:    'bg-blue-500',
    };
    case 'needs_work':
      return {
        iconBg:      'bg-rose-500/10 border-rose-500/20',
        iconColor:   'text-rose-400',
        scoreColor:  'text-rose-400',
        statusColor: 'text-rose-300',
        barColor:    'bg-rose-500',
    };
    default:
      return {
        iconBg:      'bg-slate-500/10 border-slate-500/20',
        iconColor:   'text-slate-400',
        scoreColor:  'text-slate-400',
        statusColor: 'text-slate-300',
        barColor:    'bg-slate-500',
    };
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'audit_ready': return CheckCircle;
    case 'partial':
    case 'in_progress': return Clock;
    case 'needs_work':  return AlertTriangle;
    default:            return Shield;
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'audit_ready':  return 'Ready for Audit Review';
    case 'partial':      return 'Partial Coverage';
    case 'in_progress':  return 'In Progress';
    case 'needs_work':   return 'Needs Work';
    default:             return 'Unknown';
  }
};

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

const ControlStatusPill = ({ status }) => {
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-44">Status</th>
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

const ComplianceMonitor = ({ droneId, companyId = 'default', selectedDroneId, drones = [], isAdmin = false }) => {

  // ── Change 1: active framework selection (defaults to FAA 107) ──
  const [activeFrameworkId, setActiveFrameworkId] = useState('faa_107');
  const [showRubric, setShowRubric] = useState(false);

  // Evidence drawer state
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState(null);
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState(null);
  const [attachLoading, setAttachLoading] = useState(false);
  const [reviewingEvidenceId, setReviewingEvidenceId] = useState(null);

  // Evidence attach form state
  const [evidenceType, setEvidenceType] = useState('document');
  const [referenceId, setReferenceId] = useState('');
  const [linkToDrone, setLinkToDrone] = useState(true);
  const [attachIncidentId, setAttachIncidentId] = useState('');
  const [attestation, setAttestation] = useState('');
  // Evidence filter state (for future backend support)
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  // Evidence summary state (source of truth for scoring)
  const [evidenceSummary, setEvidenceSummary] = useState({
    accepted_by_control: {},
    pending_by_control: {},
    rejected_by_control: {}
  });
  const [summaryError, setSummaryError] = useState(null);

  // Compliance scope state
  const [complianceScope, setComplianceScope] = useState('org');
  const [scopedDroneId, setScopedDroneId] = useState(null);
  const [activeDroneSelection, setActiveDroneSelection] = useState(selectedDroneId || '');

  // Sync scopedDroneId when scope or selection changes
  React.useEffect(() => {
    if (complianceScope === 'drone') {
      setScopedDroneId(activeDroneSelection || null);
    } else {
      setScopedDroneId(null);
    }
  }, [complianceScope, activeDroneSelection]);

  // ── FAA 107 controls — the only wired control set right now ──
  const [faa107State, setFaa107State] = useState(() => initStateMap(FAA_PART_107_CONTROLS_V1));
  const faa107Summary = useMemo(
    () => computeFrameworkSummary(FAA_PART_107_CONTROLS_V1, faa107State, evidenceSummary),
    [faa107State, evidenceSummary]
  );
  const updateFaa107Control = (id, patch) => {
    setFaa107State((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  // ── FAA 89 ───────────────────────────────────────────────
  const [faa89State, setFaa89State] = useState(() => initStateMap(FAA_PART_89_CONTROLS_V1));
  const faa89Summary = useMemo(
    () => computeFrameworkSummary(FAA_PART_89_CONTROLS_V1, faa89State, evidenceSummary),
    [faa89State, evidenceSummary]
  );
  const updateFaa89Control = (id, patch) => {
    setFaa89State((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  // -- Auth token helper --
  const getAuthToken = () => {
    const token = localStorage.getItem('token') ||
                  localStorage.getItem('access_token') ||
                  localStorage.getItem('vigil_token');
    return token;
  };

  const userIsAdmin = useMemo(() => {
    if (isAdmin) return true;
    const role = (localStorage.getItem('role') || '').toLowerCase();
    if (role) return role === 'admin';
    const token = getAuthToken();
    if (!token) return false;
    try {
      const raw = token.split('.')[1] || '';
      const base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      return (payload.role || '').toLowerCase() === 'admin';
    } catch {
      return false;
    }
  }, [isAdmin]);

  // -- Evidence fetch --
  const fetchEvidence = async (control) => {
    setSelectedControl(control);
    setEvidenceDrawerOpen(true);
    setEvidenceItems([]);
    setEvidenceLoading(true);
    setEvidenceError(null);

    try {
      const params = new URLSearchParams({
        framework_id: activeFrameworkId,
        control_id: control.id,
      });

      // Only include drone_id when in drone scope
      if (complianceScope === 'drone' && scopedDroneId) {
        params.append('drone_id', scopedDroneId);
      }
      // Add date filters if set
      if (filterDateFrom) params.append('date_from', filterDateFrom);
      if (filterDateTo) params.append('date_to', filterDateTo);
      // Do NOT automatically add incident_id from control.evidenceRef.
      // Only add it when explicit incident filtering is introduced.

      const token = getAuthToken();
      if (!token) {
        setEvidenceError('No auth token. Please login again.');
        setEvidenceLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/evidence?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Evidence fetch failed: ${response.status}`);

      const data = await response.json();
      setEvidenceItems(data.evidence || []);
    } catch (error) {
      console.error('Evidence fetch error:', error);
      setEvidenceError(error.message);
      setEvidenceItems([]);
    } finally {
      setEvidenceLoading(false);
    }
  };

  // -- Framework summary (evidence-driven scoring) --
  const fetchFrameworkSummary = React.useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setSummaryError('No auth token');
        console.error('No auth token for summary fetch');
        return;
      }
      
      // Clear previous error
      setSummaryError(null);

      const params = new URLSearchParams({
        framework_id: activeFrameworkId,
      });

      // Add drone_id only in drone scope
      if (complianceScope === 'drone' && scopedDroneId) {
        params.append('drone_id', scopedDroneId);
      }

      // Add date filters if set
      if (filterDateFrom) params.append('date_from', filterDateFrom);
      if (filterDateTo) params.append('date_to', filterDateTo);

      const response = await fetch(`${API_BASE}/api/evidence/summary?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        setSummaryError(`API error: ${response.status}`);
        console.error('Summary fetch failed:', response.status);
        return;
      }

      const data = await response.json();
      setEvidenceSummary(data);
    } catch (error) {
      setSummaryError(error.message || 'Network error');
      console.error('Framework summary error:', error);
    }
  }, [activeFrameworkId, complianceScope, scopedDroneId, filterDateFrom, filterDateTo]);

  // Fetch evidence summary when framework, scope, or filters change
  React.useEffect(() => {
    fetchFrameworkSummary();
  }, [fetchFrameworkSummary]);

  // -- Evidence attach (POST) --
  const attachEvidence = async () => {
    if (!referenceId.trim()) {
      setEvidenceError('Reference ID is required');
      return;
    }
    if (!attestation.trim()) {
      setEvidenceError('Attestation is required');
      return;
    }

    // Diagnostic: log what we're about to send
    console.log('Attaching evidence:', {
      linkToDrone,
      scopedDroneId,
      will_send_drone_id: (linkToDrone && scopedDroneId) ? scopedDroneId : null
    });

    setAttachLoading(true);
    setEvidenceError(null);

    try {
      const payload = {
        framework_id: activeFrameworkId,
        control_id: selectedControl.id,
        evidence_type: evidenceType,
        reference_id: referenceId.trim(),
        drone_id: (linkToDrone && scopedDroneId) ? scopedDroneId : null,
        incident_id: attachIncidentId.trim() || null,
        attestation: attestation.trim(),
      };

      const token = getAuthToken();
      if (!token) {
        setEvidenceError('No auth token. Please login again.');
        setAttachLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Attach failed: ${response.status}`);
      }

      // Success - clear form and refresh
      setReferenceId('');
      setAttachIncidentId('');
      setEvidenceType('document');
      setAttestation('');
      setEvidenceError(null);

      // Refresh the drawer to show newly attached evidence
      await fetchEvidence(selectedControl);
    } catch (error) {
      console.error('Evidence attach error:', error);
      setEvidenceError(error.message);
    } finally {
      setAttachLoading(false);
    }
  };

  // -- Evidence review (admin only) --
  const reviewEvidence = async (evidenceId, decision) => {
    setReviewingEvidenceId(evidenceId);
    setEvidenceError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setEvidenceError('No auth token. Please login again.');
        setReviewingEvidenceId(null);
        return;
      }

      const response = await fetch(`${API_BASE}/api/evidence/${evidenceId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Review failed: ${response.status}`);
      }
      // Success - refresh drawer to show updated status
      await fetchEvidence(selectedControl);
    } catch (error) {
      console.error('Evidence review error:', error);
      setEvidenceError(error.message);
    } finally {
      setReviewingEvidenceId(null);
    }
  };

  // -- Esc key to close drawer + body scroll lock --
  React.useEffect(() => {
    if (evidenceDrawerOpen) {
      document.body.style.overflow = 'hidden';

      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          setEvidenceDrawerOpen(false);
          // Reset form on close
          setReferenceId('');
          setAttachIncidentId('');
          setEvidenceType('document');
          setAttestation('');
          setFilterDateFrom('');
          setFilterDateTo('');
          setEvidenceError(null);
        }
      };
      window.addEventListener('keydown', handleEsc);

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [evidenceDrawerOpen]);
// ── Framework registry ──
  // controlsWired flags which frameworks have editable control tables vs placeholders.
  const frameworks = useMemo(() => [
    { id: 'faa_107',       name: 'FAA Part 107',            ...faa107Summary,                                                     lastCheck: new Date(), controlsWired: true  },
    { id: 'faa_89',        name: 'FAA Part 89 (Remote ID)', ...faa89Summary,                                                   lastCheck: new Date(), controlsWired: true  },
    { id: 'easa_2019_947', name: 'EASA 2019/947',           score: 0,   met: 0,  requirements: 15, status: 'in_progress',  lastCheck: new Date(), controlsWired: false },
    { id: 'iso_27001',     name: 'ISO 27001',               score: 0,   met: 0,  requirements: 15, status: 'in_progress',  lastCheck: new Date(), controlsWired: false },
  ], [faa107Summary, faa89Summary]);

  // ── Change 1 (cont.): derive the active framework from the selection ──
  const activeFramework = useMemo(
    () => frameworks.find((f) => f.id === activeFrameworkId) || frameworks[0],
    [frameworks, activeFrameworkId]
  );

  const lastAudit = useMemo(() => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), []);

  const recentEvidence = useMemo(() => [
    { id: 1, type: 'forensics_bundle',    framework: 'FAA Part 107', timestamp: new Date(Date.now() - 3600000),  status: 'verified' },
    { id: 2, type: 'operator_assignment', framework: 'FAA Part 107', timestamp: new Date(Date.now() - 7200000),  status: 'verified' },
    { id: 3, type: 'flight_log',          framework: 'FAA Part 107', timestamp: new Date(Date.now() - 86400000), status: 'pending'  },
  ], []);

  // Pre-resolve styles so the top card can use them directly
  const activeStyles = getFrameworkCardClass(activeFramework.status);


  return (
    <div className="space-y-8">

      {/* ══════════════════════════════════════════════════════
          TOP CARD — Readiness Score
          Change 1: score and label come from activeFramework,
          not from a cross-framework average.
          ══════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 overflow-hidden shadow-lg">

        {/* Header: framework name + live score */}
        <div className="border-b border-slate-800/60 px-6 py-4 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-sm font-bold text-slate-50">Readiness Score</h2>

                  {/* Scope Toggle */}
                  <div className="flex items-center gap-1 rounded-lg bg-slate-950/60 border border-slate-700/60 p-1">
                    <button
                      onClick={() => setComplianceScope('org')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        complianceScope === 'org'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      Organization
                    </button>
                    <button
                      onClick={() => setComplianceScope('drone')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        complianceScope === 'drone'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      Drone
                    </button>
                  </div>

                  {/* Drone Selector */}
                  {complianceScope === 'drone' && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">-&gt;</span>
                      {drones.length > 0 ? (
                        // Dropdown if drones array is passed from parent
                        <div className="relative">
                          <select
                            value={activeDroneSelection}
                            onChange={(e) => setActiveDroneSelection(e.target.value)}
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
                        // Free-text input if no drones array provided
                        <input
                          type="text"
                          value={activeDroneSelection}
                          onChange={(e) => setActiveDroneSelection(e.target.value)}
                          placeholder="Enter drone ID..."
                          className="rounded-lg bg-slate-950/80 border border-slate-700/60 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all w-40"
                        />
                      )}
                      {activeDroneSelection && (
                        <span className="text-xs text-blue-300 font-mono">{activeDroneSelection}</span>
                      )}
                      {complianceScope === 'drone' && !activeDroneSelection && (
                        <span className="text-xs text-amber-300">No drone selected</span>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-0.5">
                  <span className="text-slate-200 font-semibold">{activeFramework.name}</span>
                  {' '}- Evidence-backed progress toward audit alignment
                  {' '}- <span className="text-amber-300">Met controls require evidence to score fully</span>
                </p>
                
                {/* Evidence scoring error warning */}
                {summaryError && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="text-xs text-rose-300 font-semibold">
                      Evidence scoring unavailable — using static state ({summaryError})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className={`text-3xl font-bold tabular-nums ${activeStyles.scoreColor}`}>
                {activeFramework.score}%
              </div>
              <div className={`text-xs ${activeStyles.statusColor}`}>
                {getStatusLabel(activeFramework.status)}
              </div>
              {activeFramework.controlsWired && (
                <div className="flex items-center justify-end gap-1.5 mt-1.5">
                  <span className="text-xs text-slate-400">
                    Evidence Coverage:{' '}
                    <span className="font-semibold text-slate-300">{activeFramework.evidenceCoverage}%</span>
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

        {/* Info tooltip — collapsed by default, toggled by the Info button */}
        <div className="border-b border-slate-800/60">
          <button
            type="button"
            onClick={() => setShowRubric((v) => !v)}
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

        {/* Stats row — middle card is now context-aware to the active framework */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <FileText className="w-5 h-5 text-slate-300" />
              <div>
                <div className="text-sm font-bold text-slate-50">{lastAudit.toLocaleDateString()}</div>
                <div className="text-xs text-slate-500">Last Review</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <Shield className="w-5 h-5 text-slate-300" />
              <div>
                <div className="text-sm font-bold text-slate-50 tabular-nums">
                  {activeFramework.met} <span className="text-slate-600">/</span> {activeFramework.requirements}
                </div>
                <div className="text-xs text-slate-500">Controls Met</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-sm font-bold text-slate-50">Hash-Stable</div>
                <div className="text-xs text-slate-500">Evidence bundles</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FRAMEWORK CARDS — clickable selection
          Change 2: each card is a button.  Clicking sets
          activeFrameworkId.  The active card shows a "Controls
          shown below" indicator so the operator understands
          which set of controls is expanded.
          ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {frameworks.map((framework) => {
          const styles   = getFrameworkCardClass(framework.status);
          const StatusIcon = getStatusIcon(framework.status);
          const isActive = activeFrameworkId === framework.id;

          return (
            <button
              key={framework.id}
              type="button"
              onClick={() => setActiveFrameworkId(framework.id)}
              className={`rounded-xl border bg-slate-900/80 shadow-lg overflow-hidden text-left transition-all ${
                isActive
                  ? 'border-blue-500/40 ring-1 ring-blue-500/20'
                  : 'border-slate-800/60 hover:border-slate-700/60'
              }`}
            >
              <div className="px-5 py-4">
                {/* Top row */}
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

                {/* Progress bar */}
                <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 ${styles.barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${framework.score}%` }}
                  />
                </div>

                {/* Active indicator — only on the selected card */}
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

      {/* ══════════════════════════════════════════════════════
          CONTROLS TABLE — renders for active framework only.
          FAA 107 → full editable table.
          Others  → clean placeholder until wired.
          ══════════════════════════════════════════════════════ */}
      {activeFrameworkId === 'faa_107' ? (
        <FrameworkControlsTable
          definitions={FAA_PART_107_CONTROLS_V1}
          stateMap={faa107State}
          summary={faa107Summary}
          onUpdate={updateFaa107Control}
          onViewEvidence={fetchEvidence}
          frameworkName="FAA Part 107"
          evidenceSummary={evidenceSummary}
        />
      ) : activeFrameworkId === 'faa_89' ? (
        <FrameworkControlsTable
          definitions={FAA_PART_89_CONTROLS_V1}
          stateMap={faa89State}
          summary={faa89Summary}
          onUpdate={updateFaa89Control}
          onViewEvidence={fetchEvidence}
          frameworkName="FAA Part 89 (Remote ID)"
          evidenceSummary={evidenceSummary}
        />
      ) : (
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-50">{activeFramework.name} � Control Details</h3>
            <p className="text-xs text-slate-400 mt-0.5">Control template mapping in progress</p>
          </div>
          <div className="p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4">
              <Clock className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-sm text-slate-300 font-semibold mb-1">Controls not yet mapped</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Individual control templates for {activeFramework.name} are being developed.
              The score on the card above is a placeholder pending full wiring.
            </p>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════════════════
          RECENT EVIDENCE ACTIVITY
          ══════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-900/60">
          <h3 className="text-sm font-bold text-slate-50">Recent Evidence Activity</h3>
          <p className="text-xs text-slate-400 mt-0.5">Snapshot of evidence events</p>
        </div>

        <div className="divide-y divide-slate-800/60">
          {recentEvidence.map((item) => (
            <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-950/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-50">
                    {item.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {item.framework} • {item.timestamp.toLocaleString()}
                  </div>
                </div>
              </div>

              <span
                className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold border ${
                  item.status === 'verified'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {item.status === 'verified' ? 'Verified' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>

                        {/* ------------------------------------------------------
          EVIDENCE DRAWER � slides in from right
          ------------------------------------------------------ */}
      <EvidenceDrawer
        isOpen={evidenceDrawerOpen}
        onClose={() => {
          setEvidenceDrawerOpen(false);
          setEvidenceError(null);
          setSelectedControl(null);
          setEvidenceItems([]);
          setEvidenceLoading(false);
          setAttachLoading(false);
          setReviewingEvidenceId(null);
          setEvidenceType('document');
          setReferenceId('');
          setLinkToDrone(true);
          setAttachIncidentId('');
          setAttestation('');
          setFilterDateFrom('');
          setFilterDateTo('');
        }}
        selectedControl={selectedControl}
        complianceScope={complianceScope}
        scopedDroneId={scopedDroneId}
        evidenceItems={evidenceItems}
        evidenceLoading={evidenceLoading}
        evidenceError={evidenceError}
        filterDateFrom={filterDateFrom}
        setFilterDateFrom={setFilterDateFrom}
        filterDateTo={filterDateTo}
        setFilterDateTo={setFilterDateTo}
        onApplyFilters={() => selectedControl && fetchEvidence(selectedControl)}
        onClearFilters={() => {
          setFilterDateFrom('');
          setFilterDateTo('');
          if (selectedControl) {
            fetchEvidence(selectedControl);
          }
        }}
        evidenceType={evidenceType}
        setEvidenceType={setEvidenceType}
        referenceId={referenceId}
        setReferenceId={setReferenceId}
        linkToDrone={linkToDrone}
        setLinkToDrone={setLinkToDrone}
        attachIncidentId={attachIncidentId}
        setAttachIncidentId={setAttachIncidentId}
        attestation={attestation}
        setAttestation={setAttestation}
        onAttachEvidence={attachEvidence}
        attachLoading={attachLoading}
        isAdmin={userIsAdmin}
        onReviewEvidence={reviewEvidence}
        reviewingEvidenceId={reviewingEvidenceId}
      />

    </div>
  );
};

export default ComplianceMonitor;
