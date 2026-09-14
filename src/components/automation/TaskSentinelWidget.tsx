import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  ChevronRight, 
  Sparkles, 
  Calendar, 
  Building2,
  X,
  RotateCcw
} from 'lucide-react';
import { TaskSentinelAlert, Task } from '../../types';
import { INITIAL_TASK_SENTINEL_ALERTS } from '../../data/practiceAutomationData';

interface TaskSentinelWidgetProps {
  onAutoCreateTask?: (task: Partial<Task>) => void;
  onAutoCreateAll?: (tasks: Partial<Task>[]) => void;
}

export function TaskSentinelWidget({ onAutoCreateTask, onAutoCreateAll }: TaskSentinelWidgetProps) {
  const [alerts, setAlerts] = useState<TaskSentinelAlert[]>(() => {
    const saved = localStorage.getItem('caoms_sentinel_alerts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_TASK_SENTINEL_ALERTS;
  });

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [createdAlertIds, setCreatedAlertIds] = useState<string[]>([]);
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const activeAlerts = alerts.filter(
    a => !dismissedAlerts.includes(a.id) && !createdAlertIds.includes(a.id)
  );

  const handleCreateSingle = (alert: TaskSentinelAlert) => {
    const newTask: Partial<Task> = {
      id: `sentinel-task-${alert.id}-${Date.now()}`,
      title: alert.suggestedTaskTitle,
      client: alert.clientName,
      type: alert.complianceCategory === 'GST' ? 'GST' : alert.complianceCategory === 'TDS' ? 'Tax' : alert.complianceCategory === 'MCA' ? 'ROC' : 'Tax',
      priority: alert.priority,
      status: 'Not Started',
      dueDate: alert.dueDate,
      description: `Task auto-spawned by Sentinel Audit Engine: ${alert.reason}`,
      recurrence: alert.complianceCategory === 'GST' ? 'Monthly' : alert.complianceCategory === 'TDS' ? 'Quarterly' : 'Annually'
    };

    if (onAutoCreateTask) {
      onAutoCreateTask(newTask);
    }

    setCreatedAlertIds(prev => [...prev, alert.id]);
  };

  const handleCreateAll = () => {
    setIsProcessingAll(true);
    const newTasks = activeAlerts.map(alert => ({
      id: `sentinel-task-${alert.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: alert.suggestedTaskTitle,
      client: alert.clientName,
      type: alert.complianceCategory === 'GST' ? 'GST' : alert.complianceCategory === 'TDS' ? 'Tax' : alert.complianceCategory === 'MCA' ? 'ROC' : 'Tax',
      priority: alert.priority,
      status: 'Not Started' as const,
      dueDate: alert.dueDate,
      description: `Task auto-spawned by Sentinel Audit Engine: ${alert.reason}`,
      recurrence: alert.complianceCategory === 'GST' ? 'Monthly' as const : alert.complianceCategory === 'TDS' ? 'Quarterly' as const : 'Annually' as const
    }));

    setTimeout(() => {
      if (onAutoCreateAll) {
        onAutoCreateAll(newTasks);
      }
      setCreatedAlertIds(prev => [...prev, ...activeAlerts.map(a => a.id)]);
      setIsProcessingAll(false);
    }, 500);
  };

  if (activeAlerts.length === 0) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <span>Task Sentinel Integrity: 100% Verified</span>
              <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-1.5 py-0.5 rounded font-mono">No Missing Tasks</span>
            </div>
            <div className="text-[11px] text-emerald-700">
              All active GST, TDS, and MCA registered clients have current-period compliance tasks assigned.
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setCreatedAlertIds([]);
            setDismissedAlerts([]);
          }}
          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
        >
          Re-scan Database
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 pb-3 border-b border-amber-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-600/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-amber-950">
                Task-Not-Created Sentinel ({activeAlerts.length} Warnings)
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-600 text-white animate-pulse">
                Action Required
              </span>
            </div>
            <p className="text-[11px] text-amber-800">
              The automated compliance audit discovered active statutory clients with no filing tasks created for the active period.
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateAll}
          disabled={isProcessingAll}
          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shrink-0"
        >
          {isProcessingAll ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              <span>Auto-Creating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Create All ({activeAlerts.length}) Tasks</span>
            </>
          )}
        </button>
      </div>

      {/* Alert Cards */}
      <div className="space-y-2.5">
        {activeAlerts.map(alert => (
          <div 
            key={alert.id}
            className="bg-white/90 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-amber-400 transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-0.5 shrink-0 ${
                alert.complianceCategory === 'GST' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                alert.complianceCategory === 'TDS' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                alert.complianceCategory === 'MCA' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {alert.complianceCategory}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900">{alert.clientName}</span>
                  {alert.clientGstin && (
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded">
                      {alert.clientGstin}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                  {alert.reason}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-500">
                  <span className="font-semibold text-amber-900">Suggested: {alert.suggestedTaskTitle}</span>
                  <span>•</span>
                  <span>Due: {alert.dueDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => setDismissedAlerts(prev => [...prev, alert.id])}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors"
                title="Dismiss Warning"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleCreateSingle(alert)}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-indigo-600 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>Auto-Create</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
