import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Download,
  Copy,
  CheckCircle2,
  ExternalLink,
  Plus,
  Eye,
  Code2,
  BookOpen,
  FileCheck,
  Star,
  Check,
  Trash2,
  Edit3,
  Sliders,
  ChevronRight,
  Info,
  Scale
} from 'lucide-react';
import { StatutoryFilingTemplate, StatutoryCategory, StatutoryFilingFrequency, TemplateFieldSchema, StatutoryValidationRule } from '../../types';
import { INITIAL_STATUTORY_TEMPLATES } from '../../data/statutoryTemplatesData';

export function StatutoryTemplatesSection() {
  // Local storage backed state for templates
  const [templates, setTemplates] = useState<StatutoryFilingTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('caoms_statutory_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_STATUTORY_TEMPLATES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string>(INITIAL_STATUTORY_TEMPLATES[0].id);
  const [activeTab, setActiveTab] = useState<'overview' | 'fields' | 'formPreview' | 'validation' | 'jsonSchema' | 'guidelines'>('overview');
  
  // Create / Customize modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Form preview interactive test fill state
  const [testFormData, setTestFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [testValidationSuccess, setTestValidationSuccess] = useState(false);

  // Persist templates to localStorage
  const saveTemplates = (newTemplates: StatutoryFilingTemplate[]) => {
    setTemplates(newTemplates);
    try {
      localStorage.setItem('caoms_statutory_templates', JSON.stringify(newTemplates));
    } catch {
      // ignore
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templates.map(t => t.id === id ? { ...t, isFavorite: !t.isFavorite } : t);
    saveTemplates(updated);
  };

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(tpl => {
      if (onlyFavorites && !tpl.isFavorite) return false;
      if (selectedCategory !== 'ALL' && tpl.category !== selectedCategory) return false;
      if (selectedFrequency !== 'ALL' && tpl.frequency !== selectedFrequency) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = tpl.title.toLowerCase().includes(q);
        const matchesCode = tpl.templateCode.toLowerCase().includes(q);
        const matchesLaw = tpl.applicableLaw.toLowerCase().includes(q);
        const matchesDesc = tpl.description.toLowerCase().includes(q);
        const matchesTag = tpl.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCode && !matchesLaw && !matchesDesc && !matchesTag) {
          return false;
        }
      }
      return true;
    });
  }, [templates, selectedCategory, selectedFrequency, searchQuery, onlyFavorites]);

  const activeTemplate = useMemo(() => {
    return templates.find(t => t.id === activeTemplateId) || filteredTemplates[0] || templates[0];
  }, [templates, activeTemplateId, filteredTemplates]);

  // Categories list for pills
  const categories: { label: string; value: string }[] = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'GST', value: 'GST' },
    { label: 'Direct Tax & TDS', value: 'Direct Tax & TDS' },
    { label: 'MCA & Corporate Law', value: 'MCA & Corporate Law' },
    { label: 'Labor & Payroll', value: 'Labor & Payroll' },
    { label: 'Audit & Assurance', value: 'Audit & Assurance' },
  ];

  const frequencies: string[] = ['ALL', 'Monthly', 'Quarterly', 'Annual', 'Event-Based'];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const downloadJson = (template: StatutoryFilingTemplate) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${template.templateCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}_schema.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Test form validation logic
  const handleTestFieldChange = (key: string, value: any) => {
    setTestFormData(prev => ({ ...prev, [key]: value }));
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    setTestValidationSuccess(false);
  };

  const runTestValidation = () => {
    if (!activeTemplate) return;
    const errors: Record<string, string> = {};

    activeTemplate.fieldSchemas.forEach(field => {
      const val = testFormData[field.key];
      if (field.required && (val === undefined || val === '' || val === null)) {
        errors[field.key] = `${field.label} is required as per statutory specification.`;
      } else if (val) {
        if (field.type === 'gstin') {
          const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
          if (!gstinRegex.test(String(val).toUpperCase())) {
            errors[field.key] = 'Invalid 15-character GSTIN format (e.g., 27AABCU9603R1ZM).';
          }
        } else if (field.type === 'pan') {
          const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
          if (!panRegex.test(String(val).toUpperCase())) {
            errors[field.key] = 'Invalid 10-character PAN format (e.g., AABCU9603R).';
          }
        }
      }
    });

    setValidationErrors(errors);
    if (Object.keys(errors).length === 0) {
      setTestValidationSuccess(true);
    } else {
      setTestValidationSuccess(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Stats */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 tracking-widest uppercase border border-indigo-100">
                ICAI & STATUTORY STANDARDIZATION REPOSITORY
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> AY 2026-27 COMPLIANT
              </span>
            </div>
            <h2 className="text-xl font-bold text-zinc-900">Standardized Statutory Filing Templates</h2>
            <p className="text-xs text-zinc-500 mt-1 max-w-3xl">
              Inspect, customize, and deploy standardized data schemas, statutory validation checklists, and legal reporting templates for GST, Direct Tax & TDS, MCA/ROC, and Labor Laws.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const schemaMarkdown = `# Statutory Filing Templates Export (${templates.length} Models)\n\n` + 
                  templates.map(t => `### ${t.title} (${t.templateCode})\n- **Authority**: ${t.authority}\n- **Law**: ${t.applicableLaw}\n- **Due Date**: ${t.standardDueDateDescription}\n- **Fields**: ${t.fieldSchemas.map(f => f.label).join(', ')}\n`).join('\n\n');
                copyToClipboard(schemaMarkdown, 'Catalog exported as Markdown');
              }}
              className="px-3 py-2 text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-all flex items-center gap-2"
              title="Export complete schema catalog as Markdown"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export Catalog</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Filing Template</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-zinc-100">
          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">TOTAL TEMPLATES</span>
            <span className="text-xl font-bold text-zinc-900 mt-0.5 block">{templates.length} Models</span>
            <span className="text-[10px] text-zinc-500 font-medium">GST, ITD, MCA, EPFO</span>
          </div>

          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">STANDARDIZED SCHEMAS</span>
            <span className="text-xl font-bold text-zinc-900 mt-0.5 block">{templates.filter(t => t.isStandardized).length} Active</span>
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 inline" /> 100% Verified
            </span>
          </div>

          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">SCHEMA FIELDS MAPPED</span>
            <span className="text-xl font-bold text-zinc-900 mt-0.5 block">
              {templates.reduce((acc, t) => acc + t.fieldSchemas.length, 0)} Data Points
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">With Live Validation</span>
          </div>

          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">VALIDATION CHECKS</span>
            <span className="text-xl font-bold text-zinc-900 mt-0.5 block">
              {templates.reduce((acc, t) => acc + t.validationChecklist.length, 0)} Statutory Rules
            </span>
            <span className="text-[10px] text-amber-600 font-medium">Prevents Scrutiny SCNs</span>
          </div>
        </div>
      </div>

      {/* Copy Notification Toast */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-zinc-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Main Workspace Layout (Sidebar List + Comprehensive Detail Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Template Navigator & Filterable Library (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Search & Category Filter Controls */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search templates, sections, laws, forms..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-zinc-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.value
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sub Filters (Frequency & Favorites) */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Frequency:</span>
                <select
                  value={selectedFrequency}
                  onChange={e => setSelectedFrequency(e.target.value)}
                  className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {frequencies.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-all ${
                  onlyFavorites
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Star className={`w-3 h-3 ${onlyFavorites ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>Starred</span>
              </button>
            </div>
          </div>

          {/* Template Cards List */}
          <div className="space-y-2.5 max-h-[850px] overflow-y-auto pr-1">
            {filteredTemplates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
                <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-700">No matching statutory templates</p>
                <p className="text-[11px] text-zinc-500 mt-1">Try refining your search terms or filter selections.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setSelectedFrequency('ALL');
                    setOnlyFavorites(false);
                  }}
                  className="mt-3 text-xs text-indigo-600 font-bold hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              filteredTemplates.map(tpl => {
                const isSelected = tpl.id === activeTemplate?.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setActiveTemplateId(tpl.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative ${
                      isSelected
                        ? 'bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-600'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            tpl.category === 'GST' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            tpl.category === 'Direct Tax & TDS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            tpl.category === 'MCA & Corporate Law' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            tpl.category === 'Labor & Payroll' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                            'bg-zinc-100 text-zinc-700'
                          }`}>
                            {tpl.category}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-zinc-500">
                            {tpl.templateCode}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 line-clamp-1 leading-snug">
                          {tpl.title}
                        </h4>
                      </div>

                      <button
                        onClick={e => toggleFavorite(tpl.id, e)}
                        className="p-1 rounded-lg text-zinc-300 hover:text-amber-500 transition-colors"
                        title={tpl.isFavorite ? 'Remove from favorites' : 'Star template'}
                      >
                        <Star className={`w-3.5 h-3.5 ${tpl.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>

                    <p className="text-[11px] text-zinc-500 line-clamp-2 mt-2 leading-relaxed">
                      {tpl.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 text-[10px] text-zinc-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{tpl.frequency}</span>
                      </span>
                      <span className="font-semibold text-zinc-600">
                        {tpl.fieldSchemas.length} Fields · {tpl.validationChecklist.length} Rules
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Column: Deep Template Detail Inspector & Interactive Views (8 cols) */}
        <div className="lg:col-span-8">
          {activeTemplate ? (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden space-y-0">
              
              {/* Template Title Header */}
              <div className="p-6 border-b border-zinc-100 bg-zinc-50/40">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 text-white tracking-widest uppercase">
                        {activeTemplate.templateCode}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {activeTemplate.authority}
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-500">
                        Version: {activeTemplate.version}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 leading-tight">
                      {activeTemplate.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadJson(activeTemplate)}
                      className="px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                      title="Download full JSON schema"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Download JSON</span>
                    </button>

                    <button
                      onClick={() => copyToClipboard(JSON.stringify(activeTemplate, null, 2), `${activeTemplate.templateCode} JSON copied to clipboard`)}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Spec</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex items-center gap-2 mt-6 overflow-x-auto border-b border-zinc-200 pb-px scrollbar-none">
                  {[
                    { id: 'overview', label: 'Statutory Overview', icon: BookOpen },
                    { id: 'fields', label: `Field Schema (${activeTemplate.fieldSchemas.length})`, icon: Sliders },
                    { id: 'formPreview', label: 'Interactive Form & Test-Fill', icon: FileCheck },
                    { id: 'validation', label: `Validation Rules (${activeTemplate.validationChecklist.length})`, icon: ShieldCheck },
                    { id: 'jsonSchema', label: 'JSON Sample Spec', icon: Code2 },
                    { id: 'guidelines', label: 'ICAI & Compliance Notes', icon: Scale },
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                          isActive
                            ? 'text-indigo-600 border-indigo-600'
                            : 'text-zinc-500 border-transparent hover:text-zinc-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content Body */}
              <div className="p-6">
                
                {/* 1. Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">FILING DESCRIPTION & SCOPE</h4>
                      <p className="text-xs text-zinc-700 leading-relaxed bg-zinc-50/60 p-4 rounded-xl border border-zinc-100">
                        {activeTemplate.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                          <Scale className="w-4 h-4 text-indigo-600" />
                          <span>Applicable Statutory Provision</span>
                        </div>
                        <p className="text-xs text-zinc-800 font-semibold bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                          {activeTemplate.applicableLaw}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2">
                        <div className="flex items-center gap-2 text-zinc-700 font-bold text-xs">
                          <Clock className="w-4 h-4 text-zinc-600" />
                          <span>Standard Due Date Rule</span>
                        </div>
                        <p className="text-xs text-zinc-800 font-semibold bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                          {activeTemplate.standardDueDateDescription}
                        </p>
                      </div>
                    </div>

                    {/* Penalty Provisions Box */}
                    <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Statutory Penalty, Late Fees & Interest Provisions</span>
                      </div>
                      <p className="text-xs text-rose-900 leading-relaxed font-medium">
                        {activeTemplate.penaltyAndLateFeeProvisions}
                      </p>
                    </div>

                    {/* Mandatory Attachments */}
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">MANDATORY STATUTORY ATTACHMENTS & EVIDENCES</h4>
                      <div className="space-y-2">
                        {activeTemplate.mandatoryAttachments.map((att, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs text-zinc-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{att}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">TAXONOMY TAGS</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {activeTemplate.tags.map(tag => (
                          <span key={tag} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Field Schema Tab */}
                {activeTab === 'fields' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-500">
                        Standardized data dictionary specifications mapped to statutory portal e-filing payloads.
                      </p>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                        {activeTemplate.fieldSchemas.length} Standard Fields
                      </span>
                    </div>

                    <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Field Label & Key</th>
                            <th className="px-4 py-3">Data Type</th>
                            <th className="px-4 py-3">Required</th>
                            <th className="px-4 py-3">Statutory Description / Constraints</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {activeTemplate.fieldSchemas.map((field) => (
                            <tr key={field.id} className="hover:bg-zinc-50/50">
                              <td className="px-4 py-3">
                                <span className="font-bold text-zinc-900 block">{field.label}</span>
                                <span className="font-mono text-[10px] text-indigo-600 block mt-0.5">{field.key}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 text-zinc-700 uppercase">
                                  {field.type}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {field.required ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                    Mandatory
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-500">
                                    Optional
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-zinc-600">
                                <span>{field.description || 'Standard field value'}</span>
                                {field.validationRule && (
                                  <span className="block text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 border border-amber-100 w-fit">
                                    Rule: {field.validationRule}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. Interactive Form & Test-Fill Tab */}
                {activeTab === 'formPreview' && (
                  <div className="space-y-6">
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-indigo-950">Interactive Schema Playground</h4>
                        <p className="text-[11px] text-indigo-800 mt-0.5">
                          Test-fill the standardized statutory schema to verify required fields, regex validations (PAN/GSTIN), and computation consistency prior to portal submission.
                        </p>
                      </div>
                    </div>

                    {testValidationSuccess && (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 animate-in fade-in">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-emerald-900">Pre-Filing Validation Successful!</h5>
                          <p className="text-[11px] text-emerald-700">All mandatory statutory fields and syntax formats adhere to current legal guidelines.</p>
                        </div>
                      </div>
                    )}

                    {Object.keys(validationErrors).length > 0 && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1 animate-in fade-in">
                        <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Validation Errors Detected ({Object.keys(validationErrors).length})</span>
                        </div>
                        <ul className="list-disc list-inside text-[11px] text-rose-700 pl-1">
                          {Object.entries(validationErrors).map(([k, msg]) => (
                            <li key={k}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeTemplate.fieldSchemas.map((field) => (
                        <div key={field.id} className="space-y-1">
                          <label className="text-xs font-bold text-zinc-800 flex items-center justify-between">
                            <span>
                              {field.label} {field.required && <span className="text-rose-500">*</span>}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400 uppercase">{field.type}</span>
                          </label>

                          {field.type === 'select' && field.options ? (
                            <select
                              value={testFormData[field.key] || ''}
                              onChange={e => handleTestFieldChange(field.key, e.target.value)}
                              className={`w-full px-3 py-2 bg-zinc-50 border rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                validationErrors[field.key] ? 'border-rose-300 bg-rose-50/20' : 'border-zinc-200'
                              }`}
                            >
                              <option value="">Select option...</option>
                              {field.options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : field.type === 'boolean' ? (
                            <div className="flex items-center gap-4 py-2">
                              <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={field.key}
                                  checked={testFormData[field.key] === true}
                                  onChange={() => handleTestFieldChange(field.key, true)}
                                  className="text-indigo-600"
                                />
                                <span>Yes / Applicable</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={field.key}
                                  checked={testFormData[field.key] === false}
                                  onChange={() => handleTestFieldChange(field.key, false)}
                                  className="text-indigo-600"
                                />
                                <span>No / Exempt</span>
                              </label>
                            </div>
                          ) : (
                            <input
                              type={field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
                              value={testFormData[field.key] !== undefined ? testFormData[field.key] : ''}
                              onChange={e => handleTestFieldChange(field.key, e.target.value)}
                              placeholder={field.description || `Enter ${field.label}...`}
                              className={`w-full px-3 py-2 bg-zinc-50 border rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-400 ${
                                validationErrors[field.key] ? 'border-rose-300 bg-rose-50/20' : 'border-zinc-200'
                              }`}
                            />
                          )}

                          {field.helpText && (
                            <p className="text-[10px] text-zinc-400">{field.helpText}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                      <button
                        onClick={() => {
                          setTestFormData({});
                          setValidationErrors({});
                          setTestValidationSuccess(false);
                        }}
                        className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
                      >
                        Reset Form Inputs
                      </button>

                      <button
                        onClick={runTestValidation}
                        className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all shadow-sm flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Run Statutory Verification</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Validation Rules Tab */}
                {activeTab === 'validation' && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-500">
                      Automated integrity checks executed by CAOMS compliance engine prior to submission to eliminate rejection notices.
                    </p>

                    <div className="space-y-3">
                      {activeTemplate.validationChecklist.map((rule) => (
                        <div key={rule.id} className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-indigo-600" />
                              <span>{rule.checkName}</span>
                            </h5>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rule.severity === 'BLOCKING_ERROR' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              rule.severity === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {rule.severity.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                            {rule.ruleDescription}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. JSON Sample Spec Tab */}
                {activeTab === 'jsonSchema' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-500">
                        Canonical JSON payload for API integration with ERP systems (SAP, Tally, Zoho, Oracle).
                      </p>
                      <button
                        onClick={() => copyToClipboard(activeTemplate.jsonSampleSchema, 'Sample JSON schema copied')}
                        className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </button>
                    </div>

                    <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-xl text-xs font-mono overflow-x-auto max-h-[500px] border border-zinc-800">
                      <code>{activeTemplate.jsonSampleSchema}</code>
                    </pre>
                  </div>
                )}

                {/* 6. Guidelines & Notes Tab */}
                {activeTab === 'guidelines' && (
                  <div className="space-y-4">
                    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-950">Statutory Practice & ICAI Technical Guidance</h4>
                        <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                          {activeTemplate.guidelinesNotes}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-3">
                      <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Faceless Assessment & Scrutiny Avoidance Protocols</h4>
                      <ul className="space-y-2 text-xs text-zinc-600 list-disc list-inside">
                        <li>Ensure all reconciliation differences between portal records (e.g. 26AS/AIS vs Books, 2B vs Purchase Register) are documented in audit working papers.</li>
                        <li>Verify Unique Document Identification Number (UDIN) generation within prescribed time limits on the ICAI portal.</li>
                        <li>Retain timestamped cryptographic hashes of supporting vouchers in the CAOMS Client Vault.</li>
                      </ul>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
              <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-800">Select a Statutory Template</h3>
              <p className="text-xs text-zinc-500 mt-1">Choose a filing template from the left directory to view schema details, validation rules, and compliance guidance.</p>
            </div>
          )}
        </div>

      </div>

      {/* New / Custom Template Modal */}
      {isCreateModalOpen && (
        <CreateTemplateModal
          onClose={() => setIsCreateModalOpen(false)}
          onSave={(newTemplate) => {
            const updated = [newTemplate, ...templates];
            saveTemplates(updated);
            setActiveTemplateId(newTemplate.id);
            setIsCreateModalOpen(false);
            setCopiedNotification(`Template ${newTemplate.templateCode} created successfully!`);
          }}
        />
      )}
    </div>
  );
}

// Modal component for creating customized filing template
function CreateTemplateModal({
  onClose,
  onSave
}: {
  onClose: () => void;
  onSave: (template: StatutoryFilingTemplate) => void;
}) {
  const [templateCode, setTemplateCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<StatutoryCategory>('GST');
  const [authority, setAuthority] = useState<any>('Goods & Services Tax Network (GSTN)');
  const [frequency, setFrequency] = useState<StatutoryFilingFrequency>('Monthly');
  const [applicableLaw, setApplicableLaw] = useState('');
  const [dueDateDesc, setDueDateDesc] = useState('');
  const [penaltyProvisions, setPenaltyProvisions] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [guidelinesNotes, setGuidelinesNotes] = useState('');
  
  // Dynamic fields builder
  const [fields, setFields] = useState<TemplateFieldSchema[]>([
    { id: 'f1', label: 'Primary Entity Identifier', key: 'entityId', type: 'text', required: true, description: 'Registration / Identification number' },
    { id: 'f2', label: 'Filing Period', key: 'period', type: 'text', required: true, description: 'Return period in MM-YYYY or FY' },
    { id: 'f3', label: 'Taxable Amount (in INR)', key: 'taxableAmount', type: 'currency', required: true, description: 'Gross statutory base amount' }
  ]);

  const addField = () => {
    const newId = `f_${Date.now()}`;
    setFields([...fields, {
      id: newId,
      label: 'New Field',
      key: `field_${fields.length + 1}`,
      type: 'text',
      required: false,
      description: 'Field description'
    }]);
  };

  const updateField = (id: string, updates: Partial<TemplateFieldSchema>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    if (fields.length <= 1) return;
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateCode || !title || !applicableLaw) {
      alert('Please fill in Template Code, Title, and Applicable Law.');
      return;
    }

    const newTemplate: StatutoryFilingTemplate = {
      id: `tpl-custom-${Date.now()}`,
      templateCode: templateCode.trim().toUpperCase(),
      title: title.trim(),
      authority,
      category,
      frequency,
      applicableLaw: applicableLaw.trim(),
      standardDueDateDescription: dueDateDesc || 'As notified by statutory authority',
      penaltyAndLateFeeProvisions: penaltyProvisions || 'Standard statutory late fees apply',
      description: description || 'Custom statutory filing template configured by firm.',
      version: version || 'v1.0',
      isStandardized: false,
      isFavorite: true,
      tags: [category, frequency, 'Custom Template'],
      mandatoryAttachments: ['Relevant Ledger & Reconciliation Statement'],
      fieldSchemas: fields,
      validationChecklist: [
        { id: 'v1', checkName: 'Entity Identifier Format Match', severity: 'BLOCKING_ERROR', ruleDescription: 'Primary identifier must match registered authority records.' }
      ],
      jsonSampleSchema: JSON.stringify({
        templateCode: templateCode.trim().toUpperCase(),
        sampleData: fields.reduce((acc, f) => ({ ...acc, [f.key]: f.type === 'currency' ? 0.00 : 'Sample Value' }), {})
      }, null, 2),
      guidelinesNotes: guidelinesNotes || 'Follow standard ICAI and relevant department guidance.',
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    onSave(newTemplate);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full p-6 my-8 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Create Standardized Statutory Template</h3>
            <p className="text-xs text-zinc-500">Define standardized schema rules and validation parameters for custom filings.</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-800 block mb-1">Template Code *</label>
              <input
                type="text"
                required
                value={templateCode}
                onChange={e => setTemplateCode(e.target.value)}
                placeholder="e.g. GST-GSTR9-ANNUAL"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-800 block mb-1">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as StatutoryCategory)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="GST">GST</option>
                <option value="Direct Tax & TDS">Direct Tax & TDS</option>
                <option value="MCA & Corporate Law">MCA & Corporate Law</option>
                <option value="Labor & Payroll">Labor & Payroll</option>
                <option value="Audit & Assurance">Audit & Assurance</option>
                <option value="FEMA & International">FEMA & International</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-800 block mb-1">Template Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. GSTR-9 Annual Return & Statutory Turnover Reconciliation"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-800 block mb-1">Authority *</label>
              <select
                value={authority}
                onChange={e => setAuthority(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Goods & Services Tax Network (GSTN)">Goods & Services Tax Network (GSTN)</option>
                <option value="Income Tax Department (CPC)">Income Tax Department (CPC)</option>
                <option value="Ministry of Corporate Affairs (MCA)">Ministry of Corporate Affairs (MCA)</option>
                <option value="EPFO & ESIC">EPFO & ESIC</option>
                <option value="Reserve Bank of India (RBI)">Reserve Bank of India (RBI)</option>
                <option value="ICAI">ICAI</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-800 block mb-1">Frequency *</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as StatutoryFilingFrequency)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Annual">Annual</option>
                <option value="Event-Based">Event-Based</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-800 block mb-1">Applicable Statutory Law / Section *</label>
            <input
              type="text"
              required
              value={applicableLaw}
              onChange={e => setApplicableLaw(e.target.value)}
              placeholder="e.g. Section 44 of CGST Act 2017 read with Rule 80"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-800 block mb-1">Due Date Rule</label>
              <input
                type="text"
                value={dueDateDesc}
                onChange={e => setDueDateDesc(e.target.value)}
                placeholder="e.g. 31st December of subsequent FY"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-800 block mb-1">Penalty / Late Fee Provision</label>
              <input
                type="text"
                value={penaltyProvisions}
                onChange={e => setPenaltyProvisions(e.target.value)}
                placeholder="e.g. INR 200/day capped at 0.50% turnover"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-800 block mb-1">Description & Scope</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Comprehensive summary of what this filing entails..."
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Dynamic Field Schema Builder */}
          <div className="space-y-3 pt-3 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900">Template Fields Schema ({fields.length})</span>
              <button
                type="button"
                onClick={addField}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Field</span>
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((f, idx) => (
                <div key={f.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={f.label}
                      onChange={e => updateField(f.id, { label: e.target.value })}
                      placeholder="Field Label"
                      className="w-full px-2 py-1 bg-white border border-zinc-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={f.key}
                      onChange={e => updateField(f.id, { key: e.target.value })}
                      placeholder="field_key"
                      className="w-full px-2 py-1 bg-white border border-zinc-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="col-span-3">
                    <select
                      value={f.type}
                      onChange={e => updateField(f.id, { type: e.target.value as any })}
                      className="w-full px-2 py-1 bg-white border border-zinc-200 rounded-lg text-xs"
                    >
                      <option value="text">Text</option>
                      <option value="currency">Currency</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="gstin">GSTIN</option>
                      <option value="pan">PAN</option>
                      <option value="boolean">Boolean</option>
                    </select>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <label className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={e => updateField(f.id, { required: e.target.checked })}
                      />
                      <span>Req</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeField(f.id)}
                      className="text-zinc-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all shadow-sm"
            >
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
