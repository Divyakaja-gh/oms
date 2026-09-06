import { OnboardingEmailPayload, OnboardingEmailResult, KycDocumentRequirement } from '../types';

export const STANDARD_KYC_CHECKLIST: KycDocumentRequirement[] = [
  {
    id: 'kyc_1',
    category: 'Entity Proof',
    title: 'Certificate of Incorporation (COI) / Partnership Deed / Trust Deed',
    description: 'Statutory certificate issued by MCA (for Companies) or Registrar of Firms (for LLPs/Partnerships) establishing legal existence.',
    mandatory: true,
    acceptedFormats: 'PDF (Certified Copy)'
  },
  {
    id: 'kyc_2',
    category: 'Entity Proof',
    title: 'Memorandum of Association (MOA) & Articles of Association (AOA)',
    description: 'Constitutional charter defining corporate objects and internal regulation for corporate entities.',
    mandatory: true,
    acceptedFormats: 'PDF'
  },
  {
    id: 'kyc_3',
    category: 'Entity Proof',
    title: 'Entity PAN Card & GSTIN Registration Certificate (Form REG-06)',
    description: 'Permanent Account Number of business entity and active GSTIN registration with all principal & additional places of business.',
    mandatory: true,
    acceptedFormats: 'PDF / Scanned Copy'
  },
  {
    id: 'kyc_4',
    category: 'Signatory KYC',
    title: 'Designated Directors / Partners / Signatories PAN & Aadhaar / Passport',
    description: 'Identity and residential verification of all designated partners, directors (with DIN), and authorized signatories.',
    mandatory: true,
    acceptedFormats: 'PDF (Self-Attested)'
  },
  {
    id: 'kyc_5',
    category: 'Signatory KYC',
    title: 'Certified Board Resolution / Authorization Letter',
    description: 'Formal resolution passed by the Board of Directors authorizing the designated signatory to appoint Aarav Advisors and execute engagement contracts.',
    mandatory: true,
    acceptedFormats: 'PDF (On Company Letterhead with Stamp)'
  },
  {
    id: 'kyc_6',
    category: 'Financial & Tax',
    title: 'Preceding 2-3 FY Filed ITR Acknowledgements (ITR-V) & Audited Financials',
    description: 'Balance Sheet, Profit & Loss Account with schedules, Tax Audit Report (Form 3CD), and ITR acknowledgement slips.',
    mandatory: true,
    acceptedFormats: 'PDF / Excel'
  },
  {
    id: 'kyc_7',
    category: 'Financial & Tax',
    title: 'Bank Account Verification & Cancelled Cheque',
    description: 'Cancelled cheque leaf or bank verification certificate showing Entity Name, Account Number, and IFSC Code for statutory refunds.',
    mandatory: true,
    acceptedFormats: 'PDF / Image'
  },
  {
    id: 'kyc_8',
    category: 'Auditor & Legal',
    title: 'Communication / NOC from Previous Statutory Auditor (ICAI Code of Ethics)',
    description: 'Mandatory under Clause 8 of Part I of First Schedule to Chartered Accountants Act 1949 prior to accepting statutory audit engagement.',
    mandatory: false,
    acceptedFormats: 'PDF'
  },
  {
    id: 'kyc_9',
    category: 'Portal Credentials',
    title: 'Statutory Portal Access Handover (ITD, GST Common Portal, MCA V3 & TRACES)',
    description: 'Authorized Representative (AR) access / login linkages to allow timely advance tax, GSTR-1, GSTR-3B, and annual compliances.',
    mandatory: true,
    acceptedFormats: 'Encrypted Vault Submission / AR Authorization'
  }
];

// Helper to safely Base64URL encode unicode strings
export function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function calculateInvoiceBreakdown(baseAmount: number) {
  const subtotal = Number(baseAmount) || 0;
  const cgst = Math.round(subtotal * 0.09 * 100) / 100;
  const sgst = Math.round(subtotal * 0.09 * 100) / 100;
  const total = Math.round((subtotal + cgst + sgst) * 100) / 100;
  return {
    subtotal,
    cgst,
    sgst,
    totalGst: cgst + sgst,
    total
  };
}

export function generateEmailHtml(payload: OnboardingEmailPayload): string {
  const invoice = calculateInvoiceBreakdown(payload.advanceInvoiceAmount);
  const invoiceNum = payload.invoiceNumber || `AA/INV/2026-27/${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Client Onboarding Package - Aarav Advisors</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f5f8; color: #1e293b; line-height: 1.6; }
    .wrapper { max-width: 680px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 32px 36px; border-bottom: 3px solid #6366f1; color: #ffffff; }
    .header-sub { color: #94a3b8; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; font-weight: 600; }
    .header-title { font-size: 22px; font-weight: 700; margin: 0; color: #ffffff; }
    .header-meta { font-size: 12px; color: #cbd5e1; margin-top: 8px; }
    .content { padding: 32px 36px; }
    .greeting { font-size: 15px; margin-bottom: 16px; color: #0f172a; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-blue { background: #e0e7ff; color: #3730a3; }
    .badge-green { background: #dcfce7; color: #166534; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .card-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; display: flex; align-items: center; justify-content: space-between; }
    .table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    .table th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; }
    .table td { padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155; }
    .table tr:last-child td { border-bottom: none; }
    .highlight-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 0 8px 8px 0; font-size: 13px; color: #1e3a8a; margin: 20px 0; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: center; margin: 12px 0; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 36px; font-size: 11px; color: #64748b; line-height: 1.5; }
    .bank-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; font-size: 12px; }
    .bank-item { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Firm Header -->
    <div class="header">
      <div class="header-sub">Chartered Accountants • ICAI Firm Reg: 014892N</div>
      <h1 class="header-title">AARAV ADVISORS</h1>
      <div class="header-meta">
        Statutory Audit • Direct & Indirect Tax • Corporate Governance • SOC2 Type II Certified
      </div>
    </div>

    <!-- Main Body -->
    <div class="content">
      <div class="greeting">
        <strong>Dear ${payload.recipientName || 'Authorized Signatory'},</strong><br>
        Warm welcome to <strong>Aarav Advisors</strong>. We are pleased to initiate the official onboarding and statutory engagement for <strong>${payload.clientName}</strong> for FY 2026–27.
      </div>

      ${payload.customMessage ? `
      <div class="highlight-box">
        <strong>Direct Partner Note:</strong><br>
        ${payload.customMessage.replace(/\n/g, '<br>')}
      </div>
      ` : ''}

      <!-- Section 1: Engagement Contract (ICAI SA-210) -->
      ${payload.includeContract ? `
      <div class="card">
        <div class="card-title">
          <span>1. Statutory Engagement Contract (ICAI SA-210)</span>
          <span class="badge badge-green">Ready for Execution</span>
        </div>
        <p style="font-size: 12px; color: #475569; margin: 0 0 10px 0;">
          Our Standard on Auditing (SA) 210 Engagement Letter defines the scope of professional services, client management obligations, and confidentiality safeguards.
        </p>
        <table class="table">
          <tr>
            <td width="35%"><strong>Letter Reference No:</strong></td>
            <td><code>${payload.letterRefNumber}</code></td>
          </tr>
          <tr>
            <td><strong>Client Legal Entity:</strong></td>
            <td>${payload.clientName} (PAN: <code>${payload.panNumber}</code>)</td>
          </tr>
          <tr>
            <td><strong>Annual Retainer:</strong></td>
            <td>INR ${(payload.annualRetainerFee || 180000).toLocaleString('en-IN')} / annum + applicable GST</td>
          </tr>
          <tr>
            <td><strong>Scope Highlights:</strong></td>
            <td>${(payload.servicesRequested || ['GST Filings', 'TDS Compliances', 'Direct Tax Audit']).join(' • ')}</td>
          </tr>
          <tr>
            <td><strong>Standard Compliance:</strong></td>
            <td>ICAI SA-210, SQC 1 Peer-Review & Sec 144 Companies Act 2013</td>
          </tr>
        </table>
      </div>
      ` : ''}

      <!-- Section 2: Statutory KYC & Documentation Checklist -->
      ${payload.includeKycChecklist ? `
      <div class="card">
        <div class="card-title">
          <span>2. Statutory Onboarding Documentation Checklist</span>
          <span class="badge badge-blue">Mandatory Submission</span>
        </div>
        <p style="font-size: 12px; color: #475569; margin: 0 0 10px 0;">
          Kindly arrange and upload certified digital copies of the following statutory documents to complete your client vault setup:
        </p>
        <table class="table">
          <thead>
            <tr>
              <th width="40%">Required Document</th>
              <th width="40%">Description & Purpose</th>
              <th width="20%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${STANDARD_KYC_CHECKLIST.map(doc => `
              <tr>
                <td><strong>${doc.title}</strong><br><span style="color: #64748b; font-size: 10px;">Category: ${doc.category}</span></td>
                <td style="font-size: 11px; color: #475569;">${doc.description}</td>
                <td><span style="font-weight: 600; font-size: 10px; color: ${doc.mandatory ? '#dc2626' : '#2563eb'};">${doc.mandatory ? 'Required' : 'Optional'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Section 3: Initial Retainer Tax Invoice -->
      ${payload.includeInvoice ? `
      <div class="card" style="border: 2px solid #e0e7ff; background: #ffffff;">
        <div class="card-title">
          <span>3. Initial Retainer Tax Invoice</span>
          <span class="badge badge-blue">Invoice: ${invoiceNum}</span>
        </div>
        <table class="table">
          <tr>
            <td><strong>Invoice Date:</strong> ${dateStr}</td>
            <td><strong>SAC Code:</strong> 9982 (Accounting & Tax Services)</td>
          </tr>
          <tr>
            <td><strong>Billed To:</strong> ${payload.clientName}</td>
            <td><strong>GSTIN:</strong> ${payload.gstin || 'Unregistered / SEZ'}</td>
          </tr>
        </table>

        <table class="table" style="margin-top: 16px;">
          <thead>
            <tr>
              <th>Description of Service</th>
              <th style="text-align: right;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Initial Retainer & Professional Engagement Setup Fee</strong><br>
                <span style="font-size: 11px; color: #64748b;">Statutory client onboarding, vault provisioning, initial compliance review & ICAI SA-210 contract execution.</span>
              </td>
              <td style="text-align: right; font-weight: 600;">₹${invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Central GST (CGST @ 9.0%)</td>
              <td style="text-align: right;">₹${invoice.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">State GST (SGST @ 9.0%)</td>
              <td style="text-align: right;">₹${invoice.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="background: #f8fafc; font-size: 13px;">
              <td><strong>Total Amount Payable (Incl. 18% GST):</strong></td>
              <td style="text-align: right; font-weight: 700; color: #4338ca;">₹${invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 16px;">
          <strong style="font-size: 12px; color: #0f172a;">Bank Transfer Details (NEFT / RTGS / IMPS):</strong>
          <table class="table" style="margin-top: 6px; font-size: 11px;">
            <tr>
              <td><strong>Account Name:</strong> Aarav Advisors LLP</td>
              <td><strong>Bank:</strong> HDFC Bank Ltd</td>
            </tr>
            <tr>
              <td><strong>Account Number:</strong> 50200084920194</td>
              <td><strong>IFSC Code:</strong> HDFC0000003</td>
            </tr>
            <tr>
              <td><strong>Branch:</strong> Barakhamba Road, New Delhi</td>
              <td><strong>UPI ID:</strong> aaravadvisors@hdfcbank</td>
            </tr>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- Section 4: Vault Link & Next Steps -->
      ${payload.includeVaultLink ? `
      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 13px; color: #334155; margin-bottom: 8px;">
          Your secure, AES-256 encrypted client vault has been provisioned with tenant-level SOC2 isolation.
        </p>
        <a href="https://aa-oms.web.app/vault/${encodeURIComponent(payload.clientName)}" class="btn">
          Access Client Upload Vault & Submit KYC →
        </a>
      </div>
      ` : ''}

      <div style="margin-top: 24px; font-size: 13px; color: #334155;">
        Please feel free to reply directly to this email or reach out to our engagement team if you have any questions regarding documentation or portal handovers.<br><br>
        Yours sincerely,<br>
        <strong>Hari Krishna, FCA</strong><br>
        Senior Partner • Practice Governance<br>
        <strong>Aarav Advisors</strong> (Chartered Accountants)<br>
        ICAI Firm Reg No: 014892N
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <strong>Confidentiality Notice:</strong> This electronic transmission contains confidential and legally privileged information intended exclusively for the board and management of ${payload.clientName}. If you are not the intended recipient, any disclosure, copying, distribution or reliance upon this material is strictly prohibited under the Chartered Accountants Act, 1949 and Indian Information Technology Act, 2000.<br><br>
      © 2026 Aarav Advisors. All rights reserved. New Delhi • Mumbai • Bengaluru.
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateEmailPlainText(payload: OnboardingEmailPayload): string {
  const invoice = calculateInvoiceBreakdown(payload.advanceInvoiceAmount);
  return `
AARAV ADVISORS (CHARTERED ACCOUNTANTS)
ICAI Firm Reg No: 014892N
=====================================================

Dear ${payload.recipientName || 'Authorized Signatory'},

Warm welcome to Aarav Advisors. We are pleased to initiate the official onboarding and statutory engagement for ${payload.clientName} for FY 2026-27.

${payload.customMessage ? `PARTNER NOTE:\n${payload.customMessage}\n\n` : ''}
1. STATUTORY ENGAGEMENT CONTRACT (ICAI SA-210)
Reference Number: ${payload.letterRefNumber}
Client Entity: ${payload.clientName} (PAN: ${payload.panNumber})
Annual Retainer: INR ${(payload.annualRetainerFee || 180000).toLocaleString('en-IN')} / year + GST
Services Included: ${(payload.servicesRequested || ['GST', 'TDS', 'Tax Audit']).join(', ')}

2. STATUTORY ONBOARDING DOCUMENTATION CHECKLIST
Please provide certified digital copies of:
- Certificate of Incorporation (COI) / Partnership Deed
- Memorandum (MOA) & Articles of Association (AOA)
- Entity PAN & Form REG-06 (GSTIN Registration)
- Signatory / Director KYC (PAN, Aadhaar/Passport, DIN)
- Certified Board Resolution authorizing appointment
- Bank Verification / Cancelled Cheque
- Prior 2-3 FY Filed ITR-V & Audited Financial Statements
- Previous Auditor NOC (ICAI Code of Ethics Clause 8)
- Tax Portal Access Handover (ITD, GST Common Portal, MCA V3)

3. INITIAL RETAINER TAX INVOICE
Invoice No: ${payload.invoiceNumber || 'AA/INV/2026-27/0412'}
SAC Code: 9982 (Accounting & Tax Services)
Base Retainer Amount: INR ${invoice.subtotal.toLocaleString('en-IN')}
CGST (9%) + SGST (9%): INR ${invoice.totalGst.toLocaleString('en-IN')}
Total Amount Payable: INR ${invoice.total.toLocaleString('en-IN')}

Bank Transfer Details (NEFT/RTGS):
Account Name: Aarav Advisors LLP
Bank: HDFC Bank Ltd | Account No: 50200084920194
IFSC: HDFC0000003 | UPI: aaravadvisors@hdfcbank

Yours faithfully,
Hari Krishna, FCA (Partner)
Aarav Advisors (Chartered Accountants)
  `.trim();
}

/**
 * Sends the onboarding email package via Google Gmail API using the user's OAuth access token
 */
export async function sendViaGmailApi(
  accessToken: string,
  payload: OnboardingEmailPayload
): Promise<OnboardingEmailResult> {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const subject = `[Aarav Advisors] Client Onboarding Package & Statutory Engagement - ${payload.clientName}`;
  const htmlBody = generateEmailHtml(payload);
  const plainTextBody = generateEmailPlainText(payload);

  const ccHeader = payload.ccEmails && payload.ccEmails.length > 0 
    ? `Cc: ${payload.ccEmails.join(', ')}\r\n` 
    : '';

  // Construct standard MIME multipart/alternative RFC 2822 email
  const rawMessage = [
    `To: ${payload.recipientEmail}`,
    ccHeader ? ccHeader.trim() : null,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    plainTextBody,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    htmlBody,
    ``,
    `--${boundary}--`
  ].filter(line => line !== null).join('\r\n');

  const encodedRaw = base64UrlEncode(rawMessage);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: encodedRaw
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData?.error?.message || `Gmail API error HTTP ${response.status}`;
    throw new Error(message);
  }

  const resultData = await response.json();

  return {
    success: true,
    messageId: resultData.id || `GM-${Date.now()}`,
    sentAt: new Date().toISOString(),
    sender: payload.senderEmail || 'Connected Gmail Account',
    recipient: payload.recipientEmail,
    subject,
    method: 'gmail_api'
  };
}

/**
 * Sends the onboarding package via firm domain server route
 */
export async function sendViaDomainEmail(
  payload: OnboardingEmailPayload,
  accessToken?: string | null
): Promise<OnboardingEmailResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch('/api/email/send-onboarding', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Domain Email error HTTP ${response.status}`);
  }

  return await response.json();
}
