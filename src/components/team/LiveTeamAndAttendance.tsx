import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  LogOut, 
  LogIn, 
  AlertCircle, 
  Coffee, 
  Briefcase, 
  Download, 
  Calendar, 
  Search, 
  Filter, 
  Sparkles,
  Laptop,
  Building,
  UserCheck
} from 'lucide-react';
import { AttendanceRecord, LiveTeamMember, Role, User } from '../../types';
import { INITIAL_ATTENDANCE, INITIAL_LIVE_TEAM } from '../../data/practiceAutomationData';

interface LiveTeamAndAttendanceProps {
  currentUser?: User | null;
  user?: User | null;
}

export function LiveTeamAndAttendance({ currentUser, user }: LiveTeamAndAttendanceProps) {
  const effectiveUser = currentUser || user;
  const [activeSubTab, setActiveSubTab] = useState<'live' | 'attendance'>('live');
  const [liveTeam, setLiveTeam] = useState<LiveTeamMember[]>(() => {
    const saved = localStorage.getItem('caoms_live_team');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_LIVE_TEAM;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('caoms_attendance_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_ATTENDANCE;
  });

  // Current user's daily clock-in state
  const todayStr = '2026-09-14';
  const currentUserId = currentUser?.id || 'u-1';
  const currentUserName = currentUser?.name || 'CA Aarav Sharma';
  const currentUserRole = currentUser?.role || 'partner';

  const userTodayRecord = attendanceRecords.find(
    r => r.userId === currentUserId && r.date === todayStr
  );

  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(Boolean(userTodayRecord && !userTodayRecord.checkOutTime));
  const [workLocation, setWorkLocation] = useState<'Office' | 'Client Site' | 'WFH'>('Office');
  const [clientVisited, setClientVisited] = useState('');
  const [dailyNotes, setDailyNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Live digital clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      userId: currentUserId,
      userName: currentUserName,
      userRole: currentUserRole,
      date: todayStr,
      checkInTime: timeStr,
      workLocation,
      clientVisited: workLocation === 'Client Site' ? clientVisited : undefined,
      status: now.getHours() > 10 ? 'Late' : 'Present',
      notes: dailyNotes || 'Standard shift attendance',
      ipAddress: '103.21.124.89'
    };

    const updated = [newRecord, ...attendanceRecords.filter(r => !(r.userId === currentUserId && r.date === todayStr))];
    setAttendanceRecords(updated);
    localStorage.setItem('caoms_attendance_records', JSON.stringify(updated));
    setIsCheckedIn(true);
    setStatusMessage(`Clocked in successfully at ${timeStr} (${workLocation})`);
    setTimeout(() => setStatusMessage(null), 4000);

    // Update live team member status
    setLiveTeam(prev => prev.map(m => {
      if (m.name === currentUserName || m.id === currentUserId) {
        return {
          ...m,
          status: workLocation === 'Client Site' ? 'on_site' : 'active',
          location: workLocation === 'Client Site' ? (clientVisited || 'Client Premises') : workLocation === 'WFH' ? 'Remote / Home' : 'Head Office',
          clockInTime: timeStr.slice(0, 5) + (now.getHours() >= 12 ? ' PM' : ' AM'),
          lastActive: 'Just now'
        };
      }
      return m;
    }));
  };

  const handleCheckOut = () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const updated = attendanceRecords.map(r => {
      if (r.userId === currentUserId && r.date === todayStr) {
        // Calculate rough hours
        const inParts = r.checkInTime.split(':').map(Number);
        const outParts = timeStr.split(':').map(Number);
        const total = Math.max(0.5, ((outParts[0] * 60 + outParts[1]) - (inParts[0] * 60 + inParts[1])) / 60);
        return {
          ...r,
          checkOutTime: timeStr,
          totalHours: Math.round(total * 10) / 10,
          notes: dailyNotes || r.notes
        };
      }
      return r;
    });

    setAttendanceRecords(updated);
    localStorage.setItem('caoms_attendance_records', JSON.stringify(updated));
    setIsCheckedIn(false);
    setStatusMessage(`Clocked out at ${timeStr}. Shift recorded.`);
    setTimeout(() => setStatusMessage(null), 4000);

    // Update live team member status
    setLiveTeam(prev => prev.map(m => {
      if (m.name === currentUserName || m.id === currentUserId) {
        return {
          ...m,
          status: 'offline',
          lastActive: 'Clocked out at ' + timeStr
        };
      }
      return m;
    }));
  };

  const exportAttendanceCSV = () => {
    const headers = ['Date', 'Staff Name', 'Role', 'Check-In', 'Check-Out', 'Work Location', 'Client Visited', 'Status', 'Total Hours', 'Notes', 'IP Address'];
    const rows = attendanceRecords.map(r => [
      r.date,
      `"${r.userName}"`,
      r.userRole,
      r.checkInTime,
      r.checkOutTime || 'Active',
      r.workLocation,
      `"${r.clientVisited || ''}"`,
      r.status,
      r.totalHours || '',
      `"${r.notes || ''}"`,
      r.ipAddress || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CAOMS_Attendance_Register_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                Live Team Tracking & Attendance Management
              </h2>
              <p className="text-xs text-zinc-500">
                Monitor real-time team activity, check-in/check-out logs, and field visits
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('live')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'live' 
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200' 
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Live Team Tracking ({liveTeam.filter(m => m.status !== 'offline').length} Online)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'attendance' 
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200' 
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Daily Attendance Register</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 1. LIVE TEAM TRACKING SUB-TAB */}
      {activeSubTab === 'live' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Active Staff</div>
              <div className="text-xl font-bold text-zinc-900 mt-1 flex items-center gap-2">
                <span>{liveTeam.filter(m => m.status === 'active').length}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Currently working on tasks</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Client Site / Field</div>
              <div className="text-xl font-bold text-blue-600 mt-1">
                {liveTeam.filter(m => m.status === 'on_site').length}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Stock audits & hearings</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">In Meeting</div>
              <div className="text-xl font-bold text-amber-600 mt-1">
                {liveTeam.filter(m => m.status === 'in_meeting').length}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Tax scrutiny & partner reviews</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">On Break</div>
              <div className="text-xl font-bold text-purple-600 mt-1">
                {liveTeam.filter(m => m.status === 'break').length}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Article clerk recess</div>
            </div>
          </div>

          {/* Live Staff Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveTeam.map(member => (
              <div 
                key={member.id}
                className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Status Bar */}
                <div className={`h-1.5 absolute top-0 left-0 right-0 ${
                  member.status === 'active' ? 'bg-emerald-500' :
                  member.status === 'on_site' ? 'bg-blue-500' :
                  member.status === 'in_meeting' ? 'bg-amber-500' :
                  member.status === 'break' ? 'bg-purple-500' :
                  'bg-zinc-300'
                }`} />

                <div className="flex items-start justify-between gap-3 mt-1">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">{member.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-zinc-100 text-zinc-600 font-mono">
                        {member.role}
                      </span>
                      <span className="text-[11px] text-zinc-500">In since {member.clockInTime || '09:30 AM'}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    member.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                    member.status === 'on_site' ? 'bg-blue-100 text-blue-800' :
                    member.status === 'in_meeting' ? 'bg-amber-100 text-amber-800' :
                    member.status === 'break' ? 'bg-purple-100 text-purple-800' :
                    'bg-zinc-100 text-zinc-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      member.status === 'active' ? 'bg-emerald-500' :
                      member.status === 'on_site' ? 'bg-blue-500' :
                      member.status === 'in_meeting' ? 'bg-amber-500' :
                      member.status === 'break' ? 'bg-purple-500' :
                      'bg-zinc-400'
                    }`} />
                    <span className="capitalize">{member.status.replace('_', ' ')}</span>
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Current Task</span>
                    <span className="font-medium text-zinc-800 truncate block mt-0.5">
                      {member.currentTask || 'General Practice Work'}
                    </span>
                  </div>

                  {member.clientName && (
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Client</span>
                      <span className="font-semibold text-indigo-600 truncate block mt-0.5">
                        {member.clientName}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                    <div className="flex items-center gap-1 truncate max-w-[180px]">
                      <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="truncate">{member.location}</span>
                    </div>
                    <span className="text-zinc-400 shrink-0">{member.lastActive}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ATTENDANCE MANAGEMENT SUB-TAB */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          {/* Interactive Clock-In / Clock-Out Card */}
          <div className="bg-gradient-to-r from-zinc-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold backdrop-blur-xs">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Practice Web Clock • {currentTime}</span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Good day, {currentUserName}
                </h3>
                <p className="text-xs text-indigo-200 max-w-xl">
                  Log your daily office hours, physical client visits, or remote sessions for ICAI articleship and practice timesheet compliance.
                </p>
              </div>

              {/* Action Form */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-3 min-w-[320px]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWorkLocation('Office')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      workLocation === 'Office' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                    }`}
                  >
                    Office
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkLocation('Client Site')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      workLocation === 'Client Site' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                    }`}
                  >
                    Client Site
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkLocation('WFH')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      workLocation === 'WFH' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                    }`}
                  >
                    WFH
                  </button>
                </div>

                {workLocation === 'Client Site' && (
                  <input
                    type="text"
                    placeholder="Enter Client Name / ITO Office..."
                    value={clientVisited}
                    onChange={(e) => setClientVisited(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-black/30 border border-white/20 text-white placeholder-zinc-400 focus:outline-hidden"
                  />
                )}

                <input
                  type="text"
                  placeholder="Today's focus / work notes..."
                  value={dailyNotes}
                  onChange={(e) => setDailyNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-black/30 border border-white/20 text-white placeholder-zinc-400 focus:outline-hidden"
                />

                {isCheckedIn ? (
                  <button
                    onClick={handleCheckOut}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Clock Out & End Shift</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Clock In for Today</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Daily Attendance History Table */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/60">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Attendance Log Register (September 2026)</h3>
                <p className="text-xs text-zinc-500">ICAI Form 102/103 articleship compliance and payroll records</p>
              </div>

              <button
                onClick={exportAttendanceCSV}
                className="px-3.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-zinc-500" />
                <span>Export Attendance CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Staff Member</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Check-In</th>
                    <th className="px-4 py-3">Check-Out</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-medium">
                  {attendanceRecords.map(record => (
                    <tr key={record.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-zinc-900 font-bold">{record.date}</td>
                      <td className="px-4 py-3 font-bold text-zinc-900">{record.userName}</td>
                      <td className="px-4 py-3 uppercase font-mono text-[10px] text-zinc-500">{record.userRole}</td>
                      <td className="px-4 py-3 text-emerald-700 font-mono font-bold">{record.checkInTime}</td>
                      <td className="px-4 py-3 font-mono">
                        {record.checkOutTime ? (
                          <span className="text-zinc-700">{record.checkOutTime}</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            In Session
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          record.workLocation === 'Office' ? 'bg-zinc-100 text-zinc-700' :
                          record.workLocation === 'Client Site' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {record.workLocation} {record.clientVisited ? `(${record.clientVisited})` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-zinc-900">
                        {record.totalHours ? `${record.totalHours} hrs` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          record.status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                          record.status === 'Late' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 max-w-[200px] truncate" title={record.notes}>
                        {record.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
