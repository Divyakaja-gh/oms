import React from 'react';
import { Calendar, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Clock, MoreVertical, FileText, User } from 'lucide-react';
import { Task, TaskStatus } from '../../types';

interface TaskCardProps {
  key?: React.Key;
  task: Task;
  onSelect: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

const STATUS_FLOW: TaskStatus[] = [
  'Not Started',
  'In Progress',
  'Pending Info',
  'Under Review',
  'Completed'
];

export function TaskCard({ task, onSelect, onStatusChange, onDragStart }: TaskCardProps) {
  const currentIndex = STATUS_FLOW.indexOf(task.status as TaskStatus);
  const canMoveBack = currentIndex > 0;
  const canMoveForward = currentIndex < STATUS_FLOW.length - 1;

  // Check if task is overdue
  const isOverdue = React.useMemo(() => {
    if (!task.dueDate || task.status === 'Completed') return false;
    const due = new Date(task.dueDate);
    const now = new Date();
    // Compare YYYY-MM-DD
    return due.getTime() < now.setHours(0, 0, 0, 0);
  }, [task.dueDate, task.status]);

  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, task)}
      onClick={() => onSelect(task)}
      className="bg-white rounded-xl border border-zinc-200/90 p-3.5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between select-none relative"
    >
      {/* Top Tag Row */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {task.client && (
            <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100/90 px-2 py-0.5 rounded-md truncate max-w-[120px]">
              {task.client}
            </span>
          )}
          {task.statutoryForm && (
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              {task.statutoryForm}
            </span>
          )}
        </div>

        {/* Priority Badge */}
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
            task.priority === 'High'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : task.priority === 'Low'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              task.priority === 'High'
                ? 'bg-rose-500'
                : task.priority === 'Low'
                ? 'bg-emerald-500'
                : 'bg-amber-500'
            }`}
          />
          {task.priority || 'Medium'}
        </span>
      </div>

      {/* Task Title */}
      <h4 className="text-xs sm:text-[13px] font-bold text-zinc-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors mb-2.5">
        {task.title}
      </h4>

      {/* Subtasks checklist progress bar if subtasks exist */}
      {subtasksCount > 0 && (
        <div className="mb-2.5 bg-zinc-50 border border-zinc-100 rounded-lg p-1.5">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium mb-1">
            <span>Checklist</span>
            <span className="font-semibold text-zinc-700">
              {completedSubtasks}/{subtasksCount}
            </span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-1 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(completedSubtasks / subtasksCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Due Date & Overdue Tag */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
          <span className={`font-medium ${isOverdue ? 'text-rose-600 font-bold' : ''}`}>
            {task.dueDate || 'No Date'}
          </span>
          {isOverdue && (
            <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">
              Overdue
            </span>
          )}
        </div>

        {/* Recurrence or Type Pill */}
        {task.recurrence && task.recurrence !== 'One-time' && (
          <span className="text-[9px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">
            {task.recurrence}
          </span>
        )}
      </div>

      {/* Assignee & Quick Column Move Footer */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-100">
        {/* Assignee Avatar / Name */}
        <div className="flex items-center gap-1.5 min-w-0 pr-1">
          <div className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-700 shrink-0">
            {task.assignee ? task.assignee.charAt(0).toUpperCase() : '?'}
          </div>
          <span className="text-[11px] text-zinc-600 truncate font-medium max-w-[100px]">
            {task.assignee || 'Unassigned'}
          </span>
        </div>

        {/* 1-Click Status Arrows */}
        {onStatusChange && (
          <div 
            className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {canMoveBack && (
              <button
                type="button"
                onClick={() => onStatusChange(task.id, STATUS_FLOW[currentIndex - 1])}
                className="w-5 h-5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                title={`Move to ${STATUS_FLOW[currentIndex - 1]}`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            {canMoveForward && (
              <button
                type="button"
                onClick={() => onStatusChange(task.id, STATUS_FLOW[currentIndex + 1])}
                className="w-5 h-5 rounded hover:bg-indigo-50 text-indigo-500 hover:text-indigo-700 flex items-center justify-center transition-colors cursor-pointer"
                title={`Move to ${STATUS_FLOW[currentIndex + 1]}`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
