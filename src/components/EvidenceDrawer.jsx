import React from 'react';
import { FileText, Clock } from 'lucide-react';

function getEvidenceScopeBadge(item) {
  if (item.incident_id) {
    return {
      label: 'INCIDENT',
      className: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      tooltip: 'Applies to a specific incident',
    };
  }
  if (item.drone_id) {
    return {
      label: 'DRONE',
      className: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      tooltip: 'Applies to this specific drone',
    };
  }
  return {
    label: 'ORG',
    className: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    tooltip: 'Applies to organization-wide compliance posture',
  };
}

export default function EvidenceDrawer(props) {
  const {
    isOpen,
    onClose,
    selectedControl,
    complianceScope,
    scopedDroneId,
    evidenceItems,
    evidenceLoading,
    evidenceError,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    onClearFilters,
    evidenceType,
    setEvidenceType,
    referenceId,
    setReferenceId,
    linkToDrone,
    setLinkToDrone,
    attachIncidentId,
    setAttachIncidentId,
    attestation,
    setAttestation,
    onAttachEvidence,
    attachLoading,
    isAdmin,
    onReviewEvidence,
    reviewingEvidenceId,
  } = props;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div
        className="fixed right-0 top-0 bottom-0 w-[480px] bg-slate-900 border-l border-slate-800/60 shadow-2xl z-50 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800/60 px-6 py-4 z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-50">Evidence Artifacts</h3>
              </div>
              <p className="text-xs text-slate-400 mb-1">
                Control {selectedControl?.id}: {selectedControl?.title}
              </p>
              {complianceScope === 'drone' && scopedDroneId ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-slate-500">Showing:</span>
                  <span className="text-xs font-mono text-blue-300">{scopedDroneId}</span>
                  <span className="text-slate-600">+</span>
                  <span className="text-xs text-slate-400">Org evidence</span>
                </div>
              ) : complianceScope === 'org' ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-slate-500">Showing:</span>
                  <span className="text-xs text-slate-400">Organization-wide evidence</span>
                </div>
              ) : null}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 -mr-1"
              aria-label="Close evidence drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="border-b border-slate-800/60 px-6 py-4 bg-slate-950/60">
          <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wide">Filter Evidence</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">From Date</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">To Date</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          {(filterDateFrom || filterDateTo) && (
            <button
              onClick={onClearFilters}
              className="mt-3 text-xs text-blue-300 hover:text-blue-200 transition-colors"
            >
              Clear date filters
            </button>
          )}
        </div>

        <div className="border-b border-slate-800/60 px-6 py-4 bg-slate-950/40">
          <h4 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wide">Attach Evidence</h4>

          {evidenceError && (
            <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {evidenceError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Evidence Type</label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                disabled={attachLoading}
                className="w-full rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50"
              >
                <option value="document">Document</option>
                <option value="policy">Policy</option>
                <option value="sop">SOP</option>
                <option value="training">Training</option>
                <option value="waiver">Waiver</option>
                <option value="registration">Registration</option>
                <option value="log">Log</option>
                <option value="screenshot">Screenshot</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Reference ID or URL</label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                disabled={attachLoading}
                placeholder="doc:cert.pdf or https://..."
                className="w-full rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50"
              />
            </div>

            {complianceScope === 'drone' && scopedDroneId ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkToDrone}
                  onChange={(e) => setLinkToDrone(e.target.checked)}
                  disabled={attachLoading}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                />
                <span className="text-xs text-slate-300">Link to drone {scopedDroneId}</span>
              </label>
            ) : (
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/40">
                <p className="text-xs text-slate-400 italic">
                  Select a drone + switch to Drone scope to attach drone-scoped evidence
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Incident ID (optional)</label>
              <input
                type="text"
                value={attachIncidentId}
                onChange={(e) => setAttachIncidentId(e.target.value)}
                disabled={attachLoading}
                placeholder="INC-xxxx"
                className="w-full rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Attestation (required)</label>
              <textarea
                value={attestation}
                onChange={(e) => setAttestation(e.target.value)}
                disabled={attachLoading}
                rows={3}
                placeholder="Explain why this artifact is valid and audit-ready evidence for this control."
                className="w-full rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50 resize-none"
              />
            </div>

            <button
              onClick={onAttachEvidence}
              disabled={attachLoading || !referenceId.trim() || !attestation.trim()}
              className="w-full rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {attachLoading ? 'Attaching...' : 'Attach Evidence'}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {evidenceLoading && evidenceItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading evidence...</p>
            </div>
          ) : evidenceItems.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400 mb-1">No evidence artifacts found</p>
              <p className="text-xs text-slate-500">Attach evidence using the form above</p>
            </div>
          ) : (
            evidenceItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-4 hover:bg-slate-950/60 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-50">{item.evidence_type || item.type}</div>
                      <div className="text-xs text-slate-500">{item.source_event || item.sourceEvent || 'Evidence'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const scopeBadge = getEvidenceScopeBadge(item);
                      return (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${scopeBadge.className}`}
                          title={scopeBadge.tooltip}
                        >
                          {scopeBadge.label}
                        </span>
                      );
                    })()}
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      item.review_status === 'accepted'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : item.review_status === 'rejected'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      {item.review_status === 'accepted' ? 'Accepted' : item.review_status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                </div>

                {item.attestation && (
                  <div className="mb-3 p-3 rounded-lg bg-slate-900/60 border border-slate-700/40">
                    <div className="text-xs text-slate-500 mb-1.5 font-semibold">Attestation</div>
                    <div className="text-xs text-slate-300 leading-relaxed italic">{item.attestation}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-500 mb-0.5">Scope</div>
                    <div className="flex items-center gap-1.5">
                      {item.drone_id || item.droneId ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                          {item.drone_id || item.droneId}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-500/10 text-slate-300 border border-slate-500/30">
                          ORG
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-0.5">Incident ID</div>
                    <div className="text-slate-200 font-mono">{item.incident_id || item.incidentId || 'N/A'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-slate-500 mb-0.5">Timestamp</div>
                    <div className="text-slate-300">{new Date(item.timestamp || item.created_at).toLocaleString()}</div>
                  </div>
                </div>

                {isAdmin && item.review_status === 'pending' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800/60">
                    <button
                      onClick={() => onReviewEvidence(item.id, 'accepted')}
                      disabled={attachLoading || reviewingEvidenceId === item.id}
                      className="flex-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onReviewEvidence(item.id, 'rejected')}
                      disabled={attachLoading || reviewingEvidenceId === item.id}
                      className="flex-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800/60 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/60 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
