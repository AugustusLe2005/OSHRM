import React, { useMemo, useState } from 'react';
import {
  FileSignature,
  Plus,
  Search,
  Printer,
  RefreshCw,
  FileX2,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import type {
  Employee,
  HrmState,
  LaborContract,
  LaborContractKind,
  LaborContractStatus,
  PaymentMethod,
  SystemSettings,
  UserRole,
} from '../../types/hrm';
import {
  computeContractEndDate,
  computeContractStatus,
  formatDateVN,
  formatVND,
  generateNextContractNumber,
  getTodayIsoLocal,
} from '../../utils/hrmLogic';
import { buildContractsCsv, downloadCsvFile } from '../../utils/csvExport';
import { Modal } from '../Modal';

interface ContractsViewProps {
  role: UserRole;
  currentUser: Employee | null;
  state: HrmState;
  settings: SystemSettings;
  onCreateContract: (contract: Omit<LaborContract, 'id'>) => void;
  onExtendContract: (
    contractId: string,
    updates: {
      contractNumber: string;
      contractType: LaborContractKind;
      startDate: string;
      endDate: string;
      baseSalary: number;
      allowance: number;
      payDay: number;
    }
  ) => void;
  onTerminateContract: (contractId: string, terminatedDate: string, reason: string) => void;
  onExportSuccess?: (message: string) => void;
}

const CONTRACT_KINDS: LaborContractKind[] = [
  'Thử việc 2 tháng',
  'Xác định thời hạn 12 tháng',
  'Xác định thời hạn 24 tháng',
  'Không xác định thời hạn',
];

export function ContractsView({
  role,
  currentUser,
  state,
  settings,
  onCreateContract,
  onExtendContract,
  onTerminateContract,
  onExportSuccess,
}: ContractsViewProps) {
  const today = getTodayIsoLocal();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kindFilter, setKindFilter] = useState<string>('all');

  const [viewingContract, setViewingContract] = useState<LaborContract | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [extendingContract, setExtendingContract] = useState<LaborContract | null>(null);
  const [terminatingContract, setTerminatingContract] = useState<LaborContract | null>(null);

  // Create Contract Form State
  const [createForm, setCreateForm] = useState<{
    employeeId: string;
    contractNumber: string;
    contractType: LaborContractKind;
    startDate: string;
    endDate: string;
    baseSalary: number;
    allowance: number;
    paymentMethod: PaymentMethod;
    payDay: number;
    workLocation: string;
    jobDuties: string;
  }>(() => {
    const firstEmp = state.employees[0];
    const firstBranch = state.branches.find((b) => b.id === firstEmp?.branchId) ?? state.branches[0];
    return {
      employeeId: firstEmp?.id ?? '',
      contractNumber: generateNextContractNumber(state.contracts, 'HĐLĐ', today),
      contractType: 'Xác định thời hạn 12 tháng',
      startDate: today,
      endDate: computeContractEndDate(today, 'Xác định thời hạn 12 tháng'),
      baseSalary: firstEmp?.baseSalary ?? 18_000_000,
      allowance: firstEmp?.allowance ?? 1_500_000,
      paymentMethod: 'Chuyển khoản ngân hàng',
      payDay: 10,
      workLocation: firstBranch?.address ?? settings.address,
      jobDuties: 'Thực hiện công việc chuyên môn theo mô tả vị trí và phân công của Trưởng bộ phận.',
    };
  });

  // Extend Contract Form State
  const [extendForm, setExtendForm] = useState<{
    contractNumber: string;
    contractType: LaborContractKind;
    startDate: string;
    endDate: string;
    baseSalary: number;
    allowance: number;
    payDay: number;
  }>({
    contractNumber: '',
    contractType: 'Xác định thời hạn 12 tháng',
    startDate: today,
    endDate: computeContractEndDate(today, 'Xác định thời hạn 12 tháng'),
    baseSalary: 20_000_000,
    allowance: 1_500_000,
    payDay: 10,
  });

  // Terminate Contract Form State
  const [terminateForm, setTerminateForm] = useState({
    terminatedDate: today,
    reason: 'Thỏa thuận chấm dứt hợp đồng lao động trước thời hạn / hết hạn.',
  });

  const scopedContracts = useMemo(() => {
    const baseList =
      role === 'ess' && currentUser
        ? state.contracts.filter((c) => c.employeeId === currentUser.id)
        : state.contracts;
    return baseList.map((contract) => ({
      contract,
      status: computeContractStatus(contract, today),
      employee: state.employees.find((e) => e.id === contract.employeeId) ?? null,
    }));
  }, [currentUser, role, state.contracts, state.employees, today]);

  const stats = useMemo(() => {
    let effective = 0;
    let probation = 0;
    let expiringSoon = 0;
    let expiredOrTerminated = 0;

    for (const item of scopedContracts) {
      if (item.status === 'Đang hiệu lực' || item.status === 'Thử việc' || item.status === 'Sắp hết hạn') {
        effective += 1;
      }
      if (item.status === 'Thử việc') probation += 1;
      if (item.status === 'Sắp hết hạn') expiringSoon += 1;
      if (item.status === 'Hết hạn' || item.status === 'Đã thanh lý') expiredOrTerminated += 1;
    }
    return { effective, probation, expiringSoon, expiredOrTerminated };
  }, [scopedContracts]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedContracts.filter(({ contract, status, employee }) => {
      const matchQuery =
        !q ||
        contract.contractNumber.toLowerCase().includes(q) ||
        (employee?.fullName.toLowerCase().includes(q) ?? false) ||
        (employee?.code.toLowerCase().includes(q) ?? false);
      const matchStatus = statusFilter === 'all' || status === statusFilter;
      const matchKind = kindFilter === 'all' || contract.contractType === kindFilter;
      return matchQuery && matchStatus && matchKind;
    });
  }, [kindFilter, scopedContracts, searchQuery, statusFilter]);

  const openCreateModal = () => {
    const firstEmp = state.employees[0];
    const branch = state.branches.find((b) => b.id === firstEmp?.branchId) ?? state.branches[0];
    const defaultKind: LaborContractKind = 'Xác định thời hạn 12 tháng';
    setCreateForm({
      employeeId: firstEmp?.id ?? '',
      contractNumber: generateNextContractNumber(state.contracts, 'HĐLĐ', today),
      contractType: defaultKind,
      startDate: today,
      endDate: computeContractEndDate(today, defaultKind),
      baseSalary: firstEmp?.baseSalary ?? 18_000_000,
      allowance: firstEmp?.allowance ?? 1_500_000,
      paymentMethod: 'Chuyển khoản ngân hàng',
      payDay: 10,
      workLocation: branch?.address ?? settings.address,
      jobDuties: 'Thực hiện công việc chuyên môn theo mô tả vị trí và phân công của Trưởng bộ phận.',
    });
    setCreateModalOpen(true);
  };

  const handleSelectEmployeeInCreate = (empId: string) => {
    const emp = state.employees.find((e) => e.id === empId);
    const branch = state.branches.find((b) => b.id === emp?.branchId);
    setCreateForm((prev) => ({
      ...prev,
      employeeId: empId,
      baseSalary: emp?.baseSalary ?? prev.baseSalary,
      allowance: emp?.allowance ?? prev.allowance,
      workLocation: branch?.address ?? prev.workLocation,
    }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.employeeId || !createForm.contractNumber.trim()) return;
    onCreateContract({
      contractNumber: createForm.contractNumber.trim(),
      employeeId: createForm.employeeId,
      contractType: createForm.contractType,
      startDate: createForm.startDate,
      endDate:
        createForm.contractType === 'Không xác định thời hạn'
          ? 'Không thời hạn'
          : createForm.endDate,
      baseSalary: createForm.baseSalary,
      allowance: createForm.allowance,
      paymentMethod: createForm.paymentMethod,
      payDay: createForm.payDay,
      workLocation: createForm.workLocation.trim() || settings.address,
      jobDuties: createForm.jobDuties.trim(),
      signedDate: createForm.startDate,
    });
    setCreateModalOpen(false);
  };

  const openExtendModal = (contract: LaborContract) => {
    setExtendingContract(contract);
    const nextKind: LaborContractKind =
      contract.contractType === 'Thử việc 2 tháng'
        ? 'Xác định thời hạn 12 tháng'
        : contract.contractType === 'Xác định thời hạn 12 tháng'
          ? 'Xác định thời hạn 24 tháng'
          : 'Không xác định thời hạn';
    const nextStart =
      contract.endDate && contract.endDate !== 'Không thời hạn' && contract.endDate >= today
        ? contract.endDate
        : today;
    setExtendForm({
      contractNumber: generateNextContractNumber(state.contracts, 'HĐLĐ', nextStart),
      contractType: nextKind,
      startDate: nextStart,
      endDate: computeContractEndDate(nextStart, nextKind),
      baseSalary: contract.baseSalary,
      allowance: contract.allowance,
      payDay: contract.payDay,
    });
  };

  const handleExtendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingContract || !extendForm.contractNumber.trim()) return;
    onExtendContract(extendingContract.id, {
      ...extendForm,
      contractNumber: extendForm.contractNumber.trim(),
      endDate:
        extendForm.contractType === 'Không xác định thời hạn'
          ? 'Không thời hạn'
          : extendForm.endDate,
    });
    setExtendingContract(null);
  };

  const handleTerminateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminatingContract) return;
    onTerminateContract(
      terminatingContract.id,
      terminateForm.terminatedDate,
      terminateForm.reason.trim()
    );
    setTerminatingContract(null);
  };

  const renderStatusText = (status: LaborContractStatus) => {
    if (status === 'Đang hiệu lực') return 'text-emerald-700';
    if (status === 'Thử việc') return 'text-blue-700';
    if (status === 'Sắp hết hạn') return 'text-amber-700';
    if (status === 'Hết hạn') return 'text-red-700';
    return 'text-slate-500';
  };

  const viewingEmployee = viewingContract
    ? state.employees.find((e) => e.id === viewingContract.employeeId) ?? null
    : null;
  const viewingPosition = viewingEmployee
    ? state.positions.find((p) => p.id === viewingEmployee.positionId) ?? null
    : null;
  const viewingDepartment = viewingEmployee
    ? state.departments.find((d) => d.id === viewingEmployee.departmentId) ?? null
    : null;

  return (
    <div className="space-y-6">
      {/* 4 Lifecycle KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Tổng hợp đồng hiệu lực</div>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {stats.effective}
          </div>
          <div className="mt-1 text-xs text-slate-500">Đang còn giá trị pháp lý</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Hợp đồng thử việc</div>
          <div className="mt-2 font-mono text-2xl font-bold text-blue-700 tabular-nums">
            {stats.probation}
          </div>
          <div className="mt-1 text-xs text-slate-500">Thời hạn thử việc 2 tháng</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Sắp hết hạn (30 ngày)</div>
          <div className="mt-2 font-mono text-2xl font-bold text-amber-700 tabular-nums">
            {stats.expiringSoon}
          </div>
          <div className="mt-1 text-xs text-slate-500">Cần đánh giá gia hạn</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Hết hạn / Đã thanh lý</div>
          <div className="mt-2 font-mono text-2xl font-bold text-red-700 tabular-nums">
            {stats.expiredOrTerminated}
          </div>
          <div className="mt-1 text-xs text-slate-500">Cần tái ký hoặc lưu trữ</div>
        </div>
      </div>

      {/* Filter & Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm số hợp đồng, tên nhân viên, mã NV..."
              aria-label="Tìm kiếm hợp đồng"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-brand focus:outline-none"
            />
          </div>

          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            aria-label="Lọc theo loại hợp đồng"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none"
          >
            <option value="all">Tất cả loại hợp đồng</option>
            {CONTRACT_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Lọc theo trạng thái hợp đồng"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="Đang hiệu lực">Đang hiệu lực</option>
            <option value="Thử việc">Thử việc</option>
            <option value="Sắp hết hạn">Sắp hết hạn</option>
            <option value="Hết hạn">Hết hạn</option>
            <option value="Đã thanh lý">Đã thanh lý</option>
          </select>
        </div>

        {role === 'admin' && (
          <div className="flex flex-wrap items-center gap-2.5 max-w-full">
            <button
              type="button"
              onClick={() => {
                const csv = buildContractsCsv({
                  items: filteredRows,
                  departments: state.departments,
                });
                const filename = `OSHRM_DanhSachHopDong_${today}.csv`;
                downloadCsvFile(filename, csv);
                onExportSuccess?.(
                  `Đã xuất danh sách ${filteredRows.length} hợp đồng lao động ra file ${filename}.`
                );
              }}
              disabled={filteredRows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
              <span>Xuất Danh sách Hợp đồng</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on transition-colors hover:bg-brand-hover whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo hợp đồng mới</span>
            </button>
          </div>
        )}
      </div>

      {/* Contracts Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>
            Hiển thị <strong className="text-slate-900">{filteredRows.length}</strong> /{' '}
            {scopedContracts.length} hợp đồng lao động
          </span>
        </div>

        {filteredRows.length === 0 ? (
          <div className="py-12 text-center">
            <FileSignature className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              Không tìm thấy hợp đồng lao động nào phù hợp
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Số hợp đồng</th>
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3">Loại hợp đồng</th>
                  <th className="px-4 py-3">Thời hạn</th>
                  <th className="px-4 py-3 text-right">Lương căn bản</th>
                  <th className="px-4 py-3 text-right">Phụ cấp</th>
                  <th className="px-4 py-3">Trả lương</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map(({ contract, status, employee }) => {
                  const isTerminated = status === 'Đã thanh lý';
                  return (
                    <tr key={contract.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-text whitespace-nowrap">
                        {contract.contractNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 whitespace-nowrap">
                          {employee?.fullName ?? 'Nhân sự đã xóa'}
                        </div>
                        <div className="font-mono text-xs text-slate-500">
                          {employee?.code ?? '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-800 whitespace-nowrap">
                        {contract.contractType}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        <div>Từ: {formatDateVN(contract.startDate)}</div>
                        <div>
                          Đến:{' '}
                          {contract.endDate === 'Không thời hạn'
                            ? 'Không thời hạn'
                            : formatDateVN(contract.endDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-900 tabular-nums whitespace-nowrap">
                        {formatVND(contract.baseSalary)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                        {formatVND(contract.allowance)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        <div>{contract.paymentMethod}</div>
                        <div className="text-slate-500">Ngày {contract.payDay} hằng tháng</div>
                      </td>
                      <td
                        className={`px-4 py-3 text-xs font-semibold whitespace-nowrap ${renderStatusText(status)}`}
                      >
                        {status}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingContract(contract)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Xem &amp; In</span>
                          </button>

                          {role === 'admin' && !isTerminated && (
                            <>
                              <button
                                type="button"
                                onClick={() => openExtendModal(contract)}
                                title="Gia hạn hợp đồng"
                                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Gia hạn</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTerminatingContract(contract);
                                  setTerminateForm({
                                    terminatedDate: today,
                                    reason:
                                      'Thỏa thuận chấm dứt hợp đồng lao động theo quy định.',
                                  });
                                }}
                                title="Thanh lý hợp đồng"
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 whitespace-nowrap shrink-0"
                              >
                                <FileX2 className="h-3.5 w-3.5" />
                                <span>Thanh lý</span>
                              </button>
                            </>
                          )}
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

      {/* Create Labor Contract Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Tạo hợp đồng lao động mới"
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ctr-emp" className="block text-xs font-semibold text-slate-700 mb-1">
                Nhân viên ký kết
              </label>
              <select
                id="ctr-emp"
                value={createForm.employeeId}
                onChange={(e) => handleSelectEmployeeInCreate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {state.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.code} — {emp.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ctr-num" className="block text-xs font-semibold text-slate-700 mb-1">
                Số hợp đồng
              </label>
              <input
                id="ctr-num"
                required
                value={createForm.contractNumber}
                onChange={(e) => setCreateForm({ ...createForm, contractNumber: e.target.value })}
                placeholder="VD: 2611/HĐLĐ"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="ctr-kind" className="block text-xs font-semibold text-slate-700 mb-1">
                Loại hợp đồng
              </label>
              <select
                id="ctr-kind"
                value={createForm.contractType}
                onChange={(e) => {
                  const nextKind = e.target.value as LaborContractKind;
                  const nextSuffix = nextKind === 'Thử việc 2 tháng' ? 'HĐTV' : 'HĐLĐ';
                  setCreateForm((prev) => ({
                    ...prev,
                    contractType: nextKind,
                    contractNumber: prev.contractNumber.replace(/\/HĐ(LĐ|TV)$/i, `/${nextSuffix}`),
                    endDate: computeContractEndDate(prev.startDate, nextKind),
                  }));
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {CONTRACT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ctr-start" className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày bắt đầu
              </label>
              <input
                id="ctr-start"
                type="date"
                required
                value={createForm.startDate}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                    endDate: computeContractEndDate(e.target.value, prev.contractType),
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="ctr-end" className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày hết hạn
              </label>
              {createForm.contractType === 'Không xác định thời hạn' ? (
                <input
                  id="ctr-end"
                  disabled
                  value="Không thời hạn"
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                />
              ) : (
                <input
                  id="ctr-end"
                  type="date"
                  required
                  value={createForm.endDate}
                  onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="ctr-sal" className="block text-xs font-semibold text-slate-700 mb-1">
                Lương căn bản (VNĐ)
              </label>
              <input
                id="ctr-sal"
                type="number"
                min={0}
                step={500000}
                required
                value={createForm.baseSalary}
                onChange={(e) =>
                  setCreateForm({ ...createForm, baseSalary: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="ctr-allow" className="block text-xs font-semibold text-slate-700 mb-1">
                Phụ cấp (VNĐ)
              </label>
              <input
                id="ctr-allow"
                type="number"
                min={0}
                step={100000}
                required
                value={createForm.allowance}
                onChange={(e) =>
                  setCreateForm({ ...createForm, allowance: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="ctr-pay-method" className="block text-xs font-semibold text-slate-700 mb-1">
                Hình thức trả lương
              </label>
              <select
                id="ctr-pay-method"
                value={createForm.paymentMethod}
                onChange={(e) =>
                  setCreateForm({ ...createForm, paymentMethod: e.target.value as PaymentMethod })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                <option value="Chuyển khoản ngân hàng">Chuyển khoản ngân hàng</option>
                <option value="Tiền mặt">Tiền mặt</option>
              </select>
            </div>
            <div>
              <label htmlFor="ctr-payday" className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày trả lương
              </label>
              <input
                id="ctr-payday"
                type="number"
                min={1}
                max={28}
                required
                value={createForm.payDay}
                onChange={(e) => setCreateForm({ ...createForm, payDay: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ctr-loc" className="block text-xs font-semibold text-slate-700 mb-1">
              Địa điểm làm việc
            </label>
            <input
              id="ctr-loc"
              required
              value={createForm.workLocation}
              onChange={(e) => setCreateForm({ ...createForm, workLocation: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="ctr-duties" className="block text-xs font-semibold text-slate-700 mb-1">
              Công việc phải làm
            </label>
            <textarea
              id="ctr-duties"
              rows={2}
              value={createForm.jobDuties}
              onChange={(e) => setCreateForm({ ...createForm, jobDuties: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
            >
              Lưu &amp; Phát hành hợp đồng
            </button>
          </div>
        </form>
      </Modal>

      {/* Extend / Renew Labor Contract Modal */}
      <Modal
        open={Boolean(extendingContract)}
        onClose={() => setExtendingContract(null)}
        title="Gia hạn / Ký tiếp hợp đồng lao động"
        subtitle={
          extendingContract ? `Hợp đồng hiện tại: ${extendingContract.contractNumber}` : ''
        }
        maxWidthClass="max-w-xl"
      >
        {extendingContract && (
          <form onSubmit={handleExtendSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ext-num" className="block text-xs font-semibold text-slate-700 mb-1">
                  Số hợp đồng mới / phụ lục gia hạn
                </label>
                <input
                  id="ext-num"
                  required
                  value={extendForm.contractNumber}
                  onChange={(e) =>
                    setExtendForm({ ...extendForm, contractNumber: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ext-kind" className="block text-xs font-semibold text-slate-700 mb-1">
                  Loại hợp đồng gia hạn
                </label>
                <select
                  id="ext-kind"
                  value={extendForm.contractType}
                  onChange={(e) => {
                    const kind = e.target.value as LaborContractKind;
                    setExtendForm((prev) => ({
                      ...prev,
                      contractType: kind,
                      endDate: computeContractEndDate(prev.startDate, kind),
                    }));
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                >
                  {CONTRACT_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ext-start" className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày hiệu lực mới
                </label>
                <input
                  id="ext-start"
                  type="date"
                  required
                  value={extendForm.startDate}
                  onChange={(e) =>
                    setExtendForm((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                      endDate: computeContractEndDate(e.target.value, prev.contractType),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ext-end" className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày hết hạn mới
                </label>
                {extendForm.contractType === 'Không xác định thời hạn' ? (
                  <input
                    id="ext-end"
                    disabled
                    value="Không thời hạn"
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                  />
                ) : (
                  <input
                    id="ext-end"
                    type="date"
                    required
                    value={extendForm.endDate}
                    onChange={(e) => setExtendForm({ ...extendForm, endDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="ext-sal" className="block text-xs font-semibold text-slate-700 mb-1">
                  Lương căn bản mới
                </label>
                <input
                  id="ext-sal"
                  type="number"
                  min={0}
                  step={500000}
                  required
                  value={extendForm.baseSalary}
                  onChange={(e) =>
                    setExtendForm({ ...extendForm, baseSalary: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ext-allow" className="block text-xs font-semibold text-slate-700 mb-1">
                  Phụ cấp mới
                </label>
                <input
                  id="ext-allow"
                  type="number"
                  min={0}
                  step={100000}
                  required
                  value={extendForm.allowance}
                  onChange={(e) =>
                    setExtendForm({ ...extendForm, allowance: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ext-payday" className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày trả lương
                </label>
                <input
                  id="ext-payday"
                  type="number"
                  min={1}
                  max={28}
                  required
                  value={extendForm.payDay}
                  onChange={(e) => setExtendForm({ ...extendForm, payDay: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setExtendingContract(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
              >
                Xác nhận gia hạn
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Terminate Labor Contract Modal */}
      <Modal
        open={Boolean(terminatingContract)}
        onClose={() => setTerminatingContract(null)}
        title="Thanh lý hợp đồng lao động"
        maxWidthClass="max-w-md"
      >
        {terminatingContract && (
          <form onSubmit={handleTerminateSubmit} className="space-y-4">
            <p className="text-sm text-slate-600">
              Xác nhận thanh lý hợp đồng{' '}
              <strong className="font-mono text-slate-900">
                {terminatingContract.contractNumber}
              </strong>
              . Hợp đồng sẽ chuyển sang trạng thái <strong>Đã thanh lý</strong> và được lưu trữ đối
              chiếu pháp lý.
            </p>
            <div>
              <label htmlFor="term-date" className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày thanh lý hợp đồng
              </label>
              <input
                id="term-date"
                type="date"
                required
                value={terminateForm.terminatedDate}
                onChange={(e) =>
                  setTerminateForm({ ...terminateForm, terminatedDate: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="term-reason" className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do thanh lý
              </label>
              <textarea
                id="term-reason"
                rows={2}
                required
                value={terminateForm.reason}
                onChange={(e) => setTerminateForm({ ...terminateForm, reason: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTerminatingContract(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Xác nhận thanh lý
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Official Vietnamese Administrative Labor Contract View & Print Modal */}
      <Modal
        open={Boolean(viewingContract)}
        onClose={() => setViewingContract(null)}
        title={
          viewingContract
            ? `Văn bản Hợp đồng lao động (${viewingContract.contractNumber})`
            : 'Hợp đồng lao động'
        }
        subtitle="Mẫu chuẩn hành chính Việt Nam theo Bộ luật Lao động 2019"
        maxWidthClass="max-w-4xl"
      >
        {viewingContract && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 no-print">
              <div className="text-xs text-slate-600">
                Thông tin Bên A tự động đồng bộ từ <strong>Cài đặt Hệ thống</strong> · Thông tin
                Bên B đồng bộ từ <strong>Hồ sơ Nhân sự</strong>.
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-brand-on hover:bg-brand-hover whitespace-nowrap shrink-0"
              >
                <Printer className="h-4 w-4" />
                <span>In / Xuất PDF</span>
              </button>
            </div>

            {/* White Paper Official Administrative Document */}
            <div
              id="printable-contract"
              className="font-legal mx-auto rounded-lg border border-slate-300 bg-white p-6 sm:p-10 text-[14px] leading-relaxed text-slate-950 shadow-sm"
            >
              {/* Quốc hiệu tiêu ngữ */}
              <div className="text-center space-y-1">
                <div className="text-[13px] font-bold uppercase tracking-wide">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-[14px] font-bold">Độc lập - Tự do - Hạnh phúc</div>
                <div className="mx-auto w-44 border-b border-slate-900 pt-0.5" />
              </div>

              {/* Title & Legal Basis */}
              <div className="mt-6 text-center space-y-1">
                <h2 className="text-[20px] font-bold uppercase tracking-wide">
                  {viewingContract.contractType === 'Thử việc 2 tháng'
                    ? 'HỢP ĐỒNG THỬ VIỆC'
                    : 'HỢP ĐỒNG LAO ĐỘNG'}
                </h2>
                <div className="text-[13px] font-semibold">
                  Số: {viewingContract.contractNumber}
                </div>
                <div className="pt-2 text-[13px] italic text-slate-800">
                  Căn cứ Bộ luật Lao động số 45/2019/QH14 của Quốc hội nước Cộng hòa Xã hội Chủ
                  nghĩa Việt Nam;
                  <br />
                  Căn cứ nhu cầu tuyển dụng và năng lực thỏa thuận giữa hai bên;
                </div>
              </div>

              <p className="mt-5 text-[14px]">
                Hôm nay, ngày{' '}
                <strong>{formatDateVN(viewingContract.signedDate || viewingContract.startDate)}</strong>
                , tại trụ sở {settings.organizationName}, chúng tôi gồm có:
              </p>

              {/* Bên A */}
              <div className="mt-4 space-y-1.5">
                <div className="text-[14px] font-bold uppercase">
                  BÊN A: NGƯỜI SỬ DỤNG LAO ĐỘNG
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 pl-2">
                  <div className="sm:col-span-2">
                    Tên đơn vị: <strong className="uppercase">{settings.organizationName}</strong>
                  </div>
                  <div>
                    Mã số thuế: <span className="font-semibold">{settings.taxCode || '—'}</span>
                  </div>
                  <div>
                    Điện thoại: <span className="font-semibold">{settings.phone || '—'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    Địa chỉ trụ sở: <span>{settings.address || '—'}</span>
                  </div>
                  <div>
                    Người đại diện:{' '}
                    <strong>{settings.legalRepresentative || '—'}</strong>
                  </div>
                  <div>
                    Chức vụ:{' '}
                    <strong>{settings.legalRepresentativeTitle || 'Người đại diện pháp luật'}</strong>
                  </div>
                </div>
              </div>

              {/* Bên B */}
              <div className="mt-4 space-y-1.5">
                <div className="text-[14px] font-bold uppercase">BÊN B: NGƯỜI LAO ĐỘNG</div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 pl-2">
                  <div>
                    Ông/Bà: <strong className="uppercase">{viewingEmployee?.fullName ?? '—'}</strong>
                  </div>
                  <div>
                    Giới tính: <span>{viewingEmployee?.gender ?? '—'}</span>
                  </div>
                  <div>
                    Sinh ngày:{' '}
                    <span>
                      {viewingEmployee ? formatDateVN(viewingEmployee.dateOfBirth) : '—'}
                    </span>
                  </div>
                  <div>
                    Điện thoại: <span>{viewingEmployee?.phone ?? '—'}</span>
                  </div>
                  <div>
                    Số CCCD/CMND:{' '}
                    <strong>{viewingEmployee?.nationalId ?? '—'}</strong>
                  </div>
                  <div>
                    Ngày cấp:{' '}
                    <span>
                      {viewingEmployee ? formatDateVN(viewingEmployee.nationalIdIssueDate) : '—'}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    Nơi cấp: <span>{viewingEmployee?.nationalIdIssuePlace ?? '—'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    Địa chỉ thường trú: <span>{viewingEmployee?.address ?? '—'}</span>
                  </div>
                </div>
              </div>

              <p className="mt-4 italic">
                Hai bên thống nhất ký kết Hợp đồng lao động với các điều khoản cụ thể sau đây:
              </p>

              {/* Điều 1 */}
              <div className="mt-3 space-y-1">
                <div className="font-bold">
                  Điều 1. Công việc, địa điểm làm việc và thời hạn hợp đồng
                </div>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Chức danh chuyên môn:</strong> {viewingPosition?.title ?? 'Nhân viên'}{' '}
                    (Bộ phận: {viewingDepartment?.name ?? '—'}).
                  </li>
                  <li>
                    <strong>Công việc phải làm:</strong>{' '}
                    {viewingContract.jobDuties ||
                      'Thực hiện công việc chuyên môn theo bản mô tả công việc và phân công của Bên A.'}
                  </li>
                  <li>
                    <strong>Địa điểm làm việc:</strong> {viewingContract.workLocation}
                  </li>
                  <li>
                    <strong>Loại hợp đồng:</strong> {viewingContract.contractType}.
                  </li>
                  <li>
                    <strong>Thời hạn hợp đồng:</strong> Từ ngày{' '}
                    <strong>{formatDateVN(viewingContract.startDate)}</strong> đến{' '}
                    <strong>
                      {viewingContract.endDate === 'Không thời hạn'
                        ? 'Không xác định thời hạn'
                        : `ngày ${formatDateVN(viewingContract.endDate)}`}
                    </strong>
                    .
                  </li>
                </ul>
              </div>

              {/* Điều 2 */}
              <div className="mt-3 space-y-1">
                <div className="font-bold">Điều 2. Tiền lương, phụ cấp và chế độ đãi ngộ</div>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Mức lương căn bản:</strong>{' '}
                    <strong className="tabular-nums">
                      {formatVND(viewingContract.baseSalary)}
                    </strong>{' '}
                    / tháng.
                  </li>
                  <li>
                    <strong>Phụ cấp:</strong>{' '}
                    <strong className="tabular-nums">
                      {formatVND(viewingContract.allowance)}
                    </strong>{' '}
                    / tháng (phụ cấp ăn trưa, đi lại, chuyên cần theo chính sách công ty).
                  </li>
                  <li>
                    <strong>Hình thức trả lương:</strong> {viewingContract.paymentMethod}.
                  </li>
                  <li>
                    <strong>Ngày trả lương hằng tháng:</strong> Vào ngày{' '}
                    <strong>{viewingContract.payDay}</strong> hằng tháng (nếu trùng ngày nghỉ sẽ chi
                    trả vào ngày làm việc liền trước).
                  </li>
                  <li>
                    <strong>Chế độ nâng bậc, nâng lương:</strong> Được xem xét đánh giá định kỳ hằng
                    năm dựa trên kết quả KPI và quy chế lương thưởng của Bên A.
                  </li>
                </ul>
              </div>

              {/* Điều 3 */}
              <div className="mt-3 space-y-1">
                <div className="font-bold">
                  Điều 3. Thời giờ làm việc, nghỉ ngơi và bảo hiểm bắt buộc
                </div>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Thời giờ làm việc:</strong> 08 giờ/ngày (từ Thứ Hai đến Thứ Sáu hằng
                    tuần; nghỉ Thứ Bảy, Chủ Nhật và các ngày Lễ, Tết theo quy định của Bộ luật Lao
                    động 2019).
                  </li>
                  <li>
                    <strong>Chế độ nghỉ phép:</strong> Người lao động được hưởng ngày nghỉ hằng năm
                    theo quy định pháp luật (tối thiểu 12 ngày/năm đối với điều kiện làm việc bình
                    thường).
                  </li>
                  <li>
                    <strong>Bảo hiểm xã hội, BHYT, BHTN:</strong> Bên A và Bên B thực hiện trích
                    đóng BHXH, BHYT, BHTN đầy đủ theo đúng tỷ lệ quy định của Nhà nước.
                  </li>
                </ul>
              </div>

              {viewingContract.statusOverride === 'Đã thanh lý' && (
                <div className="mt-4 border border-slate-400 bg-slate-50 p-3 text-[13px]">
                  <strong>Ghi nhận thanh lý:</strong> Hợp đồng đã được thanh lý vào ngày{' '}
                  {formatDateVN(viewingContract.terminatedDate || today)}. Lý do:{' '}
                  {viewingContract.terminationReason || 'Theo thỏa thuận giữa hai bên.'}
                </div>
              )}

              {/* Signatures */}
              <div className="mt-8 grid grid-cols-2 gap-8 text-center pt-2">
                <div>
                  <div className="font-bold uppercase">NGƯỜI LAO ĐỘNG (BÊN B)</div>
                  <div className="text-[12px] italic">(Ký và ghi rõ họ tên)</div>
                  <div className="mt-16 font-bold">{viewingEmployee?.fullName ?? ''}</div>
                </div>
                <div>
                  <div className="font-bold uppercase">ĐẠI DIỆN BÊN A</div>
                  <div className="text-[12px] italic">
                    ({settings.legalRepresentativeTitle || 'Người đại diện'}, ký và đóng dấu)
                  </div>
                  <div className="mt-16 font-bold">{settings.legalRepresentative}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
