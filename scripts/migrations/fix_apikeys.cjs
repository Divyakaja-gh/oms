const fs = require('fs');
const content = `
import React, { useState, useEffect } from 'react';
import { Webhook, KeyRound, Copy, X } from 'lucide-react';
import { collection, addDoc, onSnapshot, serverTimestamp, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export function APIKeys() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keys, setKeys] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'api_keys'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setKeys(data);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'api_keys'), {
        name,
        prefix,
        status: 'Active',
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setName('');
      setPrefix('');
    } catch (error) {
      console.error(error);
      alert('Failed to generate key');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      <div className="p-8 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <Webhook className="w-6 h-6 text-indigo-600" />
              API Keys & Webhooks
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Manage API key lifecycles.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            Generate New Key
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-hidden max-w-[1600px] mx-auto w-full space-y-6">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h2 className="font-bold text-sm text-zinc-900 uppercase tracking-widest">Active Keys</h2>
          </div>
          <div className="p-4 space-y-3">
            {keys.length === 0 ? (
              <div className="text-center text-zinc-500 py-10">No API keys generated yet.</div>
            ) : (
              keys.map(k => (
                <div key={k.id} className="p-4 border border-zinc-200 rounded-xl hover:border-indigo-300 transition-colors bg-white">
                  <div className="font-bold text-zinc-900">{k.name}</div>
                  <div className="text-sm text-zinc-500 mt-1">Prefix: {k.prefix} | Status: {k.status}</div>
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
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Generate Key</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Key Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="Production CRM" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Prefix</label>
                <input required type="text" value={prefix} onChange={e => setPrefix(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="prod_crm" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
                Generate
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/pages/APIKeys.tsx', content);
