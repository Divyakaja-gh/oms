import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Prospect, ComplianceFiling } from '../types';

/**
 * Robust wrapper around jspdf-autotable that works whether imported as default,
 * named export, or attached directly onto the jsPDF prototype.
 * If autoTable fails completely, it renders a clean canvas-drawn table fallback.
 */
export function safeAutoTable(doc: any, options: any) {
  try {
    if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable(options);
      return;
    }
  } catch (e) {
    console.warn('doc.autoTable call error:', e);
  }

  try {
    if (typeof autoTable === 'function') {
      autoTable(doc, options);
      return;
    }
  } catch (e) {
    console.warn('autoTable direct call error:', e);
  }

  try {
    if (autoTable && typeof (autoTable as any).default === 'function') {
      (autoTable as any).default(doc, options);
      return;
    }
  } catch (e) {
    console.warn('autoTable.default call error:', e);
  }

  // Pure canvas-style jsPDF fallback to guarantee table generation never blocks the PDF
  try {
    const startY = options.startY || 100;
    const margin = options.margin?.left || 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);

    doc.setFillColor(15, 23, 42);
    doc.rect(margin, startY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);

    if (options.head && options.head[0]) {
      const headers = options.head[0];
      const colWidth = contentWidth / headers.length;
      headers.forEach((h: string, idx: number) => {
        const alignRight = idx === headers.length - 1;
        const x = alignRight ? margin + (idx + 1) * colWidth - 4 : margin + idx * colWidth + 4;
        doc.text(String(h), x, startY + 5.5, { align: alignRight ? 'right' : 'left' });
      });
    }

    let currentY = startY + 14;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    if (options.body && Array.isArray(options.body)) {
      options.body.forEach((row: any[]) => {
        const colWidth = contentWidth / row.length;
        row.forEach((cell: any, idx: number) => {
          const alignRight = idx === row.length - 1;
          const x = alignRight ? margin + (idx + 1) * colWidth - 4 : margin + idx * colWidth + 4;
          doc.text(String(cell), x, currentY, { align: alignRight ? 'right' : 'left' });
        });
        currentY += 8;
      });
    }
    (doc as any).lastAutoTable = { finalY: currentY + 4 };
  } catch (err) {
    console.error('Manual table drawing fallback failed:', err);
    (doc as any).lastAutoTable = { finalY: (options.startY || 100) + 20 };
  }
}

/**
 * Resilient PDF download function with multi-tier fallbacks:
 * 1. Native doc.save()
 * 2. Explicit Blob URL <a download> click
 * 3. Fallback to opening printable dataURI / blob in new tab
 */
export function safeDownloadPDF(doc: jsPDF, fileName: string): boolean {
  try {
    doc.save(fileName);
    return true;
  } catch (err1) {
    console.warn('doc.save failed, trying blob anchor fallback:', err1);
  }

  try {
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 2000);
    return true;
  } catch (err2) {
    console.warn('Blob URL anchor failed, trying data URI fallback:', err2);
  }

  try {
    const dataUri = doc.output('datauristring');
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = fileName;
    link.target = '_blank';
    link.click();
    return true;
  } catch (err3) {
    console.error('All PDF download strategies failed:', err3);
    return false;
  }
}

/**
 * Isolated printing helper that works cleanly inside sandboxed iframes, modals, or standard browsers.
 * It injects an in-DOM dedicated print stage paired with print media styles to ensure only the
 * target document prints cleanly (ignoring sidebars, navigation, and background modals).
 * Also falls back gracefully if browser iframe policies restrict window.print().
 */
export function printHtmlDocument(title: string, bodyHtml: string, onBlocked?: () => void) {
  try {
    // 1. Clean up any previous print elements
    const oldStage = document.getElementById('aarav-active-print-stage');
    if (oldStage && oldStage.parentNode) {
      oldStage.parentNode.removeChild(oldStage);
    }
    const oldStyle = document.getElementById('aarav-active-print-style');
    if (oldStyle && oldStyle.parentNode) {
      oldStyle.parentNode.removeChild(oldStyle);
    }

    // 2. Create the dedicated printable stage
    const printStage = document.createElement('div');
    printStage.id = 'aarav-active-print-stage';
    printStage.innerHTML = `
      <div class="aarav-print-document">
        ${bodyHtml}
      </div>
    `;

    // 3. Inject print isolation styles
    const printStyle = document.createElement('style');
    printStyle.id = 'aarav-active-print-style';
    printStyle.textContent = `
      @media screen {
        #aarav-active-print-stage {
          display: none !important;
          position: absolute !important;
          left: -99999px !important;
          top: -99999px !important;
          visibility: hidden !important;
        }
      }
      @media print {
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          height: auto !important;
          overflow: visible !important;
        }
        /* Hide everything in the page EXCEPT our dedicated print stage */
        body > *:not(#aarav-active-print-stage) {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          overflow: hidden !important;
        }
        #aarav-active-print-stage {
          display: block !important;
          visibility: visible !important;
          position: static !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 10mm 14mm !important;
          box-sizing: border-box !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .aarav-print-document {
          width: 100% !important;
          font-family: 'Times New Roman', Times, serif;
          color: #1a1a1a;
          line-height: 1.45;
          font-size: 11pt;
        }
        .aarav-print-document .sans {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
        }
        .aarav-print-document .header-wrap {
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .aarav-print-document .firm-name {
          font-size: 18pt;
          font-weight: bold;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #0f172a;
          margin: 0;
        }
        .aarav-print-document .firm-sub {
          font-size: 8.5pt;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #64748b;
          margin-top: 2px;
        }
        .aarav-print-document .firm-reg {
          font-size: 8.5pt;
          color: #475569;
          margin-top: 4px;
        }
        .aarav-print-document .meta-block {
          text-align: right;
          font-size: 9pt;
          color: #475569;
        }
        .aarav-print-document .recipient-block {
          margin: 14px 0;
          font-size: 9.5pt;
          line-height: 1.4;
        }
        .aarav-print-document .subject-box {
          background-color: #f1f5f9;
          border-left: 4px solid #4338ca;
          padding: 9px 14px;
          font-weight: bold;
          font-size: 10pt;
          color: #0f172a;
          margin: 16px 0;
        }
        .aarav-print-document .section-heading {
          font-weight: bold;
          font-size: 9.5pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #0f172a;
          margin-top: 14px;
          margin-bottom: 6px;
        }
        .aarav-print-document table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0 14px 0;
        }
        .aarav-print-document th, .aarav-print-document td {
          border: 1px solid #cbd5e1;
          padding: 7px 10px;
          text-align: left;
          font-size: 9.5pt;
        }
        .aarav-print-document th {
          background-color: #f8fafc;
          font-weight: bold;
          color: #1e293b;
        }
        .aarav-print-document .text-right {
          text-align: right;
        }
        .aarav-print-document .notes {
          font-size: 8.5pt;
          color: #64748b;
          margin-top: 6px;
        }
        .aarav-print-document .sign-section {
          margin-top: 36px;
          padding-top: 14px;
          border-top: 1px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          page-break-inside: avoid;
        }
        .aarav-print-document .sign-col {
          width: 45%;
        }
        .aarav-print-document .sign-line {
          margin-top: 40px;
          border-top: 1px solid #94a3b8;
          padding-top: 4px;
          font-size: 8.5pt;
          color: #64748b;
        }
      }
    `;

    document.head.appendChild(printStyle);
    document.body.appendChild(printStage);

    // 4. Try browser print
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.warn('window.print threw an error (likely iframe sandbox restricted):', err);
        if (onBlocked) onBlocked();
      } finally {
        setTimeout(() => {
          if (document.body.contains(printStage)) {
            document.body.removeChild(printStage);
          }
          if (document.head.contains(printStyle)) {
            document.head.removeChild(printStyle);
          }
        }, 1500);
      }
    }, 150);
  } catch (e) {
    console.error('Print initialization error:', e);
    if (onBlocked) onBlocked();
  }
}

/**
 * Generates and downloads a formal Chartered Accountancy engagement quotation PDF.
 */
export function downloadQuotationPDF(proposal: Prospect) {
  if (!proposal) {
    console.error('downloadQuotationPDF called without proposal');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = 16;

  // --- HEADER: Firm Branding ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('AARAV ADVISORS LLP', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text('CHARTERED ACCOUNTANTS', margin + 65, y - 0.5);

  // Date & Ref on Right
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const refNo = `AA/PROP/2026/${(proposal.id || '089').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '089'}`;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Ref: ${refNo}`, pageWidth - margin, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${todayStr}`, pageWidth - margin, y + 4, { align: 'right' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Statutory Auditors • Tax & Regulatory Advisors • Corporate Finance', margin, y);

  y += 4;
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Address: #102, SVS Majestic, Kukatpally, Hyderabad, Telangana – 500072', margin, y);

  y += 3.5;
  doc.text('Phone: +91 9701815868 | Email: info@aaravadvisors.com', margin, y);

  y += 3.5;
  doc.text('LinkedIn: Aarav Advisors | Coverage: India & Global | ICAI FRN: 014285S', margin, y);

  y += 4;
  // Header divider
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;

  // --- RECIPIENT BLOCK ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TO:', margin, y);

  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(proposal.contactPerson || 'The Board of Directors', margin, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(proposal.designation || 'Management', margin, y);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(proposal.companyName || 'Valued Client', margin, y);

  if (proposal.email) {
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Email: ${proposal.email}`, margin, y);
  }

  y += 6;

  // --- SUBJECT BLOCK ---
  const subjectTitle = proposal.proposalTitle || 'Statutory & Tax Compliance Engagement';
  const subjectText = `Subject: Professional Proposal & Fee Quotation for ${subjectTitle}`;
  
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFillColor(67, 56, 202); // indigo-700
  doc.rect(margin, y, 1.8, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(subjectText, margin + 4, y + 5.2);

  y += 12;

  // --- INTRODUCTORY BODY ---
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  
  const introPara = `Dear Sir / Madam,\n\nWe thank you for the opportunity to submit our formal professional proposal for providing comprehensive statutory, auditing, tax regulatory, and compliance advisory services to ${proposal.companyName}. As an established multi-disciplinary Chartered Accountancy practice, Aarav Advisors LLP adheres strictly to the Standards on Auditing (SAs) and Code of Ethics issued by the Institute of Chartered Accountants of India (ICAI).`;
  
  const splitIntro = doc.splitTextToSize(introPara, contentWidth);
  doc.text(splitIntro, margin, y);
  y += (splitIntro.length * 4.5) + 3;

  // --- SECTION 1: SCOPE OF ENGAGEMENT ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. SCOPE OF PROFESSIONAL ENGAGEMENT & DELIVERABLES:', margin, y);
  y += 4.5;

  const servicesList: string[] = Array.isArray(proposal.services)
    ? proposal.services
    : typeof proposal.services === 'string'
      ? [proposal.services]
      : ['Statutory Audit & Annual Filing', 'Corporate Income Tax & GST Advisory'];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  
  servicesList.forEach((srv) => {
    doc.setFillColor(67, 56, 202);
    doc.circle(margin + 2, y - 1, 0.8, 'F');
    doc.text(String(srv), margin + 5, y);
    y += 4.2;
  });

  y += 2;

  // --- SECTION 2: COMMERCIAL TERMS TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. COMMERCIAL TERMS & PROFESSIONAL FEES:', margin, y);
  y += 2;

  const feeNumber = Number(proposal.value) || 0;
  const formattedFee = `INR ${feeNumber.toLocaleString('en-IN')}`;

  safeAutoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Particulars of Engagement', 'Billing Cycle / Model', 'Professional Fee (INR)']],
    body: [
      [
        proposal.proposalTitle || 'Comprehensive CA & Audit Retainer',
        proposal.billingFrequency || 'Monthly Retainer',
        formattedFee
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8.5,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 45 },
      2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 18;
  y = finalY + 4;

  // Commercial footnotes
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const taxNotes = `* Applicable Goods & Services Tax (GST @ 18%) shall be charged extra on invoice. Out of pocket expenses: ${proposal.outOfPocketTerms || 'At actuals upon approval'}. Payment terms: ${proposal.paymentTerms || 'Net 15 days'}.`;
  const splitNotes = doc.splitTextToSize(taxNotes, contentWidth);
  doc.text(splitNotes, margin, y);
  y += (splitNotes.length * 3.5) + 3;

  // --- SECTION 3: LEAD ENGAGEMENT PARTNER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. LEAD ENGAGEMENT PARTNER & SUPERVISION:', margin, y);
  y += 4;

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const partnerDesc = `This engagement will be supervised directly by ${proposal.assignedPartner || 'CA Aarav Patel, FCA (Senior Partner)'} along with qualified team leaders and article trainees in compliance with Quality Management Standard SQC 1.`;
  const splitPartner = doc.splitTextToSize(partnerDesc, contentWidth);
  doc.text(splitPartner, margin, y);
  y += (splitPartner.length * 4) + 6;

  // --- SIGN-OFF BLOCK ---
  // Ensure we don't overflow the page
  if (y > 240) {
    doc.addPage();
    y = 25;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Left column: CA Firm
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('For AARAV ADVISORS LLP', margin, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Chartered Accountants', margin, y + 4);
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('[Digitally Signed by Authorized Partner]', margin, y + 16);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(proposal.assignedPartner || 'CA Aarav Patel, FCA', margin, y + 21);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Membership No: 512390 | ICAI FRN: 014285S', margin, y + 25);

  // Right column: Client Acceptance
  const rightColX = pageWidth - margin - 75;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Accepted & Confirmed by Client:', rightColX, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`For ${proposal.companyName}`, rightColX, y + 4);

  doc.setDrawColor(148, 163, 184);
  doc.line(rightColX, y + 20, rightColX + 70, y + 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory & Company Seal', rightColX, y + 24);

  // Save the PDF
  const sanitizedClient = (proposal.companyName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
  safeDownloadPDF(doc, `Quotation_AaravAdvisors_${sanitizedClient}.pdf`);
}

/**
 * Generates the clean printable HTML for the quotation document
 */
export function getQuotationHtml(proposal: Prospect): string {
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const refNo = `AA/PROP/2026/${(proposal.id || '089').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '089'}`;
  const servicesList: string[] = Array.isArray(proposal.services)
    ? proposal.services
    : typeof proposal.services === 'string'
      ? [proposal.services]
      : ['Statutory Audit & Annual Filing', 'Corporate Income Tax & GST Advisory'];
  const feeNumber = Number(proposal.value) || 0;
  const formattedFee = `INR ${feeNumber.toLocaleString('en-IN')}`;

  return `
    <div class="header-wrap sans">
      <div>
        <h1 class="firm-name">AARAV ADVISORS LLP</h1>
        <div class="firm-sub">Chartered Accountants &bull; Statutory Auditors &bull; Tax Consultants</div>
        <div class="firm-reg">
          <strong>Address:</strong> #102, SVS Majestic, Kukatpally, Hyderabad, Telangana – 500072<br/>
          <strong>Phone:</strong> +91 9701815868 &bull; <strong>Email:</strong> info@aaravadvisors.com<br/>
          <strong>LinkedIn:</strong> Aarav Advisors &bull; <strong>Coverage:</strong> India & Global &bull; <strong>ICAI Reg No:</strong> 014285S
        </div>
      </div>
      <div class="meta-block">
        <div><strong>Ref:</strong> ${refNo}</div>
        <div><strong>Date:</strong> ${todayStr}</div>
      </div>
    </div>

    <div class="recipient-block sans">
      <div style="font-size: 8pt; color: #64748b; font-weight: bold; text-transform: uppercase;">To:</div>
      <div style="font-size: 11pt; font-weight: bold; color: #0f172a; margin-top: 2px;">${proposal.contactPerson || 'The Board of Directors'}</div>
      <div style="color: #475569;">${proposal.designation || 'Management'}</div>
      <div style="font-weight: bold; color: #0f172a;">${proposal.companyName}</div>
      ${proposal.email ? `<div style="font-size: 8.5pt; color: #64748b;">Email: ${proposal.email}</div>` : ''}
    </div>

    <div class="subject-box sans">
      Subject: Professional Engagement Proposal & Fee Quotation for ${proposal.proposalTitle || 'Statutory & Tax Compliance'}
    </div>

    <p>Dear Sir/Madam,</p>
    <p>
      We thank you for the opportunity to submit our proposal for providing comprehensive statutory, auditing, and tax regulatory advisory services to <strong>${proposal.companyName}</strong>. As an established multi-disciplinary Chartered Accountancy firm, we adhere strictly to the Standards on Auditing (SAs) issued by the Institute of Chartered Accountants of India (ICAI).
    </p>

    <div class="section-heading sans">1. Scope of Professional Engagement & Deliverables:</div>
    <ul class="sans" style="font-size: 9.5pt; color: #334155;">
      ${servicesList.map(s => `<li style="margin-bottom: 4px;"><strong>${s}</strong></li>`).join('')}
    </ul>

    <div class="section-heading sans">2. Commercial Terms & Professional Fees:</div>
    <table>
      <thead>
        <tr>
          <th>Particulars of Engagement</th>
          <th>Billing Model</th>
          <th class="text-right">Professional Fee (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${proposal.proposalTitle || 'Comprehensive Retainer'}</strong></td>
          <td>${proposal.billingFrequency || 'Monthly Retainer'}</td>
          <td class="text-right"><strong>${formattedFee}</strong></td>
        </tr>
      </tbody>
    </table>
    <div class="notes sans">
      * Applicable Goods & Services Tax (GST @ 18%) shall be billed extra. Out of pocket expenses: ${proposal.outOfPocketTerms || 'At actuals upon approval'}. Payment terms: ${proposal.paymentTerms || 'Net 15 days'}.
    </div>

    <div class="section-heading sans" style="margin-top: 16px;">3. Lead Engagement Partner:</div>
    <p class="sans" style="font-size: 9.5pt; color: #334155;">
      The assignment will be personally supervised by <strong>${proposal.assignedPartner || 'CA Aarav Patel, FCA'}</strong> with dedicated qualified seniors and article assistants.
    </p>

    <div class="sign-section sans">
      <div class="sign-col">
        <div style="font-weight: bold; color: #0f172a;">For AARAV ADVISORS LLP</div>
        <div style="color: #64748b; font-size: 8.5pt;">Chartered Accountants</div>
        <div style="margin-top: 25px; color: #4338ca; font-style: italic; font-size: 8.5pt;">[Digitally Signed by Authorized Partner]</div>
        <div style="font-weight: bold; margin-top: 2px;">${proposal.assignedPartner || 'CA Aarav Patel, FCA'}</div>
        <div style="font-size: 8pt; color: #64748b;">Membership No: 512390 &bull; FRN: 014285S</div>
      </div>
      <div class="sign-col" style="text-align: right;">
        <div style="font-weight: bold; color: #0f172a;">Accepted & Confirmed by Client:</div>
        <div style="color: #64748b; font-size: 8.5pt;">For ${proposal.companyName}</div>
        <div class="sign-line" style="margin-left: auto;">Authorized Signatory & Seal</div>
      </div>
    </div>
  `;
}

/**
 * Triggers a direct, clean print of the Quotation
 */
export function printQuotation(proposal: Prospect) {
  const html = getQuotationHtml(proposal);
  const title = `Quotation_${proposal.companyName || 'Client'}`;
  printHtmlDocument(title, html);
}

/**
 * Generates and downloads a Tax Invoice PDF
 */
export function downloadInvoicePDF(invoice: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = 16;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('AARAV ADVISORS LLP', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229);
  doc.text('TAX INVOICE', margin + 65, y - 0.5);

  const invNum = invoice.invoiceNumber || invoice.id || 'INV-2026-001';
  const invDate = invoice.createdAt?.toDate ? invoice.createdAt.toDate().toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice No: ${invNum}`, pageWidth - margin, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${invDate}`, pageWidth - margin, y + 4, { align: 'right' });
  doc.text(`Due Date: ${invoice.dueDate || 'Upon Receipt'}`, pageWidth - margin, y + 8, { align: 'right' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Chartered Accountants • ICAI Reg No: 014285S • GSTIN: 36AAFFA1234F1Z8', margin, y);

  y += 4;
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Address: #102, SVS Majestic, Kukatpally, Hyderabad, Telangana – 500072', margin, y);

  y += 3.5;
  doc.text('Phone: +91 9701815868 | Email: info@aaravadvisors.com', margin, y);

  y += 3.5;
  doc.text('LinkedIn: Aarav Advisors | Coverage: India & Global', margin, y);

  y += 4;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);

  y += 7;

  // Billed To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO:', margin, y);

  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.clientName || invoice.client || 'Client Apex Ltd', margin, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Status: ${invoice.status || 'Payment Pending'}`, margin, y);

  y += 8;

  // Table items
  const baseAmount = Number(invoice.amount) || 25000;
  const taxableVal = Math.round(baseAmount / 1.18);
  const gstVal = baseAmount - taxableVal;

  safeAutoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Description of Service', 'SAC Code', 'Taxable (INR)', 'GST (18%)', 'Total (INR)']],
    body: [
      [
        invoice.description || 'Statutory Audit & Tax Compliance Retainer',
        invoice.sac || '998221',
        `INR ${taxableVal.toLocaleString('en-IN')}`,
        `INR ${gstVal.toLocaleString('en-IN')}`,
        `INR ${baseAmount.toLocaleString('en-IN')}`
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8.5
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 30;
  y = finalY + 6;

  // Bank details block
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 24, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 24, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('BANK REMITTANCE DETAILS (RTGS / NEFT / IMPS):', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Account Name: AARAV ADVISORS LLP | Bank: HDFC Bank Ltd', margin + 4, y + 10);
  doc.text('A/C Number: 50200084920194 | IFSC: HDFC0000128 (Branch: Kukatpally, Hyderabad)', margin + 4, y + 14);
  doc.text('UPI ID: aaravadvisors@hdfcbank | GSTIN: 36AAFFA1234F1Z8', margin + 4, y + 18);

  y += 35;

  // Signatures
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('For AARAV ADVISORS LLP', pageWidth - margin - 50, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory', pageWidth - margin - 50, y + 15);

  safeDownloadPDF(doc, `Invoice_${invNum}.pdf`);
}

/**
 * Generates and downloads a TDS Form 16 / 16A Certificate PDF
 */
export function downloadTdsCertificatePDF(cert: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = 16;

  // Gov Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`FORM NO. ${cert.certType === '16' ? '16' : '16A'}`, pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('[See rule 31(1)(a) of Income-tax Rules, 1962]', pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Certificate under section 203 of the Income-tax Act, 1961 for tax deducted at source', pageWidth / 2, y, { align: 'center' });

  y += 6;
  doc.setDrawColor(15, 23, 42);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Deductor & Deductee grid
  safeAutoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Deductor (Tax Deductor)', 'Deductee (Payee / Taxpayer)']],
    body: [
      [
        `Name: ${cert.deductorName || 'Aarav Advisors LLP'}\nTAN: ${cert.tan || 'HYDA12345B'}\nAddress: #102, SVS Majestic, Kukatpally, Hyderabad, Telangana – 500072\nPhone: +91 9701815868 | Email: info@aaravadvisors.com`,
        `Name: ${cert.deducteeName || 'Client Apex'}\nPAN: ${cert.pan || 'ABCDE1234F'}\nCategory: Corporate Entity`
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], fontSize: 8.5 },
    bodyStyles: { fontSize: 8, cellPadding: 4 }
  });

  const nextY = (doc as any).lastAutoTable?.finalY || y + 30;
  y = nextY + 6;

  // Figures table
  safeAutoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Particular', 'Detail / Amount (INR)']],
    body: [
      ['Financial Year', cert.financialYear || '2025-26'],
      ['Assessment Year', cert.assessmentYear || '2026-27'],
      ['Quarter / Period', cert.quarter || 'Q1 (Apr-Jun)'],
      ['Gross Amount Paid / Credited', `INR ${Number(cert.grossPaid || 0).toLocaleString('en-IN')}`],
      ['Total Tax Deducted at Source (TDS)', `INR ${Number(cert.taxDeducted || 0).toLocaleString('en-IN')}`],
      ['Total Tax Deposited to Central Govt (OLTAS)', `INR ${Number(cert.taxDeposited || 0).toLocaleString('en-IN')}`]
    ],
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, cellPadding: 3.5 }
  });

  const finalY2 = (doc as any).lastAutoTable?.finalY || y + 50;
  y = finalY2 + 8;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Certified that the tax deducted has been deposited to the credit of the Central Government via OLTAS ITNS 281 Challan.', margin, y);
  doc.text('This certificate is digitally authenticated under the TRACES framework.', margin, y + 4);

  safeDownloadPDF(doc, `TDS_Form_${cert.certType}_${(cert.pan || 'cert').toUpperCase()}.pdf`);
}

/**
 * Prints a TDS Form 16 / 16A Certificate using the iframe printing approach
 */
export function printTdsCertificate(cert: any) {
  const isForm16 = cert.certType === '16';
  const html = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 16pt; font-weight: bold; color: #0f172a; text-transform: uppercase;">FORM NO. ${isForm16 ? '16' : '16A'}</div>
      <div style="font-size: 8.5pt; font-style: italic; color: #64748b;">[See rule 31(1)(a) of Income-tax Rules, 1962]</div>
      <div style="font-size: 9pt; color: #334155; margin-top: 4px;">Certificate under section 203 of the Income-tax Act, 1961 for tax deducted at source</div>
    </div>
    <div style="border-top: 2px solid #0f172a; margin-bottom: 16px;"></div>

    <table style="width: 100%; margin-bottom: 20px;">
      <thead>
        <tr>
          <th style="width: 50%;">Deductor (Tax Deductor)</th>
          <th style="width: 50%;">Deductee (Payee / Taxpayer)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${cert.deductorName || 'Aarav Advisors LLP'}</strong><br/>
            TAN: <strong>${cert.tan || 'HYDA12345B'}</strong><br/>
            #102, SVS Majestic, Kukatpally, Hyderabad, Telangana – 500072<br/>
            Phone: +91 9701815868 &bull; Email: info@aaravadvisors.com
          </td>
          <td>
            <strong>${cert.deducteeName}</strong><br/>
            PAN: <strong>${cert.pan || 'ABCDE1234F'}</strong><br/>
            Status: Active Deductee
          </td>
        </tr>
      </tbody>
    </table>

    <table style="width: 100%; margin-bottom: 20px;">
      <thead>
        <tr>
          <th>Particulars</th>
          <th class="text-right">Value / Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Financial Year</td>
          <td class="text-right"><strong>${cert.financialYear || '2025-26'}</strong></td>
        </tr>
        <tr>
          <td>Assessment Year</td>
          <td class="text-right"><strong>${cert.assessmentYear || '2026-27'}</strong></td>
        </tr>
        <tr>
          <td>Quarter / Period</td>
          <td class="text-right">${cert.quarter || 'Q1 (Apr-Jun)'}</td>
        </tr>
        <tr>
          <td>Gross Amount Paid / Credited</td>
          <td class="text-right font-bold">₹${Number(cert.grossPaid || 0).toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td>Total Tax Deducted at Source (TDS)</td>
          <td class="text-right font-bold" style="color: #4338ca;">₹${Number(cert.taxDeducted || 0).toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td>Total Tax Deposited to Central Govt (OLTAS Challan ITNS 281)</td>
          <td class="text-right font-bold" style="color: #047857;">₹${Number(cert.taxDeposited || 0).toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 30px; font-size: 8.5pt; color: #475569; font-style: italic; border-top: 1px solid #cbd5e1; padding-top: 10px;">
      Certified that the tax deducted has been deposited to the credit of the Central Government via OLTAS ITNS 281 Challan. This certificate is digitally authenticated under the TRACES framework of the Income Tax Department, Government of India.
    </div>

    <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 9pt;">
      <div>
        <div style="font-weight: bold; color: #0f172a;">For ${cert.deductorName || 'Aarav Advisors LLP'}</div>
        <div style="color: #64748b; margin-top: 30px;">Authorized Signatory</div>
        <div style="font-size: 8pt; color: #94a3b8;">Digitally Signed with DSC</div>
      </div>
      <div style="text-align: right; color: #64748b; font-size: 8.5pt;">
        Date: ${new Date().toLocaleDateString('en-IN')}<br/>
        Place: New Delhi
      </div>
    </div>
  `;
  printHtmlDocument(`TDS_Certificate_Form_${cert.certType}_${cert.pan || ''}`, html);
}

/**
 * Generates and downloads a Compliance Health Summary PDF with detailed filings schedule
 */
export function downloadComplianceHealthPDF(
  metrics: { greenCount: number; amberCount: number; redCount: number },
  filings?: ComplianceFiling[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  // Firm Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('AARAV ADVISORS LLP', margin, y);

  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229);
  doc.text('COMPLIANCE HEALTH & STATUTORY AUDIT SUMMARY', pageWidth - margin, y, { align: 'right' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Address: #102, SVS Majestic, Kukatpally, Hyderabad, Telangana – 500072', margin, y);
  const totalCount = filings ? filings.length : (metrics.greenCount + metrics.amberCount + metrics.redCount);
  doc.text(`Total Portfolio Filings: ${totalCount}`, pageWidth - margin, y, { align: 'right' });

  y += 3.5;
  doc.text('Phone: +91 9701815868 | Email: info@aaravadvisors.com | Coverage: India & Global | FRN: 014285S', margin, y);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - margin, y, { align: 'right' });

  y += 4;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // KPI Metrics Summary Table
  safeAutoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Portfolio Status Category', 'Count', 'Health Indicator', 'Audit Action Plan']],
    body: [
      ['Up To Date (Compliant)', String(metrics.greenCount), 'GREEN (Compliant)', 'Filed & verified with government statutory portals'],
      ['Due within 7 Days', String(metrics.amberCount), 'AMBER (Action Required)', 'Challans & draft returns prepared for client review'],
      ['Overdue / Notices', String(metrics.redCount), 'RED (Critical Notice)', 'Priority escalation to avoid penalties and compounding']
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, cellPadding: 3.5 },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 40, halign: 'center' },
      3: { cellWidth: 'auto' }
    }
  });

  let nextY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : y + 35;

  // Detailed Filings Table
  if (filings && filings.length > 0) {
    nextY += 8;
    if (nextY > 230) {
      doc.addPage();
      nextY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('CLIENT STATUTORY FILINGS SCHEDULE', margin, nextY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Displaying ${filings.length} filings matching active filters`, pageWidth - margin, nextY, { align: 'right' });

    nextY += 4;

    const rows = filings.map((f, i) => [
      String(i + 1),
      f.clientName || 'Client',
      `${f.complianceCode}\n${f.complianceTitle || ''}`,
      f.period || '-',
      f.dueDate || '-',
      f.status || 'Pending',
      f.health.toUpperCase()
    ]);

    safeAutoTable(doc, {
      startY: nextY,
      margin: { left: margin, right: margin },
      head: [['#', 'Client Name', 'Compliance Code & Title', 'Period', 'Due Date', 'Status', 'Health']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 40, fontStyle: 'bold' },
        2: { cellWidth: 50 },
        3: { cellWidth: 20 },
        4: { cellWidth: 22 },
        5: { cellWidth: 22 },
        6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 6) {
          const val = String(data.cell.raw || '');
          if (val === 'GREEN') data.cell.styles.textColor = [16, 185, 129];
          else if (val === 'AMBER') data.cell.styles.textColor = [217, 119, 6];
          else if (val === 'RED') data.cell.styles.textColor = [225, 29, 72];
        }
      }
    });
  }

  safeDownloadPDF(doc, `Compliance_Health_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Exports Compliance Health Dashboard records to Microsoft Excel (.xlsx)
 */
export function exportComplianceHealthExcel(
  filings: ComplianceFiling[],
  metrics: { greenCount: number; amberCount: number; redCount: number }
) {
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Detailed Client Filings Schedule
    const rows = filings.map((f, idx) => ({
      'S.No': idx + 1,
      'Client Name': f.clientName,
      'Compliance Code': f.complianceCode,
      'Compliance Title': f.complianceTitle,
      'Period': f.period,
      'Statutory Due Date': f.dueDate,
      'Health Status': f.health === 'Green' ? 'Up To Date (Green)' : f.health === 'Amber' ? 'Due Soon (Amber)' : 'Overdue (Red)',
      'Filing Status': f.status,
      'Checklist Progress': `${f.completedSteps || 0} of ${f.totalSteps || 0} steps completed`,
      'Filed Date': f.filedDate || 'Not filed yet'
    }));

    const wsFilings = XLSX.utils.json_to_sheet(rows);

    // Auto-fit column widths
    wsFilings['!cols'] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 18 },
      { wch: 36 },
      { wch: 14 },
      { wch: 16 },
      { wch: 22 },
      { wch: 16 },
      { wch: 25 },
      { wch: 16 }
    ];

    XLSX.utils.book_append_sheet(wb, wsFilings, 'Filings Schedule');

    // Sheet 2: KPI Portfolio Summary
    const summaryRows = [
      { 'Portfolio Metric': 'Up To Date (Compliant - Green)', 'Count / Details': metrics.greenCount },
      { 'Portfolio Metric': 'Due within 7 Days (Amber)', 'Count / Details': metrics.amberCount },
      { 'Portfolio Metric': 'Overdue / Action Required (Red)', 'Count / Details': metrics.redCount },
      { 'Portfolio Metric': 'Total Compliance Filings Tracked', 'Count / Details': filings.length },
      { 'Portfolio Metric': 'Report Generated At', 'Count / Details': new Date().toLocaleString('en-IN') },
      { 'Portfolio Metric': 'Chartered Accountancy Firm', 'Count / Details': 'AARAV ADVISORS LLP' },
      { 'Portfolio Metric': 'ICAI Firm Registration Number (FRN)', 'Count / Details': '014285S' },
      { 'Portfolio Metric': 'Office Address', 'Count / Details': '#102, SVS Majestic, Kukatpally, Hyderabad, Telangana – 500072' },
      { 'Portfolio Metric': 'Phone & Email', 'Count / Details': '+91 9701815868 | info@aaravadvisors.com' },
      { 'Portfolio Metric': 'LinkedIn & Coverage', 'Count / Details': 'Aarav Advisors | India & Global' }
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 38 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Portfolio Summary');

    const fileName = `Compliance_Health_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(wb, fileName);
  } catch (err) {
    console.error('XLSX.writeFile error, falling back to CSV export:', err);
    exportComplianceHealthCSV(filings);
  }
}

/**
 * Fallback CSV export for Compliance Health
 */
export function exportComplianceHealthCSV(filings: ComplianceFiling[]) {
  const headers = ['S.No', 'Client Name', 'Compliance Code', 'Compliance Title', 'Period', 'Due Date', 'Status', 'Health', 'Completed Steps', 'Total Steps', 'Filed Date'];
  const csvRows = [headers.join(',')];
  
  filings.forEach((f, idx) => {
    const row = [
      idx + 1,
      `"${(f.clientName || '').replace(/"/g, '""')}"`,
      `"${(f.complianceCode || '').replace(/"/g, '""')}"`,
      `"${(f.complianceTitle || '').replace(/"/g, '""')}"`,
      `"${(f.period || '').replace(/"/g, '""')}"`,
      `"${(f.dueDate || '').replace(/"/g, '""')}"`,
      `"${(f.status || '').replace(/"/g, '""')}"`,
      `"${(f.health || '').replace(/"/g, '""')}"`,
      f.completedSteps || 0,
      f.totalSteps || 0,
      `"${(f.filedDate || '').replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `Compliance_Health_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates clean printable HTML for ICAI SA-210 Engagement Letters
 */
export function getEngagementLetterHtml(clientName: string, refNo: string, textOrMarkdown: string): string {
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedContent = textOrMarkdown
    .split('\n\n')
    .map(para => `<p style="margin-bottom: 12px; line-height: 1.6;">${para.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return `
    <div class="header-wrap sans">
      <div>
        <h1 class="firm-name">AARAV ADVISORS LLP</h1>
        <div class="firm-sub">Chartered Accountants &bull; Statutory Auditors &bull; Tax Consultants</div>
        <div class="firm-reg">
          <strong>Address:</strong> #102, SVS Majestic, Kukatpally, Hyderabad, Telangana – 500072<br/>
          <strong>Phone:</strong> +91 9701815868 &bull; <strong>Email:</strong> info@aaravadvisors.com<br/>
          <strong>LinkedIn:</strong> Aarav Advisors &bull; <strong>Coverage:</strong> India & Global &bull; <strong>ICAI FRN:</strong> 014285S
        </div>
      </div>
      <div class="meta-block">
        <div><strong>Ref:</strong> ${refNo || 'AA/ENG/2026/01'}</div>
        <div><strong>Date:</strong> ${todayStr}</div>
      </div>
    </div>

    <div class="subject-box sans">
      Subject: Professional Engagement Letter under ICAI Standard on Auditing (SA) 210 for ${clientName}
    </div>

    <div style="font-size: 10pt; color: #1e293b; margin-top: 14px;">
      ${formattedContent}
    </div>

    <div class="sign-section sans" style="margin-top: 40px;">
      <div class="sign-col">
        <div style="font-weight: bold; color: #0f172a;">For AARAV ADVISORS LLP</div>
        <div style="color: #64748b; font-size: 8.5pt;">Chartered Accountants</div>
        <div style="margin-top: 30px; color: #4338ca; font-style: italic; font-size: 8.5pt;">[Digitally Signed with DSC]</div>
        <div style="font-weight: bold; margin-top: 2px;">CA Aarav Patel, FCA (Senior Partner)</div>
        <div style="font-size: 8pt; color: #64748b;">Membership No: 512390 &bull; FRN: 014285S</div>
      </div>
      <div class="sign-col" style="text-align: right;">
        <div style="font-weight: bold; color: #0f172a;">Acknowledged & Accepted:</div>
        <div style="color: #64748b; font-size: 8.5pt;">For ${clientName}</div>
        <div class="sign-line" style="margin-left: auto;">Authorized Signatory & Seal</div>
      </div>
    </div>
  `;
}

/**
 * Triggers clean print of ICAI SA-210 Engagement Letter
 */
export function printEngagementLetter(clientName: string, refNo: string, textOrMarkdown: string) {
  const html = getEngagementLetterHtml(clientName, refNo, textOrMarkdown);
  const title = `Engagement_Letter_${clientName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  printHtmlDocument(title, html, () => {
    downloadEngagementLetterPDF(clientName, refNo, textOrMarkdown);
  });
}

/**
 * Downloads a PDF of the ICAI SA-210 Engagement Letter
 */
export function downloadEngagementLetterPDF(clientName: string, refNo: string, textOrMarkdown: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = 18;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('AARAV ADVISORS LLP', margin, y);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Chartered Accountants | ICAI FRN: 014285S', margin, y + 4.5);

  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Ref: ${refNo || 'AA/ENG/2026/01'}`, pageWidth - margin, y, { align: 'right' });
  doc.text(`Date: ${todayStr}`, pageWidth - margin, y + 4.5, { align: 'right' });

  y += 8.5;
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Address: #102, SVS Majestic, Kukatpally, Hyderabad, Telangana – 500072', margin, y);
  y += 3.5;
  doc.text('Phone: +91 9701815868 | Email: info@aaravadvisors.com | LinkedIn: Aarav Advisors | Coverage: India & Global', margin, y);

  y += 4;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(67, 56, 202);
  doc.text(`ICAI SA-210 COMPLIANT ENGAGEMENT LETTER — ${clientName.toUpperCase()}`, margin + 4, y + 5.5);

  y += 14;
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);

  const paragraphs = textOrMarkdown.split('\n\n');
  for (const para of paragraphs) {
    if (!para.trim()) continue;
    const lines = doc.splitTextToSize(para.trim(), contentWidth);
    if (y + (lines.length * 4.5) > pageHeight - 35) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += (lines.length * 4.5) + 4;
  }

  if (y > pageHeight - 40) {
    doc.addPage();
    y = 25;
  }

  // Signature Block
  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('For AARAV ADVISORS LLP', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Chartered Accountants | FRN: 014285S', margin, y + 4);
  doc.text('[Digitally Signed by Authorized Partner]', margin, y + 16);

  const rightX = pageWidth - margin - 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Accepted for ${clientName}`, rightX, y);
  doc.setDrawColor(148, 163, 184);
  doc.line(rightX, y + 18, pageWidth - margin, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory & Seal', rightX, y + 22);

  const safeClient = clientName.replace(/[^a-zA-Z0-9_-]/g, '_');
  safeDownloadPDF(doc, `ICAI_SA210_Engagement_${safeClient}.pdf`);
}
