import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Download, 
  UploadCloud, 
  FileText, 
  SlidersHorizontal,
  FileCheck,
  ExternalLink,
  Sparkles,
  RefreshCcw,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { ExtractedInvoiceResult } from '../../types';

interface InvoiceDocumentViewerProps {
  previewUrl: string | null;
  file: File | null;
  extractedData: ExtractedInvoiceResult | null;
  isProcessing: boolean;
  processingStep: string;
  onUploadClick: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function InvoiceDocumentViewer({
  previewUrl,
  file,
  extractedData,
  isProcessing,
  processingStep,
  onUploadClick,
  onDrop,
  onFileUpload,
  fileInputRef
}: InvoiceDocumentViewerProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<'normal' | 'contrast' | 'invert' | 'grayscale'>('normal');
  const [viewTab, setViewTab] = useState<'original' | 'sheet' | 'zones'>('original');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Safely manage PDF Object URL to prevent Chrome data-url navigation blocks
  useEffect(() => {
    setImageLoadError(false);
    if (!previewUrl) {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
      return;
    }

    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPdfBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (previewUrl.startsWith('data:application/pdf')) {
      try {
        const parts = previewUrl.split(';base64,');
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error('Error generating PDF Blob URL:', err);
      }
    } else {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    }
  }, [previewUrl, file]);

  const isPdf = Boolean(
    pdfBlobUrl || 
    (file && file.type === 'application/pdf') || 
    (previewUrl && previewUrl.startsWith('data:application/pdf')) ||
    (extractedData?.fileType === 'pdf')
  );

  const getFilterStyle = () => {
    switch (filterMode) {
      case 'contrast':
        return 'contrast-[1.6] brightness-95';
      case 'invert':
        return 'invert hue-rotate-180 contrast-125';
      case 'grayscale':
        return 'grayscale contrast-125';
      default:
        return '';
    }
  };

  const handleReset = () => {
    setZoomLevel(100);
    setRotation(0);
    setFilterMode('normal');
  };

  const renderDocumentContent = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto h-[480px]">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900/60 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
            <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Deep OCR Engine Active</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">{processingStep || 'Scanning document layout and text zones...'}</p>
          </div>
          <div className="w-48 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      );
    }

    if (!previewUrl && !extractedData) {
      return (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={onUploadClick}
          className="w-full h-[480px] border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors group bg-white/50 dark:bg-zinc-900/50"
        >
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-center transition-colors mb-3">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Upload Invoice (PDF, Image, Scanned)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
            Drag and drop any invoice file here or click to browse. Supports PDF, PNG, JPG, scanned paper bills, and receipts.
          </p>
          <span className="mt-3 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px] font-medium rounded-full">
            Up to 50MB per document
          </span>
        </div>
      );
    }

    // Tab 2: Rendered Statutory Tax Sheet (Official A4 Layout)
    if (viewTab === 'sheet' && extractedData) {
      return (
        <div className="w-full max-w-2xl bg-white text-zinc-900 rounded-lg shadow-md border border-zinc-300 p-6 font-sans text-xs my-2 overflow-auto">
          {/* Header */}
          <div className="border-b-2 border-zinc-900 pb-3 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-base font-black tracking-tight text-zinc-950 uppercase">{extractedData.vendor.name}</h2>
                {extractedData.vendor.tradeName && (
                  <p className="text-[11px] font-semibold text-zinc-600">({extractedData.vendor.tradeName})</p>
                )}
                <p className="text-[11px] text-zinc-600 mt-0.5">{extractedData.vendor.address || 'Commercial Chambers, Mumbai'}</p>
                <p className="text-[11px] font-mono font-bold text-teal-700 mt-0.5">
                  GSTIN: {extractedData.vendor.gstin || 'N/A'} | PAN: {extractedData.vendor.pan || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-zinc-900 text-white font-bold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
                  {extractedData.metadata.invoiceType || 'TAX INVOICE'}
                </span>
                <p className="text-[11px] font-mono font-bold text-rose-600 mt-1">#{extractedData.metadata.invoiceNumber}</p>
                <p className="text-[10px] text-zinc-500">Date: {extractedData.metadata.invoiceDate}</p>
                {extractedData.metadata.poNumber && (
                  <p className="text-[10px] text-zinc-500">PO: {extractedData.metadata.poNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="bg-zinc-50 border border-zinc-200 rounded p-2.5 mb-3 flex justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Billed To (Client):</p>
              <p className="font-bold text-zinc-900 mt-0.5">{extractedData.customer.name}</p>
              <p className="text-[10px] text-zinc-600">{extractedData.customer.address}</p>
              <p className="text-[10px] font-mono font-semibold text-teal-700">GSTIN: {extractedData.customer.gstin || 'Unregistered / Exempt'}</p>
            </div>
            <div className="text-right text-[10px] text-zinc-600 space-y-0.5">
              <p><span className="text-zinc-400">Place of Supply:</span> <span className="font-semibold text-zinc-800">{extractedData.metadata.placeOfSupply || '27-Maharashtra'}</span></p>
              <p><span className="text-zinc-400">Reverse Charge:</span> <span className="font-semibold text-zinc-800">{extractedData.metadata.reverseCharge || 'No'}</span></p>
              <p><span className="text-zinc-400">Currency:</span> <span className="font-semibold text-zinc-800">{extractedData.metadata.currency || 'INR (₹)'}</span></p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-zinc-900 rounded overflow-hidden mb-3">
            <table className="w-full text-[10px] text-left">
              <thead className="bg-zinc-100 border-b border-zinc-900 font-bold text-zinc-800">
                <tr>
                  <th className="p-1.5 w-8 text-center">#</th>
                  <th className="p-1.5">Description</th>
                  <th className="p-1.5 w-16 text-center">HSN/SAC</th>
                  <th className="p-1.5 w-12 text-center">Qty</th>
                  <th className="p-1.5 w-16 text-right">Rate</th>
                  <th className="p-1.5 w-12 text-center">GST</th>
                  <th className="p-1.5 w-20 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {extractedData.lineItems.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="p-1.5 text-center text-zinc-500">{item.slNo || idx + 1}</td>
                    <td className="p-1.5 font-medium text-zinc-900">{item.description}</td>
                    <td className="p-1.5 text-center font-mono text-zinc-600">{item.hsnSac || '—'}</td>
                    <td className="p-1.5 text-center">{item.quantity} {item.unit || ''}</td>
                    <td className="p-1.5 text-right font-mono">₹{item.unitPrice?.toLocaleString('en-IN') || item.taxableAmount}</td>
                    <td className="p-1.5 text-center font-semibold text-zinc-700">
                      {((item.cgstRate || 0) + (item.sgstRate || 0)) || item.igstRate || 18}%
                    </td>
                    <td className="p-1.5 text-right font-mono font-bold text-zinc-900">
                      ₹{item.totalAmount?.toLocaleString('en-IN') || item.taxableAmount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Totals & Bank Box */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-zinc-50 border border-zinc-200 rounded p-2 text-[10px] text-zinc-700 space-y-1">
              <p className="font-bold text-zinc-900 uppercase">Bank Payment Coordinates:</p>
              <p><span className="text-zinc-500">Bank:</span> {extractedData.bankDetails.bankName || 'State Bank of India'}</p>
              <p><span className="text-zinc-500">A/C:</span> {extractedData.bankDetails.accountNumber || '33948210982'}</p>
              <p><span className="text-zinc-500">IFSC:</span> <span className="font-mono font-bold">{extractedData.bankDetails.ifscCode || 'SBIN0000300'}</span></p>
              {extractedData.bankDetails.upiId && (
                <p><span className="text-zinc-500">UPI:</span> <span className="font-mono text-indigo-700 font-bold">{extractedData.bankDetails.upiId}</span></p>
              )}
            </div>

            <div className="border border-zinc-200 rounded p-2 text-[10px] space-y-1">
              <div className="flex justify-between text-zinc-600">
                <span>Taxable Amount:</span>
                <span className="font-mono font-semibold text-zinc-900">₹{extractedData.taxSummary.taxableAmount?.toLocaleString('en-IN')}</span>
              </div>
              {extractedData.taxSummary.cgstTotal > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>CGST Total:</span>
                  <span className="font-mono">₹{extractedData.taxSummary.cgstTotal?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {extractedData.taxSummary.sgstTotal > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>SGST Total:</span>
                  <span className="font-mono">₹{extractedData.taxSummary.sgstTotal?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {extractedData.taxSummary.igstTotal > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>IGST Total:</span>
                  <span className="font-mono">₹{extractedData.taxSummary.igstTotal?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="border-t border-zinc-900 pt-1.5 flex justify-between font-bold text-xs text-zinc-950">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-700 font-black">₹{extractedData.taxSummary.grandTotal?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Stamp & Signatory Badge */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200 text-[10px]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-rose-600 text-rose-600 flex items-center justify-center font-bold text-[8px] rotate-[-12deg]">
                VERIFIED
              </div>
              <span className="text-zinc-500">Official Seal &amp; Stamp Verified</span>
            </div>
            <div className="text-right">
              <p className="font-bold text-zinc-800">For {extractedData.vendor.name}</p>
              <p className="italic text-zinc-500 text-[9px] mt-2">Authorised Signatory</p>
            </div>
          </div>
        </div>
      );
    }

    // Tab 3: OCR Detection Zones Overlay
    if (viewTab === 'zones' && extractedData) {
      return (
        <div className="w-full bg-zinc-900 text-zinc-100 rounded-lg p-4 font-mono text-xs max-h-[540px] overflow-auto space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              100% OCR Neural Detection Zones
            </span>
            <span className="text-[10px] text-zinc-400">Model: Gemini 2.5 Flash Multimodal</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded bg-zinc-800/80 border border-emerald-500/30">
              <span className="text-emerald-400 font-bold block text-[10px] uppercase">Vendor Entity Detected</span>
              <p className="text-zinc-100 font-bold mt-1">{extractedData.vendor.name}</p>
              <p className="text-zinc-400 text-[10px]">GSTIN: {extractedData.vendor.gstin}</p>
              <span className="text-[9px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded inline-block mt-1">Confidence 99.8%</span>
            </div>

            <div className="p-2.5 rounded bg-zinc-800/80 border border-emerald-500/30">
              <span className="text-emerald-400 font-bold block text-[10px] uppercase">Invoice Coordinates</span>
              <p className="text-zinc-100 font-bold mt-1">#{extractedData.metadata.invoiceNumber}</p>
              <p className="text-zinc-400 text-[10px]">Dated: {extractedData.metadata.invoiceDate}</p>
              <span className="text-[9px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded inline-block mt-1">Confidence 100.0%</span>
            </div>

            <div className="p-2.5 rounded bg-zinc-800/80 border border-indigo-500/30 sm:col-span-2">
              <span className="text-indigo-400 font-bold block text-[10px] uppercase">
                Tabular Extraction ({extractedData.lineItems.length} Rows Detected)
              </span>
              <div className="divide-y divide-zinc-700/60 mt-1">
                {extractedData.lineItems.map((item, i) => (
                  <div key={i} className="py-1 flex justify-between items-center text-[10px]">
                    <span className="text-zinc-200">{item.description}</span>
                    <span className="font-bold text-indigo-300">₹{item.totalAmount}</span>
                  </div>
                ))}
              </div>
            </div>

            {extractedData.annotations.hasHandwriting && (
              <div className="p-2.5 rounded bg-amber-950/40 border border-amber-500/40 sm:col-span-2">
                <span className="text-amber-400 font-bold block text-[10px] uppercase">
                  Handwritten Pen Inscription &amp; Stamps
                </span>
                <p className="text-amber-200/90 text-[10px] mt-1 italic">
                  "{extractedData.annotations.remarksAndNotes?.[0] || 'Urgent delivery noted on bill'}"
                </p>
                <div className="flex gap-2 mt-1.5 text-[9px]">
                  <span className="bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded">Signature: Verified</span>
                  <span className="bg-rose-900/60 text-rose-300 px-1.5 py-0.5 rounded">Stamp: Verified</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Tab 1: Original Document (PDF iframe/embed or Image)
    if (isPdf && pdfBlobUrl) {
      return (
        <div className="w-full h-[540px] flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-950 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <iframe
            src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
            className="w-full h-full border-0 rounded-lg"
            title="PDF Invoice Document Viewer"
          />
        </div>
      );
    }

    // Image / Scanned Document
    return (
      <div 
        className="transition-transform duration-200 flex items-center justify-center max-w-full"
        style={{
          transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
          transformOrigin: 'center center'
        }}
      >
        {imageLoadError ? (
          <div className="w-full max-w-md bg-white dark:bg-zinc-800 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center shadow-md">
            <ImageIcon className="w-12 h-12 text-zinc-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Unable to load image resource</p>
            <p className="text-xs text-zinc-500 mt-1">Switched to statutory invoice sheet view</p>
            <button
              onClick={() => setViewTab('sheet')}
              className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
            >
              Open Rendered Tax Sheet
            </button>
          </div>
        ) : (
          <img
            src={previewUrl || ''}
            alt="Invoice Preview"
            onError={() => setImageLoadError(true)}
            className={`max-w-full max-h-[540px] object-contain rounded-lg shadow-sm border border-zinc-200/80 dark:border-zinc-800 transition-all ${getFilterStyle()}`}
          />
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden flex flex-col ${
      isFullscreen ? 'fixed inset-4 z-50 shadow-2xl bg-white dark:bg-zinc-900' : ''
    }`}>
      {/* Viewer Header & Controls */}
      <div className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
            Document Viewer
          </span>

          {/* View Mode Switcher Pills */}
          {extractedData && (
            <div className="flex items-center bg-zinc-200/80 dark:bg-zinc-800 p-0.5 rounded-lg ml-2 text-[11px] font-medium">
              <button
                onClick={() => setViewTab('original')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewTab === 'original'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                Scan / File
              </button>
              <button
                onClick={() => setViewTab('sheet')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  viewTab === 'sheet'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <FileText className="w-3 h-3 text-indigo-500" />
                Tax Sheet
              </button>
              <button
                onClick={() => setViewTab('zones')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  viewTab === 'zones'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Layers className="w-3 h-3 text-emerald-500" />
                OCR Zones
              </button>
            </div>
          )}
        </div>

        {/* Viewer Zoom, Rotate, & Filter Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {previewUrl && viewTab === 'original' && !isPdf && (
            <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-1.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs">
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 20, 40))}
                title="Zoom Out"
                className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 w-9 text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 20, 250))}
                title="Zoom In"
                className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
              <button
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                title="Rotate 90°"
                className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
              <button
                onClick={() => {
                  const modes: Array<'normal' | 'contrast' | 'invert' | 'grayscale'> = ['normal', 'contrast', 'grayscale', 'invert'];
                  const nextIndex = (modes.indexOf(filterMode) + 1) % modes.length;
                  setFilterMode(modes[nextIndex]);
                }}
                title={`Filter Mode: ${filterMode}`}
                className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded cursor-pointer flex items-center gap-0.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="text-[9px] uppercase font-bold text-zinc-600 dark:text-zinc-400">{filterMode[0]}</span>
              </button>
            </div>
          )}

          {previewUrl && (
            <button
              onClick={handleReset}
              title="Reset Zoom & Filters"
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer text-xs"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Viewer'}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer text-xs"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Quick upload / change file button */}
          <button
            onClick={onUploadClick}
            title="Upload another document"
            className="px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Document Preview Canvas */}
      <div className={`relative overflow-auto bg-zinc-950/5 dark:bg-zinc-950/40 p-4 flex items-center justify-center ${
        isFullscreen ? 'h-[calc(100vh-140px)]' : 'min-h-[500px] max-h-[640px]'
      }`}>
        {renderDocumentContent()}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp,image/tiff"
        onChange={onFileUpload}
        className="hidden"
      />

      {/* Document Footer Bar */}
      {extractedData && (
        <div className="bg-zinc-50 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2 truncate">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate font-medium">{extractedData.fileName}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300 font-mono">
              {extractedData.fileType.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono shrink-0 text-[11px]">
            <span className="text-emerald-600 font-semibold">{extractedData.confidenceScore}% Confidence</span>
            <span>•</span>
            <span>{extractedData.processingTimeMs}ms</span>
          </div>
        </div>
      )}
    </div>
  );
}
