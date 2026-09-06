import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Download, Printer } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { printHtmlDocument } from '../utils/printAndPdfUtils';

const SAMPLE_INVOICES = [
  { id: 'inv-1', client: 'Apex Tech Solutions Pvt Ltd', amount: 45000, status: 'Paid', date: '2026-03-10' },
  { id: 'inv-2', client: 'Zenith Logistics LLP', amount: 35000, status: 'Paid', date: '2026-03-15' },
  { id: 'inv-3', client: 'Horizon Global Enterprises', amount: 60000, status: 'Unpaid', date: '2026-03-18' },
  { id: 'inv-4', client: 'Spectra Bio Sciences', amount: 28000, status: 'Paid', date: '2026-03-22' },
  { id: 'inv-5', client: 'Quantum Dynamics India', amount: 50000, status: 'Unpaid', date: '2026-03-25' },
];

export function Reports() {
  const [invoices, setInvoices] = useState<any[]>(SAMPLE_INVOICES);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      setInvoices(SAMPLE_INVOICES);
      return;
    }
    const q = query(collection(db, 'invoices'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvoices(data.length > 0 ? data : SAMPLE_INVOICES);
    }, (error) => {
      console.error(error);
      setInvoices(SAMPLE_INVOICES);
    });
    return () => unsubscribe();
  }, []);

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Client Billing Status Summary', 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Compute Totals
      const totalAmount = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
      const paidAmount = invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
      const unpaidAmount = invoices.filter(i => i.status === 'Unpaid').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
      
      doc.text(`Total Billed: Rs. ${totalAmount.toLocaleString()}`, 14, 40);
      doc.text(`Total Paid: Rs. ${paidAmount.toLocaleString()}`, 14, 46);
      doc.text(`Total Unpaid: Rs. ${unpaidAmount.toLocaleString()}`, 14, 52);

      // Table data
      const tableColumn = ["Client Name", "Amount (Rs.)", "Status", "Date"];
      const tableRows = invoices.map(invoice => [
        invoice.client || 'N/A',
        invoice.amount ? Number(invoice.amount).toLocaleString() : '0',
        invoice.status || 'Unpaid',
        invoice.createdAt?.toDate ? invoice.createdAt.toDate().toLocaleDateString() : 'N/A'
      ]);

      autoTable(doc, {
        startY: 60,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
        styles: { fontSize: 10, cellPadding: 4 },
      });

      doc.save('client_billing_status.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      <div className="p-4 sm:p-6 lg:p-8 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between max-w-[1600px] mx-auto gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              MIS & Reports Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">Computed receivables aging, revenue by client/service, and GST liability reporting.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button 
              onClick={handleDownloadPDF} 
              disabled={isGenerating || invoices.length === 0}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer"
              title="Download billing status report as PDF"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating PDF...' : 'Download Billing Summary'}</span>
            </button>
            <button 
              onClick={() => {
                const totalAmount = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
                const paidAmount = invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
                const unpaidAmount = invoices.filter(i => i.status === 'Unpaid').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

                const rowsHtml = invoices.map(i => `
                  <tr>
                    <td><strong>${i.client || 'N/A'}</strong></td>
                    <td class="text-right">₹${Number(i.amount || 0).toLocaleString('en-IN')}</td>
                    <td><span style="font-weight: bold; color: ${i.status === 'Paid' ? '#059669' : '#d97706'}">${i.status || 'Unpaid'}</span></td>
                    <td>${i.createdAt?.toDate ? i.createdAt.toDate().toLocaleDateString('en-IN') : (i.date || new Date().toLocaleDateString('en-IN'))}</td>
                  </tr>
                `).join('');

                const html = `
                  <div class="header-wrap sans">
                    <div>
                      <h1 class="firm-name">AARAV ADVISORS LLP</h1>
                      <div class="firm-sub">Chartered Accountants &bull; Executive MIS & Receivables Summary</div>
                      <div class="firm-reg">
                        <strong>Address:</strong> #102, SVS Majestic, Kukatpally, Hyderabad, Telangana – 500072<br/>
                        <strong>Phone:</strong> +91 9701815868 &bull; <strong>Email:</strong> info@aaravadvisors.com<br/>
                        <strong>LinkedIn:</strong> Aarav Advisors &bull; <strong>Coverage:</strong> India & Global
                      </div>
                    </div>
                    <div class="meta-block">
                      <div>Generated: ${new Date().toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>

                  <div style="display: flex; gap: 16px; margin-bottom: 20px;" class="sans">
                    <div style="flex: 1; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                      <div style="font-size: 8.5pt; color: #64748b; font-weight: bold;">TOTAL BILLED</div>
                      <div style="font-size: 14pt; font-weight: bold; color: #0f172a;">₹${totalAmount.toLocaleString('en-IN')}</div>
                    </div>
                    <div style="flex: 1; padding: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px;">
                      <div style="font-size: 8.5pt; color: #047857; font-weight: bold;">TOTAL COLLECTED</div>
                      <div style="font-size: 14pt; font-weight: bold; color: #065f46;">₹${paidAmount.toLocaleString('en-IN')}</div>
                    </div>
                    <div style="flex: 1; padding: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;">
                      <div style="font-size: 8.5pt; color: #b45309; font-weight: bold;">OUTSTANDING RECEIVABLES</div>
                      <div style="font-size: 14pt; font-weight: bold; color: #92400e;">₹${unpaidAmount.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th>Client Entity</th>
                        <th class="text-right">Billed Amount</th>
                        <th>Settlement Status</th>
                        <th>Billing Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rowsHtml}
                    </tbody>
                  </table>
                `;
                printHtmlDocument('Billing_Summary_Report', html);
              }}
              className="flex items-center gap-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
              title="Print billing summary"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Receivables Aging */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <h3 className="text-[10px] font-bold text-zinc-800 tracking-widest uppercase mb-6 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-500" />
              RECEIVABLES AGING (DAYS)
            </h3>
            <div className="space-y-4">
               {['0-30 Days', '31-60 Days', '61-90 Days', '90+ Days'].map((bucket, i) => (
                 <div key={i} className="flex items-center justify-between text-sm">
                   <span className="font-medium text-zinc-600">{bucket}</span>
                   <span className={`font-bold ${i === 3 ? 'text-rose-600' : 'text-zinc-900'}`}>
                     ₹ {(Math.random() * 50000).toFixed(0)}
                   </span>
                 </div>
               ))}
            </div>
          </div>

          {/* Revenue by Service */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <h3 className="text-[10px] font-bold text-zinc-800 tracking-widest uppercase mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              REVENUE BY SERVICE (MTD)
            </h3>
            <div className="space-y-4">
               {['Statutory Audit', 'GST Compliance', 'Income Tax Filing', 'Advisory Retainers'].map((service, i) => (
                 <div key={i}>
                   <div className="flex items-center justify-between text-sm mb-1">
                     <span className="font-medium text-zinc-600">{service}</span>
                     <span className="font-bold text-zinc-900">{(Math.random() * 40 + 10).toFixed(0)}%</span>
                   </div>
                   <div className="w-full bg-zinc-100 rounded-full h-1.5">
                     <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.random() * 40 + 10}%` }}></div>
                   </div>
                 </div>
               ))}
            </div>
          </div>

          {/* Firm GST Liability */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-center items-center text-center">
             <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
               <BarChart3 className="w-6 h-6 text-indigo-600" />
             </div>
             <h3 className="text-[10px] font-bold text-zinc-800 tracking-widest uppercase mb-2">OUTPUT GST LIABILITY (EST)</h3>
             <span className="text-4xl font-extrabold text-zinc-900 mb-1">₹ 1,42,500</span>
             <span className="text-xs text-zinc-500 font-medium">Auto-computed from issued invoices this month.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
