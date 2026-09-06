const fs = require('fs');
const content = `
import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Users, X } from 'lucide-react';
import { collection, addDoc, onSnapshot, serverTimestamp, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export function Clients() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'clients'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(data);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'clients'), {
        name,
        pan,
        gstin,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setName('');
      setPan('');
      setGstin('');
    } catch (error) {
      console.error(error);
      alert('Failed to add client');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      <div className="p-8 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <Users className="w-6 h-6 text-indigo-600" />
              Corporate Clients Directory
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Maintain complete KYC, PAN, GSTIN details.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Add New Client
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-hidden flex flex-col max-w-[1600px] mx-auto w-full">
        <div className="flex-1 overflow-y-auto space-y-3">
          {clients.length === 0 ? (
            <div className="text-center text-zinc-500 py-10">No clients in directory.</div>
          ) : (
            clients.map(c => (
              <div key={c.id} className="p-4 border border-zinc-200 rounded-xl hover:border-indigo-300 transition-colors bg-white">
                <div className="font-bold text-zinc-900">{c.name}</div>
                <div className="text-sm text-zinc-500 mt-1">PAN: {c.pan} | GSTIN: {c.gstin}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-md">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Add New Client</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Company Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="Apex Logistics" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">PAN Number</label>
                <input required type="text" value={pan} onChange={e => setPan(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="ABCDE1234F" maxLength={10} />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">GSTIN</label>
                <input required type="text" value={gstin} onChange={e => setGstin(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="27ABCDE1234F1Z5" maxLength={15} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
                Save Client
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/pages/Clients.tsx', content);
