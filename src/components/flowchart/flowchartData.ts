// Service Management System - Flowchart Data Model & Specifications
// Based on exact business workflow and architecture rules

export interface FlowNodeData {
  id: string;
  title: string;
  subtitle?: string;
  actor: 'Employee' | 'Admin' | 'KOT' | 'Service Partner' | 'System' | 'Decision';
  category: 'employee' | 'admin' | 'kot' | 'partner' | 'decision' | 'billing' | 'closure';
  icon: string;
  bullets: string[];
  description: string;
  roleResponsibilities?: string[];
  entityAttributes?: string[];
  stepNumber: number;
}

export const FLOW_NODES: Record<string, FlowNodeData> = {
  employee_raise: {
    id: 'employee_raise',
    title: 'Employee',
    subtitle: '(Raise Issue)',
    actor: 'Employee',
    category: 'employee',
    icon: 'User',
    stepNumber: 1,
    bullets: [
      'Fill service request form',
      'Device details (Laptop/Other)',
      'Issue description',
      'Date & time',
    ],
    description: 'The internal employee initiates support by submitting a ticket for their company device through the workstation software portal.',
    roleResponsibilities: [
      'Fill out hardware and issue diagnostics accurately',
      'Provide device serial tag or workstation ID',
      'Track request status in personal employee portal without administrative billing visibility',
    ],
    entityAttributes: ['emp_id', 'name', 'department', 'contact', 'device_type', 'description', 'date_time'],
  },

  submit_request: {
    id: 'submit_request',
    title: 'Submit Request',
    subtitle: '(Through Software)',
    actor: 'System',
    category: 'kot',
    icon: 'FileText',
    stepNumber: 2,
    bullets: [
      'Form validation check',
      'Record stored in system',
      'Real-time admin alert dispatched',
      'Tracking ID assigned',
    ],
    description: 'System processes the submitted employee request, persists it into the central database, and queues it directly in the Admin console.',
    roleResponsibilities: [
      'Ingest form payload securely',
      'Dispatch immediate badge notification to Admin',
      'Assign chronological request tracking number',
    ],
    entityAttributes: ['request_id', 'emp_id', 'device_type', 'description', 'date_time', 'status'],
  },

  admin_create_entry: {
    id: 'admin_create_entry',
    title: 'Admin',
    subtitle: '(Create Service Entry)',
    actor: 'Admin',
    category: 'admin',
    icon: 'UserCog',
    stepNumber: 3,
    bullets: [
      'Review the request',
      'Add/modify correct details',
      'Create service entry',
      'Generate KOT',
    ],
    description: 'Internal IT Admin directly reviews the ticket (NO issue validity diamond), validates/augments device parameters, and creates the official Service Entry.',
    roleResponsibilities: [
      'Review employee diagnostic notes',
      'Verify asset number against inventory registry',
      'Augment specs or urgency level if needed',
      'Generate initial KOT work order',
    ],
    entityAttributes: ['service_id', 'request_id', 'created_by_admin', 'date_time', 'service_status'],
  },

  kot_card: {
    id: 'kot_card',
    title: 'KOT (Job Card)',
    subtitle: 'Work Order Ticket',
    actor: 'KOT',
    category: 'kot',
    icon: 'FileSpreadsheet',
    stepNumber: 4,
    bullets: [
      'KOT ID',
      'Issue details',
      'Assigned service partner',
      'Estimated time of repair',
      'Estimated cost (if any)',
    ],
    description: 'Digital Job Card dispatched to the authorized Service Partner with hardware specifications, reported faults, and SLA targets.',
    roleResponsibilities: [
      'Binds Service ID to authorized technician/partner',
      'Defines scope of work and preliminary cost limits',
      'Serves as the contractual repair tracking entity',
    ],
    entityAttributes: ['kot_id', 'service_id', 'partner_id', 'estimated_time', 'estimated_cost', 'status'],
  },

  service_partner_work: {
    id: 'service_partner_work',
    title: 'Service Partner',
    subtitle: '(Work on Issue)',
    actor: 'Service Partner',
    category: 'partner',
    icon: 'Wrench',
    stepNumber: 5,
    bullets: [
      'Receive KOT',
      'Work on the issue',
      'Update status in system',
      'Add parts/services used',
      'Upload service report',
    ],
    description: 'Authorized service partner accesses KOT, runs bench diagnostics, performs repairs, logs spare parts used, and submits technical findings.',
    roleResponsibilities: [
      'Acknowledge and inspect physical workstation',
      'Execute repair or part replacement under warranty/contract',
      'Log billable items and service timestamps',
      'Mark issue resolved OR report impasse to Admin',
    ],
    entityAttributes: ['partner_id', 'name', 'contact', 'specialization', 'technician_notes'],
  },

  issue_resolved_decision: {
    id: 'issue_resolved_decision',
    title: 'Issue Resolved?',
    subtitle: 'Diagnostic Verification',
    actor: 'Decision',
    category: 'decision',
    icon: 'HelpCircle',
    stepNumber: 6,
    bullets: [
      'Hardware QA passed?',
      'POST / Boot test valid?',
      'Parts functional?',
      'Branch: YES / NO',
    ],
    description: 'Primary diagnostic decision gate. If YES, system branches to Final Menu billing. If NO, Service Partner triggers the administrative loop.',
    roleResponsibilities: [
      'Verify physical repair integrity',
      'Branch YES: proceed to invoice generation',
      'Branch NO: return report to Admin for new KOT cycle',
    ],
    entityAttributes: ['qa_passed', 'bench_tested', 'diagnostic_result'],
  },

  // YES BRANCH:
  prepare_final_menu: {
    id: 'prepare_final_menu',
    title: 'Prepare Final Menu',
    subtitle: '(Bill / Invoice)',
    actor: 'System',
    category: 'billing',
    icon: 'Receipt',
    stepNumber: 7,
    bullets: [
      'Service charges',
      'Parts (if any)',
      'Total cost',
      'Repaired date & time',
    ],
    description: 'Comprehensive itemized invoice compiled automatically from partner labor charges, parts consumed, and tax tariffs.',
    roleResponsibilities: [
      'Itemize spare parts & components',
      'Calculate total organizational repair spend',
      'Record completion timestamp',
      'Prepare confidential billing payload for Admin review',
    ],
    entityAttributes: ['menu_id', 'kot_id', 'total_cost', 'parts_cost', 'labor_charges', 'repaired_date', 'created_by'],
  },

  notify_admin_only: {
    id: 'notify_admin_only',
    title: 'Notify Admin Only',
    subtitle: 'Confidential Internal Notification',
    actor: 'Admin',
    category: 'partner',
    icon: 'BellRing',
    stepNumber: 8,
    bullets: [
      'Send final menu / bill details',
      'Issue marked as resolved',
      'Service history updated',
    ],
    description: 'CRITICAL SECURITY RULE: The final financial bill is dispatched strictly to internal IT Admin. Employee NEVER receives repair billing notifications.',
    roleResponsibilities: [
      'Admin approves vendor financial invoice',
      'System updates asset service expenditure ledger',
      'Employee receives general "Device Ready" status only',
    ],
    entityAttributes: ['notification_id', 'recipient_role (admin)', 'bill_reference', 'dispatched_at'],
  },

  close_issue: {
    id: 'close_issue',
    title: 'Close Issue',
    subtitle: '(End)',
    actor: 'System',
    category: 'closure',
    icon: 'CheckCircle2',
    stepNumber: 9,
    bullets: [
      'Mark as closed',
      'Maintain service history',
      'Return asset to active fleet',
    ],
    description: 'Final workflow termination. Locks KOT ledger, transitions asset status from "Under Service" to "Assigned/Available", and stores audit trail permanently.',
    roleResponsibilities: [
      'Archive complete chronological repair log',
      'Update corporate asset lifetime maintenance spend',
      'Close service ticket permanently',
    ],
    entityAttributes: ['closure_id', 'final_status', 'archive_timestamp', 'total_turnaround_hours'],
  },

  // NO BRANCH:
  partner_sends_report: {
    id: 'partner_sends_report',
    title: 'Service Partner Sends Report',
    subtitle: '(Through Software)',
    actor: 'Service Partner',
    category: 'kot',
    icon: 'FileWarning',
    stepNumber: 10,
    bullets: [
      'Mention issue not resolved',
      'Add findings / notes',
      'Attach images (if any)',
      'Suggest next action',
    ],
    description: 'When standard repair fails (e.g. motherboard dead, parts backordered), Partner files an unresolved incident report explaining root cause.',
    roleResponsibilities: [
      'Provide detailed failure diagnosis',
      'Attach high-res photos or diagnostic log dumps',
      'Recommend escalation or alternate component procurement',
    ],
    entityAttributes: ['report_id', 'kot_id', 'issue_not_resolved_flag', 'notes', 'images', 'created_at'],
  },

  admin_reviews_report: {
    id: 'admin_reviews_report',
    title: 'Admin Reviews Report',
    subtitle: 'Escalation & Reassignment',
    actor: 'Admin',
    category: 'admin',
    icon: 'Settings',
    stepNumber: 11,
    bullets: [
      'Check service partner report',
      'Decide next action',
      'Generate new KOT',
      'Reassign (same or different partner)',
    ],
    description: 'Admin evaluates partner impasse, authorizes extended budget or warranty swap, and issues a NEW KOT, feeding back into the KOT node.',
    roleResponsibilities: [
      'Evaluate feasibility of secondary repair',
      'Authorize OEM part procurement or swap vendor',
      'Generate NEW secondary KOT work order',
      'Reassign loop continuation to Partner',
    ],
    entityAttributes: ['admin_review_id', 'report_id', 'next_action', 'new_kot_generated'],
  },
};

export const KEY_POINTS = [
  { id: 1, text: 'Employee raises request (internal employee only, no external customer!).' },
  { id: 2, text: 'No issue validity check — Admin directly creates a valid service entry upon review.' },
  { id: 3, text: 'If issue is not resolved, Service Partner sends a structured report to Admin via software.' },
  { id: 4, text: 'Admin generates a NEW KOT and the process repeats in a controlled loop.' },
  { id: 5, text: 'Final menu/bill is notified ONLY to Admin (confidential internal vendor invoice).' },
  { id: 6, text: 'Employee can track high-level status but never receives financial repair bills.' },
];

export const MAIN_ENTITIES = [
  {
    name: 'Employee',
    fields: ['emp_id', 'name', 'department', 'contact'],
    desc: 'Internal workforce user initiating hardware support for corporate workstation.',
  },
  {
    name: 'ServiceRequest',
    fields: ['request_id', 'emp_id', 'device_type', 'description', 'date_time', 'status'],
    desc: 'Initial raw support ticket submitted by employee through software portal.',
  },
  {
    name: 'ServiceEntry',
    fields: ['service_id', 'request_id', 'created_by_admin', 'date_time'],
    desc: 'Official administrative repair record registered in enterprise fleet ledger.',
  },
  {
    name: 'KOT',
    fields: ['kot_id', 'service_id', 'partner_id', 'estimated_time', 'estimated_cost', 'status'],
    desc: 'Job Card binding the ticket to vendor with SLA timelines and cost estimates.',
  },
  {
    name: 'ServicePartner',
    fields: ['partner_id', 'name', 'contact', 'specialization'],
    desc: 'Authorized external technician or hardware service center.',
  },
  {
    name: 'ServiceReport',
    fields: ['report_id', 'kot_id', 'notes', 'images', 'status', 'created_at'],
    desc: 'Diagnostic update filed when repairs are incomplete or require escalation.',
  },
  {
    name: 'FinalMenu',
    fields: ['menu_id', 'kot_id', 'total_cost', 'repaired_date', 'created_by'],
    desc: 'Final financial billing and parts accounting document sent to Admin only.',
  },
];

export const SYSTEM_ROLES = [
  {
    role: 'Employee',
    color: 'emerald',
    badge: 'Internal Workforce',
    duties: [
      'Raise hardware service request through portal',
      'Provide device serial, symptoms, and urgency',
      'Track real-time resolution milestones',
    ],
  },
  {
    role: 'Admin',
    color: 'amber',
    badge: 'IT Administrator',
    duties: [
      'Review employee requests & create service entry',
      'Generate initial KOT and assign Service Partner',
      'Evaluate unresolved reports & issue secondary KOTs',
      'Receive final bill / invoice & authorize issue closure',
    ],
  },
  {
    role: 'Service Partner',
    color: 'purple',
    badge: 'Certified Technician',
    duties: [
      'Receive KOT work orders digitally',
      'Execute diagnostics, board repairs, and part swaps',
      'Log replacement components and labor hours',
      'Transmit unresolved failure reports back to Admin',
    ],
  },
];

export const MODULE_RESPONSIBILITIES = [
  {
    title: '1. Employee',
    icon: 'User',
    color: 'emerald',
    points: [
      'Raise service request with device parameters',
      'Describe symptoms, error codes, and incident date/time',
      'Monitor repair progress in self-service dashboard',
    ],
  },
  {
    title: '2. Admin',
    icon: 'ShieldCheck',
    color: 'amber',
    points: [
      'Create authoritative Service Entry directly',
      'Generate KOT Job Card and assign Service Partner',
      'Review technical reports on unresolved repairs',
      'Generate NEW KOTs for persistent/escalated faults',
      'Receive confidential Final Menu / Bill',
      'Authorize formal Issue Closure',
    ],
  },
  {
    title: '3. KOT (Job Card)',
    icon: 'FileText',
    color: 'blue',
    points: [
      'Unique KOT ID mapped to Service ID',
      'Precise device specs and reported faults',
      'Assigned Service Partner identification',
      'Estimated repair time and provisional cost',
      'Real-time lifecycle status tracking',
    ],
  },
  {
    title: '4. Service Partner',
    icon: 'Wrench',
    color: 'purple',
    points: [
      'Accept digital KOT work order',
      'Execute bench diagnostic and repair actions',
      'Record parts replaced and labor breakdown',
      'Upload technical findings and inspection photos',
      'Submit unresolved status report to Admin when stalled',
      'Flag issue as resolved upon QA verification',
    ],
  },
  {
    title: '5. Final Menu / Bill',
    icon: 'Receipt',
    color: 'blue',
    points: [
      'Itemized spare parts costs and service charges',
      'Total consolidated repair expenditure',
      'Repaired completion date and time stamp',
      'Strictly confidential: Admin Notification ONLY',
    ],
  },
  {
    title: '6. Issue Closure',
    icon: 'CheckCircle2',
    color: 'emerald',
    points: [
      'Transition ticket to Closed / Resolved state',
      'Archive full chronological timeline and KOT chain',
      'Store vendor billing records in corporate asset ledger',
      'Restore device to active workforce fleet',
    ],
  },
];
