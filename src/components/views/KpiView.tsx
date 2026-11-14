import React, { useMemo, useState } from 'react';
import { Plus, SlidersHorizontal, Trash2, Target } from 'lucide-react';
import type { Employee, HrmState, KpiItem, UserRole } from '../../types/hrm';
import { calculateKpiOverallScore, formatDateVN } from '../../utils/hrmLogic';
import { Modal } from '../Modal';

interface KpiViewProps {
  role: UserRole;
  currentUser: Employee | null;
  state: HrmState;
  onAddKpi: (kpi: Omit<KpiItem, 'id'>) => void;
  onUpdateKpiProgress: (
    kpiId: string,
    updates: { actualValue: number; completionPercent: number; evaluatorNote: string }
  ) => void;
  onDeleteKpi: (kpiId: string) => void;
}

export function KpiView({
  role,
  currentUser,
  state,
  onAddKpi,
  onUpdateKpiProgress,
  onDeleteKpi,
}: KpiViewProps) {
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>('all');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [gradingKpi, setGradingKpi] = useState<KpiItem | null>(null);

  const [newKpiForm, setNewKpiForm] = useState({
    employeeId: state.employees[1]?.id ?? state.employees[0]?.id ?? '',
    quarter: 'Q4/2026',
    title: '',
    category: 'Hiệu suất công việc',
    targetValue: 100,
    actualValue: 0,
    unit: '%',
    weight: 30,
    deadline: '2026-12-31',
    evaluatorNote: '',
  });

  const [gradeForm, setGradeForm] = useState({
    actualValue: 0,
    completionPercent: 0,
    evaluatorNote: '',
  });

  const visibleEmployees = useMemo(() => {
    if (role === 'ess' && currentUser) return [currentUser];
    if (selectedEmpFilter !== 'all') {
      return state.employees.filter((e) => e.id === selectedEmpFilter);
    }
    return state.employees.filter((e) => {
      const hasKpi = state.kpis.some((k) => k.employeeId === e.id);
      return hasKpi;
    });
  }, [currentUser, role, selectedEmpFilter, state.employees, state.kpis]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKpiForm.title.trim()) return;
    const completion =
      newKpiForm.targetValue > 0
        ? Math.min(150, Math.round((newKpiForm.actualValue / newKpiForm.targetValue) * 100))
        : 0;
    onAddKpi({
      ...newKpiForm,
      completionPercent: completion,
    });
    setAddModalOpen(false);
    setNewKpiForm({
      ...newKpiForm,
      title: '',
      actualValue: 0,
      evaluatorNote: '',
    });
  };

  const openGradeModal = (kpi: KpiItem) => {
    setGradingKpi(kpi);
    setGradeForm({
      actualValue: kpi.actualValue,
      completionPercent: kpi.completionPercent,
      evaluatorNote: kpi.evaluatorNote,
    });
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingKpi) return;
    onUpdateKpiProgress(gradingKpi.id, gradeForm);
    setGradingKpi(null);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {role === 'admin' ? (
          <div className="flex items-center gap-3">
            <label htmlFor="kpi-emp-filter" className="text-xs font-semibold text-slate-600">
              Nhân viên:
            </label>
            <select
              id="kpi-emp-filter"
              value={selectedEmpFilter}
              onChange={(e) => setSelectedEmpFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none"
            >
              <option value="all">Nhân viên đang có KPI</option>
              {state.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.code} — {e.fullName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-sm text-slate-600">
            Bảng đánh giá chỉ tiêu hiệu suất (KPI) của{' '}
            <strong className="text-slate-900">{currentUser?.fullName}</strong>
          </div>
        )}

        {role === 'admin' && (
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on transition-colors hover:bg-brand-hover whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Giao KPI mới</span>
          </button>
        )}
      </div>

      {/* Employee KPI Scorecards */}
      {visibleEmployees.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Target className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Nhân viên này chưa được giao mục tiêu KPI nào
          </p>
          {role === 'admin' && (
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-brand-on hover:bg-brand-hover"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Giao KPI đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {visibleEmployees.map((emp) => {
            const empKpis = state.kpis.filter((k) => k.employeeId === emp.id);
            const dept = state.departments.find((d) => d.id === emp.departmentId);
            const pos = state.positions.find((p) => p.id === emp.positionId);
            const summary = calculateKpiOverallScore(state.kpis, emp.id);

            return (
              <section
                key={emp.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-500">
                        {emp.code}
                      </span>
                      <h2 className="text-base font-semibold text-slate-900">{emp.fullName}</h2>
                    </div>
                    <p className="text-xs text-slate-500">
                      {pos?.title ?? '—'} · {dept?.name ?? '—'}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Điểm KPI tổng hợp</div>
                      <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                        {summary.weightedScore}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Xếp loại</div>
                      <div
                        className={`text-sm font-semibold ${
                          summary.rating === 'Xuất sắc'
                            ? 'text-emerald-700'
                            : summary.rating === 'Đạt yêu cầu'
                              ? 'text-brand-text'
                              : 'text-amber-700'
                        }`}
                      >
                        {summary.rating}
                      </div>
                    </div>
                  </div>
                </div>

                {empKpis.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Chưa có chỉ tiêu KPI nào được giao.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {empKpis.map((kpi) => (
                      <div
                        key={kpi.id}
                        className="px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">{kpi.quarter}</span>
                            <span aria-hidden="true">·</span>
                            <span>{kpi.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">Trọng số {kpi.weight}%</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">Hạn {formatDateVN(kpi.deadline)}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-slate-900">{kpi.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-600 tabular-nums">
                            <span>
                              Thực đạt:{' '}
                              <strong className="font-mono text-slate-900">
                                {kpi.actualValue} / {kpi.targetValue} {kpi.unit}
                              </strong>
                            </span>
                            {kpi.evaluatorNote && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-slate-500">{kpi.evaluatorNote}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="w-36">
                            <div className="flex justify-between text-xs mb-1 font-mono tabular-nums">
                              <span className="text-slate-500">Hoàn thành</span>
                              <span className="font-semibold text-slate-900">
                                {kpi.completionPercent}%
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
                              <div
                                className={`h-full rounded transition-all ${
                                  kpi.completionPercent >= 95
                                    ? 'bg-emerald-600'
                                    : kpi.completionPercent >= 75
                                      ? 'bg-brand'
                                      : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, kpi.completionPercent)}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openGradeModal(kpi)}
                              aria-label={`Chấm điểm KPI ${kpi.title}`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-text whitespace-nowrap"
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                              <span>{role === 'admin' ? 'Chấm điểm' : 'Cập nhật'}</span>
                            </button>
                            {role === 'admin' && (
                              <button
                                type="button"
                                onClick={() => onDeleteKpi(kpi.id)}
                                aria-label={`Xóa KPI ${kpi.title}`}
                                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Add KPI Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Giao chỉ tiêu KPI mới"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="kpi-emp" className="block text-xs font-semibold text-slate-700 mb-1">
                Nhân viên thực hiện
              </label>
              <select
                id="kpi-emp"
                value={newKpiForm.employeeId}
                onChange={(e) => setNewKpiForm({ ...newKpiForm, employeeId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {state.employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.code} — {e.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="kpi-q" className="block text-xs font-semibold text-slate-700 mb-1">
                Kỳ đánh giá
              </label>
              <input
                id="kpi-q"
                required
                value={newKpiForm.quarter}
                onChange={(e) => setNewKpiForm({ ...newKpiForm, quarter: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="kpi-title" className="block text-xs font-semibold text-slate-700 mb-1">
              Tên mục tiêu KPI
            </label>
            <input
              id="kpi-title"
              required
              value={newKpiForm.title}
              onChange={(e) => setNewKpiForm({ ...newKpiForm, title: e.target.value })}
              placeholder="VD: Hoàn thành 100% chỉ tiêu tuyển dụng quý 4"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="kpi-target" className="block text-xs font-semibold text-slate-700 mb-1">
                Mục tiêu
              </label>
              <input
                id="kpi-target"
                type="number"
                min={1}
                required
                value={newKpiForm.targetValue}
                onChange={(e) =>
                  setNewKpiForm({ ...newKpiForm, targetValue: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="kpi-unit" className="block text-xs font-semibold text-slate-700 mb-1">
                Đơn vị
              </label>
              <input
                id="kpi-unit"
                required
                value={newKpiForm.unit}
                onChange={(e) => setNewKpiForm({ ...newKpiForm, unit: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="kpi-weight" className="block text-xs font-semibold text-slate-700 mb-1">
                Trọng số (%)
              </label>
              <input
                id="kpi-weight"
                type="number"
                min={5}
                max={100}
                required
                value={newKpiForm.weight}
                onChange={(e) => setNewKpiForm({ ...newKpiForm, weight: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="kpi-due" className="block text-xs font-semibold text-slate-700 mb-1">
                Hạn chót
              </label>
              <input
                id="kpi-due"
                type="date"
                required
                value={newKpiForm.deadline}
                onChange={(e) => setNewKpiForm({ ...newKpiForm, deadline: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
            >
              Giao KPI
            </button>
          </div>
        </form>
      </Modal>

      {/* Grade KPI Progress Modal */}
      <Modal
        open={Boolean(gradingKpi)}
        onClose={() => setGradingKpi(null)}
        title="Chấm điểm & Cập nhật tiến độ KPI"
        subtitle={gradingKpi?.title}
      >
        {gradingKpi && (
          <form onSubmit={handleGradeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="grade-actual"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Kết quả thực đạt (Mục tiêu: {gradingKpi.targetValue} {gradingKpi.unit})
                </label>
                <input
                  id="grade-actual"
                  type="number"
                  min={0}
                  step="any"
                  required
                  value={gradeForm.actualValue}
                  onChange={(e) => {
                    const actual = Number(e.target.value);
                    const autoPct =
                      gradingKpi.targetValue > 0
                        ? Math.min(150, Math.round((actual / gradingKpi.targetValue) * 100))
                        : gradeForm.completionPercent;
                    setGradeForm({
                      ...gradeForm,
                      actualValue: actual,
                      completionPercent: autoPct,
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="grade-pct"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Điểm % hoàn thành (0 - 150%)
                </label>
                <input
                  id="grade-pct"
                  type="number"
                  min={0}
                  max={150}
                  required
                  value={gradeForm.completionPercent}
                  onChange={(e) =>
                    setGradeForm({ ...gradeForm, completionPercent: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="grade-note" className="block text-xs font-semibold text-slate-700 mb-1">
                Nhận xét đánh giá
              </label>
              <textarea
                id="grade-note"
                rows={2}
                value={gradeForm.evaluatorNote}
                onChange={(e) => setGradeForm({ ...gradeForm, evaluatorNote: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGradingKpi(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
              >
                Lưu kết quả KPI
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
