import re

with open("src/pages/Dashboard.tsx", "r") as f:
    content = f.read()

# Replace imports to include useEffect and Firebase
content = content.replace(
    "import React, { useState } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { collection, onSnapshot, query, where } from 'firebase/firestore';\nimport { db, auth } from '../lib/firebase';"
)

# Add state and useEffect inside Dashboard
state_code = """
  const [isWiping, setIsWiping] = useState(false);
  const [metrics, setMetrics] = useState({ clients: 0, tasks: 0, receivables: 0, pipeline: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }
    const uid = auth.currentUser.uid;
    let cLoaded = false, tLoaded = false, iLoaded = false, pLoaded = false;
    
    const checkLoaded = () => {
      if (cLoaded && tLoaded && iLoaded && pLoaded) setIsLoading(false);
    };

    const unsubC = onSnapshot(query(collection(db, 'clients'), where('ownerId', '==', uid)), snap => {
      setMetrics(p => ({ ...p, clients: snap.size }));
      cLoaded = true; checkLoaded();
    });
    const unsubT = onSnapshot(query(collection(db, 'tasks'), where('ownerId', '==', uid)), snap => {
      setMetrics(p => ({ ...p, tasks: snap.size }));
      tLoaded = true; checkLoaded();
    });
    const unsubI = onSnapshot(query(collection(db, 'invoices'), where('ownerId', '==', uid)), snap => {
      let t = 0; snap.forEach(doc => { if (doc.data().status !== 'Paid') t += Number(doc.data().amount) || 0; });
      setMetrics(p => ({ ...p, receivables: t }));
      iLoaded = true; checkLoaded();
    });
    const unsubP = onSnapshot(query(collection(db, 'prospects'), where('ownerId', '==', uid)), snap => {
      let t = 0; snap.forEach(doc => { t += Number(doc.data().value) || 0; });
      setMetrics(p => ({ ...p, pipeline: t }));
      pLoaded = true; checkLoaded();
    });

    return () => { unsubC(); unsubT(); unsubI(); unsubP(); };
  }, []);
"""

content = re.sub(r"  const \[isWiping, setIsWiping\] = useState\(false\);", state_code.strip(), content)


# Fix the KPI cards mapping
old_kpi = r"""        {\[
          { title: 'TOTAL CORPORATE CLIENTS', value: '0', link: 'Manage Database', tab: 'clients', icon: Users, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
          { title: 'PENDING / ACTIVE TASKS', value: '0', subtitle: 'All checklists healthy', link: 'View Tasks', tab: 'tasks', icon: CalendarDays, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
          { title: 'OUTSTANDING RECEIVABLES', value: '₹ 0', link: 'Track Invoices', tab: 'accounts', icon: TrendingUp, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
          { title: 'BD PITCHING FUNNEL', value: '₹ 0', subtitle: '0 prospects active', link: 'View Pipeline', tab: 'pitching', icon: ArrowUpRight, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
        \].map\(\(kpi, i\) => \(
          <div key=\{i\} onClick=\{\(\) => kpi.tab && setActiveTab\(kpi.tab\)\} className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm flex items-center justify-between group cursor-pointer hover:border-indigo-300 transition-colors">
            <div>
              <h4 className="text-\[10px\] font-bold text-zinc-500 tracking-widest uppercase mb-1">\{kpi.title\}</h4>
              <div className="text-2xl font-bold text-zinc-900 mb-1">\{kpi.value\}</div>
              \{kpi.subtitle \? \(
                <div className="text-xs text-emerald-600 font-medium">\{kpi.subtitle\}</div>
              \) : \(
                <div className="text-xs text-indigo-600 font-medium flex items-center gap-1 group-hover:underline">
                  \{kpi.link\} <ArrowUpRight className="w-3 h-3" />
                </div>
              \)\}
            </div>
            <div className=\{`w-10 h-10 rounded-full flex items-center justify-center \$\{kpi.iconBg\}`\}>
              <kpi.icon className=\{`w-5 h-5 \$\{kpi.iconColor\}`\} />
            </div>
          </div>
        \)\)}"""

new_kpi = r"""        {[
          { title: 'TOTAL CORPORATE CLIENTS', value: metrics.clients.toString(), link: 'Manage Database', tab: 'clients', icon: Users, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
          { title: 'PENDING / ACTIVE TASKS', value: metrics.tasks.toString(), subtitle: 'All checklists healthy', link: 'View Tasks', tab: 'tasks', icon: CalendarDays, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
          { title: 'OUTSTANDING RECEIVABLES', value: `₹ ${metrics.receivables.toLocaleString()}`, link: 'Track Invoices', tab: 'accounts', icon: TrendingUp, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
          { title: 'BD PITCHING FUNNEL', value: `₹ ${metrics.pipeline.toLocaleString()}`, subtitle: `${metrics.pipeline > 0 ? 'Prospects active' : '0 prospects active'}`, link: 'View Pipeline', tab: 'pitching', icon: ArrowUpRight, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
        ].map((kpi, i) => (
          <div key={i} onClick={() => kpi.tab && setActiveTab(kpi.tab)} className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm flex items-center justify-between group cursor-pointer hover:border-indigo-300 transition-colors relative overflow-hidden">
            {isLoading ? (
              <div className="w-full">
                 <div className="h-3 w-32 bg-zinc-200 rounded animate-pulse mb-3"></div>
                 <div className="h-8 w-16 bg-zinc-200 rounded animate-pulse mb-2"></div>
                 <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">{kpi.title}</h4>
                  <div className="text-2xl font-bold text-zinc-900 mb-1">{kpi.value}</div>
                  {kpi.subtitle ? (
                    <div className="text-xs text-emerald-600 font-medium">{kpi.subtitle}</div>
                  ) : (
                    <div className="text-xs text-indigo-600 font-medium flex items-center gap-1 group-hover:underline">
                      {kpi.link} <ArrowUpRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${kpi.iconBg}`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
                </div>
              </>
            )}
          </div>
        ))}"""

content = re.sub(old_kpi, new_kpi, content, flags=re.DOTALL)

# Focus List Skeleton
old_focus = r"""            <div className="flex-1 flex items-center justify-center text-sm text-zinc-400 font-medium">
              All caught up! No tasks on active desk.
            </div>"""

new_focus = r"""            {isLoading ? (
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-12 w-full bg-zinc-100/60 rounded-lg animate-pulse"></div>
                <div className="h-12 w-full bg-zinc-100/60 rounded-lg animate-pulse"></div>
                <div className="h-12 w-full bg-zinc-100/60 rounded-lg animate-pulse"></div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-zinc-400 font-medium">
                All caught up! No tasks on active desk.
              </div>
            )}"""
content = content.replace(old_focus, new_focus)

# Calendar Skeleton
old_calendar = r"""                        <div className="border border-zinc-100 rounded-xl p-4 bg-zinc-50/50 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-\[10px\] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Quarterly Filings</span>
                <span className="text-\[10px\] font-bold text-zinc-400 tracking-widest">FY 2026-27 \(Q1\)</span>
              </div>
              <h4 className="text-sm font-bold text-zinc-900">Advance Tax 1st Instalment payment</h4>
              <p className="text-xs text-zinc-500 mt-1 mb-4">15% of estimated tax liability is payable by 15th Jun.</p>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-500">Standard due: 15th June</span>
                <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded">Deadline: 2026-06-15</span>
              </div>
            </div>"""

new_calendar = r"""            {isLoading ? (
              <div className="border border-zinc-100 rounded-xl p-4 bg-zinc-50/50 relative overflow-hidden">
                 <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse mb-3"></div>
                 <div className="h-5 w-48 bg-zinc-200 rounded animate-pulse mb-2"></div>
                 <div className="h-3 w-64 bg-zinc-200 rounded animate-pulse mb-4"></div>
                 <div className="flex justify-between">
                   <div className="h-3 w-32 bg-zinc-200 rounded animate-pulse"></div>
                   <div className="h-5 w-24 bg-zinc-200 rounded animate-pulse"></div>
                 </div>
              </div>
            ) : (
              <div className="border border-zinc-100 rounded-xl p-4 bg-zinc-50/50 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Quarterly Filings</span>
                  <span className="text-[10px] font-bold text-zinc-400 tracking-widest">FY 2026-27 (Q1)</span>
                </div>
                <h4 className="text-sm font-bold text-zinc-900">Advance Tax 1st Instalment payment</h4>
                <p className="text-xs text-zinc-500 mt-1 mb-4">15% of estimated tax liability is payable by 15th Jun.</p>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-500">Standard due: 15th June</span>
                  <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded">Deadline: 2026-06-15</span>
                </div>
              </div>
            )}"""
content = re.sub(old_calendar, new_calendar, content)

# Pitching and Vault Skeletons
old_pitch = r"""              <button onClick=\{\(\) => setActiveTab\('pitching'\)\} className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer bg-transparent border-none p-0">Pipeline Deck ↗</button>
            </div>
          </div>"""

new_pitch = r"""              <button onClick={() => setActiveTab('pitching')} className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer bg-transparent border-none p-0">Pipeline Deck ↗</button>
            </div>
            {isLoading && (
              <div className="mt-4 space-y-3">
                <div className="h-10 w-full bg-zinc-100/60 rounded-lg animate-pulse"></div>
                <div className="h-10 w-full bg-zinc-100/60 rounded-lg animate-pulse"></div>
              </div>
            )}
          </div>"""
content = re.sub(old_pitch, new_pitch, content)

old_vault = r"""              <button onClick=\{\(\) => setActiveTab\('vault'\)\} className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer bg-transparent border-none p-0">Open Directory ↗</button>
            </div>
          </div>"""
new_vault = r"""              <button onClick={() => setActiveTab('vault')} className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer bg-transparent border-none p-0">Open Directory ↗</button>
            </div>
            {isLoading && (
              <div className="mt-4 space-y-3">
                <div className="h-10 w-full bg-zinc-100/60 rounded-lg animate-pulse"></div>
              </div>
            )}
          </div>"""
content = re.sub(old_vault, new_vault, content)


# Activity History Skeleton
old_history = r"""            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-zinc-100"> 
               \{\[
                 \{ msg: 'New client registration: Apex Traders LLP added successfully', time: '2 days ago', color: 'bg-indigo-500' \},
                 \{ msg: 'Rajesh Goenka uploaded Balance_sheet_Draft_FY25-26.xlsx', time: 'Yesterday', color: 'bg-indigo-500' \},
                 \{ msg: 'Goenka Foods Private Limited completed payment of INV-2026-015', time: 'Yesterday', color: 'bg-indigo-500' \},
               \]\.map\(\(log, i\) => \(
                 <div key=\{i\} className="relative pl-6">
                   <div className=\{`absolute left-0 w-3 h-3 rounded-full \$\{log.color\} border-2 border-white top-1`\}></div>
                   <p className="text-xs font-semibold text-zinc-700">\{log.msg\}</p>
                   <p className="text-\[10px\] text-zinc-400 mt-1 font-medium uppercase tracking-wider">\{log.time\}</p>
                 </div>
               \)\)\}
            </div>"""

new_history = r"""            {isLoading ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-zinc-100">
                {[1, 2, 3].map(i => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute left-0 w-3 h-3 rounded-full bg-zinc-200 border-2 border-white top-1 animate-pulse"></div>
                    <div className="h-3 w-48 bg-zinc-200 rounded animate-pulse mb-1.5"></div>
                    <div className="h-2 w-20 bg-zinc-100 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-zinc-100"> 
                 {[
                   { msg: 'New client registration: Apex Traders LLP added successfully', time: '2 days ago', color: 'bg-indigo-500' },
                   { msg: 'Rajesh Goenka uploaded Balance_sheet_Draft_FY25-26.xlsx', time: 'Yesterday', color: 'bg-indigo-500' },
                   { msg: 'Goenka Foods Private Limited completed payment of INV-2026-015', time: 'Yesterday', color: 'bg-indigo-500' },
                 ].map((log, i) => (
                   <div key={i} className="relative pl-6">
                     <div className={`absolute left-0 w-3 h-3 rounded-full ${log.color} border-2 border-white top-1`}></div>
                     <p className="text-xs font-semibold text-zinc-700">{log.msg}</p>
                     <p className="text-[10px] text-zinc-400 mt-1 font-medium uppercase tracking-wider">{log.time}</p>
                   </div>
                 ))}
              </div>
            )}"""
content = re.sub(old_history, new_history, content)

with open("src/pages/Dashboard.tsx", "w") as f:
    f.write(content)
