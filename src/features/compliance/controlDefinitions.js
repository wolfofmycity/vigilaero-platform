// Extracted control definitions for compliance frameworks.

export const FAA_PART_107_CONTROLS_V1 = [
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
export const FAA_PART_89_CONTROLS_V1 = [
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
export const EASA_2019_947_CONTROLS_V1 = [
  {
    id: 'easa_001',
    title: 'Operational category assignment',
    intent: 'Each operation is assigned an applicable operational category and the decision is recorded with sufficient context for audit review.',
    evidenceHints: ['Operational category record', 'Mission brief', 'Decision log entry'],
    weight: 1,
  },
  {
    id: 'easa_002',
    title: 'Operator accountability record',
    intent: 'Responsible operator and accountable personnel are identified for each mission with traceable responsibility for decisions and actions.',
    evidenceHints: ['Operator assignment', 'RACI/role mapping', 'Mission ownership record'],
    weight: 1,
  },
  {
    id: 'easa_003',
    title: 'Pilot competency evidence',
    intent: 'Pilot competency and required training/authorization evidence is maintained and linked to operational activity for inspection-readiness.',
    evidenceHints: ['Training record', 'Competency tracker', 'Authorization evidence'],
    weight: 1,
  },
  {
    id: 'easa_004',
    title: 'Pre-flight operational checklist',
    intent: 'A pre-flight checklist is executed and retained for each mission, covering readiness of aircraft, crew, and operating environment.',
    evidenceHints: ['Pre-flight checklist', 'Checklist sign-off', 'Mission readiness record'],
    weight: 1,
  },
  {
    id: 'easa_005',
    title: 'Airspace and zone constraint check',
    intent: 'Airspace and geographic zone constraints are checked prior to operation and evidence of the check is retained.',
    evidenceHints: ['Zone check log', 'Airspace verification record', 'Constraint screenshot/export'],
    weight: 1,
  },
  {
    id: 'easa_006',
    title: 'Risk assessment record',
    intent: 'A structured risk assessment is performed prior to mission approval and retained for audit defensibility.',
    evidenceHints: ['Risk assessment form', 'Approval record', 'Risk register entry'],
    weight: 1,
  },
  {
    id: 'easa_007',
    title: 'Contingency and emergency procedures',
    intent: 'Contingency procedures (lost link, RTH, emergency actions) are defined, accessible, and evidence of readiness is retained.',
    evidenceHints: ['Contingency SOP', 'Procedure checklist', 'Exercise/drill record'],
    weight: 1,
  },
  {
    id: 'easa_008',
    title: 'UAS configuration baseline',
    intent: 'A baseline configuration for the UAS is maintained for operations and deviations are recorded with change accountability.',
    evidenceHints: ['Configuration baseline', 'Config diff', 'Change approval record'],
    weight: 1,
  },
  {
    id: 'easa_009',
    title: 'Maintenance and serviceability records',
    intent: 'Maintenance actions and aircraft readiness status are tracked and retained to support post-incident investigation and audit review.',
    evidenceHints: ['Maintenance log', 'Defect/repair tickets', 'Readiness-to-fly status'],
    weight: 1,
  },
  {
    id: 'easa_010',
    title: 'Operational data handling safeguards',
    intent: 'Operational data (telemetry, logs, evidence artifacts) is protected against unauthorized access or modification and controls are auditable.',
    evidenceHints: ['Access logs', 'Encryption evidence', 'Retention policy'],
    weight: 1,
  },
  {
    id: 'easa_011',
    title: 'Logging and traceability',
    intent: 'Mission activity logs are retained in a manner sufficient to reconstruct events, decisions, and operational outcomes for inspection.',
    evidenceHints: ['Flight/mission logs', 'Audit trail records', 'Export bundle'],
    weight: 1,
  },
  {
    id: 'easa_012',
    title: 'Telemetry anomaly monitoring',
    intent: 'Telemetry anomalies indicative of safety or security issues are detected, recorded, and triaged with traceable timestamps and outcomes.',
    evidenceHints: ['Anomaly alerts', 'Triage notes', 'Linked incident record'],
    weight: 1,
  },
  {
    id: 'easa_013',
    title: 'Incident capture and classification',
    intent: 'Incidents are captured with classification, scope, timeline, and linked evidence artifacts to support regulator-facing review.',
    evidenceHints: ['Incident record', 'Classification notes', 'Evidence links'],
    weight: 1,
  },
  {
    id: 'easa_014',
    title: 'Incident response actions recorded',
    intent: 'Response actions (containment, recovery, communications) are recorded with decision rationale and reviewer notes for audit defensibility.',
    evidenceHints: ['Response timeline', 'Containment actions', 'Reviewer notes'],
    weight: 1,
  },
  {
    id: 'easa_015',
    title: 'Corrective actions and verification',
    intent: 'Corrective actions are tracked to closure with verification evidence demonstrating effectiveness and preventing recurrence.',
    evidenceHints: ['Corrective action tickets', 'Verification record', 'Closure evidence'],
    weight: 1,
  },
];
export const ISO_27001_CONTROLS_V1 = [
  {
    id: 'iso_001',
    title: 'Information security policy governance',
    intent: 'Security policies are documented, approved, versioned, and reviewed on a defined cadence with evidence of communication.',
    evidenceHints: ['Policy register', 'Approval record', 'Review cadence log'],
    weight: 1,
  },
  {
    id: 'iso_002',
    title: 'Risk management evidence',
    intent: 'Information security risks are identified, assessed, treated, and reviewed with auditable treatment decisions and ownership.',
    evidenceHints: ['Risk register', 'Treatment plan', 'Risk review minutes'],
    weight: 1,
  },
  {
    id: 'iso_003',
    title: 'Asset inventory and ownership',
    intent: 'Information assets and operational systems are inventoried with ownership and criticality recorded to support governance and audits.',
    evidenceHints: ['Asset inventory', 'Ownership registry', 'Classification labels'],
    weight: 1,
  },
  {
    id: 'iso_004',
    title: 'User access provisioning and review',
    intent: 'User access is provisioned based on role and reviewed periodically, with evidence of approvals and removals.',
    evidenceHints: ['Access request approvals', 'Access review report', 'Deprovisioning log'],
    weight: 1,
  },
  {
    id: 'iso_005',
    title: 'Privileged access controls',
    intent: 'Privileged access is restricted, monitored, and reviewed with accountable usage records suitable for audit investigation.',
    evidenceHints: ['Admin role assignments', 'Privileged activity logs', 'Review notes'],
    weight: 1,
  },
  {
    id: 'iso_006',
    title: 'Authentication and session assurance',
    intent: 'Authentication and session controls reduce unauthorized access risk and produce audit evidence of user identity and actions.',
    evidenceHints: ['Auth logs', 'Session policy config', 'MFA evidence (if enabled)'],
    weight: 1,
  },
  {
    id: 'iso_007',
    title: 'Change management and approvals',
    intent: 'Changes to critical systems are reviewed, approved, and traceable with evidence of testing and rollback readiness.',
    evidenceHints: ['Change tickets', 'Approval records', 'Release notes'],
    weight: 1,
  },
  {
    id: 'iso_008',
    title: 'Secure configuration baseline',
    intent: 'Secure configuration baselines are defined and deviations are tracked to protect system integrity and reduce drift.',
    evidenceHints: ['Baseline checklist', 'Config snapshots', 'Drift review notes'],
    weight: 1,
  },
  {
    id: 'iso_009',
    title: 'Vulnerability management workflow',
    intent: 'Vulnerabilities are tracked from discovery through remediation with evidence of prioritization and closure.',
    evidenceHints: ['Vulnerability backlog', 'Remediation tickets', 'Fix verification notes'],
    weight: 1,
  },
  {
    id: 'iso_010',
    title: 'Backup and recovery validation',
    intent: 'Backups are performed and recovery is periodically validated with evidence demonstrating operational resilience.',
    evidenceHints: ['Backup logs', 'Restore test report', 'Recovery runbook'],
    weight: 1,
  },
  {
    id: 'iso_011',
    title: 'Security logging and retention',
    intent: 'Security-relevant events are logged and retained to support investigations and demonstrate accountability in audits.',
    evidenceHints: ['Audit trail samples', 'Log retention config', 'Export bundle'],
    weight: 1,
  },
  {
    id: 'iso_012',
    title: 'Monitoring and alert triage',
    intent: 'Alerts are monitored and triaged with evidence of assessment, escalation, and outcomes.',
    evidenceHints: ['Alert queue snapshots', 'Triage notes', 'Linked incidents'],
    weight: 1,
  },
  {
    id: 'iso_013',
    title: 'Incident management execution',
    intent: 'Incidents are recorded and managed through a consistent workflow with evidence artifacts and reviewer notes.',
    evidenceHints: ['Incident record', 'Response timeline', 'Review notes'],
    weight: 1,
  },
  {
    id: 'iso_014',
    title: 'Supplier and dependency oversight',
    intent: 'Third-party dependencies are tracked and assessed for security impact with evidence of review and risk handling.',
    evidenceHints: ['Supplier register', 'Assessment notes', 'Risk exceptions'],
    weight: 1,
  },
  {
    id: 'iso_015',
    title: 'Corrective action tracking',
    intent: 'Corrective actions are assigned, tracked to closure, and verified for effectiveness with audit-ready evidence.',
    evidenceHints: ['Corrective action tickets', 'Closure evidence', 'Verification record'],
    weight: 1,
  },
];

