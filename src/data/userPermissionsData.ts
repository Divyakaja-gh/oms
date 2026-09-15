import { PermissionDefinition, SystemAccessUser, SystemRole } from '../types';

export const PERMISSION_CATEGORIES = [
  {
    id: 'AUDIT_SECURITY',
    label: 'Audit, Security & Governance',
    description: 'SOC2 Type II controls, cryptographic audit trails, and KMS vault credentials'
  },
  {
    id: 'STATUTORY_FILINGS',
    label: 'Statutory Compliance & Filings',
    description: 'GST, Income Tax, TDS, ROC filings, and Digital Signature Key oversight'
  },
  {
    id: 'CLIENT_VAULT',
    label: 'Client Registry & Document Vault',
    description: 'Confidential client accounts, master databases, and financial statements'
  },
  {
    id: 'AI_AUTOMATION',
    label: 'Autonomous AI & Intelligence',
    description: 'Notice Triage agents, reconciliation engines, and OCR invoice extraction'
  },
  {
    id: 'BILLING_OPERATIONS',
    label: 'Billing, Operations & Team',
    description: 'Invoicing, metered credits, live staff attendance, and practice administration'
  }
] as const;

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // AUDIT & SECURITY
  {
    id: 'audit_logs_view',
    name: 'View Audit & Forensic Logs',
    description: 'Inspect immutable SHA-256 access trails, IP logins, and security events',
    category: 'AUDIT_SECURITY'
  },
  {
    id: 'audit_soc2_export',
    name: 'Export SOC 2 Compliance Reports',
    description: 'Download certified Type II compliance proof and integrity hash logs',
    category: 'AUDIT_SECURITY'
  },
  {
    id: 'vault_credentials',
    name: 'Decrypt Portal Credentials',
    description: 'Access KMS encrypted passwords for GST, Income Tax, and MCA portals',
    category: 'AUDIT_SECURITY'
  },

  // STATUTORY & FILINGS
  {
    id: 'filings_approve',
    name: 'Approve & Authorize Filings',
    description: 'Final senior partner sign-off and submission of GSTR-3B, GSTR-1, and ITR',
    category: 'STATUTORY_FILINGS'
  },
  {
    id: 'filings_draft',
    name: 'Prepare & Draft Returns',
    description: 'Draft computation sheets, reconcile workpapers, and upload filing challans',
    category: 'STATUTORY_FILINGS'
  },
  {
    id: 'dsc_management',
    name: 'Manage DSC Expiry Hub',
    description: 'Register digital keys, update hardware tokens, and track expiry alerts',
    category: 'STATUTORY_FILINGS'
  },

  // CLIENT & VAULT
  {
    id: 'clients_view',
    name: 'View Full Client Registry',
    description: 'Access PAN, GSTIN, CIN, and corporate contact profiles across the firm',
    category: 'CLIENT_VAULT'
  },
  {
    id: 'clients_manage',
    name: 'Add & Edit Client Entities',
    description: 'Onboard new entities, edit fee structures, and modify engagement scopes',
    category: 'CLIENT_VAULT'
  },
  {
    id: 'financials_confidential',
    name: 'View Confidential Client Financials',
    description: 'Inspect P&L accounts, balance sheets, and bank reconciliation statements',
    category: 'CLIENT_VAULT'
  },
  {
    id: 'vault_documents',
    name: 'Upload & Manage Vault Documents',
    description: 'Store, organize, and download confidential tax and audit documents',
    category: 'CLIENT_VAULT'
  },

  // AI & AUTOMATION
  {
    id: 'ai_agents_run',
    name: 'Execute Autonomous AI Agents',
    description: 'Run Notice Triage, Client Onboarding Agent, and 3-Way Reconciliation',
    category: 'AI_AUTOMATION'
  },
  {
    id: 'ocr_tool',
    name: 'Access Invoice OCR Tool',
    description: 'Upload tax invoices and execute AI-assisted line item extraction',
    category: 'AI_AUTOMATION'
  },

  // BILLING & OPERATIONS
  {
    id: 'billing_manage',
    name: 'Manage Billing & AI Credits',
    description: 'View payment gateways, purchase meter credits, and review retainers',
    category: 'BILLING_OPERATIONS'
  },
  {
    id: 'invoices_create',
    name: 'Generate Client Invoices',
    description: 'Draft and dispatch proforma & tax invoices to firm clients',
    category: 'BILLING_OPERATIONS'
  },
  {
    id: 'team_attendance',
    name: 'Access Live Team & Attendance',
    description: 'Monitor staff check-ins, leaves, and biometric time tracking',
    category: 'BILLING_OPERATIONS'
  },
  {
    id: 'user_management',
    name: 'Manage Users & Access Matrix',
    description: 'Add new users, assign permissions with checkboxes, and suspend logins (Admin only)',
    category: 'BILLING_OPERATIONS'
  }
];

export const ALL_PERMISSION_IDS = SYSTEM_PERMISSIONS.map(p => p.id);

export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, string[]> = {
  ADMIN: [...ALL_PERMISSION_IDS],
  PARTNER: [
    'audit_logs_view',
    'audit_soc2_export',
    'vault_credentials',
    'filings_approve',
    'filings_draft',
    'dsc_management',
    'clients_view',
    'clients_manage',
    'financials_confidential',
    'vault_documents',
    'ai_agents_run',
    'ocr_tool',
    'billing_manage',
    'invoices_create',
    'team_attendance'
  ],
  MANAGER: [
    'audit_logs_view',
    'filings_draft',
    'dsc_management',
    'clients_view',
    'financials_confidential',
    'vault_documents',
    'ai_agents_run',
    'ocr_tool',
    'invoices_create',
    'team_attendance'
  ],
  ARTICLE: [
    'filings_draft',
    'vault_documents',
    'clients_view',
    'ai_agents_run',
    'ocr_tool',
    'team_attendance'
  ],
  CLIENT: [
    'vault_documents',
    'ocr_tool'
  ]
};

export function getRoleDefaultPermissions(role: string): string[] {
  const upperRole = (role || '').toUpperCase() as SystemRole;
  return DEFAULT_ROLE_PERMISSIONS[upperRole] || DEFAULT_ROLE_PERMISSIONS.ARTICLE;
}

export const DEFAULT_SYSTEM_ACCESS_USERS: SystemAccessUser[] = [
  {
    id: 'usr_admin_01',
    name: 'Aarav Advisors (Practice Master)',
    email: 'admin@aaravadvisors.in',
    role: 'ADMIN',
    mobile: '+91 98765 43210',
    status: 'ACTIVE',
    permissions: [...ALL_PERMISSION_IDS],
    passcode: '9001',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastActive: '2026-09-14T20:30:00.000Z',
    you: true
  },
  {
    id: 'usr_part_02',
    name: 'Hari Krishna',
    email: 'partner@aaravadvisors.in',
    role: 'PARTNER',
    mobile: '+91 88977 28402',
    status: 'ACTIVE',
    permissions: [...DEFAULT_ROLE_PERMISSIONS.PARTNER],
    passcode: '8840',
    createdAt: '2026-01-15T00:00:00.000Z',
    lastActive: '2026-09-14T19:15:00.000Z'
  },
  {
    id: 'usr_art_882',
    name: 'T. Varsha',
    email: 'article@aaravadvisors.in',
    role: 'ARTICLE',
    mobile: '+91 95859 97022',
    status: 'ACTIVE',
    permissions: [...DEFAULT_ROLE_PERMISSIONS.ARTICLE],
    passcode: '9702',
    createdAt: '2026-02-01T00:00:00.000Z',
    lastActive: '2026-09-14T18:45:00.000Z'
  },
  {
    id: 'usr_cli_101',
    name: 'Apex Global CFO (Client Apex)',
    email: 'client@aaravadvisors.in',
    role: 'CLIENT',
    mobile: '+91 98112 34567',
    status: 'ACTIVE',
    permissions: [...DEFAULT_ROLE_PERMISSIONS.CLIENT],
    passcode: '3456',
    assignedClientId: 'cli_apex_01',
    assignedClientName: 'Apex Global Technologies Ltd',
    createdAt: '2026-03-10T00:00:00.000Z',
    lastActive: '2026-09-14T14:20:00.000Z'
  }
];
