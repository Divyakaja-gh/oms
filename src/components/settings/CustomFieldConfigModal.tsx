import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  Trash2, 
  X, 
  CheckCircle2, 
  Layers, 
  Type, 
  Hash, 
  Calendar, 
  ListFilter, 
  ToggleLeft,
  Sparkles
} from 'lucide-react';
import { CustomFieldDefinition } from '../../types';
import { INITIAL_CUSTOM_FIELDS } from '../../data/practiceAutomationData';

interface CustomFieldConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFieldsUpdated?: (fields: CustomFieldDefinition[]) => void;
}

export function CustomFieldConfigModal({
  isOpen,
  onClose,
  onFieldsUpdated
}: CustomFieldConfigModalProps) {
  const [fields, setFields] = useState<CustomFieldDefinition[]>(() => {
    const saved = localStorage.getItem('caoms_custom_fields');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_CUSTOM_FIELDS;
  });

  const [activeEntity, setActiveEntity] = useState<'client' | 'task'>('client');
  const [newField, setNewField] = useState<{
    label: string;
    fieldKey: string;
    fieldType: 'text' | 'number' | 'date' | 'select' | 'boolean';
    optionsStr: string;
    placeholder: string;
    required: boolean;
  }>({
    label: '',
    fieldKey: '',
    fieldType: 'text',
    optionsStr: '',
    placeholder: '',
    required: false
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentFields = fields.filter(f => f.targetEntity === activeEntity);

  const handleLabelChange = (val: string) => {
    const generatedKey = val.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    setNewField(prev => ({
      ...prev,
      label: val,
      fieldKey: generatedKey
    }));
  };

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newField.label || !newField.fieldKey) return;

    const created: CustomFieldDefinition = {
      id: `cf-${Date.now()}`,
      targetEntity: activeEntity,
      label: newField.label,
      fieldKey: newField.fieldKey,
      fieldType: newField.fieldType,
      options: newField.fieldType === 'select' ? newField.optionsStr.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      placeholder: newField.placeholder || undefined,
      required: newField.required
    };

    const updated = [...fields, created];
    setFields(updated);
    localStorage.setItem('caoms_custom_fields', JSON.stringify(updated));
    if (onFieldsUpdated) onFieldsUpdated(updated);

    setNewField({
      label: '',
      fieldKey: '',
      fieldType: 'text',
      optionsStr: '',
      placeholder: '',
      required: false
    });

    setToastMessage(`Custom field "${created.label}" added to ${activeEntity} profile schema.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteField = (id: string) => {
    const updated = fields.filter(f => f.id !== id);
    setFields(updated);
    localStorage.setItem('caoms_custom_fields', JSON.stringify(updated));
    if (onFieldsUpdated) onFieldsUpdated(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Custom Field Configuration</h2>
              <p className="text-xs text-zinc-500">Extend Client profiles and Task workflows with practice-specific parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {toastMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Entity Selector (Client vs Task) */}
          <div className="flex items-center justify-center p-1 bg-zinc-100 rounded-xl border border-zinc-200 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => setActiveEntity('client')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeEntity === 'client' ? 'bg-white text-indigo-700 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Client Entity Fields ({fields.filter(f => f.targetEntity === 'client').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveEntity('task')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeEntity === 'task' ? 'bg-white text-indigo-700 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Task Workflow Fields ({fields.filter(f => f.targetEntity === 'task').length})
            </button>
          </div>

          {/* Active Fields List */}
          <div>
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2.5">
              Active {activeEntity === 'client' ? 'Client Master' : 'Task Master'} Custom Fields
            </h3>

            <div className="space-y-2">
              {currentFields.map(field => (
                <div 
                  key={field.id}
                  className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between gap-3 hover:bg-zinc-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-zinc-200 text-zinc-700 flex items-center justify-center text-xs font-mono">
                      {field.fieldType === 'text' ? <Type className="w-3.5 h-3.5" /> :
                       field.fieldType === 'number' ? <Hash className="w-3.5 h-3.5" /> :
                       field.fieldType === 'date' ? <Calendar className="w-3.5 h-3.5" /> :
                       field.fieldType === 'select' ? <ListFilter className="w-3.5 h-3.5" /> :
                       <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900">{field.label}</span>
                        <span className="text-[10px] font-mono text-zinc-400">({field.fieldKey})</span>
                        {field.required && (
                          <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 py-0.2 rounded border border-red-200">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Type: <span className="font-semibold text-zinc-700 capitalize">{field.fieldType}</span>
                        {field.options && ` • Options: [${field.options.join(', ')}]`}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteField(field.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete custom field"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Custom Field Form */}
          <form onSubmit={handleAddField} className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-3">
            <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Define New Field for {activeEntity === 'client' ? 'Client Master' : 'Task Master'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Field Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Assessing Officer Ward"
                  value={newField.label}
                  onChange={e => handleLabelChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Internal Database Key</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ao_ward"
                  value={newField.fieldKey}
                  onChange={e => setNewField({ ...newField, fieldKey: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-zinc-100 font-mono text-zinc-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Field Type</label>
                <select
                  value={newField.fieldType}
                  onChange={e => setNewField({ ...newField, fieldType: e.target.value as any })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white"
                >
                  <option value="text">Text Input</option>
                  <option value="number">Numeric (Amount / Ratio)</option>
                  <option value="date">Date Picker</option>
                  <option value="select">Dropdown Select</option>
                  <option value="boolean">Yes / No Switch</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Placeholder / Hint</label>
                <input
                  type="text"
                  placeholder="e.g. Enter Ward / Circle..."
                  value={newField.placeholder}
                  onChange={e => setNewField({ ...newField, placeholder: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white"
                />
              </div>

              {newField.fieldType === 'select' && (
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Dropdown Options (Comma-separated)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Micro, Small, Medium, Corporate"
                    value={newField.optionsStr}
                    onChange={e => setNewField({ ...newField, optionsStr: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white"
                  />
                </div>
              )}

              <div className="col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reqCheck"
                  checked={newField.required}
                  onChange={e => setNewField({ ...newField, required: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-indigo-600"
                />
                <label htmlFor="reqCheck" className="text-xs text-zinc-700 font-medium cursor-pointer">
                  Mark as Mandatory (Required before save)
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Field Definition</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            Close & Save
          </button>
        </div>
      </div>
    </div>
  );
}
