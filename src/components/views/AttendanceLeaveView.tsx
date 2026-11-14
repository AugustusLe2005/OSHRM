import React, { useEffect, useState } from 'react';
import { LogIn, LogOut, Plus, Check, X, Calendar, Clock } from 'lucide-react';
import type {
  Employee,
  HrmState,
  LeaveOtRequest,
  LeaveRequestType,
  RequestStatus,
  UserRole,
} from '../../types/hrm';
import { formatDateVN, getCurrentTimeLocal, getTodayIsoLocal } from '../../utils/hrmLogic';
import { Modal } from '../Modal';

interface AttendanceLeaveViewProps {
  role: UserRole;
  currentUser: Employee | null;
  state: HrmState;
  onCheckInOut: (employeeId: string, action: 'check-in' | 'check-out') => void;
  onCreateRequest: (req: Omit<LeaveOtRequest, 'id' | 'status' | 'createdAt'>) => void;
  onReviewRequest: (requestId: string, decision: Exclude<RequestStatus, 'Chờ duyệt'>) => boolean;
}

export function AttendanceLeaveView({
  role,
  currentUser,
  state,
  onCheckInOut,
  onCreateRequest,
  onReviewRequest,
}: AttendanceLeaveViewProps) {
  const [liveTime, setLiveTime] = useState(getCurrentTimeLocal);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reqFilter, setReqFilter] = useState<'all' | RequestStatus>('all');

  const today = getTodayIsoLocal();

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(getCurrentTimeLocal());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [reqForm, setReqForm] = useState({
    employeeId: currentUser?.id ?? state.employees[0]?.id ?? '',
    type: 'Nghỉ phép năm' as LeaveRequestType,
    startDate: today,
    endDate: today,
    days: 1,
    otHours: 2,
    reason: '',
  });

  const myTodayRecord = currentUser
    ? state.attendance.find((a) => a.employeeId === currentUser.id && a.date === today)
    : undefined;

  const hasCheckedIn = Boolean(myTodayRecord?.checkInTime);
  const hasCheckedOut = Boolean(myTodayRecord?.checkOutTime);

  const visibleRequests = state.requests.filter((r) => {
    const roleMatch = role === 'admin' || r.employeeId === currentUser?.id;
    const statusMatch = reqFilter === 'all' || r.status === reqFilter;
    return roleMatch && statusMatch;
  });

  const visibleAttendance = state.attendance
    .filter((a) => role === 'admin' || a.employeeId === currentUser?.id)
    .sort((a, b) => (a.date === b.date ? (b.checkInTime ?? '').localeCompare(a.checkInTime ?? '') : b.date.localeCompare(a.date)));

  const handleOpenCreateModal = () => {
    setReqForm({
      employeeId: currentUser?.id ?? state.employees[0]?.id ?? '',
      type: 'Nghỉ phép năm',
      startDate: today,
      endDate: today,
      days: 1,
      otHours: 2,
      reason: '',
    });
    setRequestModalOpen(true);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqForm.reason.trim()) return;
    const targetEmpId = role === 'admin' ? reqForm.employeeId : (currentUser?.id ?? reqForm.employeeId);
    onCreateRequest({
      employeeId: targetEmpId,
      type: reqForm.type,
      startDate: reqForm.startDate,
      endDate: reqForm.type === 'Tăng ca (OT)' ? reqForm.startDate : reqForm.endDate,
      days: reqForm.type === 'Tăng ca (OT)' ? 0 : Math.max(0.5, reqForm.days),
      otHours: reqForm.type === 'Tăng ca (OT)' ? Math.max(1, reqForm.otHours) : 0,
      reason: reqForm.reason.trim(),
    });
    setRequestModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Check-in/Check-out & Leave Balance Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Live Web Check-in / Check-out */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Chấm công trực tuyến · Hôm nay {formatDateVN(today)}
              </div>
              <div className="mt-2 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
                {liveTime}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Nhân viên: <strong className="text-slate-800">{currentUser?.fullName}</strong> (
                {currentUser?.code}) · Giờ chuẩn 08:30
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={!currentUser || hasCheckedIn}
                onClick={() => currentUser && onCheckInOut(currentUser.id, 'check-in')}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-on transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 whitespace-nowrap"
              >
                <LogIn className="h-4 w-4" />
                <span>Check-in</span>
              </button>
              <button
                type="button"
                disabled={!currentUser || !hasCheckedIn || hasCheckedOut}
                onClick={() => currentUser && onCheckInOut(currentUser.id, 'check-out')}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 whitespace-nowrap"
              >
                <LogOut className="h-4 w-4" />
                <span>Check-out</span>
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-xs">
            <div>
              <span className="text-slate-500">Giờ vào (Check-in)</span>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {myTodayRecord?.checkInTime ?? 'Chưa ghi nhận'}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Giờ ra (Check-out)</span>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {myTodayRecord?.checkOutTime ?? 'Chưa ghi nhận'}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Trạng thái hôm nay</span>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {myTodayRecord ? (
                  <span
                    className={
                      myTodayRecord.status === 'Đúng giờ' ? 'text-emerald-700' : 'text-amber-700'
                    }
                  >
                    {myTodayRecord.status}
                    {myTodayRecord.workHours > 0 ? ` (${myTodayRecord.workHours}h)` : ''}
                  </span>
                ) : (
                  <span className="text-slate-500">Chưa chấm công</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Leave Quota & Create Request Card */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Quỹ phép năm cá nhân</span>
              <Calendar className="h-4 w-4 text-brand-text" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold text-slate-900 tabular-nums">
                {currentUser?.annualLeaveRemaining ?? 0}
              </span>
              <span className="text-sm text-slate-500 tabular-nums">
                / {currentUser?.annualLeaveTotal ?? 12} ngày phép còn lại
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Khi đơn <strong className="text-slate-700">Nghỉ phép năm</strong> được Admin phê
              duyệt, hệ thống tự động trừ số ngày phép tương ứng. Đơn OT đã duyệt được cộng trực
              tiếp vào bảng tính lương.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo đơn xin nghỉ phép / OT</span>
            </button>
          </div>
        </section>
      </div>

      {/* Leave & OT Requests Section */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {role === 'admin' ? 'Danh sách đơn nghỉ phép & tăng ca toàn công ty' : 'Đơn từ của tôi'}
            </h2>
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['all', 'Chờ duyệt', 'Đã duyệt', 'Từ chối'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setReqFilter(status)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  reqFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'all' ? 'Tất cả' : status}
              </button>
            ))}
          </div>
        </div>

        {visibleRequests.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Không có đơn từ nào trong danh sách lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3">Loại đơn</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3 text-right">Thời lượng</th>
                  <th className="px-4 py-3">Lý do</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  {role === 'admin' && <th className="px-4 py-3 text-right">Phê duyệt</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRequests.map((req) => {
                  const emp = state.employees.find((e) => e.id === req.employeeId);
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{emp?.fullName ?? '—'}</div>
                        <div className="font-mono text-xs text-slate-500">
                          {emp?.code} · Còn {emp?.annualLeaveRemaining ?? 0} phép
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                        {req.type}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {formatDateVN(req.startDate)}
                        {req.endDate !== req.startDate ? ` – ${formatDateVN(req.endDate)}` : ''}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {req.type === 'Tăng ca (OT)' ? `${req.otHours} giờ` : `${req.days} ngày`}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">{req.reason}</td>
                      <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap">
                        <span
                          className={
                            req.status === 'Đã duyệt'
                              ? 'text-emerald-700'
                              : req.status === 'Từ chối'
                                ? 'text-red-600'
                                : 'text-amber-700'
                          }
                        >
                          {req.status}
                        </span>
                      </td>
                      {role === 'admin' && (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {req.status === 'Chờ duyệt' ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onReviewRequest(req.id, 'Đã duyệt')}
                                aria-label={`Duyệt đơn ${req.id}`}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Duyệt</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onReviewRequest(req.id, 'Từ chối')}
                                aria-label={`Từ chối đơn ${req.id}`}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Từ chối</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {req.reviewedBy ? `Bởi ${req.reviewedBy}` : 'Đã xử lý'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Attendance Log History */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-text" />
            <h2 className="text-base font-semibold text-slate-900">
              {role === 'admin' ? 'Nhật ký chấm công toàn công ty' : 'Lịch sử chấm công của tôi'}
            </h2>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {visibleAttendance.length} bản ghi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3">Giờ vào</th>
                <th className="px-4 py-3">Giờ ra</th>
                <th className="px-4 py-3 text-right">Tổng giờ</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleAttendance.map((att) => {
                const emp = state.employees.find((e) => e.id === att.employeeId);
                return (
                  <tr key={att.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums">
                      {formatDateVN(att.date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {emp?.fullName ?? '—'}{' '}
                      <span className="font-mono text-xs text-slate-500">({emp?.code})</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-800 tabular-nums">
                      {att.checkInTime ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-800 tabular-nums">
                      {att.checkOutTime ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                      {att.workHours > 0 ? `${att.workHours}h` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      <span
                        className={
                          att.status === 'Đúng giờ' ? 'text-emerald-700' : 'text-amber-700'
                        }
                      >
                        {att.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create Request Modal */}
      <Modal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title="Tạo đơn xin nghỉ phép / Tăng ca (OT)"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          {role === 'admin' && (
            <div>
              <label htmlFor="req-emp" className="block text-xs font-semibold text-slate-700 mb-1">
                Nhân viên gửi đơn
              </label>
              <select
                id="req-emp"
                value={reqForm.employeeId}
                onChange={(e) => setReqForm({ ...reqForm, employeeId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {state.employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.code} — {e.fullName} (Còn {e.annualLeaveRemaining} phép)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="req-type" className="block text-xs font-semibold text-slate-700 mb-1">
              Loại đơn yêu cầu
            </label>
            <select
              id="req-type"
              value={reqForm.type}
              onChange={(e) => setReqForm({ ...reqForm, type: e.target.value as LeaveRequestType })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="Nghỉ phép năm">Nghỉ phép năm (Trừ vào phép năm)</option>
              <option value="Nghỉ không lương">Nghỉ không lương</option>
              <option value="Tăng ca (OT)">Tăng ca (OT)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="req-start" className="block text-xs font-semibold text-slate-700 mb-1">
                {reqForm.type === 'Tăng ca (OT)' ? 'Ngày tăng ca' : 'Từ ngày'}
              </label>
              <input
                id="req-start"
                type="date"
                required
                value={reqForm.startDate}
                onChange={(e) => setReqForm({ ...reqForm, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>

            {reqForm.type !== 'Tăng ca (OT)' ? (
              <>
                <div>
                  <label
                    htmlFor="req-end"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Đến ngày
                  </label>
                  <input
                    id="req-end"
                    type="date"
                    required
                    value={reqForm.endDate}
                    onChange={(e) => setReqForm({ ...reqForm, endDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="req-days"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Số ngày nghỉ
                  </label>
                  <input
                    id="req-days"
                    type="number"
                    min={0.5}
                    max={15}
                    step={0.5}
                    required
                    value={reqForm.days}
                    onChange={(e) => setReqForm({ ...reqForm, days: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
                  />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <label htmlFor="req-ot" className="block text-xs font-semibold text-slate-700 mb-1">
                  Số giờ tăng ca (Hệ số 150%)
                </label>
                <input
                  id="req-ot"
                  type="number"
                  min={1}
                  max={24}
                  step={0.5}
                  required
                  value={reqForm.otHours}
                  onChange={(e) => setReqForm({ ...reqForm, otHours: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="req-reason" className="block text-xs font-semibold text-slate-700 mb-1">
              Lý do chi tiết
            </label>
            <textarea
              id="req-reason"
              required
              rows={2}
              value={reqForm.reason}
              onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })}
              placeholder="Nhập lý do xin nghỉ hoặc nội dung công việc tăng ca..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRequestModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
            >
              Gửi đơn chờ duyệt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
