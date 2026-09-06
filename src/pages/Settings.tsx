import React from 'react';
import { Shield, Key, Bell, Building } from 'lucide-react';

export function Settings() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Firm Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage SOC2 controls, DPDP compliance, and firm preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Security Section */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-zinc-900">Security & Access (SOC2)</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Enforce Multi-Factor Authentication (MFA)</h3>
                <p className="text-xs text-zinc-500 mt-1">Require TOTP or Passkeys for all firm partners and articles.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <hr className="border-zinc-100" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Audit Logging</h3>
                <p className="text-xs text-zinc-500 mt-1">Immutable logging of all PII access and document downloads.</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-200 inset-ring">Enforced by System</span>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex items-center gap-3">
            <Key className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-zinc-900">Data Privacy (DPDP Act)</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Auto-Mask PII Data</h3>
                <p className="text-xs text-zinc-500 mt-1">Mask PAN and Aadhaar by default on all screens for non-partner roles.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
