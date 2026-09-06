const fs = require('fs');
const content = `
import React, { useState, useEffect } from 'react';
import { BookOpen, UploadCloud, Search, X } from 'lucide-react';
import { collection, addDoc, onSnapshot, serverTimestamp, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export function KnowledgeBase() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'materials'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaterials(data);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'materials'), {
        title,
        category,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setTitle('');
      setCategory('');
    } catch (error) {
      console.error(error);
      alert('Failed to upload material');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      <div className="p-8 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Practice Knowledge Base
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Unified office repository for regulatory formats.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm">
            <UploadCloud className="w-4 h-4" />
            Upload document
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-hidden max-w-[1600px] mx-auto w-full space-y-6">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h2 className="font-bold text-sm text-zinc-900 uppercase tracking-widest">Documents</h2>
          </div>
          <div className="p-4 space-y-3">
            {materials.length === 0 ? (
              <div className="text-center text-zinc-500 py-10">No materials attached.</div>
            ) : (
              materials.map(m => (
                <div key={m.id} className="p-4 border border-zinc-200 rounded-xl hover:border-indigo-300 transition-colors bg-white">
                  <div className="font-bold text-zinc-900">{m.title}</div>
                  <div className="text-sm text-zinc-500 mt-1">Category: {m.category}</div>
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
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Upload document</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Document Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="Audit SOP 2026" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Category</label>
                <input required type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="SOPs" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
                Upload
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/pages/KnowledgeBase.tsx', content);
