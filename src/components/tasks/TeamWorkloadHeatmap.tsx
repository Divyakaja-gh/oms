import React from 'react';
import { Flame, Hourglass, UserCheck, ShieldAlert, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { Task } from '../../types';

interface TeamMemberWorkload {
  name: string;
  role: string;
  avatarColor: string;
  activeCount: number;
  highPriorityCount: number;
  completedCount: number;
}

interface TeamWorkloadHeatmapProps {
  tasks: Task[];
  selectedAssignee?: string | null;
  onSelectAssignee?: (assignee: string | null) => void;
}

const DEFAULT_TEAM = [
  { name: 'CA Vikram Malhotra', role: 'Partner & Signatory', avatarColor: 'bg-indigo-100 text-indigo-700' },
  { name: 'Rahul Verma (Article Clerk)', role: 'Article Clerk', avatarColor: 'bg-amber-100 text-amber-800' },
  { name: 'Aarav Advisors', role: 'Firm Admin / Partner', avatarColor: 'bg-emerald-100 text-emerald-800' },
  { name: 'T. Varsha', role: 'Article Staff', avatarColor: 'bg-purple-100 text-purple-800' },
];

export function TeamWorkloadHeatmap({
  tasks,
  selectedAssignee,
  onSelectAssignee,
}: TeamWorkloadHeatmapProps) {
  // Aggregate stats dynamically per team member
  const members: TeamMemberWorkload[] = DEFAULT_TEAM.map((member) => {
    // Check for matching tasks (by exact name or partial name match)
    const memberTasks = tasks.filter((t) => {
      if (!t.assignee) return false;
      const tAssignee = t.assignee.toLowerCase();
      const mName = member.name.toLowerCase();
      return tAssignee.includes(mName) || mName.includes(tAssignee) || 
        (member.name.includes('Aarav') && tAssignee.includes('aarav')) ||
        (member.name.includes('Rahul') && tAssignee.includes('rahul')) ||
        (member.name.includes('Vikram') && tAssignee.includes('vikram'));
    });

    const activeTasks = memberTasks.filter((t) => t.status !== 'Completed');
    const highPriorityTasks = activeTasks.filter((t) => t.priority === 'High');
    const completedTasks = memberTasks.filter((t) => t.status === 'Completed');

    return {
      name: member.name,
      role: member.role,
      avatarColor: member.avatarColor,
      activeCount: activeTasks.length,
      highPriorityCount: highPriorityTasks.length,
      completedCount: completedTasks.length,
    };
  });

  return (
    <div 
      id="team-workload-heatmap-card"
      className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between h-full"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-4 h-4 text-zinc-800 shrink-0 fill-zinc-800/10" />
          <h2 className="text-xs font-bold tracking-wider text-zinc-900 uppercase">
            TEAM WORKLOAD HEATMAP
          </h2>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed mb-4">
          Staff balancing visual index indicating uncompleted tasks. Helps avoid bottlenecks during busy filing calendars.
        </p>

        {/* Selected Assignee active filter pill */}
        {selectedAssignee && (
          <div className="mb-3 flex items-center justify-between bg-indigo-50 border border-indigo-200/70 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-indigo-900 font-medium truncate">
              Filtered: <strong>{selectedAssignee}</strong>
            </span>
            <button
              onClick={() => onSelectAssignee && onSelectAssignee(null)}
              className="text-indigo-600 hover:text-indigo-800 font-bold ml-2 cursor-pointer text-[11px]"
            >
              Reset
            </button>
          </div>
        )}

        {/* Staff balancing index list */}
        <div className="space-y-3">
          {members.map((member) => {
            const isSelected = selectedAssignee === member.name;
            const maxCapacity = 5;
            const ratio = Math.min(member.activeCount / maxCapacity, 1);
            
            // Workload color indicator
            const barColor =
              member.highPriorityCount > 0 || member.activeCount >= 4
                ? 'bg-rose-500'
                : member.activeCount >= 2
                ? 'bg-amber-500'
                : 'bg-emerald-500';

            return (
              <div
                key={member.name}
                onClick={() => onSelectAssignee && onSelectAssignee(isSelected ? null : member.name)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                    : 'border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${member.avatarColor}`}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-zinc-900 truncate">
                      {member.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 shrink-0 whitespace-nowrap">
                    {member.activeCount} active{' '}
                    <span className={member.highPriorityCount > 0 ? 'text-rose-600 font-bold' : 'text-zinc-500'}>
                      ({member.highPriorityCount} High)
                    </span>
                  </span>
                </div>

                {/* Micro Workload Progress Meter */}
                <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.max(ratio * 100, member.activeCount > 0 ? 15 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Alert / Compliance notice */}
      <div className="mt-6 bg-[#FFF9F5] border border-amber-200/60 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-zinc-600">
        <Hourglass className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Overdue filings will escalate and turn flag-red automatically. Monthly recurrence handles subinstance generations securely.
        </p>
      </div>
    </div>
  );
}
