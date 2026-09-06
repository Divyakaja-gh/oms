import re

with open("src/pages/Billing.tsx", "r") as f:
    content = f.read()

# I will add a tab state to Billing.tsx
state_code = """
  const [activeTab, setActiveTab] = useState('invoices');
"""
content = re.sub(r"const \[isModalOpen, setIsModalOpen\] = useState\(false\);", state_code.strip() + "\n  const [isModalOpen, setIsModalOpen] = useState(false);\n  const [isRetainerModalOpen, setIsRetainerModalOpen] = useState(false);\n  const [retainers, setRetainers] = useState<any[]>([]);\n  const [retainerData, setRetainerData] = useState({ clientId: '', amount: '', cycle: 'Monthly', startDate: '' });\n", content)

fetch_code = """    // Fetch Clients
    const unsubClients = onSnapshot(query(collection(db, 'clients'), where('ownerId', '==', uid)), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRetainers = onSnapshot(query(collection(db, 'retainers'), where('ownerId', '==', uid)), (snapshot) => {
      setRetainers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubInvoices(); unsubClients(); unsubRetainers(); };"""
content = re.sub(r"    // Fetch Clients\n.*?return \(\) => \{ unsubInvoices\(\); unsubClients\(\); \};", fetch_code, content, flags=re.DOTALL)

handle_retainer = """  const handleCreateRetainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !retainerData.clientId) return;
    const selected = clients.find(c => c.id === retainerData.clientId);
    try {
      await addDoc(collection(db, 'retainers'), {
        ...retainerData,
        clientName: selected?.name,
        status: 'Active',
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setIsRetainerModalOpen(false);
      setRetainerData({ clientId: '', amount: '', cycle: 'Monthly', startDate: '' });
    } catch (error) {
      console.error(error);
    }
  };
"""
content = re.sub(r"  const handleCreate = ", handle_retainer + "\n  const handleCreate = ", content)

header_code = """            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-indigo-600 font-bold text-lg">₹</span>
              </div>
              Billing, Invoicing, & GST
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Generate Tax Invoices, Proformas, Credit Notes, and Track Receivables.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsRetainerModalOpen(true)} className="flex items-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              New Retainer
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              New Invoice
            </button>
          </div>"""
content = re.sub(r"<h1 className=\"text-2xl font-bold text-zinc-900 flex items-center gap-3\">.*?New Invoice\n\s*</button>\n\s*</div>", header_code, content, flags=re.DOTALL)

tab_ui = """      <div className="px-8 pt-4 bg-white border-b border-zinc-200 flex gap-6 shrink-0">
        <button onClick={() => setActiveTab('invoices')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'invoices' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>Invoices</button>
        <button onClick={() => setActiveTab('retainers')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'retainers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>Retainers / Subscriptions</button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto max-w-[1200px] mx-auto w-full space-y-6">
        {activeTab === 'invoices' ? (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
"""
content = re.sub(r"      <div className=\"flex-1 p-8 overflow-y-auto max-w-\[1200px\] mx-auto w-full space-y-6\">\n\s*<div className=\"bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden\">", tab_ui, content)

retainer_tab = """          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="font-bold text-sm text-zinc-900 uppercase tracking-widest">Active Retainers</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {retainers.length === 0 ? (
                <div className="text-center text-zinc-500 py-16">
                  <p className="font-medium text-zinc-900">No active retainers</p>
                  <p className="text-sm mt-1">Set up recurring billing subscriptions for your clients.</p>
                </div>
              ) : (
                retainers.map(r => (
                  <div key={r.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-zinc-900">{r.clientName}</div>
                      <div className="text-xs text-zinc-500 mt-1">Started: {r.startDate} • {r.cycle} Billing</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-indigo-600">₹{Number(r.amount).toLocaleString()}/{r.cycle === 'Monthly' ? 'mo' : r.cycle === 'Quarterly' ? 'qtr' : 'yr'}</div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 mt-1 inline-block">ACTIVE</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>"""
content = re.sub(r"          </div>\n\s*</div>\n\s*</div>\n\s*\{isModalOpen", retainer_tab + "\n\n      {isModalOpen", content)

retainer_modal = """
      {isRetainerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-md">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">New Retainer</h3>
              <button onClick={() => setIsRetainerModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateRetainer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Select Client</label>
                <select required value={retainerData.clientId} onChange={e => setRetainerData({...retainerData, clientId: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20">
                  <option value="">-- Choose a client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Retainer Amount (₹)</label>
                <input required type="number" value={retainerData.amount} onChange={e => setRetainerData({...retainerData, amount: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Billing Cycle</label>
                <select value={retainerData.cycle} onChange={e => setRetainerData({...retainerData, cycle: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Start Date</label>
                <input required type="date" value={retainerData.startDate} onChange={e => setRetainerData({...retainerData, startDate: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
                Setup Retainer
              </button>
            </form>
          </div>
        </div>
      )}
"""
content = content.replace("    </div>\n  );\n}", retainer_modal + "    </div>\n  );\n}")

with open("src/pages/Billing.tsx", "w") as f:
    f.write(content)
