import React, { useMemo, useState } from 'react';
import { Search, Plus, Eye, Pencil, Trash2, FileText, FileSpreadsheet } from 'lucide-react';
import type { ContractType, Employee, EmployeeStatus, HrmState, UserRole } from '../../types/hrm';
import { formatDateVN, formatVND, generateNextEmployeeCode, getTodayIsoLocal } from '../../utils/hrmLogic';
import { buildEmployeesCsv, downloadCsvFile } from '../../utils/csvExport';
import { Modal } from '../Modal';

interface EmployeesViewProps {
  role: UserRole;
  currentUser: Employee | null;
  state: HrmState;
  onSaveEmployee: (emp: Omit<Employee, 'id'> & { id?: string }) => void;
  onDeleteEmployee: (id: string) => boolean;
  onExportSuccess?: (message: string) => void;
}

export function EmployeesView({
  role,
  currentUser,
  state,
  onSaveEmployee,
  onDeleteEmployee,
  onExportSuccess,
}: EmployeesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [detailEmp, setDetailEmp] = useState<Employee | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [confirmDeleteEmp, setConfirmDeleteEmp] = useState<Employee | null>(null);

  const [form, setForm] = useState<Omit<Employee, 'id'>>(() => ({
    code: generateNextEmployeeCode(state.employees),
    fullName: '',
    email: '',
    phone: '',
    gender: 'Nam',
    dateOfBirth: '1996-01-15',
    nationalId: '',
    nationalIdIssueDate: '2022-04-20',
    nationalIdIssuePlace: 'Cục Cảnh sát QLHC về TTXH',
    address: '',
    departmentId: state.departments[0]?.id ?? '',
    positionId: state.positions[0]?.id ?? '',
    branchId: state.branches[0]?.id ?? '',
    joinDate: getTodayIsoLocal(),
    contractType: 'HĐLĐ 12 tháng',
    contractCode: `HĐLĐ-${new Date().getFullYear()}-NEW`,
    contractStartDate: getTodayIsoLocal(),
    contractEndDate: '2027-11-14',
    baseSalary: 18_000_000,
    allowance: 1_500_000,
    dependents: 0,
    annualLeaveTotal: 12,
    annualLeaveRemaining: 12,
    bankAccount: '',
    bankName: 'Techcombank',
    status: 'Đang làm việc',
  }));

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.employees.filter((emp) => {
      const matchQuery =
        !q ||
        emp.fullName.toLowerCase().includes(q) ||
        emp.code.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q);
      const matchDept = deptFilter === 'all' || emp.departmentId === deptFilter;
      const matchStatus = statusFilter === 'all' || emp.status === statusFilter;
      return matchQuery && matchDept && matchStatus;
    });
  }, [deptFilter, searchQuery, state.employees, statusFilter]);

  const openCreateModal = () => {
    const nextCode = generateNextEmployeeCode(state.employees);
    const today = getTodayIsoLocal();
    setEditingEmp(null);
    setForm({
      code: nextCode,
      fullName: '',
      email: '',
      phone: '',
      gender: 'Nam',
      dateOfBirth: '1996-05-10',
      nationalId: '',
      nationalIdIssueDate: '2022-04-20',
      nationalIdIssuePlace: 'Cục Cảnh sát QLHC về TTXH',
      address: 'Hà Nội',
      departmentId: state.departments[0]?.id ?? '',
      positionId: state.positions[0]?.id ?? '',
      branchId: state.branches[0]?.id ?? '',
      joinDate: today,
      contractType: 'HĐLĐ 12 tháng',
      contractCode: `26${nextCode.replace('NV-', '')}/HĐLĐ`,
      contractStartDate: today,
      contractEndDate: '2027-11-14',
      baseSalary: 18_000_000,
      allowance: 1_500_000,
      dependents: 0,
      annualLeaveTotal: 12,
      annualLeaveRemaining: 12,
      bankAccount: '',
      bankName: 'Techcombank',
      status: 'Đang làm việc',
    });
    setFormModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    const { id: _id, ...rest } = emp;
    setForm(rest);
    setFormModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) return;
    onSaveEmployee({ id: editingEmp?.id, ...form });
    setFormModalOpen(false);
    if (detailEmp && editingEmp && detailEmp.id === editingEmp.id) {
      setDetailEmp({ id: editingEmp.id, ...form });
    }
  };

  // ESS View: Personal Profile & Labor Contract Only
  if (role === 'ess' && currentUser) {
    const dept = state.departments.find((d) => d.id === currentUser.departmentId);
    const pos = state.positions.find((p) => p.id === currentUser.positionId);
    const branch = state.branches.find((b) => b.id === currentUser.branchId);

    return (
      <div className="space-y-6 max-w-4xl">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="font-mono text-xs font-semibold text-brand-text">{currentUser.code}</div>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">{currentUser.fullName}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {pos?.title ?? '—'} · {dept?.name ?? '—'} · {branch?.name ?? '—'}
              </p>
            </div>
            <div className="sm:text-right">
              <div className="text-xs text-slate-500">Trạng thái làm việc</div>
              <div className="mt-0.5 text-sm font-semibold text-emerald-700">
                {currentUser.status}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Thông tin cá nhân</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4 py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Email công việc</dt>
                  <dd className="font-medium text-slate-900 text-right">{currentUser.email}</dd>
                </div>
                <div className="flex justify-between gap-4 py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Số điện thoại</dt>
                  <dd className="font-mono text-slate-900 tabular-nums whitespace-nowrap">
                    {currentUser.phone}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Ngày sinh / Giới tính</dt>
                  <dd className="text-slate-900 tabular-nums whitespace-nowrap">
                    {formatDateVN(currentUser.dateOfBirth)} · {currentUser.gender}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Số CCCD / CMND</dt>
                  <dd className="font-mono text-slate-900 tabular-nums whitespace-nowrap">
                    {currentUser.nationalId}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Ngày cấp CCCD</dt>
                  <dd className="text-slate-900 tabular-nums whitespace-nowrap">
                    {formatDateVN(currentUser.nationalIdIssueDate)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Nơi cấp CCCD</dt>
                  <dd className="text-slate-900 text-right">{currentUser.nationalIdIssuePlace}</dd>
                </div>
                <div className="flex justify-between gap-4 py-1">
                  <dt className="text-slate-500">Địa chỉ thường trú</dt>
                  <dd className="text-slate-900 text-right">{currentUser.address}</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Hợp đồng &amp; Chế độ phúc lợi</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4 py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Số hợp đồng</dt>
                  <dd className="font-mono font-medium text-slate-900 whitespace-nowrap">
                    {currentUser.contractCode}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Loại hợp đồng</dt>
                  <dd className="text-slate-900 text-right">{currentUser.contractType}</dd>
                </div>
                <div className="flex justify-between gap-4 py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Thời hạn</dt>
                  <dd className="text-slate-900 tabular-nums text-right">
                    {formatDateVN(currentUser.contractStartDate)} –{' '}
                    {currentUser.contractEndDate === 'Không thời hạn'
                      ? 'Không thời hạn'
                      : formatDateVN(currentUser.contractEndDate)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Lương cơ bản + Phụ cấp</dt>
                  <dd className="font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                    {formatVND(currentUser.baseSalary + currentUser.allowance)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1">
                  <dt className="text-slate-500">Phép năm còn lại</dt>
                  <dd className="font-mono font-semibold text-brand-text tabular-nums whitespace-nowrap">
                    {currentUser.annualLeaveRemaining} / {currentUser.annualLeaveTotal} ngày
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, mã NV, email..."
              aria-label="Tìm kiếm nhân viên"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-brand focus:outline-none"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            aria-label="Lọc theo phòng ban"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none"
          >
            <option value="all">Tất cả phòng ban</option>
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Lọc theo trạng thái"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="Đang làm việc">Đang làm việc</option>
            <option value="Thử việc">Thử việc</option>
            <option value="Nghỉ việc">Nghỉ việc</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 max-w-full">
          <button
            type="button"
            onClick={() => {
              const csv = buildEmployeesCsv({
                employees: filteredEmployees,
                departments: state.departments,
                positions: state.positions,
              });
              const filename = `OSHRM_DanhSachNhanVien_${getTodayIsoLocal()}.csv`;
              downloadCsvFile(filename, csv);
              onExportSuccess?.(
                `Đã xuất danh sách ${filteredEmployees.length} nhân sự ra file ${filename}.`
              );
            }}
            disabled={filteredEmployees.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            <span>Xuất Danh sách Nhân viên</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on transition-colors hover:bg-brand-hover whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm nhân viên</span>
          </button>
        </div>
      </div>

      {/* Employee Data Grid */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>
            Hiển thị <strong className="text-slate-900">{filteredEmployees.length}</strong> /{' '}
            {state.employees.length} hồ sơ nhân sự
          </span>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              Không tìm thấy nhân viên nào khớp bộ lọc
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDeptFilter('all');
                setStatusFilter('all');
              }}
              className="mt-3 text-xs font-semibold text-brand-text hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Mã NV</th>
                  <th className="px-4 py-3">Họ và tên</th>
                  <th className="px-4 py-3">Phòng ban / Chức danh</th>
                  <th className="px-4 py-3">Hợp đồng lao động</th>
                  <th className="px-4 py-3 text-right">Lương cơ bản</th>
                  <th className="px-4 py-3 text-right">Phép năm</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => {
                  const dept = state.departments.find((d) => d.id === emp.departmentId);
                  const pos = state.positions.find((p) => p.id === emp.positionId);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">
                        {emp.code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{emp.fullName}</div>
                        <div className="text-xs text-slate-500">{emp.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800">{pos?.title ?? '—'}</div>
                        <div className="text-xs text-slate-500">{dept?.name ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-slate-800">{emp.contractType}</div>
                        <div className="font-mono text-xs text-slate-500">{emp.contractCode}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-900 tabular-nums whitespace-nowrap">
                        {formatVND(emp.baseSalary)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {emp.annualLeaveRemaining}/{emp.annualLeaveTotal} ngày
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap">
                        <span
                          className={
                            emp.status === 'Đang làm việc'
                              ? 'text-emerald-700'
                              : emp.status === 'Thử việc'
                                ? 'text-amber-700'
                                : 'text-slate-500'
                          }
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailEmp(emp)}
                            aria-label={`Xem hồ sơ ${emp.fullName}`}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-text"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(emp)}
                            aria-label={`Chỉnh sửa ${emp.fullName}`}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-text"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteEmp(emp)}
                            aria-label={`Xóa nhân viên ${emp.fullName}`}
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
        )}
      </div>

      {/* Employee Detail Modal */}
      <Modal
        open={Boolean(detailEmp)}
        onClose={() => setDetailEmp(null)}
        title={detailEmp ? `Hồ sơ nhân sự: ${detailEmp.fullName}` : ''}
        subtitle={detailEmp ? `${detailEmp.code} · ${detailEmp.email}` : ''}
        maxWidthClass="max-w-2xl"
      >
        {detailEmp && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-2">
                  Thông tin cá nhân &amp; Pháp lý
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3 py-1 border-b border-slate-100">
                    <dt className="text-slate-500 shrink-0">Điện thoại</dt>
                    <dd className="font-mono text-slate-900">{detailEmp.phone}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-1 border-b border-slate-100">
                    <dt className="text-slate-500 shrink-0">Ngày sinh / Giới tính</dt>
                    <dd className="text-slate-900 tabular-nums">
                      {formatDateVN(detailEmp.dateOfBirth)} ({detailEmp.gender})
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 py-1 border-b border-slate-100">
                    <dt className="text-slate-500 shrink-0">Số CCCD / CMND</dt>
                    <dd className="font-mono text-slate-900">{detailEmp.nationalId}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-1 border-b border-slate-100">
                    <dt className="text-slate-500 shrink-0">Ngày cấp</dt>
                    <dd className="text-slate-900 tabular-nums">
                      {formatDateVN(detailEmp.nationalIdIssueDate)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 py-1 border-b border-slate-100">
                    <dt className="text-slate-500 shrink-0">Nơi cấp</dt>
                    <dd className="text-slate-900 text-right">{detailEmp.nationalIdIssuePlace}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-1 border-b border-slate-100">
                    <dt className="text-slate-500 shrink-0">Địa chỉ thường trú</dt>
                    <dd className="text-slate-900 text-right">{detailEmp.address}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-1">
                    <dt className="text-slate-500 shrink-0">Tài khoản NH</dt>
                    <dd className="text-slate-900 text-right">
                      {detailEmp.bankName} · <span className="font-mono">{detailEmp.bankAccount}</span>
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-2">
                  Hợp đồng &amp; Tổ chức
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <dt className="text-slate-500">Phòng ban</dt>
                    <dd className="font-medium text-slate-900">
                      {state.departments.find((d) => d.id === detailEmp.departmentId)?.name ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <dt className="text-slate-500">Chức danh</dt>
                    <dd className="font-medium text-slate-900">
                      {state.positions.find((p) => p.id === detailEmp.positionId)?.title ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <dt className="text-slate-500">Chi nhánh</dt>
                    <dd className="text-slate-900">
                      {state.branches.find((b) => b.id === detailEmp.branchId)?.name ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-slate-500">Ngày gia nhập</dt>
                    <dd className="text-slate-900 tabular-nums">{formatDateVN(detailEmp.joinDate)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-brand-text" />
                <span>Chi tiết Hợp đồng lao động</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                <div>
                  <div className="text-slate-500">Số hợp đồng</div>
                  <div className="mt-0.5 font-mono font-semibold text-slate-900">
                    {detailEmp.contractCode}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Loại hợp đồng</div>
                  <div className="mt-0.5 font-medium text-slate-900">{detailEmp.contractType}</div>
                </div>
                <div>
                  <div className="text-slate-500">Lương cơ bản</div>
                  <div className="mt-0.5 font-mono font-semibold text-slate-900 tabular-nums">
                    {formatVND(detailEmp.baseSalary)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Phụ cấp / Người PT</div>
                  <div className="mt-0.5 font-mono text-slate-900 tabular-nums">
                    {formatVND(detailEmp.allowance)} / {detailEmp.dependents}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const target = detailEmp;
                  setDetailEmp(null);
                  openEditModal(target);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Chỉnh sửa hồ sơ
              </button>
              <button
                type="button"
                onClick={() => setDetailEmp(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Employee Modal */}
      <Modal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingEmp ? `Cập nhật hồ sơ: ${editingEmp.fullName}` : 'Thêm nhân viên mới'}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="emp-code" className="block text-xs font-semibold text-slate-700 mb-1">
                Mã nhân viên
              </label>
              <input
                id="emp-code"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="emp-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên
              </label>
              <input
                id="emp-name"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="VD: Nguyễn Văn An"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="emp-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email công việc
              </label>
              <input
                id="emp-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="an.nguyen@oshrm.vn"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="emp-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại
              </label>
              <input
                id="emp-phone"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0912 345 678"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
            <div className="text-xs font-semibold text-slate-700">
              Thông tin pháp lý cá nhân (Dùng cho Hợp đồng lao động)
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="emp-dob" className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày sinh
                </label>
                <input
                  id="emp-dob"
                  type="date"
                  required
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="emp-gender" className="block text-xs font-semibold text-slate-700 mb-1">
                  Giới tính
                </label>
                <select
                  id="emp-gender"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as 'Nam' | 'Nữ' })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
              <div>
                <label htmlFor="emp-cccd" className="block text-xs font-semibold text-slate-700 mb-1">
                  Số CCCD / CMND
                </label>
                <input
                  id="emp-cccd"
                  required
                  value={form.nationalId}
                  onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                  placeholder="001096012345"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="emp-cccd-date" className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày cấp CCCD
                </label>
                <input
                  id="emp-cccd-date"
                  type="date"
                  required
                  value={form.nationalIdIssueDate}
                  onChange={(e) => setForm({ ...form, nationalIdIssueDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="emp-cccd-place" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nơi cấp CCCD
                </label>
                <input
                  id="emp-cccd-place"
                  required
                  value={form.nationalIdIssuePlace}
                  onChange={(e) => setForm({ ...form, nationalIdIssuePlace: e.target.value })}
                  placeholder="Cục Cảnh sát QLHC về TTXH"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="emp-address" className="block text-xs font-semibold text-slate-700 mb-1">
                Địa chỉ thường trú
              </label>
              <input
                id="emp-address"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="emp-dept" className="block text-xs font-semibold text-slate-700 mb-1">
                Phòng ban
              </label>
              <select
                id="emp-dept"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {state.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="emp-pos" className="block text-xs font-semibold text-slate-700 mb-1">
                Chức danh
              </label>
              <select
                id="emp-pos"
                value={form.positionId}
                onChange={(e) => setForm({ ...form, positionId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {state.positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="emp-branch" className="block text-xs font-semibold text-slate-700 mb-1">
                Chi nhánh
              </label>
              <select
                id="emp-branch"
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="emp-salary" className="block text-xs font-semibold text-slate-700 mb-1">
                Lương cơ bản (VNĐ)
              </label>
              <input
                id="emp-salary"
                type="number"
                min={0}
                step={500000}
                required
                value={form.baseSalary}
                onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="emp-allow" className="block text-xs font-semibold text-slate-700 mb-1">
                Phụ cấp (VNĐ)
              </label>
              <input
                id="emp-allow"
                type="number"
                min={0}
                step={100000}
                required
                value={form.allowance}
                onChange={(e) => setForm({ ...form, allowance: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="emp-dep" className="block text-xs font-semibold text-slate-700 mb-1">
                Số người phụ thuộc
              </label>
              <input
                id="emp-dep"
                type="number"
                min={0}
                max={10}
                value={form.dependents}
                onChange={(e) => setForm({ ...form, dependents: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="emp-contract" className="block text-xs font-semibold text-slate-700 mb-1">
                Loại hợp đồng
              </label>
              <select
                id="emp-contract"
                value={form.contractType}
                onChange={(e) =>
                  setForm({ ...form, contractType: e.target.value as ContractType })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                <option value="HĐLĐ Không xác định thời hạn">HĐLĐ Không xác định thời hạn</option>
                <option value="HĐLĐ 24 tháng">HĐLĐ 24 tháng</option>
                <option value="HĐLĐ 12 tháng">HĐLĐ 12 tháng</option>
                <option value="Hợp đồng Thử việc 2 tháng">Hợp đồng Thử việc 2 tháng</option>
              </select>
            </div>
            <div>
              <label htmlFor="emp-leave" className="block text-xs font-semibold text-slate-700 mb-1">
                Phép năm còn lại
              </label>
              <input
                id="emp-leave"
                type="number"
                min={0}
                max={30}
                value={form.annualLeaveRemaining}
                onChange={(e) =>
                  setForm({ ...form, annualLeaveRemaining: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="emp-status" className="block text-xs font-semibold text-slate-700 mb-1">
                Trạng thái
              </label>
              <select
                id="emp-status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as EmployeeStatus })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                <option value="Đang làm việc">Đang làm việc</option>
                <option value="Thử việc">Thử việc</option>
                <option value="Nghỉ việc">Nghỉ việc</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setFormModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
            >
              {editingEmp ? 'Lưu thay đổi' : 'Tạo hồ sơ nhân viên'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(confirmDeleteEmp)}
        onClose={() => setConfirmDeleteEmp(null)}
        title="Xác nhận xóa nhân sự"
        maxWidthClass="max-w-md"
      >
        {confirmDeleteEmp && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn xóa hồ sơ nhân viên{' '}
              <strong className="text-slate-900">
                {confirmDeleteEmp.fullName} ({confirmDeleteEmp.code})
              </strong>
              ? Thao tác này cũng xóa dữ liệu chấm công và KPI liên quan.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteEmp(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteEmployee(confirmDeleteEmp.id);
                  setConfirmDeleteEmp(null);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
