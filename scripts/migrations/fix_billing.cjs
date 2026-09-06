const fs = require('fs');
const content = `
import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, X } from 'lucide-react';
import { collection, addDoc, onSnapshot, serverTimestamp, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export function Billing() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [client, setClient] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'invoices'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvoices(data);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'invoices'), {
        client,
        amount: Number(amount),
        status: 'Unpaid',
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setClient('');
      setAmount('');
    } catch (error) {
      console.error(error);
      alert('Failed to create invoice');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      <div className="p-8 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <span className="text-indigo-600 font-normal">₹</span>
              Billing, Invoicing, & GST Records
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Raise GST compliant bills and track payments.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-hidden max-w-[1600px] mx-auto w-full space-y-6">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h2 className="font-bold text-sm text-zinc-900 uppercase tracking-widest">Recent Invoices</h2>
          </div>
          <div className="p-4 space-y-3">
            {invoices.length === 0 ? (
              <div className="text-center text-zinc-500 py-10">No invoices raised yet.</div>
            ) : (
              invoices.map(i => (
                <div key={i.id} className="p-4 border border-zinc-200 rounded-xl hover:border-indigo-300 transition-colors bg-white flex justify-between items-center">
                  <div>
                    <div className="font-bold text-zinc-900">{i.client}</div>
                    <div className="text-sm text-zinc-500 mt-1">Status: {i.status}</div>
                  </div>
                  <div className="font-bold text-indigo-600">₹{i.amount}</div>
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
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Raise Invoice</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Client Name</label>
                <input required type="text" value={client} onChange={e => setClient(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="Apex Logistics" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Amount (₹)</label>
                <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="10000" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
                Save Invoice
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/pages/Billing.tsx', content);
