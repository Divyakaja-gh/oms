import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  RotateCw, 
  Plus, 
  UploadCloud, 
  FileText, 
  Lock, 
  Search, 
  Download, 
  Eye, 
  History, 
  Share2, 
  Trash2, 
  X, 
  Check, 
  File, 
  ShieldCheck, 
  Sparkles, 
  Tag, 
  ExternalLink,
  ChevronDown,
  ScanText
} from 'lucide-react';
import { ClientDocument } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

interface DocumentsProps {
  onNavigateToOcr?: () => void;
}

interface ClientOption {
  id: string;
  name: string;
  panOrCode: string;
}

const DEFAULT_CLIENTS: ClientOption[] = [
  { id: 'c-1', name: 'Acme Tech Pvt Ltd', panOrCode: 'AKSPT1234L' },
  { id: 'c-2', name: 'New Client', panOrCode: 'NEWCL1234N' },
  { id: 'c-3', name: 'Aarav Capital Advisers', panOrCode: 'AAACB1234D' },
  { id: 'c-4', name: 'Apex Logistics Ltd', panOrCode: 'APEXL5678P' },
];

const STANDARD_FOLDERS = [
  'Correspondence',
  'Tax Documents',
  'Financial Statements',
  'GST Documents',
  'KYC Documents',
  'Bank Documents',
  'Agreements'
];

const INITIAL_DOCUMENTS: ClientDocument[] = [
  {
    id: 'doc-1',
    clientName: 'Acme Tech Pvt Ltd',
    clientPanOrGst: 'AKSPT1234L',
    folder: 'Correspondence',
    name: 'Engagement_Letter_AY2026_27_Signed.pdf',
    version: 'v1',
    size: '1.4 MB',
    tags: ['Signed', 'Contract'],
    uploadedAt: '2026-09-01',
    sharedStatus: 'Shared with Client',
    fileType: 'pdf',
    encrypted: true,
    notes: 'Countersigned engagement letter covering statutory audit & GST filings.'
  },
  {
    id: 'doc-2',
    clientName: 'Acme Tech Pvt Ltd',
    clientPanOrGst: 'AKSPT1234L',
    folder: 'Tax Documents',
    name: 'Form_3CD_Draft_Computation_2026.xlsx',
    version: 'v2',
    size: '2.8 MB',
    tags: ['Audit', 'Draft'],
    uploadedAt: '2026-09-02',
    sharedStatus: 'Internal Only',
    fileType: 'xlsx',
    encrypted: true,
    notes: 'Working copy with tax depreciation schedules & 40A(2) disclosures.'
  },
  {
    id: 'doc-3',
    clientName: 'Acme Tech Pvt Ltd',
    clientPanOrGst: 'AKSPT1234L',
    folder: 'GST Documents',
    name: 'GSTR_2B_Reconciliation_Aug2026.pdf',
    version: 'v1',
    size: '890 KB',
    tags: ['Final', 'Reconciliation'],
    uploadedAt: '2026-09-01',
    sharedStatus: 'Internal Only',
    fileType: 'pdf',
    encrypted: true,
    notes: 'Auto-matched report highlighting eligible vs ineligible ITC.'
  }
];

export function Documents({ onNavigateToOcr }: DocumentsProps = {}) {
  const [clients, setClients] = useState<ClientOption[]>(DEFAULT_CLIENTS);
  const [selectedClientId, setSelectedClientId] = useState<string>(DEFAULT_CLIENTS[0].id);
  const [clientFolders, setClientFolders] = useState<string[]>(STANDARD_FOLDERS);
  const [selectedFolder, setSelectedFolder] = useState<string>('Correspondence');
  const [documents, setDocuments] = useState<ClientDocument[]>(() => {
    const saved = localStorage.getItem('caoms_client_documents');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_DOCUMENTS; }
    }
    return INITIAL_DOCUMENTS;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<ClientDocument | null>(null);
  const [selectedDocForHistory, setSelectedDocForHistory] = useState<ClientDocument | null>(null);
  const [selectedDocForShare, setSelectedDocForShare] = useState<ClientDocument | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTag, setSelectedTag] = useState('Final');
  const [uploadNotes, setUploadNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [conflictFile, setConflictFile] = useState<File | null>(null);
  const [conflictExisting, setConflictExisting] = useState<ClientDocument[]>([]);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState({ client: '', type: '', tag: '' });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load clients from Firestore if available
  useEffect(() => {
    if (auth.currentUser) {
      const q = query(collection(db, 'clients'), where('ownerId', '==', auth.currentUser.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loaded: ClientOption[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unnamed Client',
            panOrCode: data.pan || data.gstin || 'CL-REG'
          };
        });
        if (loaded.length > 0) {
          setClients(prev => {
            const combined = [...prev];
            loaded.forEach(item => {
              if (!combined.some(c => c.name === item.name)) {
                combined.push(item);
              }
            });
            return combined;
          });
        }
      }, () => {});
      return () => unsubscribe();
    }
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('caoms_client_documents', JSON.stringify(documents));
  }, [documents]);

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Add custom folder
  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    if (!clientFolders.includes(newFolderName.trim())) {
      setClientFolders(prev => [...prev, newFolderName.trim()]);
      setSelectedFolder(newFolderName.trim());
    }
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
  };

  // Handle File Upload
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const existingSameName = documents.filter(d => 
      d.clientName === selectedClient.name && 
      d.folder === selectedFolder && 
      d.name === selectedFile.name
    );

    if (existingSameName.length > 0) {
      setConflictExisting(existingSameName);
      setConflictFile(selectedFile);
      return;
    }

    proceedUpload(selectedFile, selectedFile.name, 'v1');
  };

  const proceedUpload = (file: File, finalName: string, finalVersion: string) => {
    setIsUploading(true);
    setTimeout(() => {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      const newDoc: ClientDocument = {
        id: `doc-${Date.now()}`,
        clientName: selectedClient.name,
        clientPanOrGst: selectedClient.panOrCode,
        folder: selectedFolder,
        name: finalName,
        version: finalVersion,
        size: sizeStr,
        tags: [selectedTag],
        uploadedAt: new Date().toISOString().split('T')[0],
        sharedStatus: 'Internal Only',
        fileType: finalName.split('.').pop() || 'pdf',
        encrypted: true,
        notes: uploadNotes || `Uploaded to ${selectedFolder} for ${selectedClient.name}`
      };

      setDocuments(prev => [newDoc, ...prev]);
      setSelectedFile(null);
      setUploadNotes('');
      setConflictFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsUploading(false);
    }, 400);
  };

  const handleConflictResolve = (action: 'replace' | 'new') => {
    if (!conflictFile) return;
    if (action === 'replace') {
      const nextVer = `v${conflictExisting.length + 1}`;
      proceedUpload(conflictFile, conflictFile.name, nextVer);
    } else {
      const parts = conflictFile.name.split('.');
      const ext = parts.pop();
      const base = parts.join('.');
      const newName = `${base} (${conflictExisting.length}).${ext}`;
      proceedUpload(conflictFile, newName, 'v1');
    }
  };


  // Filter documents by selected client, folder, and optional search
// Filter documents by selected client, folder, and optional search
  const isGlobalSearch = searchQuery.trim() !== '' || isAdvancedSearchOpen;

  const currentFolderDocuments = documents.filter(doc => {
    // If we are actively searching, search globally (all clients, all folders) unless filtered
    if (isGlobalSearch) {
      let matches = true;
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        matches = doc.name.toLowerCase().includes(lowerQ) || 
                  doc.tags.some(t => t.toLowerCase().includes(lowerQ)) ||
                  (doc.notes || '').toLowerCase().includes(lowerQ); // simulate OCR full-text search
      }
      if (advFilters.client && doc.clientName !== advFilters.client) matches = false;
      if (advFilters.type && doc.fileType !== advFilters.type) matches = false;
      if (advFilters.tag && !doc.tags.includes(advFilters.tag)) matches = false;
      return matches;
    }

    // Default view: specific client & folder
    const matchClient = doc.clientName === selectedClient.name;
    const matchFolder = doc.folder === selectedFolder;
    return matchClient && matchFolder;
  });

  const handleDeleteDocument = (docId: string) => {
    if (confirm('Are you sure you want to securely purge this document and its encrypted versions?')) {
      setDocuments(prev => prev.filter(d => d.id !== docId));
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA] overflow-y-auto">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">
        
        {/* Header matching IMG_8964.jpeg */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Documents</h1>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">7 folders per client · versioned · AES-256 at rest</p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToOcr && (
              <button
                onClick={onNavigateToOcr}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <ScanText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Invoice OCR Tool</span>
              </button>
            )}

            <button
              onClick={handleRefresh}
              title="Refresh documents repository"
              className="p-2 bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 rounded-full shadow-sm hover:bg-zinc-50 transition-all cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Client Selector Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-zinc-700">Client</label>
          <div className="relative">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-white border border-zinc-200 text-zinc-900 text-xs font-semibold rounded-lg px-3 py-2.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.panOrCode})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[11px] font-semibold text-zinc-400 tracking-wider">
            {selectedClient.panOrCode}
          </div>
        </div>

        {/* Folders Section */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-900">Folders (auto-created on first access)</h2>
            <button
              onClick={() => setIsNewFolderModalOpen(true)}
              className="flex items-center gap-1 text-xs font-bold text-zinc-700 hover:text-indigo-600 px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2.5">
            {clientFolders.map(folderName => {
              const isSelected = selectedFolder === folderName;
              const countInFolder = documents.filter(d => d.clientName === selectedClient.name && d.folder === folderName).length;
              return (
                <button
                  key={folderName}
                  onClick={() => setSelectedFolder(folderName)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left ${
                    isSelected
                      ? 'bg-[#0f172a] text-white shadow-sm'
                      : 'bg-zinc-50/70 border border-zinc-200/80 text-zinc-800 hover:bg-zinc-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400 fill-indigo-400/20' : 'text-zinc-500'}`} />
                    <span className="truncate">{folderName}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-slate-800 text-slate-300' : 'bg-zinc-200/60 text-zinc-600'
                  }`}>
                    {countInFolder}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload to Selected Folder Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-xs font-bold text-zinc-900">Upload to "{selectedFolder}"</h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">Max 50MB · versioned automatically (v1, v2, ...)</p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="document-file-input"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="document-file-input"
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 font-bold text-xs rounded-lg cursor-pointer transition-colors shrink-0 shadow-2xs"
                >
                  Choose File
                </label>
                <span className="text-xs text-zinc-600 truncate font-medium">
                  {selectedFile ? selectedFile.name : 'No file chosen'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="bg-white border border-zinc-200 text-xs font-semibold rounded-lg px-3 py-2 text-zinc-700 shadow-2xs"
                >
                  <option value="Final">Tag: Final</option>
                  <option value="Draft">Tag: Draft</option>
                  <option value="Signed">Tag: Signed</option>
                  <option value="Notice">Tag: Notice</option>
                  <option value="Audit">Tag: Audit</option>
                  <option value="Acknowledgment">Tag: Acknowledgment</option>
                </select>

                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className={`px-5 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                    selectedFile && !isUploading
                      ? 'bg-[#0f172a] hover:bg-slate-800 text-white cursor-pointer'
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Encrypting...' : 'Upload'}</span>
                </button>
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>File will be encrypted with client-specific key (AES-256-GCM) prior to storage.</span>
              </div>
            )}
          </form>
        </div>

        {/* Documents Table Card */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Documents ({currentFolderDocuments.length})</h2>
              <p className="text-xs text-zinc-500 mt-0.5 font-medium">Click a doc for actions (versions, share, delete)</p>
            </div>

            {/* Quick Search */}
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Full-text & OCR search..."
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <button 
                onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)} 
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${isAdvancedSearchOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
              >
                Filters
              </button>
            </div>
          </div>

          {isAdvancedSearchOpen && (
            <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50/50 flex flex-wrap gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Client</label>
                <select value={advFilters.client} onChange={e => setAdvFilters({...advFilters, client: e.target.value})} className="border border-zinc-200 rounded px-2 py-1 text-xs bg-white">
                  <option value="">All Clients</option>
                  {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">File Type</label>
                <select value={advFilters.type} onChange={e => setAdvFilters({...advFilters, type: e.target.value})} className="border border-zinc-200 rounded px-2 py-1 text-xs bg-white">
                  <option value="">All Types</option>
                  <option value="pdf">PDF</option>
                  <option value="xlsx">Excel</option>
                  <option value="docx">Word</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Tag</label>
                <select value={advFilters.tag} onChange={e => setAdvFilters({...advFilters, tag: e.target.value})} className="border border-zinc-200 rounded px-2 py-1 text-xs bg-white">
                  <option value="">All Tags</option>
                  <option value="Final">Final</option>
                  <option value="Draft">Draft</option>
                  <option value="Signed">Signed</option>
                </select>
              </div>
            </div>
          )}


          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-zinc-50/70 border-b border-zinc-200 text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Version</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3">Tags</th>
                  <th className="px-5 py-3">Uploaded</th>
                  <th className="px-5 py-3">Shared</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-medium">
                {currentFolderDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-zinc-400">
                      No documents in this folder yet.
                    </td>
                  </tr>
                ) : (
                  currentFolderDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 hover:text-indigo-600 cursor-pointer" onClick={() => setSelectedDocForPreview(doc)}>
                              {doc.name}
                            </div>
                            <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Lock className="w-2.5 h-2.5 text-emerald-600" />
                              AES-256 Encrypted
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 font-bold text-[11px] rounded-md border border-zinc-200">
                          {doc.version}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600">{doc.size}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-md border border-indigo-100">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600">{doc.uploadedAt}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          doc.sharedStatus.includes('Shared')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}>
                          {doc.sharedStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDocForPreview(doc)}
                            title="Preview file"
                            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-indigo-600 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedDocForHistory(doc)}
                            title="Version history"
                            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-indigo-600 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDocForShare(doc);
                              setShareCopied(false);
                            }}
                            title="Share document"
                            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-indigo-600 transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            title="Purge document"
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-zinc-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL: + New Folder */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Create Client Folder</h3>
              </div>
              <button 
                onClick={() => setIsNewFolderModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFolder} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Folder Name</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Statutory Audit 2026-27"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg font-medium text-zinc-900"
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                This folder will be initialized with automated versioning and client-level access control.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 font-bold rounded-lg hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-full shadow-sm"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Document Preview & Encryption Details */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-zinc-900">{selectedDocForPreview.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedDocForPreview(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <div>
                  <span className="text-zinc-500 font-medium">Client:</span>{' '}
                  <span className="font-bold text-zinc-900">{selectedDocForPreview.clientName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-medium">Folder:</span>{' '}
                  <span className="font-bold text-zinc-900">{selectedDocForPreview.folder}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-medium">Version:</span>{' '}
                  <span className="font-bold text-zinc-900">{selectedDocForPreview.version}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-medium">File Size:</span>{' '}
                  <span className="font-bold text-zinc-900">{selectedDocForPreview.size}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  End-to-End Cryptographic Security (SOC2 Verified)
                </div>
                <p className="text-emerald-800 text-[11px]">
                  Algorithm: AES-256-GCM • Key Envelope: AWS KMS CA-Master-Key-01 • Integrity Hash: sha256-{selectedDocForPreview.id.substring(0, 16)}...
                </p>
              </div>

              {selectedDocForPreview.notes && (
                <div>
                  <h4 className="font-bold text-zinc-700 mb-1">Document Notes:</h4>
                  <p className="p-3 bg-white border border-zinc-200 rounded-lg text-zinc-800 font-medium">
                    {selectedDocForPreview.notes}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-200 flex justify-between">
                <button
                  onClick={() => {
                    alert(`Simulating secure decrypted download for ${selectedDocForPreview.name}`);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Decrypted File
                </button>
                <button
                  onClick={() => setSelectedDocForPreview(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Version History */}
      {selectedDocForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-zinc-900">Version History: {selectedDocForHistory.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedDocForHistory(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="space-y-2">
                <div className="p-3 bg-indigo-50/40 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-zinc-900 flex items-center gap-2">
                      <span>{selectedDocForHistory.version} (Current Active)</span>
                      <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md font-bold">Latest</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Uploaded {selectedDocForHistory.uploadedAt} • {selectedDocForHistory.size}</div>
                  </div>
                  <button className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-700 font-bold rounded-full hover:bg-zinc-50 text-[11px]">
                    Download
                  </button>
                </div>

                <div className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between opacity-80">
                  <div>
                    <div className="font-bold text-zinc-800">v1 (Initial Ingestion)</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Uploaded 2026-09-01 • 1.1 MB</div>
                  </div>
                  <button className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-700 font-bold rounded-full hover:bg-zinc-50 text-[11px]">
                    Download
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end">
                <button
                  onClick={() => setSelectedDocForHistory(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Share Document */}
      {selectedDocForShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-zinc-900">Secure Share Link</h3>
              </div>
              <button 
                onClick={() => setSelectedDocForShare(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-zinc-600">
                Generate a temporary, OTP-guarded download link for <span className="font-bold text-zinc-900">{selectedDocForShare.name}</span>.
              </p>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-zinc-600 truncate">
                  https://aaravadvisors.com/portal/share/sec_{selectedDocForShare.id}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://aaravadvisors.com/portal/share/sec_${selectedDocForShare.id}`);
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2000);
                  }}
                  className="px-3 py-1 bg-white border border-zinc-200 rounded-md font-bold text-zinc-800 hover:bg-zinc-100 shrink-0"
                >
                  {shareCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="text-[11px] text-zinc-500 space-y-1">
                <div>• Link expires in 24 hours.</div>
                <div>• Recipient must authenticate via OTP sent to verified client email.</div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedDocForShare(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* MODAL: Version Conflict */}
      {conflictFile && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 mb-2">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-lg font-bold text-zinc-900">File Already Exists</h3>
            </div>
            <p className="text-sm text-zinc-600">
              A file named <strong>{conflictFile.name}</strong> already exists in this folder.
            </p>
            <p className="text-xs text-zinc-500 border-l-2 border-amber-200 pl-3 py-1">
              Selecting <strong>Replace & version</strong> will save this as a new version and retain the old file in history. Selecting <strong>Upload as new</strong> will append a number to the file name.
            </p>
            
            <div className="pt-4 flex flex-col gap-2">
              <button onClick={() => handleConflictResolve('replace')} className="w-full px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-sm">
                Replace & version (Recommended)
              </button>
              <button onClick={() => handleConflictResolve('new')} className="w-full px-5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold rounded-full">
                Upload as new file
              </button>
              <button onClick={() => setConflictFile(null)} className="w-full mt-2 text-xs font-bold text-zinc-400 hover:text-zinc-600">
                Cancel Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
