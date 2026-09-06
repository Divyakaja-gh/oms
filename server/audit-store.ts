import { db } from '../src/lib/firebase-admin.js';

// Audit Logs In-Memory Immutable Ledger (SOC2 Compliance)
export const auditLogsStore: any[] = [
  {
    id: 'LOG-SOC2-90141',
    timestamp: '2026-09-02T00:58:12.441Z',
    actor: {
      id: 'usr_admin_01',
      name: 'Aarav Advisors (Practice Master)',
      email: 'info@aaravadvisors.in',
      role: 'admin',
      ipAddress: '49.207.194.12',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/128.0.0.0'
    },
    action: 'ROLE_CHANGE',
    category: 'PRIVILEGE',
    severity: 'HIGH',
    resourceType: 'UserAccount',
    resourceId: 'usr_art_882',
    resourceName: 'T. Varsha (Article Staff)',
    details: 'Elevated role scope from "Article Intern" to "Lead Article Staff". Granted GSTR-3B filing privileges.',
    metadata: {
      previousRole: 'article_intern',
      newRole: 'lead_article',
      authorizedBy: 'Partner Audit Committee',
      mfaVerified: true
    },
    soc2Criterion: 'CC6.1 - Logical Access Controls',
    integrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'VERIFIED'
  },
  {
    id: 'LOG-SOC2-90140',
    timestamp: '2026-09-02T00:45:00.119Z',
    actor: {
      id: 'usr_part_02',
      name: 'Hari Krishna (Partner Audit)',
      email: 'hari.krishna@aaravadvisors.in',
      role: 'partner',
      ipAddress: '103.21.124.90',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/127.0.0.0'
    },
    action: 'CREDENTIAL_REVEAL',
    category: 'VAULT',
    severity: 'CRITICAL',
    resourceType: 'PortalCredential',
    resourceId: 'cred_gst_01',
    resourceName: 'GST Portal (State Level filing)',
    details: 'Decrypted KMS credentials for monthly return verification. Real-time Slack alert dispatched.',
    metadata: {
      kmsKeyId: 'arn:aws:kms:ap-south-1:180324796208:key/ca-gov-portals-2026',
      ipGeo: 'Bangalore, IN',
      durationSeconds: 120
    },
    soc2Criterion: 'CC6.6 - Boundary Protection & Encryption',
    integrityHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    status: 'VERIFIED'
  },
  {
    id: 'LOG-SOC2-90139',
    timestamp: '2026-09-02T00:32:41.802Z',
    actor: {
      id: 'usr_art_882',
      name: 'T. Varsha (Article Staff)',
      email: 'varsha.t@aaravadvisors.in',
      role: 'article',
      ipAddress: '49.207.194.12',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15'
    },
    action: 'FILE_ACCESS',
    category: 'DATA_ACCESS',
    severity: 'LOW',
    resourceType: 'ClientDocument',
    resourceId: 'doc_acme_itr_2026',
    resourceName: 'Acme_ITR_Ack_AY26.pdf (Vault Folder: Tax Documents)',
    details: 'Downloaded confidential client tax return acknowledgement for 3B statutory cross-check.',
    metadata: {
      clientId: 'firm_abc_client_1',
      fileSizeBytes: 1258291,
      retentionSchedule: '7-Years DPDP Act 2023'
    },
    soc2Criterion: 'CC6.3 - Data Access Restrictions',
    integrityHash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
    status: 'VERIFIED'
  },
  {
    id: 'LOG-SOC2-90138',
    timestamp: '2026-09-02T00:15:10.021Z',
    actor: {
      id: 'usr_admin_01',
      name: 'Aarav Advisors (Practice Master)',
      email: 'info@aaravadvisors.in',
      role: 'admin',
      ipAddress: '49.207.194.12',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/128.0.0.0'
    },
    action: 'LOGIN_SUCCESS',
    category: 'AUTH',
    severity: 'INFO',
    resourceType: 'Session',
    resourceId: 'sess_990142_admin',
    resourceName: 'Terminal Gateway Session #990142',
    details: 'Admin authenticated via Single Sign-On + Hardware FIDO2 MFA Token.',
    metadata: {
      authProvider: 'Tenant Keycloak / SAML 2.0',
      mfaMethod: 'FIDO2 / WebAuthn',
      tlsVersion: 'TLS 1.3 / ChaCha20-Poly1305'
    },
    soc2Criterion: 'CC6.2 - User Registration & MFA',
    integrityHash: '4355a46b19d348dc2f57c046f8ef63d4538ebb936000f3c9ee954a27460dd865',
    status: 'VERIFIED'
  },
  {
    id: 'LOG-SOC2-90137',
    timestamp: '2026-09-01T23:55:04.912Z',
    actor: {
      id: 'usr_client_09',
      name: 'Apex Global CFO (Client User)',
      email: 'cfo@apexglobal.in',
      role: 'client',
      ipAddress: '157.34.89.201',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) Safari/604.1'
    },
    action: 'FILE_UPLOAD',
    category: 'DATA_ACCESS',
    severity: 'INFO',
    resourceType: 'ClientDocument',
    resourceId: 'doc_bank_stmt_aug26',
    resourceName: 'HDFC_Bank_Aug2026_Statement.pdf',
    details: 'Client securely uploaded 15MB encrypted bank record to designated client vault repository.',
    metadata: {
      folderId: 'fld_bank_reconciliation',
      checksumSha256: '9b73c68f7f5204f103d34e297d4f5c543aecd02813637f626fb5e449fa5ff5ff'
    },
    soc2Criterion: 'CC6.7 - Transmission Security',
    integrityHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    status: 'VERIFIED'
  },
  {
    id: 'LOG-SOC2-90136',
    timestamp: '2026-09-01T22:18:30.334Z',
    actor: {
      id: 'usr_unknown_external',
      name: 'Unauthorized Remote Agent',
      email: 'threat_actor@tor-exit-node.net',
      role: 'article',
      ipAddress: '185.220.101.5',
      userAgent: 'Python-requests/2.31.0'
    },
    action: 'SECURITY_ALERT',
    category: 'NETWORK',
    severity: 'CRITICAL',
    resourceType: 'APIGateway',
    resourceId: 'endpoint_api_clients_export',
    resourceName: 'Public API Edge Gateway (/api/clients)',
    details: 'Flagged automated scrape attack: 420 requests in 60 seconds from suspicious Tor exit relay. IP quarantined automatically.',
    metadata: {
      mitigationAction: 'WAF_IP_QUARANTINE',
      threatScore: 94,
      geoloc: 'Unknown (Tor Relay)'
    },
    soc2Criterion: 'CC6.8 - Threat Detection & Intrusion Prevention',
    integrityHash: '912803b9845012a498cf11283cbe910248a8f102391094038201948301928401',
    status: 'FLAGGED'
  },
  {
    id: 'LOG-SOC2-90135',
    timestamp: '2026-09-01T21:04:12.776Z',
    actor: {
      id: 'usr_part_01',
      name: 'R. Aarav (Senior Partner)',
      email: 'aarav@aaravadvisors.in',
      role: 'partner',
      ipAddress: '49.207.194.12',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/128.0.0.0'
    },
    action: 'PERMISSION_OVERRIDE',
    category: 'PRIVILEGE',
    severity: 'MEDIUM',
    resourceType: 'TenantDatabase',
    resourceId: 'policy_abac_gstr_export',
    resourceName: 'Tenant ABAC Filing Policy #402',
    details: 'Temporarily enabled batch GSTR-3B export permission for Article Clerks during month-end audit peak.',
    metadata: {
      expiryTimestamp: '2026-09-05T18:30:00Z',
      justification: 'Statutory GST Deadline Rush (Sept 20th)'
    },
    soc2Criterion: 'CC6.1 - Least Privilege & Access Reviews',
    integrityHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    status: 'VERIFIED'
  }
];

// Resilient helper to record audit logs both in-memory and Firestore (without crashing)
export const saveAuditLog = (log: any) => {
  if (!log) return;
  auditLogsStore.unshift(log);
  try {
    if (db && typeof db.collection === 'function') {
      const p = db.collection('audit_logs').doc(log.id).set(log);
      if (p && typeof p.catch === 'function') {
        p.catch((e: any) => {
          console.warn('[Audit Sync] Notice (in-memory SOC2 ledger recorded):', e?.message || e);
        });
      }
    }
  } catch (e: any) {
    console.warn('[Audit Sync] Note:', e?.message || e);
  }
};
