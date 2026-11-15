import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Printer,
  FileText,
  Calculator,
  FileSpreadsheet,
  Pencil,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  Employee,
  HrmState,
  SystemSettings,
  UserRole,
} from '../../types/hrm';
import {
  calculatePayslip,
  formatVND,
  getApprovedOtHoursForMonth,
  getPayrollAdjustmentForEmployee,
  getTodayIsoLocal,
} from '../../utils/hrmLogic';
import { buildPayrollCsv, downloadCsvFile } from '../../utils/csvExport';
import { BrandMark } from '../BrandMark';
import { Modal } from '../Modal';
import {
  FormulaBreakdownContent,
  ManualAdjustmentModal,
  PayrollFormulaModal,
} from './PayrollModals';

interface PayrollViewProps {
  role: UserRole;
  currentUser: Employee | null;
  state: HrmState;
  settings: SystemSettings;
  onSaveAdjustment: (payload: {
    employeeId: string;
    month: string;
    bonus: number;
    deduction: number;
    adjustmentNote: string;
  }) => void;
  onExportSuccess?: (message: string) => void;
}

export function PayrollView({
  role,
  currentUser,
  state,
  settings,
  onSaveAdjustment,
  onExportSuccess,
}: PayrollViewProps) {
  const defaultMonth = getTodayIsoLocal().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedPayslipEmpId, setSelectedPayslipEmpId] = useState<string | null>(null);
  const [adjustingEmpId, setAdjustingEmpId] = useState<string | null>(null);
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);
  const [showPayslipFormula, setShowPayslipFormula] = useState(false);
  const payslipFormulaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (showPayslipFormula && payslipFormulaRef.current) {
      payslipFormulaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showPayslipFormula]);

  const monthOptions = useMemo(() => {
    const currentYear = Number(defaultMonth.slice(0, 4));
    const currentM = Number(defaultMonth.slice(5, 7));
    const list: string[] = [];
    for (let i = 0; i < 4; i++) {
      let m = currentM - i;
      let y = currentYear;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }
      list.push(`${y}-${String(m).padStart(2, '0')}`);
    }
    return list;
  }, [defaultMonth]);

  const payslips = useMemo(() => {
    const targetEmployees =
      role === 'admin'
        ? state.employees.filter((e) => e.status !== 'Nghỉ việc')
        : state.employees.filter((e) => e.id === currentUser?.id);

    return targetEmployees.map((emp) => {
      const dept = state.departments.find((d) => d.id === emp.departmentId)?.name ?? '—';
      const pos = state.positions.find((p) => p.id === emp.positionId)?.title ?? '—';
      const otHours = getApprovedOtHoursForMonth(state.requests, emp.id, selectedMonth);
      const adjustment = getPayrollAdjustmentForEmployee(
        state.payrollAdjustments,
        emp.id,
        selectedMonth
      );
      return calculatePayslip({
        employee: emp,
        departmentName: dept,
        positionTitle: pos,
        month: selectedMonth,
        approvedOtHours: otHours,
        adjustment,
      });
    });
  }, [
    currentUser?.id,
    role,
    selectedMonth,
    state.departments,
    state.employees,
    state.payrollAdjustments,
    state.positions,
    state.requests,
  ]);

  const totals = useMemo(() => {
    return payslips.reduce(
      (acc, p) => ({
        gross: acc.gross + p.grossSalary,
        insurance: acc.insurance + p.insuranceDeduction,
        tax: acc.tax + p.personalIncomeTax,
        net: acc.net + p.netSalary,
        bonus: acc.bonus + p.bonus,
        deduction: acc.deduction + p.deduction,
      }),
      { gross: 0, insurance: 0, tax: 0, net: 0, bonus: 0, deduction: 0 }
    );
  }, [payslips]);

  const selectedPayslip = useMemo(
    () => payslips.find((p) => p.employeeId === selectedPayslipEmpId) ?? null,
    [payslips, selectedPayslipEmpId]
  );

  const adjustingPayslip = useMemo(
    () => payslips.find((p) => p.employeeId === adjustingEmpId) ?? null,
    [adjustingEmpId, payslips]
  );

  const adjustingEmployee = useMemo(
    () => state.employees.find((e) => e.id === adjustingEmpId) ?? null,
    [adjustingEmpId, state.employees]
  );

  const handleExportPayroll = () => {
    const csv = buildPayrollCsv({ payslips, employees: state.employees });
    const filename = `OSHRM_BangLuong_${selectedMonth}.csv`;
    downloadCsvFile(filename, csv);
    onExportSuccess?.(
      `Đã xuất bảng lương kỳ ${selectedMonth} (${payslips.length} nhân sự) ra file ${filename}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls & Formula Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
            <Calculator className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">
              Công thức tính lương tự động &amp; Điều chỉnh linh hoạt
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Thực nhận = (Lương ngày công + Phụ cấp + Tiền OT 150% + Thưởng ĐC) − 10.5% Bảo hiểm
              − Thuế TNCN lũy tiến − Khấu trừ khác
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 max-w-full">
          <label htmlFor="payroll-month" className="text-xs font-semibold text-slate-600">
            Kỳ lương:
          </label>
          <select
            id="payroll-month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono font-medium text-slate-900 focus:border-brand focus:outline-none"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                Tháng {m.slice(5)}/{m.slice(0, 4)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setFormulaModalOpen(true)}
            disabled={payslips.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-brand-soft/60 px-3.5 py-2 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-soft disabled:opacity-50 max-w-full"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>Xem chi tiết công thức &amp; Diễn giải tính lương</span>
          </button>

          <button
            type="button"
            onClick={handleExportPayroll}
            disabled={payslips.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50 whitespace-nowrap"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>Xuất Bảng lương Excel</span>
          </button>
        </div>
      </div>

      {/* Totals Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Tổng thu nhập gộp (Gross)</div>
          <div className="mt-1.5 font-mono text-xl font-semibold text-slate-900 tabular-nums">
            {formatVND(totals.gross)}
          </div>
          {totals.bonus > 0 && (
            <div className="mt-1 text-[11px] font-medium text-emerald-700 tabular-nums">
              Đã cộng thưởng điều chỉnh: +{formatVND(totals.bonus)}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Tổng trích BHXH/Y/TN (10.5%)</div>
          <div className="mt-1.5 font-mono text-xl font-semibold text-slate-900 tabular-nums">
            {formatVND(totals.insurance)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Tổng thuế TNCN</div>
          <div className="mt-1.5 font-mono text-xl font-semibold text-slate-900 tabular-nums">
            {formatVND(totals.tax)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Tổng quỹ lương thực nhận (Net)</div>
          <div className="mt-1.5 font-mono text-xl font-semibold text-brand-text tabular-nums">
            {formatVND(totals.net)}
          </div>
          {totals.deduction > 0 && (
            <div className="mt-1 text-[11px] font-medium text-red-600 tabular-nums">
              Đã trừ khấu trừ/phạt: −{formatVND(totals.deduction)}
            </div>
          )}
        </div>
      </div>

      {/* Payroll Sheet Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
              <tr>
                <th className="py-3 pl-3 pr-1.5 min-w-[132px]">Nhân viên</th>
                <th className="px-1.5 py-3 text-right whitespace-nowrap">Lương CB</th>
                <th className="px-1.5 py-3 text-right whitespace-nowrap">Phụ cấp</th>
                <th className="px-1.5 py-3 text-right whitespace-nowrap">Tiền OT</th>
                <th className="px-1.5 py-3 text-right whitespace-nowrap">Thưởng / ĐC</th>
                <th className="px-1.5 py-3 text-right whitespace-nowrap">Khấu trừ</th>
                <th className="px-1.5 py-3 text-right whitespace-nowrap">BH (10.5%)</th>
                <th className="px-1.5 py-3 text-right whitespace-nowrap">Thuế TNCN</th>
                <th className="px-1.5 py-3 text-right whitespace-nowrap">Thực nhận (Net)</th>
                <th className="py-3 pl-1.5 pr-3 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payslips.map((slip) => (
                <tr key={slip.employeeId} className="hover:bg-slate-50/70">
                  <td className="py-3 pl-3 pr-1.5 min-w-[132px] max-w-[155px]">
                    <div className="font-semibold text-slate-900 truncate">{slip.fullName}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      <span className="font-mono">{slip.employeeCode}</span> · {slip.departmentName}
                    </div>
                    {slip.adjustmentNote && (
                      <div className="mt-0.5 text-[11px] text-amber-700 truncate" title={slip.adjustmentNote}>
                        {slip.adjustmentNote}
                      </div>
                    )}
                  </td>
                  <td className="px-1.5 py-3 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                    {formatVND(slip.baseSalary)}
                  </td>
                  <td className="px-1.5 py-3 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                    {formatVND(slip.allowance)}
                  </td>
                  <td className="px-1.5 py-3 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                    {slip.otPay > 0 ? (
                      <div>
                        <div>{formatVND(slip.otPay)}</div>
                        <div className="text-[11px] text-slate-400">({slip.approvedOtHours}h OT)</div>
                      </div>
                    ) : (
                      '0 ₫'
                    )}
                  </td>
                  <td className="px-1.5 py-3 text-right font-mono tabular-nums whitespace-nowrap">
                    {slip.bonus > 0 ? (
                      <span className="font-medium text-emerald-700">+{formatVND(slip.bonus)}</span>
                    ) : (
                      <span className="text-slate-400">0 ₫</span>
                    )}
                  </td>
                  <td className="px-1.5 py-3 text-right font-mono tabular-nums whitespace-nowrap">
                    {slip.deduction > 0 ? (
                      <span className="font-medium text-red-600">−{formatVND(slip.deduction)}</span>
                    ) : (
                      <span className="text-slate-400">0 ₫</span>
                    )}
                  </td>
                  <td className="px-1.5 py-3 text-right font-mono text-red-600 tabular-nums whitespace-nowrap">
                    -{formatVND(slip.insuranceDeduction)}
                  </td>
                  <td className="px-1.5 py-3 text-right font-mono text-red-600 tabular-nums whitespace-nowrap">
                    -{formatVND(slip.personalIncomeTax)}
                  </td>
                  <td className="px-1.5 py-3 text-right font-mono font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                    {formatVND(slip.netSalary)}
                  </td>
                  <td className="py-3 pl-1.5 pr-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1">
                      {role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => setAdjustingEmpId(slip.employeeId)}
                          aria-label={`Điều chỉnh tay lương của ${slip.fullName}`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-brand-border hover:bg-brand-soft/60 hover:text-brand-text"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Điều chỉnh tay</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPayslipEmpId(slip.employeeId);
                          setShowPayslipFormula(false);
                        }}
                        aria-label={`Xem phiếu lương của ${slip.fullName}`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-text"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Chi tiết &amp; In</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Payroll Engine Formula Verification Modal */}
      <PayrollFormulaModal
        open={formulaModalOpen}
        onClose={() => setFormulaModalOpen(false)}
        payslips={payslips}
        month={selectedMonth}
      />

      {/* Admin Manual Salary Adjustment Modal */}
      {role === 'admin' && (
        <ManualAdjustmentModal
          open={Boolean(adjustingPayslip && adjustingEmployee)}
          onClose={() => setAdjustingEmpId(null)}
          payslip={adjustingPayslip}
          employee={adjustingEmployee}
          onSave={onSaveAdjustment}
        />
      )}

      {/* Printable Payslip Modal */}
      <Modal
        open={Boolean(selectedPayslip)}
        onClose={() => {
          setSelectedPayslipEmpId(null);
          setShowPayslipFormula(false);
        }}
        title="Phiếu lương chi tiết (Payslip)"
        subtitle={
          selectedPayslip
            ? `Kỳ lương tháng ${selectedPayslip.month.slice(5)}/${selectedPayslip.month.slice(0, 4)}`
            : ''
        }
        maxWidthClass="max-w-2xl"
      >
        {selectedPayslip && (
          <div className="space-y-5">
            <div id="printable-payslip" className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2.5">
                    <BrandMark settings={settings} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-brand-text leading-snug break-words">
                        {settings.organizationName}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-snug">
                        {settings.slogan}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 space-y-0.5 text-[11px] text-slate-500 leading-relaxed">
                    {settings.taxCode && (
                      <div>
                        MST: <span className="font-mono text-slate-700">{settings.taxCode}</span>
                        {settings.legalRepresentative && (
                          <span> · Đại diện PL: {settings.legalRepresentative}</span>
                        )}
                      </div>
                    )}
                    {!settings.taxCode && settings.legalRepresentative && (
                      <div>Đại diện PL: {settings.legalRepresentative}</div>
                    )}
                    {settings.address && <div className="break-words">Đ/c: {settings.address}</div>}
                  </div>
                  <h3 className="mt-3 text-base sm:text-lg font-bold text-slate-900">
                    Phiếu thanh toán tiền lương
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kỳ lương: Tháng {selectedPayslip.month.slice(5)}/{selectedPayslip.month.slice(0, 4)}{' '}
                    · Ngày công thực tế: {selectedPayslip.actualWorkDays}/{selectedPayslip.standardWorkDays} ngày
                  </p>
                </div>
                <div className="sm:text-right text-xs shrink-0 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                  <div className="font-mono font-semibold text-slate-900">
                    {selectedPayslip.employeeCode}
                  </div>
                  <div className="font-semibold text-slate-900">{selectedPayslip.fullName}</div>
                  <div className="text-slate-500">{selectedPayslip.positionTitle}</div>
                  <div className="text-slate-500">{selectedPayslip.departmentName}</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 mb-2">
                    Các khoản thu nhập
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-slate-100">
                      <dt className="text-slate-600">Lương cơ bản ({selectedPayslip.actualWorkDays}/{selectedPayslip.standardWorkDays} ngày)</dt>
                      <dd className="font-mono text-slate-900 tabular-nums whitespace-nowrap shrink-0">
                        {formatVND(selectedPayslip.proratedBaseSalary)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-slate-100">
                      <dt className="text-slate-600">Phụ cấp cố định</dt>
                      <dd className="font-mono text-slate-900 tabular-nums whitespace-nowrap shrink-0">
                        {formatVND(selectedPayslip.allowance)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-slate-100">
                      <dt className="text-slate-600">
                        Tiền tăng ca ({selectedPayslip.approvedOtHours}h × 150%)
                      </dt>
                      <dd className="font-mono text-slate-900 tabular-nums whitespace-nowrap shrink-0">
                        {formatVND(selectedPayslip.otPay)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-slate-100">
                      <dt className="text-slate-600">Thưởng / Điều chỉnh cộng</dt>
                      <dd className="font-mono text-emerald-700 tabular-nums whitespace-nowrap shrink-0">
                        +{formatVND(selectedPayslip.bonus)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 pt-2 font-semibold">
                      <dt className="text-slate-900">Tổng thu nhập (Gross)</dt>
                      <dd className="font-mono text-slate-900 tabular-nums whitespace-nowrap shrink-0">
                        {formatVND(selectedPayslip.grossSalary)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-500 mb-2">
                    Các khoản khấu trừ
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-slate-100">
                      <dt className="text-slate-600">Bảo hiểm (10.5% lương CB)</dt>
                      <dd className="font-mono text-red-600 tabular-nums whitespace-nowrap shrink-0">
                        -{formatVND(selectedPayslip.insuranceDeduction)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-slate-100">
                      <dt className="text-slate-600">Giảm trừ bản thân &amp; PT</dt>
                      <dd className="font-mono text-slate-500 tabular-nums whitespace-nowrap shrink-0">
                        {formatVND(
                          selectedPayslip.personalDeduction + selectedPayslip.dependentDeduction
                        )}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-slate-100">
                      <dt className="text-slate-600">Thu nhập tính thuế</dt>
                      <dd className="font-mono text-slate-700 tabular-nums whitespace-nowrap shrink-0">
                        {formatVND(selectedPayslip.taxableIncome)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-slate-100">
                      <dt className="text-slate-600">Thuế TNCN phải nộp</dt>
                      <dd className="font-mono text-red-600 tabular-nums whitespace-nowrap shrink-0">
                        -{formatVND(selectedPayslip.personalIncomeTax)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 pt-2 font-semibold">
                      <dt className="text-slate-900">Khấu trừ / Phạt khác</dt>
                      <dd className="font-mono text-red-600 tabular-nums whitespace-nowrap shrink-0">
                        -{formatVND(selectedPayslip.deduction)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {selectedPayslip.adjustmentNote && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900">
                  <span className="font-semibold">Ghi chú điều chỉnh lương: </span>
                  {selectedPayslip.adjustmentNote}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-900 px-5 py-4 text-white">
                <div>
                  <div className="text-xs font-semibold text-slate-300">
                    Số tiền thực lĩnh (Net Salary)
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Đã cộng thưởng &amp; trừ 10.5% Bảo hiểm, Thuế TNCN, Khấu trừ khác
                  </div>
                </div>
                <div className="font-mono text-2xl font-bold tabular-nums whitespace-nowrap">
                  {formatVND(selectedPayslip.netSalary)}
                </div>
              </div>
            </div>

            {/* Transparent Formula Breakdown Toggle inside Payslip Modal */}
            <div ref={payslipFormulaRef} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 no-print">
              <button
                type="button"
                aria-expanded={showPayslipFormula}
                onClick={() => setShowPayslipFormula((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-brand-text hover:opacity-90"
              >
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span>Xem chi tiết công thức &amp; Diễn giải tính lương</span>
                </span>
                {showPayslipFormula ? (
                  <ChevronUp className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                )}
              </button>

              {showPayslipFormula && (
                <div className="mt-3.5 pt-3.5 border-t border-slate-200">
                  <FormulaBreakdownContent payslip={selectedPayslip} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 no-print">
              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    const empId = selectedPayslip.employeeId;
                    setSelectedPayslipEmpId(null);
                    setAdjustingEmpId(empId);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Điều chỉnh tay</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedPayslipEmpId(null);
                  setShowPayslipFormula(false);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
              >
                <Printer className="h-4 w-4" />
                <span>In phiếu lương</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

