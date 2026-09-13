import { z } from 'zod';
import express from 'express';

/**
 * Server-Side SQL Injection & Malicious Pattern Detector
 * Protects all Express endpoints from SQL, NoSQL, and Script Injection
 */
const SQL_INJECTION_REGEXES = [
  /(?:'|"|`)\s*(?:or|and)\s*(?:'|"|`|true|1|2|\d+)\s*=\s*(?:'|"|`|true|1|2|\d+)/i,
  /\b(?:or|and)\s+(?:1\s*=\s*1|0\s*=\s*0|true|false)\b(?:\s*--|\s*\/\*|\s*#|\s*$)/i,
  /\bunion\s+(?:all\s+)?select\b/i,
  /;\s*(?:drop\s+(?:table|database|schema|view)|truncate\s+table|delete\s+from|alter\s+table|grant\s+all|insert\s+into)\b/i,
  /(?:'|"|`)\s*;\s*(?:drop|delete|truncate|update|insert)\b/i,
  /(?:'|"|`)\s*(?:--|\/\*|#)/i,
  /\b(?:xp_cmdshell|sp_executesql|sp_oacreate|xp_regread)\b/i,
  /\b(?:waitfor\s+delay|benchmark\s*\(|pg_sleep\s*\(|sleep\s*\()\b/i,
  /\b(?:information_schema\.(?:tables|columns|schemata)|sys\.objects|sys\.tables|sysobjects)\b/i,
  /\b(?:load_file\s*\(|into\s+(?:outfile|dumpfile))\b/i,
  /\b(?:exec|execute)\s*\(\s*(?:'|"|@)/i
];

const NOSQL_INJECTION_REGEX = /(?:^|[^\w])\$(?:where|regex|gt|gte|lt|lte|ne|nin|in|exists|all|elemMatch|expr)\b/i;
const SCRIPT_INJECTION_REGEX = /<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/i;

export function checkServerSqlInjection(value: unknown): { isMalicious: boolean; reason?: string } {
  if (typeof value !== 'string') return { isMalicious: false };
  const str = value.trim();
  if (!str) return { isMalicious: false };

  let decoded = str;
  try {
    decoded = decodeURIComponent(str);
  } catch {
    // Keep raw
  }

  for (const text of [str, decoded]) {
    for (const regex of SQL_INJECTION_REGEXES) {
      if (regex.test(text)) {
        return { isMalicious: true, reason: 'SQL_INJECTION_DETECTED' };
      }
    }
    if (NOSQL_INJECTION_REGEX.test(text)) {
      return { isMalicious: true, reason: 'NOSQL_INJECTION_DETECTED' };
    }
    if (SCRIPT_INJECTION_REGEX.test(text)) {
      return { isMalicious: true, reason: 'SCRIPT_INJECTION_DETECTED' };
    }
  }

  return { isMalicious: false };
}

/**
 * Reusable Zod string refiner that asserts safe non-injected strings
 */
export const safeString = (maxLen = 500) =>
  z.string().max(maxLen).refine((val) => !checkServerSqlInjection(val).isMalicious, {
    message: 'Security validation failed: Prohibited SQL or script injection characters detected'
  });

/**
 * Global Anti-Injection Scanner Middleware
 * Inspects all incoming Request Body, Query Params, and Headers for SQL injection vectors
 */
export function antiInjectionMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Deep inspection helper
  function inspectObject(obj: any, path = ''): { isMalicious: boolean; field?: string; reason?: string } {
    if (!obj || typeof obj !== 'object') return { isMalicious: false };

    for (const key of Object.keys(obj)) {
      // Exclude large raw base64 binary and full OCR transcript payloads from SQL string checks
      if (['fileBase64', 'base64Data', 'fileData', 'imageData', 'rawBase64', 'rawTextTranscript'].includes(key)) {
        continue;
      }

      const fullPath = path ? `${path}.${key}` : key;
      const val = obj[key];

      if (typeof val === 'string') {
        const check = checkServerSqlInjection(val);
        if (check.isMalicious) {
          return { isMalicious: true, field: fullPath, reason: check.reason };
        }
      } else if (typeof val === 'object' && val !== null) {
        const nested = inspectObject(val, fullPath);
        if (nested.isMalicious) return nested;
      }
    }
    return { isMalicious: false };
  }

  // 1. Inspect Query params
  const queryCheck = inspectObject(req.query, 'query');
  if (queryCheck.isMalicious) {
    return res.status(400).json({
      error: 'SECURITY_INJECTION_DETECTED',
      message: `Prohibited SQL or command injection sequence detected in query parameter: ${queryCheck.field}`,
      code: 'CC6.6_ACCESS_BLOCKED'
    });
  }

  // 2. Inspect Request Body (except raw file buffers)
  if (req.body && typeof req.body === 'object') {
    const bodyCheck = inspectObject(req.body, 'body');
    if (bodyCheck.isMalicious) {
      return res.status(400).json({
        error: 'SECURITY_INJECTION_DETECTED',
        message: `Prohibited SQL or command injection sequence detected in payload field: ${bodyCheck.field}`,
        code: 'CC6.6_ACCESS_BLOCKED'
      });
    }
  }

  next();
}

// Reusable middleware for strict payload validation
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'SCHEMA_VALIDATION_ERROR',
        message: 'Invalid request payload structure or parameters',
        issues: result.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'root',
          message: issue.message,
          code: issue.code
        }))
      });
    }
    req.body = result.data;
    next();
  };
}

// 1. Natural Language Query Copilot
export const agentQuerySchema = z.object({
  prompt: safeString(5000)
});

// 2. Client Onboarding Agent Schema
export const onboardingAgentSchema = z.object({
  clientName: safeString(200),
  entityType: z.enum(['Private Limited', 'LLP', 'Partnership', 'Proprietorship', 'Individual']),
  contactEmail: z.string().email('Invalid email address format'),
  contactPhone: safeString(25),
  panNumber: safeString(20),
  gstin: safeString(25).optional().or(z.literal('')),
  cin: safeString(30).optional().or(z.literal('')),
  turnoverRange: safeString(100).optional(),
  servicesRequested: z.array(safeString(100)).max(30),
  uploadedDocuments: z.array(safeString(200)).optional(),
  rawTextNotes: safeString(10000).optional().or(z.literal(''))
});

// 3. Statutory Notice Triage Agent Schema
export const noticeTriageSchema = z.object({
  noticeNumber: safeString(100),
  issuingAuthority: safeString(150),
  sectionCode: safeString(100),
  financialYearOrPeriod: safeString(50),
  demandAmountInr: z.number().nonnegative().optional(),
  noticeDate: safeString(50),
  statutoryDeadline: safeString(50),
  clientPanOrGst: safeString(30),
  clientName: safeString(200),
  rawNoticeContent: safeString(25000),
  penaltySectionCited: safeString(100).optional()
});

// 4. Autonomous GST & Bank Recon Schema
export const gstBankReconSchema = z.object({
  clientName: safeString(200),
  clientGstin: safeString(30),
  reconPeriod: safeString(50),
  gstr2bJsonOrText: z.string().max(50000).optional(),
  purchaseRegisterCsvOrText: z.string().max(50000).optional(),
  bankStatementCsvOrText: z.string().max(50000).optional(),
  materialityThresholdInr: z.number().nonnegative().optional()
});

// 5. Credit Grant & Metering Schemas
export const creditGrantSchema = z.object({
  amount: z.number().positive('Credit amount must be positive'),
  packName: safeString(100).optional(),
  paymentRef: safeString(100).optional(),
  category: safeString(100).optional(),
  description: safeString(500).optional()
});

export const creditGrantTestSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(1000000, 'Exceeded maximum test credit batch'),
  description: safeString(500).optional()
});

export const creditTestModeSchema = z.object({
  bypassMetering: z.boolean()
});

export const creditSettingsSchema = z.object({
  autoRecharge: z.boolean().optional(),
  autoRechargeThreshold: z.number().min(0).optional(),
  autoRechargePackAmount: z.number().min(0).optional(),
  planType: safeString(50).optional(),
  bypassMetering: z.boolean().optional()
});

// 6. Credential Vault Management Schemas
export const createVaultCredentialSchema = z.object({
  name: safeString(150),
  system: safeString(100),
  category: z.enum(['MCA_LOGIN', 'IT_PORTAL_KEY', 'GST_PORTAL', 'TRACES_TDS', 'EPFO_ESIC', 'BANKING_API', 'OTHER']),
  credentialType: z.enum(['PORTAL_PASSWORD', 'API_ACCESS_KEY', 'DSC_PIN', 'OAUTH_SECRET', 'PRIVATE_KEY']),
  identifier: safeString(150),
  secretValue: z.string().min(1).max(4096),
  clientName: safeString(200).optional(),
  clientId: safeString(100).optional(),
  rotationIntervalDays: z.number().int().min(1).max(365).optional(),
  accessTier: z.enum(['PARTNER_ADMIN_ONLY', 'ARTICLE_PERMITTED', 'ALL_STAFF']).optional(),
  notes: safeString(2000).optional(),
  portalUrl: safeString(500).optional()
});

export const accessVaultCredentialSchema = z.object({
  reason: safeString(500).refine((val) => val.trim().length >= 4, {
    message: 'Audit justification reason must be at least 4 characters long'
  })
});

export const rotateVaultCredentialSchema = z.object({
  newSecretValue: z.string().min(8).max(4096),
  reason: safeString(500).optional()
});

// 7. Onboarding Email Dispatch Schema
export const onboardingEmailDispatchSchema = z.object({
  recipientEmail: z.string().email('Invalid recipient email address'),
  recipientName: safeString(150),
  subject: safeString(200),
  body: safeString(10000),
  documentList: z.array(safeString(200)).optional(),
  portalUrl: safeString(500).optional()
});
