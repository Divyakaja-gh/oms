import React from 'react';
import { Bell, Search, Shield, User as UserIcon } from 'lucide-react';
import { User } from '../../types';
import { CreditPill } from '../credits/CreditPill';

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search clients, PAN, GSTIN..." 
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6">
        <CreditPill />

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">

          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-medium text-emerald-700">MFA Active</span>
        </div>
        
        <button className="relative p-2 text-zinc-500 hover:text-zinc-700 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-zinc-200">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-zinc-900">{user.name}</span>
            <span className="text-xs text-zinc-500 capitalize">{user.role} • {user.firmName}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600">
            <UserIcon className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
