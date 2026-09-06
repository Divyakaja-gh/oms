import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  RotateCcw, 
  Sparkles, 
  Download, 
  ClipboardCheck, 
  Layers,
  CalendarCheck2
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp, 
  query, 
  where, 
  updateDoc, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Task, TaskStatus, TaskPriority } from '../types';
import { StatutoryDeadlineTicker, StatutoryDeadline } from '../components/tasks/StatutoryDeadlineTicker';
import { TeamWorkloadHeatmap } from '../components/tasks/TeamWorkloadHeatmap';
import { TaskKanbanBoard } from '../components/tasks/TaskKanbanBoard';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';

const LOCAL_STORAGE_KEY = 'aarav_advisors_tasks_v2';

const SEED_CA_TASKS: Partial<Task>[] = [
  {
    title: 'GSTR-1 Outbound Invoices (Client Apex)',
    client: 'Client Apex (Apex Industries Ltd)',
    type: 'GST',
    statutoryForm: 'GSTR-1',
    priority: 'High',
    status: 'In Progress',
    assignee: 'Rahul Verma (Article Clerk)',
    dueDate: '2026-06-11',
    recurrence: 'Monthly',
    description: 'Reconcile sales ledger with e-way bills and file outward supplies by 11th.',
    subtasks: [
      { id: 'st-1', title: 'Export Tally B2B sales invoices', completed: true },
      { id: 'st-2', title: 'Reconcile HSN summary & tax slabs', completed: true },
      { id: 'st-3', title: 'Upload JSON payload to GSTN portal', completed: false },
      { id: 'st-4', title: 'Partner sign-off & file with DSC', completed: false }
    ]
  },
  {
    title: 'Advance Tax 1st Installment (Quarterly)',
    client: 'Acme Tech Solutions Pvt Ltd',
    type: 'Tax',
    statutoryForm: 'Advance Tax',
    priority: 'High',
    status: 'Not Started',
    assignee: 'CA Vikram Malhotra',
    dueDate: '2026-06-15',
    recurrence: 'Quarterly',
    description: 'Estimate Q1 corporate profits and compute 15% statutory advance tax liability.',
    subtasks: [
      { id: 'st-21', title: 'Compute estimated annual net profit', completed: false },
      { id: 'st-22', title: 'Factor TDS credits from 26AS/AIS', completed: false },
      { id: 'st-23', title: 'Generate Challan 280 (Minor Head 100)', completed: false }
    ]
  },
  {
    title: 'GSTR-3B Monthly Return Filed',
    client: 'Zenith Global Traders LLP',
    type: 'GST',
    statutoryForm: 'GSTR-3B',
    priority: 'Medium',
    status: 'Pending Info',
    assignee: 'Rahul Verma (Article Clerk)',
    dueDate: '2026-06-20',
    recurrence: 'Monthly',
    description: 'Awaiting purchase registers and ITC invoices from client accountant for 2B match.',
    subtasks: [
      { id: 'st-31', title: 'Download auto-drafted GSTR-2B', completed: true },
      { id: 'st-32', title: 'Email client for missing vendor invoices', completed: true },
      { id: 'st-33', title: 'Compute net cash tax liability', completed: false }
    ]
  },
  {
    title: 'Tax Audit (Section 44AB) - Form 3CD Draft',
    client: 'Siddharth Exports & Logistics',
    type: 'Audit',
    statutoryForm: 'Form 3CD',
    priority: 'High',
    status: 'Under Review',
    assignee: 'CA Vikram Malhotra',
    dueDate: '2026-09-30',
    recurrence: 'Annually',
    description: 'Comprehensive 44-clause verification for partnership firm turnover exceeding ₹10 Cr.',
    subtasks: [
      { id: 'st-41', title: 'Clause 21: Related party payments 40A(2)', completed: true },
      { id: 'st-42', title: 'Clause 26: Section 43B statutory dues verification', completed: true },
      { id: 'st-43', title: 'Partner final audit memorandum review', completed: false }
    ]
  },
  {
    title: 'TDS Form 26Q Non-Salary Quarterly Filing',
    client: 'Nexus Infotech India Pvt Ltd',
    type: 'Tax',
    statutoryForm: 'TDS 26Q',
    priority: 'Low',
    status: 'Completed',
    assignee: 'Aarav Advisors',
    dueDate: '2026-07-31',
    recurrence: 'Quarterly',
    description: 'Quarterly TDS returns filed on TRACES and Form 16A certificates dispatched.',
    subtasks: [
      { id: 'st-51', title: 'Reconcile 194C contractor deductions', completed: true },
      { id: 'st-52', title: 'Run NSDL File Validation Utility (FVU)', completed: true },
      { id: 'st-53', title: 'Download and email Form 16A certificates', completed: true }
    ]
  }
];

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState<TaskStatus>('Not Started');
  const [createInitialDeadline, setCreateInitialDeadline] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [selectedDeadlineFilter, setSelectedDeadlineFilter] = useState<string | null>(null);

  // Load from LocalStorage as fallback / baseline
  const loadLocalTasks = (): Task[] => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse local tasks:', e);
    }
    return [];
  };

  const saveLocalTasks = (taskList: Task[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(taskList));
    } catch (e) {
      console.warn('Failed to save local tasks:', e);
    }
  };

  // Sync with Firestore & localStorage
  useEffect(() => {
    let unsubscribe = () => {};

    if (auth.currentUser) {
      const q = query(collection(db, 'tasks'), where('ownerId', '==', auth.currentUser.uid));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            })) as Task[];
            setTasks(data);
            saveLocalTasks(data);
            setLoading(false);
          } else {
            // Check local storage if firestore is empty
            const local = loadLocalTasks();
            if (local.length > 0) {
              setTasks(local);
            } else {
              setTasks([]);
            }
            setLoading(false);
          }
        },
        (error) => {
          console.error('Firestore tasks listener error:', error);
          const local = loadLocalTasks();
          setTasks(local);
          setLoading(false);
        }
      );
    } else {
      // Guest or local fallback
      const local = loadLocalTasks();
      setTasks(local);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Quick seed sample filings
  const handleSeedSampleFilings = async () => {
    setLoading(true);
    const newTasks: Task[] = [];

    for (const seed of SEED_CA_TASKS) {
      const taskPayload = {
        ...seed,
        ownerId: auth.currentUser?.uid || 'guest-user',
        createdAt: new Date().toISOString()
      };

      if (auth.currentUser) {
        try {
          const docRef = await addDoc(collection(db, 'tasks'), {
            ...taskPayload,
            createdAt: serverTimestamp()
          });
          newTasks.push({ id: docRef.id, ...(taskPayload as any) });
        } catch (e) {
          console.error('Failed to add doc to Firestore:', e);
          const fallbackId = `seed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          newTasks.push({ id: fallbackId, ...(taskPayload as any) });
        }
      } else {
        const fallbackId = `seed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        newTasks.push({ id: fallbackId, ...(taskPayload as any) });
      }
    }

    setTasks(newTasks);
    saveLocalTasks(newTasks);
    setLoading(false);
  };

  // Clear all tasks (returns to empty state)
  const handleClearAllTasks = async () => {
    if (!confirm('Clear all tasks from the workflow board?')) return;
    
    if (auth.currentUser) {
      try {
        for (const t of tasks) {
          await deleteDoc(doc(db, 'tasks', t.id));
        }
      } catch (e) {
        console.error('Failed to delete from Firestore:', e);
      }
    }
    setTasks([]);
    saveLocalTasks([]);
  };

  // Create Task
  const handleCreateTask = async (taskData: Partial<Task>) => {
    const payload = {
      ...taskData,
      ownerId: auth.currentUser?.uid || 'guest-user',
    };

    if (auth.currentUser) {
      try {
        const docRef = await addDoc(collection(db, 'tasks'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        const createdTask: Task = { id: docRef.id, ...(payload as any) };
        const updated = [createdTask, ...tasks];
        setTasks(updated);
        saveLocalTasks(updated);
      } catch (error) {
        console.error('Firestore create error, saving locally:', error);
        const localId = `task-${Date.now()}`;
        const createdTask: Task = { id: localId, ...(payload as any) };
        const updated = [createdTask, ...tasks];
        setTasks(updated);
        saveLocalTasks(updated);
      }
    } else {
      const localId = `task-${Date.now()}`;
      const createdTask: Task = { id: localId, ...(payload as any) };
      const updated = [createdTask, ...tasks];
      setTasks(updated);
      saveLocalTasks(updated);
    }
  };

  // Update Status
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
    setTasks(updated);
    saveLocalTasks(updated);

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'tasks', taskId), {
          status: newStatus
        });
      } catch (error) {
        console.warn('Could not update status in firestore, persisted locally:', error);
      }
    }
  };

  // Update Task (from detail modal)
  const handleUpdateTask = async (updatedTask: Task) => {
    const updated = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(updated);
    saveLocalTasks(updated);
    setSelectedTask(updatedTask);

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'tasks', updatedTask.id), {
          title: updatedTask.title,
          status: updatedTask.status,
          priority: updatedTask.priority,
          assignee: updatedTask.assignee,
          subtasks: updatedTask.subtasks || [],
          description: updatedTask.description || ''
        });
      } catch (error) {
        console.warn('Could not update task in firestore, saved locally:', error);
      }
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    saveLocalTasks(updated);

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (error) {
        console.warn('Could not delete task in firestore:', error);
      }
    }
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search query filter (title, client, assignee, statutoryForm)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesClient = t.client ? t.client.toLowerCase().includes(q) : false;
        const matchesAssignee = t.assignee ? t.assignee.toLowerCase().includes(q) : false;
        const matchesForm = t.statutoryForm ? t.statutoryForm.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesClient && !matchesAssignee && !matchesForm) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'All') {
        const typeMatch = t.type?.toLowerCase().includes(selectedType.toLowerCase()) ||
          t.statutoryForm?.toLowerCase().includes(selectedType.toLowerCase());
        if (!typeMatch) return false;
      }

      // Priority filter
      if (selectedPriority !== 'All') {
        if (t.priority !== selectedPriority) return false;
      }

      // Assignee filter from Heatmap
      if (selectedAssignee) {
        const m = selectedAssignee.toLowerCase();
        const a = (t.assignee || '').toLowerCase();
        const isMatch = a.includes(m) || m.includes(a) ||
          (selectedAssignee.includes('Aarav') && a.includes('aarav')) ||
          (selectedAssignee.includes('Rahul') && a.includes('rahul')) ||
          (selectedAssignee.includes('Vikram') && a.includes('vikram'));
        if (!isMatch) return false;
      }

      // Statutory Deadline ticker filter
      if (selectedDeadlineFilter) {
        const df = selectedDeadlineFilter.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(df);
        const matchesForm = t.statutoryForm ? t.statutoryForm.toLowerCase().includes(df) : false;
        const matchesClient = t.client ? t.client.toLowerCase().includes(df) : false;
        if (!matchesTitle && !matchesForm && !matchesClient) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedType, selectedPriority, selectedAssignee, selectedDeadlineFilter]);

  return (
    <div className="min-h-full flex flex-col bg-[#FAFAFA]">
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1720px] mx-auto w-full space-y-6">
        
        {/* 1. TOP STATUTORY DEADLINE TICKER BANNER (Identical to user image) */}
        <StatutoryDeadlineTicker
          selectedFilter={selectedDeadlineFilter}
          onSelectDeadline={(deadline) => {
            setSelectedDeadlineFilter(deadline ? deadline.form : null);
          }}
          onQuickCreateTask={(deadline) => {
            setCreateInitialDeadline(deadline);
            setCreateInitialStatus('Not Started');
            setIsCreateModalOpen(true);
          }}
        />

        {/* 2. MAIN HEADER ROW (Identical to user image) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-2xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
                <span>Task Workflow Board & Recurrences</span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
                Track statutory tasks generated from compliance calendar schedules alongside ad-hoc and internal operations.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {tasks.length === 0 ? (
              <button
                type="button"
                onClick={handleSeedSampleFilings}
                className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 px-3.5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                title="Populate board with sample statutory CA filings"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Populate Sample Filings</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClearAllTasks}
                className="text-xs text-zinc-500 hover:text-zinc-800 px-2.5 py-2 transition-colors cursor-pointer"
                title="Reset board to empty state"
              >
                Reset Board
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setCreateInitialDeadline(null);
                setCreateInitialStatus('Not Started');
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team Task</span>
            </button>
          </div>
        </div>

        {/* 3. TWO-COLUMN WORK AREA: LEFT HEATMAP & RIGHT KANBAN BOARD */}
        <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
          
          {/* Left Column: Team Workload Heatmap Card */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0">
            <TeamWorkloadHeatmap
              tasks={tasks}
              selectedAssignee={selectedAssignee}
              onSelectAssignee={setSelectedAssignee}
            />
          </div>

          {/* Right Column: Kanban Workflow Board with 5 Columns & Filters */}
          <div className="flex-1 w-full min-w-0">
            <TaskKanbanBoard
              tasks={filteredTasks}
              onSelectTask={(task) => setSelectedTask(task)}
              onStatusChange={handleStatusChange}
              onCreateTaskInColumn={(status) => {
                setCreateInitialDeadline(null);
                setCreateInitialStatus(status);
                setIsCreateModalOpen(true);
              }}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              selectedPriority={selectedPriority}
              setSelectedPriority={setSelectedPriority}
            />
          </div>
        </div>
      </div>

      {/* Create Team Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateInitialDeadline(null);
        }}
        onCreate={handleCreateTask}
        initialStatus={createInitialStatus}
        initialDeadline={createInitialDeadline}
      />

      {/* Task Details / Edit Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}
export default Tasks;
