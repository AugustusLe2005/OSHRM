import React, { useMemo, useState } from 'react';
import { Printer, FileText, Calculator, FileSpreadsheet } from 'lucide-react';
import type {
  Employee,
  HrmState,
  PayslipBreakdown,
  SystemSettings,
  UserRole,
} from '../../types/hrm';
import {
  calculatePayslip,
  formatVND,
  getApprovedOtHoursForMonth,
  getTodayIsoLocal,
} from '../../utils/hrmLogic';
import { buildPayrollCsv, downloadCsvFile } from '../../utils/csvExport';
import { BrandMark } from '../BrandMark';
import { Modal } from '../Modal';

interface PayrollViewProps {
  role: UserRole;
  currentUser: Employee | null;
  state: HrmState;
  settings: SystemSettings;
  onExportSuccess?: (message: string) => void;
}

export function PayrollView({
  role,
  currentUser,
  state,
  settings,
  onExportSuccess,
}: PayrollViewProps) {
  const defaultMonth = getTodayIsoLocal().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipBreakdown | null>(null);

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
      return calculatePayslip({
        employee: emp,
        departmentName: dept,
        positionTitle: pos,
        month: selectedMonth,
        approvedOtHours: otHours,
      });
    });
  }, [currentUser?.id, role, selectedMonth, state.departments, state.employees, state.positions, state.requests]);

  const totals = useMemo(() => {
    return payslips.reduce(
      (acc, p) => ({
        gross: acc.gross + p.grossSalary,
        insurance: acc.insurance + p.insuranceDeduction,
        tax: acc.tax + p.personalIncomeTax,
        net: acc.net + p.netSalary,
      }),
      { gross: 0, insurance: 0, tax: 0, net: 0 }
    );
  }, [payslips]);

  const handleExportPayroll = () => {
    const csv = buildPayrollCsv({ payslips, employees: state.employees });
    const filename = `OSHRM_BangLuong_${selectedMonth}.csv`;
    downloadCsvFile(filename, csv);
    onExportSuccess?.(`Đã xuất bảng lương kỳ ${selectedMonth} (${payslips.length} nhân sự) ra file ${filename}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls & Formula Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Công thức tính lương tự động (Payroll Engine)
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Thực nhận = (Lương cơ bản + Phụ cấp + Tiền OT 150%) − 10.5% Bảo hiểm (BHXH/BHYT/BHTN)
              − Thuế TNCN lũy tiến (Giảm trừ gia cảnh 11 triệu + 4,4 triệu/người phụ thuộc)
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
            onClick={handleExportPayroll}
            disabled={payslips.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
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
        </div>
      </div>

      {/* Payroll Sheet Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3 text-right">Lương cơ bản</th>
                <th className="px-4 py-3 text-right">Phụ cấp</th>
                <th className="px-4 py-3 text-right">Tiền OT</th>
                <th className="px-4 py-3 text-right">Bảo hiểm (10.5%)</th>
                <th className="px-4 py-3 text-right">Thuế TNCN</th>
                <th className="px-4 py-3 text-right">Thực nhận (Net)</th>
                <th className="px-4 py-3 text-right">Phiếu lương</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payslips.map((slip) => (
                <tr key={slip.employeeId} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{slip.fullName}</div>
                    <div className="text-xs text-slate-500">
                      <span className="font-mono">{slip.employeeCode}</span> · {slip.departmentName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                    {formatVND(slip.baseSalary)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                    {formatVND(slip.allowance)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                    {slip.otPay > 0 ? (
                      <span>
                        {formatVND(slip.otPay)}{' '}
                        <span className="text-xs text-slate-400">({slip.approvedOtHours}h)</span>
                      </span>
                    ) : (
                      '0 ₫'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-red-600 tabular-nums whitespace-nowrap">
                    -{formatVND(slip.insuranceDeduction)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-red-600 tabular-nums whitespace-nowrap">
                    -{formatVND(slip.personalIncomeTax)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                    {formatVND(slip.netSalary)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedPayslip(slip)}
                      aria-label={`Xem phiếu lương của ${slip.fullName}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-text"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Chi tiết &amp; In</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Payslip Modal */}
      <Modal
        open={Boolean(selectedPayslip)}
        onClose={() => setSelectedPayslip(null)}
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
                    · Ngày công chuẩn: {selectedPayslip.standardWorkDays} ngày
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
                      <dt className="text-slate-600">Lương cơ bản</dt>
                      <dd className="font-mono text-slate-900 tabular-nums whitespace-nowrap shrink-0">
                        {formatVND(selectedPayslip.baseSalary)}
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
                    <div className="flex items-baseline justify-between gap-3 pt-2 font-semibold">
                      <dt className="text-slate-900">Thuế TNCN phải nộp</dt>
                      <dd className="font-mono text-red-600 tabular-nums whitespace-nowrap shrink-0">
                        -{formatVND(selectedPayslip.personalIncomeTax)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-900 px-5 py-4 text-white">
                <div>
                  <div className="text-xs font-semibold text-slate-300">
                    Số tiền thực lĩnh (Net Salary)
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Đã trừ 10.5% Bảo hiểm và Thuế TNCN
                  </div>
                </div>
                <div className="font-mono text-2xl font-bold tabular-nums whitespace-nowrap">
                  {formatVND(selectedPayslip.netSalary)}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 no-print">
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
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
