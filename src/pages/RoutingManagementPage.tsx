import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Edit2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext.tsx';
import {
  departmentsApi,
  extractApiError,
  handlersApi,
  routingApi,
} from '../services/api.ts';
import type {
  Department,
  EscalationStatus,
  HandlerProfile,
  PriorityOverride,
  ReportCategory,
  RoutingRule,
} from '../types/index.ts';
import {
  ESCALATION_STATUSES,
  HOSPITAL_DEPARTMENTS,
  HOSPITAL_ZONES,
  PRIORITY_OVERRIDES,
  REPORT_CATEGORIES,
} from '../utils/constants.ts';
import { AvailabilityLabel, CategoryLabel, PriorityLabel } from '../components/StatusLabels.tsx';
import { Modal } from '../components/Modal.tsx';

export function RoutingManagementPage() {
  const { showToast } = useToast();

  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [handlers, setHandlers] = useState<HandlerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [escalationFilter, setEscalationFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    category: 'Critical' as ReportCategory,
    department: 'Biomedical Engineering',
    assignedHandler: '',
    backupHandler: '',
    zone: 'ICU Complex',
    escalationStatus: 'Normal' as EscalationStatus,
    priorityOverride: 'None' as PriorityOverride,
    notes: '',
    isActive: true,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [routingRes, deptRes, handlerRes] = await Promise.all([
        routingApi.list({
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          department: departmentFilter !== 'All' ? departmentFilter : undefined,
          zone: zoneFilter !== 'All' ? zoneFilter : undefined,
          escalationStatus: escalationFilter !== 'All' ? escalationFilter : undefined,
        }),
        departmentsApi.list(),
        handlersApi.list(),
      ]);
      setRules(routingRes.data.rules);
      setDepartments(deptRes.data.departments);
      setHandlers(handlerRes.data.handlers);
    } catch (err) {
      showToast('Failed to load routing rules', extractApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, departmentFilter, zoneFilter, escalationFilter, showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openAddModal = () => {
    setEditingRule(null);
    setForm({
      category: 'Critical',
      department: 'Biomedical Engineering',
      assignedHandler: handlers[0]?._id || '',
      backupHandler: handlers[1]?._id || '',
      zone: 'ICU Complex',
      escalationStatus: 'Normal',
      priorityOverride: 'None',
      notes: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (rule: RoutingRule) => {
    setEditingRule(rule);
    setForm({
      category: rule.category,
      department: rule.department,
      assignedHandler: rule.assignedHandler?._id || '',
      backupHandler: rule.backupHandler?._id || '',
      zone: rule.zone,
      escalationStatus: rule.escalationStatus,
      priorityOverride: rule.priorityOverride,
      notes: rule.notes || '',
      isActive: rule.isActive,
    });
    setModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        assignedHandler: form.assignedHandler || null,
        backupHandler: form.backupHandler || null,
      };
      if (editingRule) {
        await routingApi.update(editingRule._id, payload);
        showToast('Routing rule updated', `${form.category} · ${form.zone} updated.`, 'success');
      } else {
        await routingApi.create(payload);
        showToast('Routing rule created', `Added routing for ${form.category} in ${form.zone}.`, 'success');
      }
      setModalOpen(false);
      void loadData();
    } catch (err) {
      showToast('Save failed', extractApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (rule: RoutingRule) => {
    try {
      await routingApi.remove(rule._id);
      showToast('Routing rule deleted', `Removed ${rule.category} rule for ${rule.zone}.`, 'info');
      setRules((prev) => prev.filter((r) => r._id !== rule._id));
    } catch (err) {
      showToast('Delete failed', extractApiError(err), 'error');
    }
  };

  const filteredRules = rules.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.department.toLowerCase().includes(q) ||
      r.zone.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      (r.assignedHandler?.name || '').toLowerCase().includes(q) ||
      (r.backupHandler?.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Routing Management Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Configure manual department assignments, primary and backup handlers, escalation policies, and priority overrides.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] transition-colors self-start sm:self-auto whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Routing Record</span>
        </button>
      </div>

      {/* Department Directory Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {(departments.length > 0
          ? departments
          : HOSPITAL_DEPARTMENTS.map((name, idx) => ({
              _id: String(idx),
              name,
              code: name.slice(0, 4).toUpperCase(),
              description: 'Hospital clinical operations department',
              headOfDepartment: 'Department Lead',
              contactExtension: `Ext. 4${idx + 1}00`,
              zonesSupported: HOSPITAL_ZONES,
              isActive: true,
            }))
        ).map((dept) => {
          const deptHandlers = handlers.filter((h) => h.department === dept.name);
          const availableCount = deptHandlers.filter((h) => h.availability === 'Available').length;
          return (
            <div key={dept._id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#0F2942] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-slate-900 truncate">{dept.name}</h2>
                    <p className="text-[11px] font-mono text-slate-500">
                      {dept.code} · {dept.contactExtension}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2">{dept.description}</p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{dept.headOfDepartment || 'Clinical Lead'}</span>
                <span className="font-mono tabular-nums font-semibold text-emerald-700">
                  {availableCount}/{deptHandlers.length} available
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Routing Rules Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search handler, dept, zone..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="All">All Categories</option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="All">All Departments</option>
              {HOSPITAL_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="All">All Zones</option>
              {HOSPITAL_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>

            <select
              value={escalationFilter}
              onChange={(e) => setEscalationFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="All">All Escalations</option>
              {ESCALATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading routing table...</div>
        ) : filteredRules.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No routing records match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 whitespace-nowrap">Category</th>
                  <th className="py-3 px-4 whitespace-nowrap">Department</th>
                  <th className="py-3 px-4 whitespace-nowrap">Hospital Zone</th>
                  <th className="py-3 px-4 whitespace-nowrap">Assigned Handler</th>
                  <th className="py-3 px-4 whitespace-nowrap">Backup Handler</th>
                  <th className="py-3 px-4 whitespace-nowrap">Availability</th>
                  <th className="py-3 px-4 whitespace-nowrap">Workload / Cap</th>
                  <th className="py-3 px-4 whitespace-nowrap">Queued</th>
                  <th className="py-3 px-4 whitespace-nowrap">Escalation</th>
                  <th className="py-3 px-4 whitespace-nowrap">Priority Override</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRules.map((rule) => {
                  const primary = rule.assignedHandler;
                  const backup = rule.backupHandler;
                  const workload = primary?.currentWorkload ?? 0;
                  const maxCap = primary?.maxCapacity ?? 6;
                  const overloaded = primary && workload >= maxCap;

                  return (
                    <tr key={rule._id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <CategoryLabel category={rule.category} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-900">
                        {rule.department}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">{rule.zone}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-900">
                        {primary?.name || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {backup?.name || 'None'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {primary ? (
                          <AvailabilityLabel availability={primary.availability} />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums">
                        {primary ? (
                          <span className={overloaded ? 'text-red-700 font-bold' : 'text-slate-800'}>
                            {workload} / {maxCap}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums font-semibold text-slate-900">
                        {rule.queuedReports ?? 0}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${
                            rule.escalationStatus === 'Escalated'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : rule.escalationStatus === 'Standby'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {rule.escalationStatus === 'Escalated' && (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {rule.escalationStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rule.priorityOverride === 'None' ? (
                          <span className="text-slate-400">None</span>
                        ) : (
                          <PriorityLabel priority={rule.priorityOverride} />
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(rule)}
                            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            title="Edit routing rule"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteRule(rule)}
                            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete routing rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Routing Rule Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRule ? 'Edit Routing Record' : 'Add Routing Record'}
        subtitle="Configure manual department routing, handler assignments, and escalation settings."
      >
        <form onSubmit={handleSaveRule} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Report Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ReportCategory })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                {REPORT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Hospital Zone
              </label>
              <select
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                {HOSPITAL_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hospital Department
            </label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            >
              {HOSPITAL_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assigned Handler
              </label>
              <select
                value={form.assignedHandler}
                onChange={(e) => setForm({ ...form, assignedHandler: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                <option value="">Unassigned</option>
                {handlers.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name} ({h.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Backup Handler
              </label>
              <select
                value={form.backupHandler}
                onChange={(e) => setForm({ ...form, backupHandler: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                <option value="">None</option>
                {handlers.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name} ({h.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Escalation Status
              </label>
              <select
                value={form.escalationStatus}
                onChange={(e) =>
                  setForm({ ...form, escalationStatus: e.target.value as EscalationStatus })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                {ESCALATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Priority Override
              </label>
              <select
                value={form.priorityOverride}
                onChange={(e) =>
                  setForm({ ...form, priorityOverride: e.target.value as PriorityOverride })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                {PRIORITY_OVERRIDES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Routing Notes
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Dispatch escalation instructions or coverage hours..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
