import React, { useEffect, useState } from 'react';
import { Building2, Plus, Save, Sliders, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { authApi, departmentsApi, extractApiError } from '../services/api.ts';
import type { Department } from '../types/index.ts';
import { HOSPITAL_ZONES } from '../utils/constants.ts';

export function SettingsPage() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const [prefs, setPrefs] = useState({
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    criticalAlertsOnly: user?.preferences?.criticalAlertsOnly ?? false,
    compactTables: user?.preferences?.compactTables ?? false,
    defaultZone: user?.preferences?.defaultZone || 'All Zones',
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Admin Department Management
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    headOfDepartment: '',
    contactExtension: '',
    description: '',
  });
  const [addingDept, setAddingDept] = useState(false);

  useEffect(() => {
    void departmentsApi
      .list()
      .then((res) => setDepartments(res.data.departments))
      .catch(() => {});
  }, []);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingPrefs(true);
      const { data } = await authApi.updateProfile({ preferences: prefs });
      setUser(data.user);
      showToast('Preferences saved', 'Your workspace settings were persisted to MongoDB.', 'success');
    } catch (err) {
      showToast('Failed to save settings', extractApiError(err), 'error');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name.trim() || !newDept.code.trim()) {
      showToast('Validation', 'Department name and code are required.', 'error');
      return;
    }
    try {
      setAddingDept(true);
      const { data } = await departmentsApi.create(newDept);
      setDepartments((prev) => [...prev, data.department]);
      setNewDept({ name: '', code: '', headOfDepartment: '', contactExtension: '', description: '' });
      showToast('Department added', `${data.department.name} created.`, 'success');
    } catch (err) {
      showToast('Failed to add department', extractApiError(err), 'error');
    } finally {
      setAddingDept(false);
    }
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    try {
      await departmentsApi.remove(id);
      setDepartments((prev) => prev.filter((d) => d._id !== id));
      showToast('Department removed', `${name} deleted.`, 'info');
    } catch (err) {
      showToast('Delete failed', extractApiError(err), 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Customize notification alerts, table density, default hospital zone, and department records.
        </p>
      </div>

      {/* User Preferences */}
      <form
        onSubmit={handleSavePreferences}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#0F2942]" />
          <h2 className="font-display text-base font-semibold text-slate-900">
            Workspace & Notification Preferences
          </h2>
        </div>

        <div className="space-y-4 pt-2 border-t border-slate-100">
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-900">Email Alert Notifications</p>
              <p className="text-xs text-slate-500">
                Receive dispatch summaries when reports in your ward are assigned or resolved.
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.emailNotifications}
              onChange={(e) => setPrefs({ ...prefs, emailNotifications: e.target.checked })}
              className="mt-1 h-4 w-4 accent-[#0F2942] rounded"
            />
          </label>

          <label className="flex items-start justify-between gap-4 cursor-pointer pt-3 border-t border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-900">Critical Alerts Only</p>
              <p className="text-xs text-slate-500">
                Prioritize high-acuity critical ward alerts in notification digests.
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.criticalAlertsOnly}
              onChange={(e) => setPrefs({ ...prefs, criticalAlertsOnly: e.target.checked })}
              className="mt-1 h-4 w-4 accent-[#0F2942] rounded"
            />
          </label>

          <label className="flex items-start justify-between gap-4 cursor-pointer pt-3 border-t border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-900">Compact Table Density</p>
              <p className="text-xs text-slate-500">
                Reduce vertical padding in report queues to view more rows per screen.
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.compactTables}
              onChange={(e) => setPrefs({ ...prefs, compactTables: e.target.checked })}
              className="mt-1 h-4 w-4 accent-[#0F2942] rounded"
            />
          </label>

          <div className="pt-3 border-t border-slate-100 max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default Hospital Zone for Report Submission
            </label>
            <select
              value={prefs.defaultZone}
              onChange={(e) => setPrefs({ ...prefs, defaultZone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2942]"
            >
              <option value="All Zones">All Zones</option>
              {HOSPITAL_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={savingPrefs}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingPrefs ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>

      {/* Hospital Departments Directory */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#0F2942]" />
          <h2 className="font-display text-base font-semibold text-slate-900">
            Hospital Departments Directory
          </h2>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {departments.map((dept) => (
            <div key={dept._id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
              <div>
                <span className="font-semibold text-slate-900">{dept.name}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="font-mono text-slate-500">{dept.code}</span>
                {dept.contactExtension && (
                  <>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="text-slate-600">{dept.contactExtension}</span>
                  </>
                )}
                {dept.headOfDepartment && (
                  <p className="text-slate-500 mt-0.5">Lead: {dept.headOfDepartment}</p>
                )}
              </div>
              {user?.role === 'Admin' && (
                <button
                  type="button"
                  onClick={() => void handleDeleteDepartment(dept._id, dept.name)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50"
                  title="Delete department"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {(user?.role === 'Admin' || user?.role === 'Routing Manager') && (
          <form onSubmit={handleAddDepartment} className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-semibold text-slate-700">Add New Department</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                value={newDept.name}
                onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                placeholder="Department Name"
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                required
              />
              <input
                type="text"
                value={newDept.code}
                onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                placeholder="Code (e.g. RAD)"
                className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                required
              />
              <input
                type="text"
                value={newDept.headOfDepartment}
                onChange={(e) => setNewDept({ ...newDept, headOfDepartment: e.target.value })}
                placeholder="Head of Department"
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={newDept.contactExtension}
                onChange={(e) => setNewDept({ ...newDept, contactExtension: e.target.value })}
                placeholder="Extension (e.g. Ext. 4400)"
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={addingDept}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F2942] rounded-lg hover:bg-[#163A5C] disabled:opacity-60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{addingDept ? 'Adding...' : 'Add Department'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
