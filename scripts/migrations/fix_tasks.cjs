const fs = require('fs');
const content = `
import React, { useState, useEffect } from 'react';
import { CalendarDays, CheckSquare, Plus, Search, X } from 'lucide-react';
import { collection, addDoc, onSnapshot, serverTimestamp, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export function Tasks() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'tasks'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        title,
        assignee,
        status: 'Pending',
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setTitle('');
      setAssignee('');
    } catch (error) {
      console.error(error);
      alert('Failed to create task');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      <div className="p-8 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <CheckSquare className="w-6 h-6 text-indigo-600" />
              Task Master & Workflow
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Track statutory tasks generated from compliance calendar schedules.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Create Team Task
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-hidden flex gap-6 max-w-[1600px] mx-auto w-full">
        <div className="flex-1 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
             <div className="font-bold text-sm text-zinc-900 uppercase tracking-widest">Active Tasks</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center text-zinc-500 py-10">No pending tasks.</div>
            ) : (
              tasks.map(t => (
                <div key={t.id} className="p-4 border border-zinc-200 rounded-xl hover:border-indigo-300 transition-colors bg-white">
                  <div className="font-bold text-zinc-900">{t.title}</div>
                  <div className="text-sm text-zinc-500 mt-1">Assignee: {t.assignee || 'Unassigned'} | Status: {t.status}</div>
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
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Create Team Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Task Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="File Q2 Returns" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Assignee</label>
                <input type="text" value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm" placeholder="T. Varsha" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/pages/Tasks.tsx', content);
