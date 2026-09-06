import re

with open("src/pages/Documents.tsx", "r") as f:
    content = f.read()

# Add states for Version Conflict Modal
version_state = """
  const [conflictFile, setConflictFile] = useState<File | null>(null);
  const [conflictExisting, setConflictExisting] = useState<ClientDocument[]>([]);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState({ client: '', type: '', tag: '' });
"""
content = re.sub(r"const \[isUploading, setIsUploading\] = useState\(false\);", "const [isUploading, setIsUploading] = useState(false);\n" + version_state, content)

# Update handleUploadSubmit to intercept for conflict
new_upload = """  const handleUploadSubmit = (e: React.FormEvent) => {
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
"""
content = re.sub(r"  const handleUploadSubmit = \(e: React.FormEvent\) => \{[\s\S]*?\}, 400\);\n  \};", new_upload, content)

# Modify filtering to support advanced search across ALL folders
filter_logic = """
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
"""
content = re.sub(r"  const currentFolderDocuments = documents.filter\(doc => \{[\s\S]*?return matchClient && matchFolder && matchSearch;\n  \}\);", filter_logic.strip(), content)

# Update Search UI to include Advanced Search toggle and OCR text
search_ui = """            {/* Quick Search */}
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
            <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50/50 flex gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Client</label>
                <select value={advFilters.client} onChange={e => setAdvFilters({...advFilters, client: e.target.value})} className="border border-zinc-200 rounded px-2 py-1 text-xs">
                  <option value="">All Clients</option>
                  {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">File Type</label>
                <select value={advFilters.type} onChange={e => setAdvFilters({...advFilters, type: e.target.value})} className="border border-zinc-200 rounded px-2 py-1 text-xs">
                  <option value="">All Types</option>
                  <option value="pdf">PDF</option>
                  <option value="xlsx">Excel</option>
                  <option value="docx">Word</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Tag</label>
                <select value={advFilters.tag} onChange={e => setAdvFilters({...advFilters, tag: e.target.value})} className="border border-zinc-200 rounded px-2 py-1 text-xs">
                  <option value="">All Tags</option>
                  <option value="Final">Final</option>
                  <option value="Draft">Draft</option>
                  <option value="Signed">Signed</option>
                </select>
              </div>
            </div>
          )}
"""
content = re.sub(r"            \{\/\* Quick Search \*\/\}.*?</div>\n          </div>", search_ui, content, flags=re.DOTALL)

# Add Conflict Modal
conflict_modal = """
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
              <button onClick={() => handleConflictResolve('replace')} className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm">
                Replace & version (Recommended)
              </button>
              <button onClick={() => handleConflictResolve('new')} className="w-full px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold rounded-lg">
                Upload as new file
              </button>
              <button onClick={() => setConflictFile(null)} className="w-full mt-2 text-xs font-bold text-zinc-400 hover:text-zinc-600">
                Cancel Upload
              </button>
            </div>
          </div>
        </div>
      )}
"""
content = content.replace("    </div>\n  );\n}", conflict_modal + "    </div>\n  );\n}")

with open("src/pages/Documents.tsx", "w") as f:
    f.write(content)
