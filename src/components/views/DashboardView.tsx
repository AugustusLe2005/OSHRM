import React from 'react';
import {
  Users,
  UserCheck,
  Clock,
  Wallet,
  Check,
  X,
  ArrowRight,
  Briefcase,
} from 'lucide-react';
import type { HrmState, NavSection } from '../../types/hrm';
import {
  calculatePayslip,
  formatDateVN,
  formatVND,
  getApprovedOtHoursForMonth,
  getTodayIsoLocal,
} from '../../utils/hrmLogic';

interface DashboardViewProps {
  state: HrmState;
  onNavigate: (nav: NavSection) => void;
  onReviewRequest: (requestId: string, decision: 'Đã duyệt' | 'Từ chối') => void;
}

export function DashboardView({ state, onNavigate, onReviewRequest }: DashboardViewProps) {
  const today = getTodayIsoLocal();
  const activeEmployees = state.employees.filter((e) => e.status !== 'Nghỉ việc');
  const totalHeadcount = activeEmployees.length;

  const todayRecords = state.attendance.filter((a) => a.date === today && a.checkInTime);
  const checkedInIds = new Set(todayRecords.map((a) => a.employeeId));
  const attendanceRate =
    totalHeadcount > 0 ? Math.round((checkedInIds.size / totalHeadcount) * 100) : 0;
  const onTimeCount = todayRecords.filter((a) => a.status === 'Đúng giờ').length;
  const lateCount = todayRecords.filter((a) => a.status === 'Đi muộn').length;

  const pendingRequests = state.requests.filter((r) => r.status === 'Chờ duyệt');

  const currentMonth = today.slice(0, 7);
  const totalMonthlyNetPayroll = activeEmployees.reduce((sum, emp) => {
    const dept = state.departments.find((d) => d.id === emp.departmentId)?.name ?? '';
    const pos = state.positions.find((p) => p.id === emp.positionId)?.title ?? '';
    const otHours = getApprovedOtHoursForMonth(state.requests, emp.id, currentMonth);
    const slip = calculatePayslip({
      employee: emp,
      departmentName: dept,
      positionTitle: pos,
      month: currentMonth,
      approvedOtHours: otHours,
    });
    return sum + slip.netSalary;
  }, 0);

  const deptStats = state.departments.map((dept) => {
    const members = activeEmployees.filter((e) => e.departmentId === dept.id);
    const payrollSum = members.reduce((s, e) => s + e.baseSalary + e.allowance, 0);
    const ratio = totalHeadcount > 0 ? Math.round((members.length / totalHeadcount) * 100) : 0;
    return {
      dept,
      count: members.length,
      payrollSum,
      ratio,
    };
  });

  const maxDeptCount = Math.max(1, ...deptStats.map((d) => d.count));

  const readyToHireCandidates = state.candidates.filter(
    (c) => c.stage === 'Trúng tuyển' && !c.convertedEmployeeId
  );

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Stat Cards */}
      <section aria-label="Chỉ số nhân sự chính" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng nhân sự</span>
            <Users className="h-4 w-4 text-brand-text" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold text-slate-900 tabular-nums">
              {totalHeadcount}
            </span>
            <span className="text-xs text-slate-500">nhân viên</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {state.departments.length} phòng ban · {state.branches.length} chi nhánh
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tỷ lệ đi làm hôm nay</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold text-slate-900 tabular-nums">
              {attendanceRate}%
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              ({checkedInIds.size}/{totalHeadcount})
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 tabular-nums">
            Đúng giờ: {onTimeCount} · Đi muộn: {lateCount}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Đơn chờ duyệt</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold text-slate-900 tabular-nums">
              {pendingRequests.length}
            </span>
            <span className="text-xs text-slate-500">đơn từ</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {pendingRequests.length > 0
              ? 'Cần HR xem xét và phê duyệt'
              : 'Đã xử lý toàn bộ đơn trong hàng đợi'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng quỹ lương thực nhận</span>
            <Wallet className="h-4 w-4 text-brand-text" />
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {formatVND(totalMonthlyNetPayroll)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 tabular-nums">
            Kỳ lương tháng {currentMonth.split('-')[1]}/{currentMonth.split('-')[0]} (sau BH &amp; thuế)
          </div>
        </div>
      </section>

      {/* Main Analytics Grid: Department Distribution Chart + Pending Approvals */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Headcount by Department Chart */}
        <section className="xl:col-span-7 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Phân bổ nhân sự theo phòng ban
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Thống kê số lượng nhân sự và tỷ trọng quỹ lương cơ bản từng đơn vị
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('organization')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text hover:opacity-80 whitespace-nowrap shrink-0"
            >
              <span>Cơ cấu tổ chức</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-5 space-y-5">
            {deptStats.map(({ dept, count, payrollSum, ratio }) => {
              const barWidth = Math.max(6, Math.round((count / maxDeptCount) * 100));
              return (
                <div key={dept.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium text-slate-900">{dept.name}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        Trưởng bộ phận: {dept.managerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono text-xs tabular-nums">
                      <span className="font-semibold text-slate-900">{count} nhân sự</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-600">{ratio}%</span>
                    </div>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded bg-slate-100">
                    <div
                      className="h-full rounded bg-brand transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 tabular-nums">
                    <span>Mã: {dept.code}</span>
                    <span>Quỹ lương gộp cơ bản: {formatVND(payrollSum)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Action Queue: Pending Leave & OT Requests */}
        <section className="xl:col-span-5 rounded-xl border border-slate-200 bg-white p-6 flex flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Đơn từ cần duyệt ngay</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Duyệt nhanh nghỉ phép năm (tự động trừ phép) hoặc tăng ca
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('attendance')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text hover:opacity-80 whitespace-nowrap shrink-0"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 flex-1 divide-y divide-slate-100">
            {pendingRequests.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Không còn đơn nào đang chờ phê duyệt
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Mọi đơn xin nghỉ phép và tăng ca đã được xử lý.
                </p>
              </div>
            ) : (
              pendingRequests.map((req) => {
                const emp = state.employees.find((e) => e.id === req.employeeId);
                return (
                  <div key={req.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">
                          {emp?.fullName ?? 'Nhân viên'}{' '}
                          <span className="font-mono text-xs font-normal text-slate-500">
                            ({emp?.code})
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-slate-600">
                          {req.type} ·{' '}
                          <span className="font-mono tabular-nums">
                            {formatDateVN(req.startDate)}
                          </span>
                          {req.type === 'Tăng ca (OT)'
                            ? ` · ${req.otHours} giờ`
                            : ` · ${req.days} ngày`}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{req.reason}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onReviewRequest(req.id, 'Đã duyệt')}
                          aria-label={`Duyệt đơn của ${emp?.fullName ?? req.id}`}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Duyệt</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onReviewRequest(req.id, 'Từ chối')}
                          aria-label={`Từ chối đơn của ${emp?.fullName ?? req.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-red-600 whitespace-nowrap"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Từ chối</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Bottom Recruitment & Quick Onboarding Strip */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Briefcase className="h-4 w-4 text-brand-text" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Ứng viên trúng tuyển chờ nhận việc (ATS)
              </h2>
              <p className="text-xs text-slate-500">
                {readyToHireCandidates.length} ứng viên đã đạt phỏng vấn, sẵn sàng chuyển sang Hồ sơ
                nhân sự chính thức
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('recruitment')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <span>Mở bảng Tuyển dụng (ATS)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-2.5 pr-4">Ứng viên</th>
                <th className="py-2.5 px-4">Vị trí ứng tuyển</th>
                <th className="py-2.5 px-4">Nguồn</th>
                <th className="py-2.5 px-4 text-right">Mức lương kỳ vọng</th>
                <th className="py-2.5 pl-4 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.candidates.slice(0, 4).map((cand) => {
                const pos = state.positions.find((p) => p.id === cand.appliedPositionId);
                return (
                  <tr key={cand.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{cand.fullName}</td>
                    <td className="py-2.5 px-4 text-slate-600">{pos?.title ?? '—'}</td>
                    <td className="py-2.5 px-4 text-slate-500">{cand.source}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {formatVND(cand.expectedSalary)}
                    </td>
                    <td className="py-2.5 pl-4 text-right text-xs font-semibold">
                      {cand.convertedEmployeeId ? (
                        <span className="text-emerald-700">Đã thành nhân viên</span>
                      ) : cand.stage === 'Trúng tuyển' ? (
                        <span className="text-brand-text">Trúng tuyển</span>
                      ) : (
                        <span className="text-slate-600">{cand.stage}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
