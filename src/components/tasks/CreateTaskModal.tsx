import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, User, FileText, CheckSquare, Sparkles, Building2 } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TaskType } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (taskData: Partial<Task>) => Promise<void> | void;
  initialStatus?: TaskStatus;
  initialDeadline?: any;
}

const COMMON_CLIENTS = [
  'Client Apex (Apex Industries Ltd)',
  'Acme Tech Solutions Pvt Ltd',
  'Zenith Global Traders LLP',
  'Nexus Infotech India Pvt Ltd',
  'Siddharth Exports & Logistics'
];

const STATUTORY_TEMPLATES = [
  { name: 'GSTR-1 Outbound Invoices', form: 'GSTR-1', type: 'GST', priority: 'High', steps: ['Download sales ledger from Tally', 'Reconcile B2B invoices & HSN', 'Upload JSON to GST Portal', 'Generate summary and verify taxes'] },
  { name: 'GSTR-3B Monthly Return Filing', form: 'GSTR-3B', type: 'GST', priority: 'High', steps: ['Download GSTR-2B ITC statement', 'Reconcile input tax credit', 'Calculate net tax payable via cash ledger', 'File with EVC / DSC'] },
  { name: 'Advance Tax 1st Installment (Quarterly)', form: 'Advance Tax', type: 'Tax', priority: 'Medium', steps: ['Estimate Q1 profit & loss figures', 'Compute 15% advance tax liability', 'Generate Challan 280 (Minor Head 100)', 'Verify payment confirmation BSR code'] },
  { name: 'TDS Form 26Q (Quarterly Non-Salary)', form: 'TDS 26Q', type: 'Tax', priority: 'Medium', steps: ['Extract 194C / 194J / 194I deductions', 'Match challan details with OLTAS', 'Validate file with NSDL RPU / FVU', 'Upload to TRACES / Income Tax portal'] },
  { name: 'Tax Audit (Section 44AB) - Form 3CD', form: 'Form 3CD', type: 'Audit', priority: 'High', steps: ['Verify Depreciation Schedule', 'Audit 40A(2) related party payments', 'Check 43B statutory dues payment dates', 'Prepare Draft 3CA/3CD for Partner review'] }
];

export function CreateTaskModal({
  isOpen,
  onClose,
  onCreate,
  initialStatus = 'Not Started',
  initialDeadline
}: CreateTaskModalProps) {
  const [title, setTitle] = useState(initialDeadline ? initialDeadline.title : '');
  const [client, setClient] = useState(initialDeadline?.client || 'Client Apex (Apex Industries Ltd)');
  const [type, setType] = useState<string>(initialDeadline ? 'Statutory' : 'Statutory');
  const [statutoryForm, setStatutoryForm] = useState(initialDeadline?.form || 'GSTR-1');
  const [priority, setPriority] = useState<TaskPriority>(initialDeadline?.urgency === 'high' ? 'High' : 'Medium');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [assignee, setAssignee] = useState('Rahul Verma (Article Clerk)');
  const [dueDate, setDueDate] = useState(initialDeadline?.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState<'One-time' | 'Monthly' | 'Quarterly' | 'Annually'>('Monthly');
  const [description, setDescription] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([
    { id: 'step-1', title: 'Collect raw tally vouchers & purchase registers', completed: false },
    { id: 'step-2', title: 'Verify statutory compliance & tax calculations', completed: false },
    { id: 'step-3', title: 'Partner review & sign-off', completed: false }
  ]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: typeof STATUTORY_TEMPLATES[0]) => {
    setTitle(tmpl.name);
    setStatutoryForm(tmpl.form);
    setType(tmpl.type);
    setPriority(tmpl.priority as TaskPriority);
    setSubtasks(tmpl.steps.map((st, idx) => ({
      id: `tmpl-${idx}-${Date.now()}`,
      title: st,
      completed: false
    })));
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: `step-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false }
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        client: client.trim(),
        type,
        statutoryForm,
        priority,
        status,
        assignee,
        dueDate,
        recurrence,
        description: description.trim(),
        subtasks,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-2xl my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900">
                Create Team Task & Statutory Filing
              </h3>
              <p className="text-xs text-zinc-500">
                Generate workflow item with article assignment and compliance schedule.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-zinc-200/60 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Quick Statutory Preset Templates */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Statutory Presets:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUTORY_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.form}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="text-[11px] font-semibold bg-zinc-50 hover:bg-indigo-50 hover:text-indigo-700 text-zinc-700 px-2.5 py-1 rounded-lg border border-zinc-200 hover:border-indigo-200 transition-colors cursor-pointer"
                >
                  +{tmpl.form}
                </button>
              ))}
            </div>
          </div>

          {/* Task Title */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. GSTR-1 Outbound Invoices (Client Apex)"
            />
          </div>

          {/* Client and Statutory Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Client Entity
              </label>
              <input
                type="text"
                list="client-options"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Select or enter client name"
              />
              <datalist id="client-options">
                {COMMON_CLIENTS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Statutory Form / Act
              </label>
              <input
                type="text"
                value={statutoryForm}
                onChange={(e) => setStatutoryForm(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="e.g. GSTR-1, GSTR-3B, Advance Tax, ITR-6"
              />
            </div>
          </div>

          {/* Assignee and Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Assignee
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="Rahul Verma (Article Clerk)">Rahul Verma (Article Clerk)</option>
                <option value="CA Vikram Malhotra">CA Vikram Malhotra (Partner)</option>
                <option value="Aarav Advisors">Aarav Advisors (Admin)</option>
                <option value="T. Varsha">T. Varsha (Article)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Workflow Column
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Info">Pending Info</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date & Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Statutory Deadline
              </label>
              <input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Recurrence Cycle
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="One-time">One-time / Ad-hoc</option>
                <option value="Monthly">Monthly Recurrence</option>
                <option value="Quarterly">Quarterly Recurrence</option>
                <option value="Annually">Annually Recurrence</option>
              </select>
            </div>
          </div>

          {/* Subtasks / Checklist Builder */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              Checklist & Execution Steps ({subtasks.length})
            </label>
            <div className="space-y-2 mb-2">
              {subtasks.map((st, index) => (
                <div key={st.id} className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 px-3 py-1.5 rounded-lg text-xs">
                  <span className="text-zinc-400 font-bold">{index + 1}.</span>
                  <span className="flex-1 text-zinc-800">{st.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="text-zinc-400 hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new subtask row */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add checklist step (e.g. Verify 26AS matching)"
                className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Description & Scope Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              Filing Instructions / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="Provide specific notes for the article clerk or client requirements..."
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-full shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? 'Creating...' : 'Create Team Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
