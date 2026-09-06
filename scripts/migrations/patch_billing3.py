import re

with open("src/pages/Billing.tsx", "r") as f:
    content = f.read()

state_repl = "const [retainerData, setRetainerData] = useState({ clientId: '', amount: '', cycle: 'Monthly', startDate: '', serviceScope: '', autoInvoice: false, billingDay: '1st of month' });"
content = re.sub(r"const \[retainerData, setRetainerData\] = useState\(\{ clientId: '', amount: '', cycle: 'Monthly', startDate: '' \}\);", state_repl, content)

reset_repl = "setRetainerData({ clientId: '', amount: '', cycle: 'Monthly', startDate: '', serviceScope: '', autoInvoice: false, billingDay: '1st of month' });"
content = re.sub(r"setRetainerData\(\{ clientId: '', amount: '', cycle: 'Monthly', startDate: '' \}\);", reset_repl, content)

# I need to add UI for the new fields in the Retainer Modal
form_ui = """              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Retainer Amount (₹) / Monthly Fee</label>
                <input required type="number" value={retainerData.amount} onChange={e => setRetainerData({...retainerData, amount: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Service Scope</label>
                <input required type="text" value={retainerData.serviceScope} onChange={e => setRetainerData({...retainerData, serviceScope: e.target.value})} placeholder="e.g. GST + Accounting + TDS" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Billing Cycle</label>
                  <select value={retainerData.cycle} onChange={e => setRetainerData({...retainerData, cycle: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20">
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Billing Day</label>
                  <select value={retainerData.billingDay} onChange={e => setRetainerData({...retainerData, billingDay: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20">
                    <option value="1st of month">1st of month</option>
                    <option value="Last day of month">Last day of month</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Start Date</label>
                <input required type="date" value={retainerData.startDate} onChange={e => setRetainerData({...retainerData, startDate: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                <input type="checkbox" id="autoInvoice" checked={retainerData.autoInvoice} onChange={e => setRetainerData({...retainerData, autoInvoice: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-zinc-300" />
                <label htmlFor="autoInvoice" className="text-xs font-bold text-zinc-700 cursor-pointer">Auto-Invoice Generation</label>
              </div>"""

# Find the old form UI section and replace it.
old_ui = r"              <div>\s*<label className=\"block text-xs font-bold text-zinc-700 mb-1\">Retainer Amount \(₹\)</label>[\s\S]*?<div>\s*<label className=\"block text-xs font-bold text-zinc-700 mb-1\">Start Date</label>\s*<input required type=\"date\".*?/>\s*</div>"
content = re.sub(old_ui, form_ui, content)


# Also display in the retainers list
list_ui = """                  <div key={r.id} className="p-4 flex items-center justify-between group">
                    <div>
                      <div className="font-bold text-zinc-900 flex items-center gap-2">
                        {r.clientName}
                        {r.autoInvoice && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider">Auto-Invoice</span>}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                        <span className="font-medium text-zinc-700">{r.serviceScope || 'Standard Retainer'}</span> • Started: {r.startDate} • {r.cycle} on {r.billingDay || '1st'}
                      </div>
                    </div>"""
content = re.sub(r"                  <div key=\{r.id\} className=\"p-4 flex items-center justify-between\">\s*<div>\s*<div className=\"font-bold text-zinc-900\">\{r.clientName\}</div>\s*<div className=\"text-xs text-zinc-500 mt-1\">Started: \{r.startDate\} • \{r.cycle\} Billing</div>\s*</div>", list_ui, content)

with open("src/pages/Billing.tsx", "w") as f:
    f.write(content)
