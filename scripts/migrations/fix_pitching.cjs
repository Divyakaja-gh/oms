const fs = require('fs');
const content = `
import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Search, X } from 'lucide-react';
import { collection, addDoc, onSnapshot, serverTimestamp, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export function Pitching() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prospects, setProspects] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'prospects'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProspects(data);
    }, (error) => {
      console.error(error);
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'prospects'), {
        companyName,
        status: 'Lead',
        value: Number(value) || 0,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setCompanyName('');
      setValue('');
    } catch (error) {
      console.error(error);
      alert('Failed to create prospect');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      <div className="p-8 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              Business Development Pipeline
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Log active leads, manage estimates, design pitch campaigns.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Add New Prospect
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-hidden flex max-w-[1600px] mx-auto w-full gap-6">
        <div className="flex-1 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
             <div className="font-bold text-sm text-zinc-900 uppercase tracking-widest">Active Pipeline</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {prospects.length === 0 ? (
              <div className="text-center text-zinc-500 py-10">No prospects added yet.</div>
            ) : (
              prospects.map(p => (
                <div key={p.id} className="p-4 border border-zinc-200 rounded-xl hover:border-indigo-300 transition-colors bg-white">
                  <div className="font-bold text-zinc-900">{p.companyName}</div>
                  <div className="text-sm text-zinc-500 mt-1">Value: ₹{p.value} | Status: {p.status}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-md">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Add Prospect</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Company Name</label>
                <input required type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="Acme Corp" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Estimated Value (₹)</label>
                <input required type="number" value={value} onChange={e => setValue(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="50000" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
                Save Prospect
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/pages/Pitching.tsx', content);
