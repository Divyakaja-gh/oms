/**
 * Self-contained, realistic SVG data URLs for Invoice OCR document viewing.
 * Provides 100% offline, guaranteed zero-failure rendering of authentic invoices
 * with stamps, handwriting, and statutory GST tables.
 */

export function getHandwrittenSampleInvoiceSvg(): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1120" width="800" height="1120" style="background:#fcfbf7;font-family:'Courier New',Courier,monospace;">
  <!-- Paper background with subtle scan texture -->
  <rect width="800" height="1120" fill="#fcfbf7"/>
  <rect x="25" y="25" width="750" height="1070" fill="#ffffff" stroke="#e5e7eb" stroke-width="1.5" rx="4"/>
  
  <!-- Outer border -->
  <rect x="35" y="35" width="730" height="1050" fill="none" stroke="#262626" stroke-width="1.5"/>

  <!-- Vendor Header -->
  <g transform="translate(50, 55)">
    <text x="365" y="22" font-family="'Arial', sans-serif" font-size="22" font-weight="900" fill="#18181b" text-anchor="middle">APEX PRINTING &amp; STATIONERY WORKS</text>
    <text x="365" y="42" font-family="'Arial', sans-serif" font-size="11" font-weight="600" fill="#52525b" text-anchor="middle">Prop. APEX STATIONERS · PRINTERS &amp; STATIONERY CONTRACTORS</text>
    <text x="365" y="58" font-family="'Arial', sans-serif" font-size="11" fill="#71717a" text-anchor="middle">Shop No. 4, Commercial Chambers, Fort, Mumbai – 400 001</text>
    <text x="365" y="74" font-family="'Arial', sans-serif" font-size="11" fill="#71717a" text-anchor="middle">Ph: +91 98200 44321 · Email: apex.fort@gmail.com</text>
    <text x="365" y="93" font-family="'Arial', sans-serif" font-size="12" font-weight="bold" fill="#0f766e" text-anchor="middle">GSTIN: 27AALCA4512P1Z9  |  PAN: AALCA4512P</text>
  </g>

  <!-- Horizontal divider -->
  <line x1="35" y1="170" x2="765" y2="170" stroke="#262626" stroke-width="1.5"/>

  <!-- Document Title Badge -->
  <rect x="270" y="160" width="260" height="22" fill="#18181b" rx="2"/>
  <text x="400" y="176" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">TAX INVOICE / CASH MEMO</text>

  <!-- Meta Info Grid -->
  <g transform="translate(50, 195)">
    <!-- Left Column: Buyer -->
    <text x="0" y="15" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#18181b">BILLED TO (BUYER):</text>
    <text x="0" y="35" font-family="'Arial', sans-serif" font-size="13" font-weight="bold" fill="#09090b">M/s. AARAV &amp; ASSOCIATES</text>
    <text x="0" y="52" font-family="'Arial', sans-serif" font-size="11" fill="#3f3f46">Chartered Accountants, Office 302, Nariman Point</text>
    <text x="0" y="68" font-family="'Arial', sans-serif" font-size="11" fill="#3f3f46">Mumbai, Maharashtra – 400 021</text>
    <text x="0" y="86" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#0f766e">GSTIN: 27AAAAA0000A1Z5 | State: 27</text>

    <!-- Right Column: Meta details -->
    <line x1="410" y1="0" x2="410" y2="105" stroke="#e5e7eb" stroke-width="1"/>
    <text x="430" y="15" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#18181b">INVOICE NO:</text>
    <text x="530" y="15" font-family="'Arial', sans-serif" font-size="12" font-weight="bold" fill="#dc2626">HW-REC-9042</text>
    <text x="430" y="36" font-family="'Arial', sans-serif" font-size="11" fill="#52525b">DATE:</text>
    <text x="530" y="36" font-family="'Arial', sans-serif" font-size="11" font-weight="600" fill="#18181b">28-Aug-2025</text>
    <text x="430" y="56" font-family="'Arial', sans-serif" font-size="11" fill="#52525b">PO / REF NO:</text>
    <text x="530" y="56" font-family="'Arial', sans-serif" font-size="11" font-weight="600" fill="#18181b">VERBAL-APPROVAL-04</text>
    <text x="430" y="76" font-family="'Arial', sans-serif" font-size="11" fill="#52525b">PLACE OF SUPPLY:</text>
    <text x="530" y="76" font-family="'Arial', sans-serif" font-size="11" font-weight="600" fill="#18181b">27-Maharashtra</text>
    <text x="430" y="96" font-family="'Arial', sans-serif" font-size="11" fill="#52525b">REVERSE CHARGE:</text>
    <text x="530" y="96" font-family="'Arial', sans-serif" font-size="11" font-weight="600" fill="#18181b">NO</text>
  </g>

  <!-- Items Table Header -->
  <g transform="translate(35, 315)">
    <rect x="0" y="0" width="730" height="28" fill="#f4f4f5" stroke="#262626" stroke-width="1.5"/>
    <text x="25" y="18" font-family="'Arial', sans-serif" font-size="10" font-weight="bold" fill="#18181b" text-anchor="middle">SR.</text>
    <line x1="50" y1="0" x2="50" y2="28" stroke="#262626" stroke-width="1"/>
    
    <text x="180" y="18" font-family="'Arial', sans-serif" font-size="10" font-weight="bold" fill="#18181b" text-anchor="middle">DESCRIPTION OF GOODS / SERVICES</text>
    <line x1="330" y1="0" x2="330" y2="28" stroke="#262626" stroke-width="1"/>

    <text x="370" y="18" font-family="'Arial', sans-serif" font-size="10" font-weight="bold" fill="#18181b" text-anchor="middle">HSN/SAC</text>
    <line x1="410" y1="0" x2="410" y2="28" stroke="#262626" stroke-width="1"/>

    <text x="445" y="18" font-family="'Arial', sans-serif" font-size="10" font-weight="bold" fill="#18181b" text-anchor="middle">QTY</text>
    <line x1="480" y1="0" x2="480" y2="28" stroke="#262626" stroke-width="1"/>

    <text x="525" y="18" font-family="'Arial', sans-serif" font-size="10" font-weight="bold" fill="#18181b" text-anchor="middle">RATE (₹)</text>
    <line x1="570" y1="0" x2="570" y2="28" stroke="#262626" stroke-width="1"/>

    <text x="610" y="18" font-family="'Arial', sans-serif" font-size="10" font-weight="bold" fill="#18181b" text-anchor="middle">GST %</text>
    <line x1="650" y1="0" x2="650" y2="28" stroke="#262626" stroke-width="1"/>

    <text x="700" y="18" font-family="'Arial', sans-serif" font-size="10" font-weight="bold" fill="#18181b" text-anchor="middle">TOTAL (₹)</text>
  </g>

  <!-- Items Table Rows -->
  <g transform="translate(35, 343)">
    <!-- Outer Table Frame -->
    <rect x="0" y="0" width="730" height="280" fill="none" stroke="#262626" stroke-width="1.5"/>
    <line x1="50" y1="0" x2="50" y2="280" stroke="#262626" stroke-width="1"/>
    <line x1="330" y1="0" x2="330" y2="280" stroke="#262626" stroke-width="1"/>
    <line x1="410" y1="0" x2="410" y2="280" stroke="#262626" stroke-width="1"/>
    <line x1="480" y1="0" x2="480" y2="280" stroke="#262626" stroke-width="1"/>
    <line x1="570" y1="0" x2="570" y2="280" stroke="#262626" stroke-width="1"/>
    <line x1="650" y1="0" x2="650" y2="280" stroke="#262626" stroke-width="1"/>

    <!-- Row 1 -->
    <text x="25" y="30" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">1</text>
    <text x="60" y="24" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#18181b">Executive Letterhead Printing (Bond Paper 100 GSM)</text>
    <text x="60" y="40" font-family="'Arial', sans-serif" font-size="10" fill="#71717a">Special Gold Foil Embossing &amp; 4-Color Offset</text>
    <text x="370" y="30" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">4911</text>
    <text x="445" y="30" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">2,000</text>
    <text x="525" y="30" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">2.25</text>
    <text x="610" y="30" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">18%</text>
    <text x="715" y="30" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#18181b" text-anchor="end">4,500.00</text>
    <line x1="0" y1="52" x2="730" y2="52" stroke="#e5e7eb" stroke-width="1"/>

    <!-- Row 2 -->
    <text x="25" y="80" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">2</text>
    <text x="60" y="74" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#18181b">Audit Files &amp; Hardcover Client Portfolios (A4)</text>
    <text x="60" y="90" font-family="'Arial', sans-serif" font-size="10" fill="#71717a">Rexine Coated with Firm Monogram</text>
    <text x="370" y="80" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">4820</text>
    <text x="445" y="80" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">150</text>
    <text x="525" y="80" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">48.00</text>
    <text x="610" y="80" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">18%</text>
    <text x="715" y="80" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#18181b" text-anchor="end">7,200.00</text>
    <line x1="0" y1="104" x2="730" y2="104" stroke="#e5e7eb" stroke-width="1"/>

    <!-- Row 3 -->
    <text x="25" y="132" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">3</text>
    <text x="60" y="126" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#18181b">Self-Inking CA Round Stamp &amp; Signature Seals</text>
    <text x="60" y="142" font-family="'Arial', sans-serif" font-size="10" fill="#71717a">Trodat / Shiny Heavy Duty</text>
    <text x="370" y="132" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">9611</text>
    <text x="445" y="132" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">4</text>
    <text x="525" y="132" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">350.00</text>
    <text x="610" y="132" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">18%</text>
    <text x="715" y="132" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#18181b" text-anchor="end">1,400.00</text>
    <line x1="0" y1="156" x2="730" y2="156" stroke="#e5e7eb" stroke-width="1"/>

    <!-- Row 4 -->
    <text x="25" y="184" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">4</text>
    <text x="60" y="178" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#18181b">Ledger &amp; Day Book Registers (300 Pages Index)</text>
    <text x="60" y="194" font-family="'Arial', sans-serif" font-size="10" fill="#71717a">Full Leather Binding</text>
    <text x="370" y="184" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">4820</text>
    <text x="445" y="184" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">6</text>
    <text x="525" y="184" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">210.00</text>
    <text x="610" y="184" font-family="'Arial', sans-serif" font-size="11" fill="#18181b" text-anchor="middle">18%</text>
    <text x="715" y="184" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#18181b" text-anchor="end">1,260.00</text>

    <!-- Faint handwritten pen notes on the chit -->
    <g transform="rotate(-3, 160, 240)" opacity="0.88">
      <text x="70" y="240" font-family="'Brush Script MT', 'Comic Sans MS', cursive" font-size="15" fill="#1d4ed8" font-weight="bold">
        * Urgent delivery requested for Nariman Pt. audit desk
      </text>
      <text x="70" y="260" font-family="'Brush Script MT', 'Comic Sans MS', cursive" font-size="14" fill="#1d4ed8">
        Recvd Advance ₹ 5,000/- via GPay / UPI ref: 5821940
      </text>
    </g>
  </g>

  <!-- Summary Table Footer -->
  <g transform="translate(35, 623)">
    <rect x="0" y="0" width="730" height="150" fill="#ffffff" stroke="#262626" stroke-width="1.5"/>
    <line x1="480" y1="0" x2="480" y2="150" stroke="#262626" stroke-width="1"/>

    <!-- Left Box: Bank Details & In Words -->
    <g transform="translate(15, 15)">
      <text x="0" y="12" font-family="'Arial', sans-serif" font-size="10" font-weight="bold" fill="#18181b">BANK PAYMENT DETAILS:</text>
      <text x="0" y="30" font-family="'Arial', sans-serif" font-size="10" fill="#3f3f46">Bank: State Bank of India | Branch: Fort, Mumbai</text>
      <text x="0" y="46" font-family="'Arial', sans-serif" font-size="10" fill="#3f3f46">A/c No: 33948210982 | IFSC: SBIN0000300</text>
      <text x="0" y="62" font-family="'Arial', sans-serif" font-size="10" fill="#3f3f46">UPI ID: apexstationers@okhdfcbank</text>
      
      <line x1="0" y1="74" x2="450" y2="74" stroke="#e5e7eb" stroke-width="1"/>
      <text x="0" y="92" font-family="'Arial', sans-serif" font-size="10" font-weight="bold" fill="#18181b">AMOUNT IN WORDS:</text>
      <text x="0" y="110" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#0f766e">Sixteen Thousand Eight Hundred Ninety-Seven Rupees Only</text>
    </g>

    <!-- Right Box: Totals Breakdown -->
    <g transform="translate(490, 15)">
      <text x="0" y="14" font-family="'Arial', sans-serif" font-size="11" fill="#52525b">Taxable Subtotal:</text>
      <text x="225" y="14" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#18181b" text-anchor="end">₹ 14,360.00</text>

      <text x="0" y="34" font-family="'Arial', sans-serif" font-size="11" fill="#52525b">CGST (9.0%):</text>
      <text x="225" y="34" font-family="'Arial', sans-serif" font-size="11" font-weight="600" fill="#18181b" text-anchor="end">₹ 1,292.40</text>

      <text x="0" y="54" font-family="'Arial', sans-serif" font-size="11" fill="#52525b">SGST (9.0%):</text>
      <text x="225" y="54" font-family="'Arial', sans-serif" font-size="11" font-weight="600" fill="#18181b" text-anchor="end">₹ 1,292.40</text>

      <text x="0" y="74" font-family="'Arial', sans-serif" font-size="11" fill="#52525b">Round Off:</text>
      <text x="225" y="74" font-family="'Arial', sans-serif" font-size="11" font-weight="600" fill="#18181b" text-anchor="end">- ₹ 0.80</text>

      <line x1="-10" y1="88" x2="240" y2="88" stroke="#262626" stroke-width="1.5"/>

      <rect x="-5" y="94" width="240" height="32" fill="#18181b" rx="3"/>
      <text x="10" y="115" font-family="'Arial', sans-serif" font-size="12" font-weight="bold" fill="#ffffff">GRAND TOTAL:</text>
      <text x="225" y="115" font-family="'Arial', sans-serif" font-size="14" font-weight="900" fill="#34d399" text-anchor="end">₹ 16,897.00</text>
    </g>
  </g>

  <!-- Signatures & Stamps Footer -->
  <g transform="translate(50, 800)">
    <!-- Terms -->
    <text x="0" y="18" font-family="'Arial', sans-serif" font-size="9" font-weight="bold" fill="#71717a">TERMS &amp; CONDITIONS:</text>
    <text x="0" y="32" font-family="'Arial', sans-serif" font-size="8.5" fill="#a1a1aa">1. Goods once sold will not be taken back or exchanged.</text>
    <text x="0" y="46" font-family="'Arial', sans-serif" font-size="8.5" fill="#a1a1aa">2. Interest @ 18% p.a. will be charged if bill is not paid on due date.</text>
    <text x="0" y="60" font-family="'Arial', sans-serif" font-size="8.5" fill="#a1a1aa">3. Subject to Mumbai Jurisdiction only.</text>

    <!-- Stamp: Red Round Paid / Verified Stamp -->
    <g transform="translate(340, 50) rotate(-12)" opacity="0.82">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="8 3"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#dc2626" stroke-width="1.5"/>
      <path id="stampCurve" d="M 18,50 A 32,32 0 0,1 82,50" fill="none"/>
      <text font-family="'Arial', sans-serif" font-size="8" font-weight="bold" fill="#dc2626" text-anchor="middle">
        <textPath href="#stampCurve" startOffset="50%">APEX STATIONERS * MUMBAI</textPath>
      </text>
      <text x="50" y="46" font-family="'Arial', sans-serif" font-size="11" font-weight="900" fill="#dc2626" text-anchor="middle">VERIFIED</text>
      <text x="50" y="60" font-family="'Arial', sans-serif" font-size="10" font-weight="bold" fill="#dc2626" text-anchor="middle">&amp; PASSED</text>
      <text x="50" y="74" font-family="'Arial', sans-serif" font-size="7.5" fill="#dc2626" text-anchor="middle">28-08-2025</text>
    </g>

    <!-- Authorized Signatory -->
    <g transform="translate(520, 40)">
      <text x="90" y="0" font-family="'Arial', sans-serif" font-size="11" font-weight="bold" fill="#18181b" text-anchor="middle">For APEX STATIONERS</text>
      
      <!-- Cursive Signature Path -->
      <path d="M 20,40 Q 40,15 65,38 T 110,25 T 150,45" fill="none" stroke="#1e3a8a" stroke-width="2" stroke-linecap="round"/>
      <path d="M 40,30 L 140,30" fill="none" stroke="#1e3a8a" stroke-width="1.5" stroke-linecap="round"/>
      
      <line x1="10" y1="58" x2="170" y2="58" stroke="#71717a" stroke-width="1"/>
      <text x="90" y="72" font-family="'Arial', sans-serif" font-size="10" fill="#71717a" text-anchor="middle">Authorised Signatory</text>
    </g>
  </g>

  <!-- Bottom Security Barcode & OCR Stamp -->
  <g transform="translate(50, 1020)">
    <line x1="0" y1="0" x2="700" y2="0" stroke="#e5e7eb" stroke-width="1"/>
    <!-- Simulated barcode lines -->
    <g transform="translate(10, 10)">
      <rect x="0" y="0" width="2" height="24" fill="#18181b"/>
      <rect x="4" y="0" width="4" height="24" fill="#18181b"/>
      <rect x="11" y="0" width="1" height="24" fill="#18181b"/>
      <rect x="14" y="0" width="3" height="24" fill="#18181b"/>
      <rect x="20" y="0" width="2" height="24" fill="#18181b"/>
      <rect x="24" y="0" width="5" height="24" fill="#18181b"/>
      <rect x="32" y="0" width="2" height="24" fill="#18181b"/>
      <rect x="36" y="0" width="1" height="24" fill="#18181b"/>
      <rect x="40" y="0" width="4" height="24" fill="#18181b"/>
      <rect x="47" y="0" width="2" height="24" fill="#18181b"/>
      <rect x="52" y="0" width="3" height="24" fill="#18181b"/>
      <rect x="58" y="0" width="1" height="24" fill="#18181b"/>
      <rect x="62" y="0" width="4" height="24" fill="#18181b"/>
      <rect x="68" y="0" width="2" height="24" fill="#18181b"/>
      <rect x="73" y="0" width="5" height="24" fill="#18181b"/>
      <rect x="81" y="0" width="2" height="24" fill="#18181b"/>
      <rect x="86" y="0" width="3" height="24" fill="#18181b"/>
      <rect x="92" y="0" width="1" height="24" fill="#18181b"/>
      <rect x="96" y="0" width="4" height="24" fill="#18181b"/>
      <text x="50" y="38" font-family="'Courier New', monospace" font-size="9" fill="#71717a" text-anchor="middle">HW-REC-9042-27AALCA</text>
    </g>

    <text x="690" y="24" font-family="'Arial', sans-serif" font-size="9" fill="#9ca3af" text-anchor="end">
      CAOMS OCR Engine Document Transcript · 100% Extraction Verified
    </text>
  </g>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getCorporateSampleInvoiceSvg(): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1120" width="800" height="1120" style="background:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">
  <rect width="800" height="1120" fill="#ffffff"/>
  <rect x="25" y="25" width="750" height="1070" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" rx="6"/>
  
  <!-- Header Bar -->
  <rect x="25" y="25" width="750" height="110" fill="#1e293b" rx="6"/>
  <g transform="translate(50, 50)">
    <text x="0" y="32" font-size="24" font-weight="900" fill="#ffffff" letter-spacing="1">HEXAWARE TECHNOLOGIES PVT LTD</text>
    <text x="0" y="54" font-size="11" fill="#94a3b8">Cloud Infrastructure, ERP Advisory &amp; Enterprise IT Services</text>
    <text x="0" y="70" font-size="11" fill="#cbd5e1">B-Wing, Mindspace IT Park, Airoli, Navi Mumbai, MH – 400708</text>
    <text x="700" y="32" font-size="20" font-weight="800" fill="#38bdf8" text-anchor="end">TAX INVOICE</text>
    <text x="700" y="52" font-size="11" fill="#94a3b8" text-anchor="end">ORIGINAL FOR RECIPIENT</text>
  </g>

  <!-- GST & Meta Grid -->
  <g transform="translate(50, 155)">
    <!-- Vendor Box -->
    <rect x="0" y="0" width="340" height="110" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" rx="4"/>
    <text x="14" y="22" font-size="10" font-weight="bold" fill="#64748b" letter-spacing="0.5">SUPPLIER / VENDOR DETAILS:</text>
    <text x="14" y="42" font-size="12" font-weight="bold" fill="#0f172a">Hexaware Technologies Pvt Ltd</text>
    <text x="14" y="60" font-size="11" fill="#334155">GSTIN: <tspan font-weight="bold" fill="#0369a1">27AABCH1942K1ZU</tspan></text>
    <text x="14" y="78" font-size="11" fill="#334155">PAN: AABCH1942K  |  State: 27-Maharashtra</text>
    <text x="14" y="96" font-size="11" fill="#64748b">Email: billing@hexaware-corp.in</text>

    <!-- Invoice Meta Box -->
    <rect x="360" y="0" width="340" height="110" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" rx="4"/>
    <text x="374" y="22" font-size="10" font-weight="bold" fill="#64748b" letter-spacing="0.5">INVOICE SPECIFICATIONS:</text>
    <text x="374" y="44" font-size="11" fill="#64748b">Invoice Number:</text>
    <text x="490" y="44" font-size="12" font-weight="bold" fill="#0284c7">INV-2025-0891</text>
    <text x="374" y="66" font-size="11" fill="#64748b">Invoice Date:</text>
    <text x="490" y="66" font-size="11" font-weight="bold" fill="#0f172a">14-Aug-2025</text>
    <text x="374" y="86" font-size="11" fill="#64748b">Due Date:</text>
    <text x="490" y="86" font-size="11" font-weight="bold" fill="#0f172a">29-Aug-2025 (Net 15)</text>
    <text x="374" y="104" font-size="11" fill="#64748b">Place of Supply:</text>
    <text x="490" y="104" font-size="11" font-weight="bold" fill="#0f172a">27-Maharashtra</text>
  </g>

  <!-- Bill To Client Grid -->
  <g transform="translate(50, 280)">
    <rect x="0" y="0" width="700" height="70" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1" rx="4"/>
    <text x="14" y="20" font-size="10" font-weight="bold" fill="#475569" letter-spacing="0.5">BILLED TO (CUSTOMER):</text>
    <text x="14" y="40" font-size="13" font-weight="bold" fill="#0f172a">M/s. AARAV ADVISORS LLP</text>
    <text x="14" y="58" font-size="11" fill="#334155">#102, SVS Majestic, Kukatpally, Hyderabad, Telangana – 500072</text>
    <text x="450" y="40" font-size="11" fill="#334155">GSTIN: <tspan font-weight="bold" fill="#0284c7">36AABCA0142K1ZU</tspan></text>
    <text x="450" y="58" font-size="11" fill="#334155">State Code: 36 (Telangana) | Supply: Inter-State</text>
  </g>

  <!-- Items Table Header -->
  <g transform="translate(50, 365)">
    <rect x="0" y="0" width="700" height="30" fill="#0f172a" rx="4"/>
    <text x="25" y="20" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">#</text>
    <text x="60" y="20" font-size="10" font-weight="bold" fill="#ffffff">DESCRIPTION OF SERVICES</text>
    <text x="350" y="20" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">HSN/SAC</text>
    <text x="420" y="20" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">QTY</text>
    <text x="490" y="20" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">RATE (₹)</text>
    <text x="580" y="20" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">GST %</text>
    <text x="685" y="20" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="end">TOTAL (₹)</text>

    <!-- Table Rows -->
    <g transform="translate(0, 30)">
      <rect x="0" y="0" width="700" height="210" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
      
      <!-- Row 1 -->
      <text x="25" y="32" font-size="11" fill="#64748b" text-anchor="middle">1</text>
      <text x="60" y="26" font-size="11" font-weight="bold" fill="#0f172a">Enterprise Cloud Hosting &amp; Dedicated Infrastructure</text>
      <text x="60" y="42" font-size="10" fill="#64748b">High-availability redundant cluster (August 2025 cycle)</text>
      <text x="350" y="32" font-size="11" fill="#334155" text-anchor="middle">998315</text>
      <text x="420" y="32" font-size="11" fill="#334155" text-anchor="middle">1 Month</text>
      <text x="490" y="32" font-size="11" fill="#334155" text-anchor="middle">45,000.00</text>
      <text x="580" y="32" font-size="11" fill="#334155" text-anchor="middle">18% IGST</text>
      <text x="685" y="32" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="end">45,000.00</text>
      <line x1="0" y1="55" x2="700" y2="55" stroke="#f1f5f9" stroke-width="1"/>

      <!-- Row 2 -->
      <text x="25" y="85" font-size="11" fill="#64748b" text-anchor="middle">2</text>
      <text x="60" y="79" font-size="11" font-weight="bold" fill="#0f172a">Automated Backup Vault &amp; Disaster Recovery SLA</text>
      <text x="60" y="95" font-size="10" fill="#64748b">Daily snapshots, geo-replicated hot standby storage</text>
      <text x="350" y="85" font-size="11" fill="#334155" text-anchor="middle">998316</text>
      <text x="420" y="85" font-size="11" fill="#334155" text-anchor="middle">1</text>
      <text x="490" y="85" font-size="11" fill="#334155" text-anchor="middle">15,000.00</text>
      <text x="580" y="85" font-size="11" fill="#334155" text-anchor="middle">18% IGST</text>
      <text x="685" y="85" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="end">15,000.00</text>
      <line x1="0" y1="110" x2="700" y2="110" stroke="#f1f5f9" stroke-width="1"/>

      <!-- Row 3 -->
      <text x="25" y="140" font-size="11" fill="#64748b" text-anchor="middle">3</text>
      <text x="60" y="134" font-size="11" font-weight="bold" fill="#0f172a">SOC2 Type II Annual Security &amp; Compliance Audit Report</text>
      <text x="60" y="150" font-size="10" fill="#64748b">Verified auditor attestation package for statutory CA compliance</text>
      <text x="350" y="140" font-size="11" fill="#334155" text-anchor="middle">998221</text>
      <text x="420" y="140" font-size="11" fill="#334155" text-anchor="middle">1</text>
      <text x="490" y="140" font-size="11" fill="#334155" text-anchor="middle">25,000.00</text>
      <text x="580" y="140" font-size="11" fill="#334155" text-anchor="middle">18% IGST</text>
      <text x="685" y="140" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="end">25,000.00</text>
    </g>
  </g>

  <!-- Statutory Calculation & Bank Box -->
  <g transform="translate(50, 620)">
    <!-- Left Box: Banking & Wire Info -->
    <rect x="0" y="0" width="380" height="175" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" rx="4"/>
    <text x="14" y="24" font-size="10" font-weight="bold" fill="#475569">REMITTANCE / BANK COORDINATES:</text>
    <text x="14" y="48" font-size="11" fill="#334155">Bank Name: <tspan font-weight="bold" fill="#0f172a">HDFC Bank Ltd</tspan></text>
    <text x="14" y="68" font-size="11" fill="#334155">Account Number: <tspan font-weight="bold" fill="#0f172a">50200084920194</tspan> (Current A/c)</text>
    <text x="14" y="88" font-size="11" fill="#334155">IFSC Code: <tspan font-weight="bold" fill="#0284c7">HDFC0000128</tspan> | Branch: Airoli Mindspace</text>
    <text x="14" y="108" font-size="11" fill="#334155">PAN: <tspan font-weight="bold">AABCH1942K</tspan> | MSME Reg: UDYAM-MH-12-004921</text>
    <line x1="14" y1="122" x2="366" y2="122" stroke="#cbd5e1" stroke-width="1"/>
    <text x="14" y="142" font-size="10" font-weight="bold" fill="#64748b">AMOUNT IN WORDS:</text>
    <text x="14" y="160" font-size="11" font-weight="bold" fill="#0369a1">One Lakh Three Hundred Rupees Only</text>

    <!-- Right Box: Taxes & Totals -->
    <rect x="400" y="0" width="300" height="175" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" rx="4"/>
    <g transform="translate(414, 0)">
      <text x="0" y="28" font-size="11" fill="#64748b">Subtotal (Taxable Value):</text>
      <text x="270" y="28" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="end">₹ 85,000.00</text>

      <text x="0" y="52" font-size="11" fill="#64748b">CGST @ 0% (Inter-State):</text>
      <text x="270" y="52" font-size="11" fill="#64748b" text-anchor="end">₹ 0.00</text>

      <text x="0" y="74" font-size="11" fill="#64748b">SGST @ 0% (Inter-State):</text>
      <text x="270" y="74" font-size="11" fill="#64748b" text-anchor="end">₹ 0.00</text>

      <text x="0" y="96" font-size="11" fill="#64748b">IGST @ 18%:</text>
      <text x="270" y="96" font-size="11" font-weight="bold" fill="#0284c7" text-anchor="end">₹ 15,300.00</text>

      <line x1="0" y1="112" x2="270" y2="112" stroke="#e2e8f0" stroke-width="1.5"/>

      <rect x="-6" y="122" width="282" height="42" fill="#0f172a" rx="4"/>
      <text x="6" y="148" font-size="12" font-weight="bold" fill="#ffffff">GRAND TOTAL (INR):</text>
      <text x="264" y="148" font-size="14" font-weight="900" fill="#38bdf8" text-anchor="end">₹ 1,00,300.00</text>
    </g>
  </g>

  <!-- Authorised Stamp & Signatory -->
  <g transform="translate(50, 815)">
    <!-- Verified Official Stamp -->
    <g transform="translate(80, 40) rotate(-6)">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="6,2"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#dc2626" stroke-width="1.2"/>
      <text x="50" y="38" font-size="7.5" font-weight="bold" fill="#dc2626" text-anchor="middle">HEXAWARE TECH PVT LTD</text>
      <text x="50" y="52" font-size="10" font-weight="900" fill="#dc2626" text-anchor="middle">VERIFIED</text>
      <text x="50" y="66" font-size="8" font-weight="bold" fill="#dc2626" text-anchor="middle">AUDIT COMPLIANT</text>
    </g>

    <!-- Signatory box -->
    <g transform="translate(480, 20)">
      <text x="100" y="20" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">For HEXAWARE TECHNOLOGIES PVT LTD</text>
      <!-- Simulated signature -->
      <path d="M 30,50 Q 55,20 85,50 T 140,35 T 170,55" fill="none" stroke="#0369a1" stroke-width="2" stroke-linecap="round"/>
      <line x1="20" y1="68" x2="180" y2="68" stroke="#94a3b8" stroke-width="1"/>
      <text x="100" y="82" font-size="10" fill="#64748b" text-anchor="middle">Authorised Finance Signatory</text>
    </g>
  </g>

  <!-- Footer security code -->
  <g transform="translate(50, 1040)">
    <line x1="0" y1="0" x2="700" y2="0" stroke="#e2e8f0" stroke-width="1"/>
    <text x="0" y="20" font-size="9" fill="#94a3b8">Document SHA256: 7f89a81c4e098df241... · System Generated GST e-Invoice under Rule 48(4)</text>
    <text x="700" y="20" font-size="9" fill="#94a3b8" text-anchor="end">IRN: 29810f948... (QR Grounded)</text>
  </g>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

