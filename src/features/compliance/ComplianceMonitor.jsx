import React, { useMemo, useState } from 'react';
import { FileText, Clock } from 'lucide-react';
import EvidenceDrawer from './EvidenceDrawer';
import ScopeToggle from './ScopeToggle';
import FrameworkSelector from './FrameworkSelector';
import ReadinessHeader from './ReadinessHeader';
import {
  getAuthToken,
  fetchEvidence as apiFetchEvidence,
  attachEvidence as apiAttachEvidence,
  reviewEvidence as apiReviewEvidence,
  fetchEvidenceSummary as apiFetchEvidenceSummary,
} from './complianceApi';
import {
  computeFrameworkSummary,
  getFrameworkCardClass,
  getStatusLabel,
} from './scoring';
import FrameworkControlsTable from './FrameworkControlsTable';
import {
  FAA_PART_107_CONTROLS_V1,
  FAA_PART_89_CONTROLS_V1,
  EASA_2019_947_CONTROLS_V1,
  ISO_27001_CONTROLS_V1,
} from './controlDefinitions';

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

// Seeds a { controlId ? { status, evidenceRef, notes } } map from a
// definitions array.  Called once per framework via lazy useState.
const DEFAULT_CONTROL_STATE = { status: STATUS.PARTIAL, evidenceRef: '', notes: '' };

function initStateMap(definitions) {
  return Object.fromEntries(
    definitions.map((def) => [def.id, { ...DEFAULT_CONTROL_STATE }])
  );
}

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
  const [lastSummaryFetch, setLastSummaryFetch] = useState(null);

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

  // EASA 2019/947
  const [easa2019947State, setEasa2019947State] = useState(() => initStateMap(EASA_2019_947_CONTROLS_V1));
  const easa2019947Summary = useMemo(
    () => computeFrameworkSummary(EASA_2019_947_CONTROLS_V1, easa2019947State, evidenceSummary),
    [easa2019947State, evidenceSummary]
  );
  const updateEasa2019947Control = (id, patch) => {
    setEasa2019947State((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  // ISO 27001
  const [iso27001State, setIso27001State] = useState(() => initStateMap(ISO_27001_CONTROLS_V1));
  const iso27001Summary = useMemo(
    () => computeFrameworkSummary(ISO_27001_CONTROLS_V1, iso27001State, evidenceSummary),
    [iso27001State, evidenceSummary]
  );
  const updateIso27001Control = (id, patch) => {
    setIso27001State((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
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
      const data = await apiFetchEvidence({
        API_BASE,
        framework_id: activeFrameworkId,
        control_id: control.id,
        drone_id: complianceScope === 'drone' ? scopedDroneId : undefined,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
      });
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
      setSummaryError(null);
      const data = await apiFetchEvidenceSummary({
        API_BASE,
        framework_id: activeFrameworkId,
        drone_id: complianceScope === 'drone' ? scopedDroneId : undefined,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
      });
      setEvidenceSummary(data);
      setLastSummaryFetch(new Date().toISOString());
      setSummaryError(null);
    } catch (error) {
      setSummaryError(error.message || 'Network error');
      console.error('Framework summary error:', error);
    }
  }, [activeFrameworkId, complianceScope, scopedDroneId, filterDateFrom, filterDateTo]);

  // Fetch evidence summary when framework, scope, or filters change
  React.useEffect(() => {
    fetchFrameworkSummary();
  }, [fetchFrameworkSummary]);

  const controlDefsByFramework = {
    faa_107: FAA_PART_107_CONTROLS_V1,
    faa_89: FAA_PART_89_CONTROLS_V1,
    easa_2019_947: EASA_2019_947_CONTROLS_V1,
    iso_27001: ISO_27001_CONTROLS_V1,
  };

  const controlStateByFramework = {
    faa_107: faa107State,
    faa_89: faa89State,
    easa_2019_947: easa2019947State,
    iso_27001: iso27001State,
  };

  const controlSummaryByFramework = {
    faa_107: faa107Summary,
    faa_89: faa89Summary,
    easa_2019_947: easa2019947Summary,
    iso_27001: iso27001Summary,
  };

  const controlUpdateByFramework = {
    faa_107: updateFaa107Control,
    faa_89: updateFaa89Control,
    easa_2019_947: updateEasa2019947Control,
    iso_27001: updateIso27001Control,
  };

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

      await apiAttachEvidence({ API_BASE, payload });

      // Success - clear form and refresh
      setReferenceId('');
      setAttachIncidentId('');
      setEvidenceType('document');
      setAttestation('');
      setEvidenceError(null);

      // Refresh the drawer to show newly attached evidence
      await fetchEvidence(selectedControl);
      await fetchFrameworkSummary();
    } catch (error) {
      console.error('Evidence attach error:', error);
      setEvidenceError(error.message);
    } finally {
      setAttachLoading(false);
    }
  };

  // -- Evidence review (admin only) --
  const reviewEvidence = async (evidenceId, decision, note = '') => {
    setReviewingEvidenceId(evidenceId);
    setEvidenceError(null);

    try {
      await apiReviewEvidence({
        API_BASE,
        evidenceId,
        decision,
        note: note || undefined,
      });
      // Success - refresh drawer to show updated status
      await fetchEvidence(selectedControl);
      await fetchFrameworkSummary();
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
    { id: 'easa_2019_947', name: 'EASA 2019/947',           ...easa2019947Summary,                                             lastCheck: new Date(), controlsWired: true  },
    { id: 'iso_27001',     name: 'ISO 27001',               ...iso27001Summary,                                               lastCheck: new Date(), controlsWired: true  },
  ], [faa107Summary, faa89Summary, easa2019947Summary, iso27001Summary]);

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
      <ReadinessHeader
        activeFrameworkName={activeFramework.name}
        readinessScore={activeFramework.score}
        evidenceCoveragePct={activeFramework.evidenceCoverage}
        lastReviewDate={lastAudit.toLocaleDateString()}
        controlsMetCount={activeFramework.met}
        totalControlsCount={activeFramework.requirements}
        evidenceBundlesStatusText="Hash-Stable"
        summaryError={summaryError}
        lastSummaryFetch={lastSummaryFetch}
        statusLabel={getStatusLabel(activeFramework.status)}
        scoreColorClass={activeStyles.scoreColor}
        statusColorClass={activeStyles.statusColor}
        controlsWired={activeFramework.controlsWired}
        showRubric={showRubric}
        onToggleRubric={() => setShowRubric((v) => !v)}
        scopeToggleNode={
          <ScopeToggle
            scope={complianceScope}
            onScopeChange={setComplianceScope}
            drones={drones}
            scopedDroneId={activeDroneSelection}
            onDroneChange={setActiveDroneSelection}
          />
        }
      />

      <FrameworkSelector
        frameworks={frameworks}
        activeFrameworkId={activeFrameworkId}
        onSelectFramework={setActiveFrameworkId}
      />

      {activeFramework.controlsWired ? (
        <FrameworkControlsTable
          definitions={controlDefsByFramework[activeFrameworkId] || []}
          stateMap={controlStateByFramework[activeFrameworkId] || {}}
          summary={controlSummaryByFramework[activeFrameworkId] || { score: 0, status: 'in_progress', accepted_by_control: {}, pending_by_control: {} }}
          onUpdate={controlUpdateByFramework[activeFrameworkId]}
          onViewEvidence={fetchEvidence}
          frameworkName={activeFramework.name}
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
        evidenceSummary={evidenceSummary}
      />

    </div>
  );
};

export default ComplianceMonitor;

