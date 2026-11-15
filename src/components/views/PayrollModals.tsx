import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Info, Pencil, RotateCcw } from 'lucide-react';
import type { Employee, PayslipBreakdown } from '../../types/hrm';
import {
  calculatePayslip,
  DEPENDENT_TAX_DEDUCTION,
  formatVND,
  PERSONAL_TAX_DEDUCTION,
  PIT_BRACKETS,
} from '../../utils/hrmLogic';
import { Modal } from '../Modal';

interface FormulaBreakdownContentProps {
  payslip: PayslipBreakdown;
}

export function FormulaBreakdownContent({ payslip }: FormulaBreakdownContentProps) {
  const totalFamilyDeduction = payslip.personalDeduction + payslip.dependentDeduction;
  const roundedHourlyRate = Math.round(payslip.hourlyRate);

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Quick verification equation banner */}
      <div className="rounded-lg border border-brand-border bg-brand-soft/60 p-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-text">
          <Calculator className="h-4 w-4 shrink-0" />
          <span>Phương trình kiểm chứng trực tiếp ({payslip.employeeCode} · {payslip.fullName})</span>
        </div>
        <div className="mt-2 font-mono text-xs leading-relaxed text-slate-800 break-words">
          {formatVND(payslip.proratedBaseSalary)} + {formatVND(payslip.allowance)} +{' '}
          {formatVND(payslip.otPay)} + {formatVND(payslip.bonus)} −{' '}
          {formatVND(payslip.insuranceDeduction)} − {formatVND(payslip.personalIncomeTax)} −{' '}
          {formatVND(payslip.deduction)} ={' '}
          <strong className="text-emerald-700 font-bold">{formatVND(payslip.netSalary)}</strong>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          (Lương ngày công + Phụ cấp + Tiền OT + Thưởng ĐC − Bảo hiểm 10,5% − Thuế TNCN − Khấu trừ khác = Thực nhận)
        </div>
      </div>

      {/* Step-by-step calculation blocks */}
      <div className="space-y-2.5">
        {/* Step 1 */}
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold text-slate-900">
              Bước 1. Lương theo ngày công thực tế
            </span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {formatVND(payslip.proratedBaseSalary)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600 font-mono">
            {formatVND(payslip.baseSalary)} × ({payslip.actualWorkDays} / {payslip.standardWorkDays} ngày công chuẩn) ={' '}
            {formatVND(payslip.proratedBaseSalary)}
          </p>
        </div>

        {/* Step 2 */}
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold text-slate-900">
              Bước 2. Tổng thu nhập gộp (Gross)
            </span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {formatVND(payslip.grossSalary)}
            </span>
          </div>
          <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
            <li className="flex justify-between gap-2">
              <span>• Lương theo ngày công thực tế</span>
              <span className="font-mono tabular-nums">{formatVND(payslip.proratedBaseSalary)}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>• Phụ cấp cố định</span>
              <span className="font-mono tabular-nums">+ {formatVND(payslip.allowance)}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>
                • Tiền tăng ca OT ({payslip.approvedOtHours}h × {formatVND(roundedHourlyRate)}/h × 150%)
              </span>
              <span className="font-mono tabular-nums">+ {formatVND(payslip.otPay)}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>• Thưởng / Điều chỉnh cộng</span>
              <span className="font-mono text-emerald-700 font-medium tabular-nums">
                + {formatVND(payslip.bonus)}
              </span>
            </li>
          </ul>
        </div>

        {/* Step 3 */}
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold text-slate-900">
              Bước 3. Bảo hiểm bắt buộc (10,5% Lương cơ bản)
            </span>
            <span className="font-mono font-semibold text-red-600 tabular-nums">
              −{formatVND(payslip.insuranceDeduction)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600 font-mono">
            {formatVND(payslip.baseSalary)} × (8% BHXH + 1,5% BHYT + 1% BHTN) ={' '}
            {formatVND(payslip.insuranceDeduction)}
          </p>
        </div>

        {/* Step 4 */}
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold text-slate-900">
              Bước 4. Giảm trừ gia cảnh &amp; Thu nhập tính thuế
            </span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {formatVND(payslip.taxableIncome)}
            </span>
          </div>
          <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
            <li className="flex justify-between gap-2">
              <span>• Giảm trừ bản thân người nộp thuế</span>
              <span className="font-mono tabular-nums">{formatVND(PERSONAL_TAX_DEDUCTION)}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>
                • Giảm trừ người phụ thuộc ({payslip.dependentsCount} người ×{' '}
                {formatVND(DEPENDENT_TAX_DEDUCTION)})
              </span>
              <span className="font-mono tabular-nums">{formatVND(payslip.dependentDeduction)}</span>
            </li>
            <li className="flex justify-between gap-2 pt-1 border-t border-slate-100 text-slate-700 font-medium">
              <span>
                Thu nhập tính thuế = max(0, {formatVND(payslip.grossSalary)} −{' '}
                {formatVND(payslip.insuranceDeduction)} − {formatVND(totalFamilyDeduction)})
              </span>
              <span className="font-mono tabular-nums shrink-0">{formatVND(payslip.taxableIncome)}</span>
            </li>
          </ul>
        </div>

        {/* Step 5 */}
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold text-slate-900">
              Bước 5. Thuế TNCN lũy tiến từng phần (Biểu 7 bậc)
            </span>
            <span className="font-mono font-semibold text-red-600 tabular-nums">
              −{formatVND(payslip.personalIncomeTax)}
            </span>
          </div>
          {payslip.pitBrackets.length === 0 ? (
            <p className="mt-1 text-xs text-slate-600">
              Thu nhập tính thuế = 0 ₫ → Không phát sinh Thuế TNCN trong kỳ.
            </p>
          ) : (
            <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
              {payslip.pitBrackets.map((b) => (
                <li key={b.level} className="flex justify-between gap-2">
                  <span>
                    • Bậc {b.level} ({b.label}): {formatVND(b.taxableAmount)} ×{' '}
                    {Math.round(b.rate * 100)}%
                  </span>
                  <span className="font-mono tabular-nums shrink-0">{formatVND(b.taxAmount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Step 6 */}
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold text-slate-900">
              Bước 6. Khấu trừ / Phạt khác &amp; Lương thực nhận (Net)
            </span>
            <span className="font-mono font-bold text-emerald-700 tabular-nums">
              {formatVND(payslip.netSalary)}
            </span>
          </div>
          <div className="mt-1 space-y-1 text-xs text-slate-600">
            <div className="flex justify-between gap-2">
              <span>• Khấu trừ / Phạt điều chỉnh tay</span>
              <span className="font-mono text-red-600 tabular-nums">
                −{formatVND(payslip.deduction)}
              </span>
            </div>
            {payslip.adjustmentNote && (
              <div className="rounded bg-slate-50 px-2.5 py-1.5 text-slate-700">
                <span className="font-semibold">Ghi chú điều chỉnh:</span> {payslip.adjustmentNote}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PayrollFormulaModalProps {
  open: boolean;
  onClose: () => void;
  payslips: PayslipBreakdown[];
  month: string;
}

export function PayrollFormulaModal({
  open,
  onClose,
  payslips,
  month,
}: PayrollFormulaModalProps) {
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');

  useEffect(() => {
    if (open && payslips.length > 0) {
      setSelectedEmpId((prev) =>
        payslips.some((p) => p.employeeId === prev) ? prev : payslips[0].employeeId
      );
    }
  }, [open, payslips]);

  const activeSlip =
    payslips.find((p) => p.employeeId === selectedEmpId) ?? payslips[0] ?? null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chi tiết công thức & Diễn giải tính lương"
      subtitle={`Kỳ lương tháng ${month.slice(5)}/${month.slice(0, 4)} · Kiểm chứng minh bạch từng bước`}
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-5">
        {payslips.length > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <label
              htmlFor="formula-employee-select"
              className="text-xs font-semibold text-slate-700"
            >
              Chọn nhân viên để đối chiếu số liệu cụ thể:
            </label>
            <select
              id="formula-employee-select"
              value={activeSlip?.employeeId ?? ''}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none max-w-full"
            >
              {payslips.map((p) => (
                <option key={p.employeeId} value={p.employeeId}>
                  {p.employeeCode} — {p.fullName} ({formatVND(p.netSalary)})
                </option>
              ))}
            </select>
          </div>
        )}

        {activeSlip ? (
          <FormulaBreakdownContent payslip={activeSlip} />
        ) : (
          <p className="text-sm text-slate-500">Không có dữ liệu bảng lương trong kỳ này.</p>
        )}

        {/* Reference 7-bracket PIT table */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <Info className="h-3.5 w-3.5 text-brand-text" />
            <span>Biểu thuế TNCN lũy tiến từng phần áp dụng (Luật Thuế TNCN Việt Nam)</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 text-xs text-slate-600">
            {PIT_BRACKETS.map((b) => (
              <div
                key={b.level}
                className="flex items-center justify-between rounded bg-white px-2.5 py-1 border border-slate-100"
              >
                <span>Bậc {b.level}: {b.label.replace(/\s*\(\d+%\)$/, '')}</span>
                <span className="font-mono font-semibold text-slate-800">
                  {Math.round(b.rate * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface ManualAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  payslip: PayslipBreakdown | null;
  employee: Employee | null;
  onSave: (payload: {
    employeeId: string;
    month: string;
    bonus: number;
    deduction: number;
    adjustmentNote: string;
  }) => void;
}

export function ManualAdjustmentModal({
  open,
  onClose,
  payslip,
  employee,
  onSave,
}: ManualAdjustmentModalProps) {
  const [bonusInput, setBonusInput] = useState('0');
  const [deductionInput, setDeductionInput] = useState('0');
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    if (open && payslip) {
      setBonusInput(String(payslip.bonus || 0));
      setDeductionInput(String(payslip.deduction || 0));
      setNoteInput(payslip.adjustmentNote || '');
    }
  }, [open, payslip]);

  const parsedBonus = Math.max(0, Math.round(Number(bonusInput) || 0));
  const parsedDeduction = Math.max(0, Math.round(Number(deductionInput) || 0));

  const previewSlip = useMemo(() => {
    if (!payslip || !employee) return null;
    return calculatePayslip({
      employee,
      departmentName: payslip.departmentName,
      positionTitle: payslip.positionTitle,
      month: payslip.month,
      approvedOtHours: payslip.approvedOtHours,
      actualWorkDays: payslip.actualWorkDays,
      adjustment: {
        bonus: parsedBonus,
        deduction: parsedDeduction,
        adjustmentNote: noteInput,
      },
    });
  }, [employee, noteInput, parsedBonus, parsedDeduction, payslip]);

  if (!payslip || !employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      employeeId: payslip.employeeId,
      month: payslip.month,
      bonus: parsedBonus,
      deduction: parsedDeduction,
      adjustmentNote: noteInput.trim(),
    });
    onClose();
  };

  const handleResetZero = () => {
    setBonusInput('0');
    setDeductionInput('0');
    setNoteInput('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Điều chỉnh tay phiếu lương"
      subtitle={`${payslip.employeeCode} · ${payslip.fullName} · Kỳ tháng ${payslip.month.slice(5)}/${payslip.month.slice(0, 4)}`}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
          <div>
            <div className="text-slate-500">Lương cơ bản</div>
            <div className="mt-0.5 font-mono font-semibold text-slate-900 tabular-nums">
              {formatVND(payslip.baseSalary)}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Phụ cấp + OT</div>
            <div className="mt-0.5 font-mono font-semibold text-slate-900 tabular-nums">
              {formatVND(payslip.allowance + payslip.otPay)}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Thực nhận hiện tại</div>
            <div className="mt-0.5 font-mono font-semibold text-brand-text tabular-nums">
              {formatVND(payslip.netSalary)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="adj-bonus"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Thưởng / Điều chỉnh cộng (VNĐ)
            </label>
            <input
              id="adj-bonus"
              type="number"
              min={0}
              step={50000}
              value={bonusInput}
              onChange={(e) => setBonusInput(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-brand focus:outline-none"
            />
            <div className="mt-1 text-[11px] font-mono text-emerald-700">
              +{formatVND(parsedBonus)} (tính vào thu nhập gộp)
            </div>
          </div>

          <div>
            <label
              htmlFor="adj-deduction"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Khấu trừ / Phạt (VNĐ)
            </label>
            <input
              id="adj-deduction"
              type="number"
              min={0}
              step={50000}
              value={deductionInput}
              onChange={(e) => setDeductionInput(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-brand focus:outline-none"
            />
            <div className="mt-1 text-[11px] font-mono text-red-600">
              −{formatVND(parsedDeduction)} (trừ vào thực nhận)
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="adj-note"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Lý do / Ghi chú điều chỉnh
          </label>
          <textarea
            id="adj-note"
            rows={2}
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="VD: Thưởng hoàn thành dự án Q4, đi muộn 2 buổi..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none"
          />
        </div>

        {previewSlip && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
              <Pencil className="h-3.5 w-3.5" />
              <span>Dự kiến sau điều chỉnh (tự động tính lại Thuế TNCN &amp; Net)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div>
                <div className="text-emerald-800/80">Tổng Gross mới</div>
                <div className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatVND(previewSlip.grossSalary)}
                </div>
              </div>
              <div>
                <div className="text-emerald-800/80">Thuế TNCN mới</div>
                <div className="font-mono font-semibold text-red-600 tabular-nums">
                  −{formatVND(previewSlip.personalIncomeTax)}
                </div>
              </div>
              <div>
                <div className="text-emerald-800/80">Thực nhận (Net) mới</div>
                <div className="font-mono font-bold text-emerald-700 tabular-nums">
                  {formatVND(previewSlip.netSalary)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleResetZero}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Đặt lại 0 ₫</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
            >
              Lưu điều chỉnh
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
