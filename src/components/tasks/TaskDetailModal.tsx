import React, { useState } from 'react';
import { X, Calendar, Clock, CheckSquare, Trash2, Edit3, User, Building2, AlertTriangle, ShieldCheck, Tag } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TaskSubtask } from '../../types';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (task: Task) => Promise<void> | void;
  onDeleteTask: (taskId: string) => Promise<void> | void;
}

const STATUS_OPTIONS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'Not Started', label: 'Not Started', color: 'bg-zinc-100 text-zinc-800' },
  { status: 'In Progress', label: 'In Progress', color: 'bg-amber-100 text-amber-800' },
  { status: 'Pending Info', label: 'Pending Info', color: 'bg-rose-100 text-rose-800' },
  { status: 'Under Review', label: 'Under Review', color: 'bg-indigo-100 text-indigo-800' },
  { status: 'Completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
];

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  onDeleteTask
}: TaskDetailModalProps) {
  if (!isOpen || !task) return null;

  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task.status as TaskStatus);
  const [currentPriority, setCurrentPriority] = useState<TaskPriority>(task.priority || 'Medium');
  const [currentAssignee, setCurrentAssignee] = useState(task.assignee || 'Rahul Verma (Article Clerk)');
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>(task.subtasks || []);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const toggleSubtask = async (subtaskId: string) => {
    const updated = subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    setSubtasks(updated);

    // Auto-save subtask state
    const allCompleted = updated.every(st => st.completed);
    let nextStatus = currentStatus;
    if (allCompleted && updated.length > 0 && currentStatus === 'In Progress') {
      nextStatus = 'Under Review';
      setCurrentStatus('Under Review');
    }

    await onUpdateTask({
      ...task,
      status: nextStatus,
      subtasks: updated,
    });
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setCurrentStatus(newStatus);
    await onUpdateTask({
      ...task,
      status: newStatus,
      subtasks,
    });
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    setCurrentPriority(newPriority);
    await onUpdateTask({
      ...task,
      priority: newPriority,
    });
  };

  const handleAssigneeChange = async (newAssignee: string) => {
    setCurrentAssignee(newAssignee);
    await onUpdateTask({
      ...task,
      assignee: newAssignee,
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteTask(task.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const completedCount = subtasks.filter((s) => s.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-xl max-h-[90vh] flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {task.statutoryForm && (
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-md">
                {task.statutoryForm}
              </span>
            )}
            {task.client && (
              <span className="text-xs font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                {task.client}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-zinc-200/60 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-zinc-800">
          {/* Title */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 leading-snug">
              {task.title}
            </h2>
            {task.description && (
              <p className="text-xs sm:text-sm text-zinc-600 mt-2 bg-zinc-50 p-3 rounded-xl border border-zinc-100 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>

          {/* Key Properties Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50/70 border border-zinc-200/80 rounded-xl p-3.5 text-xs">
            <div>
              <span className="text-zinc-500 font-semibold block mb-1">Workflow Status</span>
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 font-bold text-zinc-800 cursor-pointer text-xs"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.status} value={opt.status}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-zinc-500 font-semibold block mb-1">Priority Level</span>
              <select
                value={currentPriority}
                onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 font-bold text-zinc-800 cursor-pointer text-xs"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <span className="text-zinc-500 font-semibold block mb-1">Assigned Staff</span>
              <select
                value={currentAssignee}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 font-medium text-zinc-800 cursor-pointer text-xs"
              >
                <option value="Rahul Verma (Article Clerk)">Rahul Verma (Article Clerk)</option>
                <option value="CA Vikram Malhotra">CA Vikram Malhotra (Partner)</option>
                <option value="Aarav Advisors">Aarav Advisors (Admin)</option>
                <option value="T. Varsha">T. Varsha (Article)</option>
              </select>
            </div>

            <div>
              <span className="text-zinc-500 font-semibold block mb-1">Filing Deadline</span>
              <div className="flex items-center gap-1.5 text-zinc-800 font-bold py-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>{task.dueDate || 'No Due Date'}</span>
              </div>
            </div>
          </div>

          {/* Checklist & Execution Steps */}
          {subtasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <span>Execution Checklist</span>
                </h4>
                <span className="text-xs text-zinc-500 font-medium">
                  {completedCount} of {subtasks.length} completed
                </span>
              </div>

              <div className="space-y-2 bg-zinc-50/60 p-3 rounded-xl border border-zinc-200/80">
                {subtasks.map((st) => (
                  <label
                    key={st.id}
                    className="flex items-start gap-2.5 text-xs text-zinc-800 cursor-pointer p-1.5 hover:bg-white rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => toggleSubtask(st.id)}
                      className="mt-0.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className={st.completed ? 'line-through text-zinc-400' : 'font-medium'}>
                      {st.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Deletion confirmation if requested */}
          {showConfirmDelete && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Confirm Permanent Removal</span>
              </div>
              <p>Are you sure you want to delete this filing task? This action cannot be undone.</p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-full cursor-pointer transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-3 py-1 bg-white border border-rose-300 text-rose-700 font-medium rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/70 shrink-0">
          {!showConfirmDelete ? (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Task</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-full shadow-sm transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
