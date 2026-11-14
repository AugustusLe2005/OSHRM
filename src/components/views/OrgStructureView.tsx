import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Building2, Network, Briefcase } from 'lucide-react';
import type { Branch, Department, HrmState, Position } from '../../types/hrm';
import { Modal } from '../Modal';

interface OrgStructureViewProps {
  state: HrmState;
  onSaveBranch: (branch: Omit<Branch, 'id'> & { id?: string }) => void;
  onDeleteBranch: (id: string) => boolean;
  onSaveDepartment: (dept: Omit<Department, 'id'> & { id?: string }) => void;
  onDeleteDepartment: (id: string) => boolean;
  onSavePosition: (pos: Omit<Position, 'id'> & { id?: string }) => void;
  onDeletePosition: (id: string) => boolean;
}

type OrgTab = 'departments' | 'branches' | 'positions';

export function OrgStructureView({
  state,
  onSaveBranch,
  onDeleteBranch,
  onSaveDepartment,
  onDeleteDepartment,
  onSavePosition,
  onDeletePosition,
}: OrgStructureViewProps) {
  const [activeTab, setActiveTab] = useState<OrgTab>('departments');

  // Branch Modal State
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    isHeadquarters: false,
  });

  // Department Modal State
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({
    code: '',
    name: '',
    branchId: state.branches[0]?.id ?? '',
    managerName: '',
    description: '',
  });

  // Position Modal State
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [posForm, setPosForm] = useState({
    code: '',
    title: '',
    departmentId: state.departments[0]?.id ?? '',
    level: 'Middle',
    salaryRange: '',
  });

  const openBranchModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchForm({
        code: branch.code,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        isHeadquarters: branch.isHeadquarters,
      });
    } else {
      setEditingBranch(null);
      setBranchForm({ code: '', name: '', address: '', phone: '', isHeadquarters: false });
    }
    setBranchModalOpen(true);
  };

  const openDeptModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({
        code: dept.code,
        name: dept.name,
        branchId: dept.branchId,
        managerName: dept.managerName,
        description: dept.description,
      });
    } else {
      setEditingDept(null);
      setDeptForm({
        code: '',
        name: '',
        branchId: state.branches[0]?.id ?? '',
        managerName: '',
        description: '',
      });
    }
    setDeptModalOpen(true);
  };

  const openPosModal = (pos?: Position) => {
    if (pos) {
      setEditingPos(pos);
      setPosForm({
        code: pos.code,
        title: pos.title,
        departmentId: pos.departmentId,
        level: pos.level,
        salaryRange: pos.salaryRange,
      });
    } else {
      setEditingPos(null);
      setPosForm({
        code: '',
        title: '',
        departmentId: state.departments[0]?.id ?? '',
        level: 'Middle',
        salaryRange: '15.000.000 - 22.000.000 ₫',
      });
    }
    setPosModalOpen(true);
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.code.trim() || !branchForm.name.trim()) return;
    onSaveBranch({ id: editingBranch?.id, ...branchForm });
    setBranchModalOpen(false);
  };

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.code.trim() || !deptForm.name.trim()) return;
    onSaveDepartment({ id: editingDept?.id, ...deptForm });
    setDeptModalOpen(false);
  };

  const handlePosSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!posForm.code.trim() || !posForm.title.trim()) return;
    onSavePosition({ id: editingPos?.id, ...posForm });
    setPosModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar: Segmented Tab Switcher + Primary Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-200/70 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'departments'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            <span>Phòng ban ({state.departments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('branches')}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'branches'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Chi nhánh ({state.branches.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('positions')}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'positions'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Chức danh ({state.positions.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeTab === 'departments') openDeptModal();
            else if (activeTab === 'branches') openBranchModal();
            else openPosModal();
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on transition-colors hover:bg-brand-hover whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>
            {activeTab === 'departments'
              ? 'Thêm phòng ban'
              : activeTab === 'branches'
                ? 'Thêm chi nhánh'
                : 'Thêm chức danh'}
          </span>
        </button>
      </div>

      {/* Tab 1: Departments */}
      {activeTab === 'departments' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3">Mã PB</th>
                  <th className="px-5 py-3">Tên phòng ban</th>
                  <th className="px-5 py-3">Trưởng bộ phận</th>
                  <th className="px-5 py-3">Chi nhánh trực thuộc</th>
                  <th className="px-5 py-3 text-right">Nhân sự</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.departments.map((dept) => {
                  const branch = state.branches.find((b) => b.id === dept.branchId);
                  const empCount = state.employees.filter((e) => e.departmentId === dept.id).length;
                  return (
                    <tr key={dept.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-600">
                        {dept.code}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900">{dept.name}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{dept.description}</div>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{dept.managerName || '—'}</td>
                      <td className="px-5 py-3 text-slate-600">{branch?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {empCount}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openDeptModal(dept)}
                            aria-label={`Sửa phòng ban ${dept.name}`}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-text"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDepartment(dept.id)}
                            aria-label={`Xóa phòng ban ${dept.name}`}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Branches */}
      {activeTab === 'branches' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {state.branches.map((branch) => {
            const deptCount = state.departments.filter((d) => d.branchId === branch.id).length;
            const empCount = state.employees.filter((e) => e.branchId === branch.id).length;
            return (
              <div
                key={branch.id}
                className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-mono font-semibold text-slate-500">
                        {branch.code} {branch.isHeadquarters ? '· Trụ sở chính' : '· Chi nhánh'}
                      </div>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">{branch.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openBranchModal(branch)}
                        aria-label={`Sửa chi nhánh ${branch.name}`}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-text"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBranch(branch.id)}
                        aria-label={`Xóa chi nhánh ${branch.name}`}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{branch.address}</p>
                  <p className="mt-1 text-xs font-mono text-slate-500">ĐT: {branch.phone}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-600 tabular-nums">
                  <span>{deptCount} phòng ban</span>
                  <span aria-hidden="true">·</span>
                  <span>{empCount} nhân sự làm việc</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Positions */}
      {activeTab === 'positions' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3">Mã CD</th>
                  <th className="px-5 py-3">Chức danh</th>
                  <th className="px-5 py-3">Phòng ban</th>
                  <th className="px-5 py-3">Cấp bậc</th>
                  <th className="px-5 py-3">Khung lương tham chiếu</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.positions.map((pos) => {
                  const dept = state.departments.find((d) => d.id === pos.departmentId);
                  return (
                    <tr key={pos.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-600">
                        {pos.code}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{pos.title}</td>
                      <td className="px-5 py-3 text-slate-600">{dept?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-600">{pos.level}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-700 tabular-nums">
                        {pos.salaryRange}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openPosModal(pos)}
                            aria-label={`Sửa chức danh ${pos.title}`}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-text"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePosition(pos.id)}
                            aria-label={`Xóa chức danh ${pos.title}`}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Branch Modal */}
      <Modal
        open={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
        title={editingBranch ? 'Cập nhật chi nhánh' : 'Thêm chi nhánh mới'}
      >
        <form onSubmit={handleBranchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="br-code" className="block text-xs font-semibold text-slate-700 mb-1">
                Mã chi nhánh
              </label>
              <input
                id="br-code"
                required
                value={branchForm.code}
                onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                placeholder="VD: CN-DN"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="br-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại
              </label>
              <input
                id="br-phone"
                required
                value={branchForm.phone}
                onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                placeholder="0236 7300 888"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="br-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Tên chi nhánh
            </label>
            <input
              id="br-name"
              required
              value={branchForm.name}
              onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              placeholder="VD: Chi nhánh Đà Nẵng"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="br-addr" className="block text-xs font-semibold text-slate-700 mb-1">
              Địa chỉ văn phòng
            </label>
            <input
              id="br-addr"
              required
              value={branchForm.address}
              onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={branchForm.isHeadquarters}
              onChange={(e) => setBranchForm({ ...branchForm, isHeadquarters: e.target.checked })}
              className="rounded border-slate-300 text-blue-600"
            />
            <span>Đặt làm Trụ sở chính</span>
          </label>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setBranchModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
            >
              Lưu chi nhánh
            </button>
          </div>
        </form>
      </Modal>

      {/* Department Modal */}
      <Modal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title={editingDept ? 'Cập nhật phòng ban' : 'Thêm phòng ban mới'}
      >
        <form onSubmit={handleDeptSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dept-code" className="block text-xs font-semibold text-slate-700 mb-1">
                Mã phòng ban
              </label>
              <input
                id="dept-code"
                required
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                placeholder="VD: PB-MKT"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="dept-br" className="block text-xs font-semibold text-slate-700 mb-1">
                Chi nhánh
              </label>
              <select
                id="dept-br"
                value={deptForm.branchId}
                onChange={(e) => setDeptForm({ ...deptForm, branchId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {state.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="dept-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Tên phòng ban
            </label>
            <input
              id="dept-name"
              required
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              placeholder="VD: Phòng Marketing & Truyền thông"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="dept-mgr" className="block text-xs font-semibold text-slate-700 mb-1">
              Trưởng bộ phận
            </label>
            <input
              id="dept-mgr"
              required
              value={deptForm.managerName}
              onChange={(e) => setDeptForm({ ...deptForm, managerName: e.target.value })}
              placeholder="Họ tên trưởng phòng"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="dept-desc" className="block text-xs font-semibold text-slate-700 mb-1">
              Chức năng nhiệm vụ
            </label>
            <textarea
              id="dept-desc"
              rows={2}
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeptModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
            >
              Lưu phòng ban
            </button>
          </div>
        </form>
      </Modal>

      {/* Position Modal */}
      <Modal
        open={posModalOpen}
        onClose={() => setPosModalOpen(false)}
        title={editingPos ? 'Cập nhật chức danh' : 'Thêm chức danh mới'}
      >
        <form onSubmit={handlePosSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pos-code" className="block text-xs font-semibold text-slate-700 mb-1">
                Mã chức danh
              </label>
              <input
                id="pos-code"
                required
                value={posForm.code}
                onChange={(e) => setPosForm({ ...posForm, code: e.target.value })}
                placeholder="VD: CD-11"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="pos-dept" className="block text-xs font-semibold text-slate-700 mb-1">
                Phòng ban
              </label>
              <select
                id="pos-dept"
                value={posForm.departmentId}
                onChange={(e) => setPosForm({ ...posForm, departmentId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {state.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="pos-title" className="block text-xs font-semibold text-slate-700 mb-1">
              Tên chức danh
            </label>
            <input
              id="pos-title"
              required
              value={posForm.title}
              onChange={(e) => setPosForm({ ...posForm, title: e.target.value })}
              placeholder="VD: Chuyên viên Digital Marketing"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pos-lvl" className="block text-xs font-semibold text-slate-700 mb-1">
                Cấp bậc
              </label>
              <select
                id="pos-lvl"
                value={posForm.level}
                onChange={(e) => setPosForm({ ...posForm, level: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                <option value="Junior">Junior</option>
                <option value="Middle">Middle</option>
                <option value="Senior">Senior</option>
                <option value="Quản lý">Quản lý</option>
                <option value="Quản lý cấp cao">Quản lý cấp cao</option>
              </select>
            </div>
            <div>
              <label htmlFor="pos-sal" className="block text-xs font-semibold text-slate-700 mb-1">
                Khung lương
              </label>
              <input
                id="pos-sal"
                required
                value={posForm.salaryRange}
                onChange={(e) => setPosForm({ ...posForm, salaryRange: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPosModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
            >
              Lưu chức danh
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
