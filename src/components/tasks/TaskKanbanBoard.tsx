import React, { useState } from 'react';
import { Search, Filter, Plus, LayoutGrid, List, CheckCircle2, AlertCircle, ArrowUpDown } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';

interface TaskKanbanBoardProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onCreateTaskInColumn?: (status: TaskStatus) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedPriority: string;
  setSelectedPriority: (priority: string) => void;
}

interface ColumnConfig {
  status: TaskStatus;
  label: string;
  topBarColor: string;
  borderColor: string;
  countColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'Not Started',
    label: 'NOT STARTED',
    topBarColor: 'bg-zinc-800',
    borderColor: 'border-zinc-200',
    countColor: 'bg-zinc-100 text-zinc-700'
  },
  {
    status: 'In Progress',
    label: 'IN PROGRESS',
    topBarColor: 'bg-amber-500',
    borderColor: 'border-amber-200',
    countColor: 'bg-amber-50 text-amber-800'
  },
  {
    status: 'Pending Info',
    label: 'PENDING INFO',
    topBarColor: 'bg-rose-500',
    borderColor: 'border-rose-200',
    countColor: 'bg-rose-50 text-rose-800'
  },
  {
    status: 'Under Review',
    label: 'UNDER REVIEW',
    topBarColor: 'bg-indigo-600',
    borderColor: 'border-indigo-200',
    countColor: 'bg-indigo-50 text-indigo-800'
  },
  {
    status: 'Completed',
    label: 'COMPLETED',
    topBarColor: 'bg-emerald-500',
    borderColor: 'border-emerald-200',
    countColor: 'bg-emerald-50 text-emerald-800'
  }
];

export function TaskKanbanBoard({
  tasks,
  onSelectTask,
  onStatusChange,
  onCreateTaskInColumn,
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  selectedPriority,
  setSelectedPriority,
}: TaskKanbanBoardProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Group tasks by status
  const tasksByColumn = React.useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      'Not Started': [],
      'In Progress': [],
      'Pending Info': [],
      'Under Review': [],
      'Completed': []
    };

    tasks.forEach((task) => {
      // Map legacy "Pending" to "Not Started" or keep status
      let s = task.status as TaskStatus;
      if ((s as any) === 'Pending') s = 'Not Started';
      if (map[s]) {
        map[s].push(task);
      } else {
        map['Not Started'].push(task);
      }
    });

    return map;
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumn !== columnStatus) {
      setDragOverColumn(columnStatus);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onStatusChange(taskId, columnStatus);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top Filter and Search Bar matching user image */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Task Title, Client, Assignee..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Dropdowns and View Mode Switch */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          {/* Types Filter Dropdown */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Statutory">Statutory Filing</option>
            <option value="GST">GST Compliance</option>
            <option value="Tax">Income Tax & ITR</option>
            <option value="Audit">Audit & Assurance</option>
            <option value="ROC">ROC / MCA</option>
            <option value="Internal">Internal & Ad-hoc</option>
          </select>

          {/* Priorities Filter Dropdown */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          {/* View Toggle */}
          <div className="bg-zinc-100 p-0.5 rounded-xl flex items-center border border-zinc-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white shadow-xs text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
              }`}
              title="Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white shadow-xs text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Kanban Board (or List View) */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-start min-w-0 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const columnTasks = tasksByColumn[col.status] || [];
            const isDragOver = dragOverColumn === col.status;

            return (
              <div
                key={col.status}
                onDragOver={(e) => handleDragOver(e, col.status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.status)}
                className={`bg-slate-50/70 rounded-2xl border transition-all flex flex-col min-h-[480px] ${
                  isDragOver
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30'
                    : 'border-zinc-200/90 hover:border-zinc-300'
                }`}
              >
                {/* Colored Top Bar indicator matching user image */}
                <div className={`h-1.5 w-16 mx-auto mt-2.5 rounded-full ${col.topBarColor}`} />

                {/* Column Header */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] sm:text-xs font-bold tracking-wider text-zinc-800 uppercase">
                      {col.label}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-600 bg-white border border-zinc-200/80 px-2 py-0.5 rounded-full shadow-2xs">
                      {columnTasks.length}
                    </span>
                  </div>

                  {onCreateTaskInColumn && (
                    <button
                      type="button"
                      onClick={() => onCreateTaskInColumn(col.status)}
                      className="w-5 h-5 rounded hover:bg-zinc-200/70 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                      title={`Add task to ${col.label}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Column Task Cards or Empty State */}
                <div className="p-2.5 flex-1 flex flex-col gap-2.5">
                  {columnTasks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-zinc-400 text-xs select-none">
                      <span className="font-medium text-zinc-400">Empty</span>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onSelect={onSelectTask}
                        onStatusChange={onStatusChange}
                        onDragStart={handleDragStart}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed List View */
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Task & Client</th>
                  <th className="py-3 px-4">Filing Type</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      No tasks match current search or filters.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900">{task.title}</div>
                        {task.client && (
                          <div className="text-xs text-zinc-500">{task.client}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-zinc-700">
                          {task.statutoryForm || task.type || 'Standard Task'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-600">
                        {task.assignee || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            task.priority === 'High'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : task.priority === 'Low'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {task.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 font-medium">
                        {task.dueDate || 'No Date'}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={task.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                          className="text-xs font-semibold rounded-lg border border-zinc-200 px-2 py-1 bg-white cursor-pointer"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.status} value={c.status}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(task);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
