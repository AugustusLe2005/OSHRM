import React, { useMemo, useState } from 'react';
import {
  Plus,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  Briefcase,
  Calendar,
  MapPin,
  Users,
} from 'lucide-react';
import type {
  Candidate,
  CandidateStage,
  HrmState,
  JobPosting,
  JobPostingStatus,
} from '../../types/hrm';
import { formatDateVN, formatVND, getTodayIsoLocal } from '../../utils/hrmLogic';
import { Modal } from '../Modal';

interface RecruitmentViewProps {
  state: HrmState;
  onAddJobPosting: (posting: Omit<JobPosting, 'id' | 'createdAt'>) => void;
  onUpdateJobPostingStatus: (postingId: string, status: JobPostingStatus) => void;
  onAddCandidate: (cand: Omit<Candidate, 'id'>) => void;
  onMoveStage: (candidateId: string, stage: CandidateStage) => void;
  onConvertCandidate: (
    candidateId: string,
    overrides?: {
      baseSalary?: number;
      allowance?: number;
      joinDate?: string;
      gender?: 'Nam' | 'Nữ';
      dateOfBirth?: string;
      nationalId?: string;
      nationalIdIssueDate?: string;
      nationalIdIssuePlace?: string;
      address?: string;
    }
  ) => void;
}

const STAGES: CandidateStage[] = ['Mới ứng tuyển', 'Phỏng vấn', 'Trúng tuyển'];

export function RecruitmentView({
  state,
  onAddJobPosting,
  onUpdateJobPostingStatus,
  onAddCandidate,
  onMoveStage,
  onConvertCandidate,
}: RecruitmentViewProps) {
  const today = getTodayIsoLocal();

  const [selectedPostingId, setSelectedPostingId] = useState<string>('all');
  const [postingModalOpen, setPostingModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [convertingCandidate, setConvertingCandidate] = useState<Candidate | null>(null);

  const [postingForm, setPostingForm] = useState({
    code: `TD-${today.slice(0, 4)}-${String(state.jobPostings.length + 1).padStart(2, '0')}`,
    positionId: state.positions[0]?.id ?? '',
    departmentId: state.departments[0]?.id ?? '',
    branchId: state.branches[0]?.id ?? '',
    headcount: 1,
    salaryRange: state.positions[0]?.salaryRange ?? '18.000.000 - 25.000.000 ₫',
    deadline: today,
    status: 'Đang tuyển' as JobPostingStatus,
    description: '',
  });

  const [newCandForm, setNewCandForm] = useState({
    jobPostingId: state.jobPostings[0]?.id ?? '',
    fullName: '',
    email: '',
    phone: '',
    appliedPositionId: state.positions[0]?.id ?? '',
    appliedDepartmentId: state.departments[0]?.id ?? '',
    appliedBranchId: state.branches[0]?.id ?? '',
    source: 'LinkedIn',
    expectedSalary: 20_000_000,
    notes: '',
  });

  const [onboardForm, setOnboardForm] = useState({
    baseSalary: 20_000_000,
    allowance: 1_500_000,
    joinDate: today,
    gender: 'Nam' as 'Nam' | 'Nữ',
    dateOfBirth: '1997-05-15',
    nationalId: '001097088412',
    nationalIdIssueDate: '2022-04-20',
    nationalIdIssuePlace: 'Cục Cảnh sát QLHC về TTXH',
    address: 'Hà Nội',
  });

  const filteredCandidates = useMemo(() => {
    if (selectedPostingId === 'all') return state.candidates;
    return state.candidates.filter((c) => c.jobPostingId === selectedPostingId);
  }, [selectedPostingId, state.candidates]);

  const openCreatePostingModal = () => {
    const firstPos = state.positions[0];
    const firstDept = state.departments.find((d) => d.id === firstPos?.departmentId) ?? state.departments[0];
    const nextCode = `TD-${today.slice(0, 4)}-${String(state.jobPostings.length + 1).padStart(2, '0')}`;
    const d = new Date(`${today}T00:00:00`);
    d.setDate(d.getDate() + 30);
    setPostingForm({
      code: nextCode,
      positionId: firstPos?.id ?? '',
      departmentId: firstDept?.id ?? '',
      branchId: firstDept?.branchId ?? state.branches[0]?.id ?? '',
      headcount: 1,
      salaryRange: firstPos?.salaryRange ?? '18.000.000 - 25.000.000 ₫',
      deadline: d.toISOString().slice(0, 10),
      status: 'Đang tuyển',
      description: '',
    });
    setPostingModalOpen(true);
  };

  const handleCreatePosting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postingForm.code.trim() || !postingForm.positionId) return;
    onAddJobPosting({
      ...postingForm,
      code: postingForm.code.trim(),
    });
    setPostingModalOpen(false);
  };

  const openAddCandidateModal = (posting?: JobPosting) => {
    const targetPosting =
      posting ??
      state.jobPostings.find((j) => j.id === selectedPostingId) ??
      state.jobPostings[0];

    setNewCandForm({
      jobPostingId: targetPosting?.id ?? '',
      fullName: '',
      email: '',
      phone: '',
      appliedPositionId: targetPosting?.positionId ?? state.positions[0]?.id ?? '',
      appliedDepartmentId: targetPosting?.departmentId ?? state.departments[0]?.id ?? '',
      appliedBranchId: targetPosting?.branchId ?? state.branches[0]?.id ?? '',
      source: 'LinkedIn',
      expectedSalary: 20_000_000,
      notes: '',
    });
    setAddModalOpen(true);
  };

  const handleSelectPostingInCandForm = (postingId: string) => {
    const posting = state.jobPostings.find((p) => p.id === postingId);
    if (!posting) {
      setNewCandForm((prev) => ({ ...prev, jobPostingId: '' }));
      return;
    }
    setNewCandForm((prev) => ({
      ...prev,
      jobPostingId: posting.id,
      appliedPositionId: posting.positionId,
      appliedDepartmentId: posting.departmentId,
      appliedBranchId: posting.branchId,
    }));
  };

  const handleCreateCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandForm.fullName.trim() || !newCandForm.email.trim()) return;
    onAddCandidate({
      ...newCandForm,
      jobPostingId: newCandForm.jobPostingId || undefined,
      appliedDate: getTodayIsoLocal(),
      stage: 'Mới ứng tuyển',
    });
    setAddModalOpen(false);
  };

  const openConvertModal = (cand: Candidate) => {
    setConvertingCandidate(cand);
    const branch = state.branches.find((b) => b.id === cand.appliedBranchId);
    setOnboardForm({
      baseSalary: cand.expectedSalary || 20_000_000,
      allowance: 1_500_000,
      joinDate: getTodayIsoLocal(),
      gender: 'Nam',
      dateOfBirth: '1997-05-15',
      nationalId: `0010970${Math.floor(10000 + Math.random() * 89999)}`,
      nationalIdIssueDate: '2022-04-20',
      nationalIdIssuePlace: 'Cục Cảnh sát QLHC về TTXH',
      address: branch?.name.includes('Hồ Chí Minh')
        ? 'Quận 3, TP. Hồ Chí Minh'
        : 'Cầu Giấy, Hà Nội',
    });
  };

  const handleConfirmConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingCandidate) return;
    onConvertCandidate(convertingCandidate.id, onboardForm);
    setConvertingCandidate(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Job Postings Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Tin tuyển dụng đang mở ({state.jobPostings.length})
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Đăng tin tuyển dụng mới và theo dõi số lượng hồ sơ ứng tuyển theo từng vị trí. Bấm vào
              thẻ tin để lọc ứng viên bên dưới.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={openCreatePostingModal}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Đăng tin tuyển dụng mới</span>
            </button>
            <button
              type="button"
              onClick={() => openAddCandidateModal()}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-brand-on transition-colors hover:bg-brand-hover whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm ứng viên</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {state.jobPostings.map((posting) => {
            const pos = state.positions.find((p) => p.id === posting.positionId);
            const dept = state.departments.find((d) => d.id === posting.departmentId);
            const branch = state.branches.find((b) => b.id === posting.branchId);
            const linkedCands = state.candidates.filter((c) => c.jobPostingId === posting.id);
            const hiredCount = linkedCands.filter((c) => c.convertedEmployeeId).length;
            const isSelected = selectedPostingId === posting.id;

            return (
              <div
                key={posting.id}
                className={`rounded-lg border p-4 transition-colors flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-brand bg-brand-soft/40'
                    : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-brand-text">
                      {posting.code}
                    </span>
                    <select
                      value={posting.status}
                      onChange={(e) =>
                        onUpdateJobPostingStatus(posting.id, e.target.value as JobPostingStatus)
                      }
                      aria-label={`Trạng thái tin ${posting.code}`}
                      className={`rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold focus:outline-none ${
                        posting.status === 'Đang tuyển'
                          ? 'text-emerald-700'
                          : posting.status === 'Tạm dừng'
                            ? 'text-amber-700'
                            : 'text-slate-500'
                      }`}
                    >
                      <option value="Đang tuyển">Đang tuyển</option>
                      <option value="Tạm dừng">Tạm dừng</option>
                      <option value="Đã đóng">Đã đóng</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPostingId((prev) => (prev === posting.id ? 'all' : posting.id))
                    }
                    className="text-left w-full"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 hover:text-brand-text">
                      {pos?.title ?? 'Vị trí tuyển dụng'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{dept?.name ?? '—'}</p>
                  </button>

                  <div className="space-y-1 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{branch?.name ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="tabular-nums">
                        Cần tuyển: <strong className="text-slate-900">{posting.headcount}</strong> ·
                        Đã tuyển: <strong className="text-emerald-700">{hiredCount}</strong> · Hồ
                        sơ: <strong className="text-slate-900">{linkedCands.length}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="tabular-nums">Hạn nộp: {formatDateVN(posting.deadline)}</span>
                    </div>
                    <div className="font-mono text-xs font-semibold text-slate-800 whitespace-nowrap">
                      {posting.salaryRange}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 pt-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPostingId((prev) => (prev === posting.id ? 'all' : posting.id))
                    }
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    {isSelected ? 'Hiện tất cả' : 'Lọc ứng viên'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddCandidateModal(posting)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Thêm ứng viên</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pipeline Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-600">
            Theo dõi ứng viên qua 3 giai đoạn. Khi ứng viên trúng tuyển, bấm{' '}
            <strong className="text-slate-900">Chuyển thành nhân viên</strong> để tự động tạo{' '}
            <strong className="text-slate-900">Hồ sơ Core HR</strong> và sinh kèm{' '}
            <strong className="text-slate-900">Hợp đồng thử việc 2 tháng</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="filter-posting" className="text-xs font-semibold text-slate-600">
            Lọc theo tin:
          </label>
          <select
            id="filter-posting"
            value={selectedPostingId}
            onChange={(e) => setSelectedPostingId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-brand focus:outline-none"
          >
            <option value="all">Tất cả tin tuyển dụng ({state.candidates.length})</option>
            {state.jobPostings.map((j) => {
              const p = state.positions.find((pos) => pos.id === j.positionId);
              return (
                <option key={j.id} value={j.id}>
                  {j.code} — {p?.title ?? 'Vị trí'}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* 3-Column ATS Kanban Pipeline */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {STAGES.map((stage) => {
          const items = filteredCandidates.filter((c) => c.stage === stage);
          return (
            <section
              key={stage}
              aria-label={`Cột ${stage}`}
              className="flex flex-col rounded-xl border border-slate-200 bg-slate-100/70 p-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-900">{stage}</h2>
                <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
                  {items.length}
                </span>
              </div>

              <div className="mt-3 space-y-3 flex-1">
                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-6 text-center text-xs text-slate-500">
                    Chưa có ứng viên ở giai đoạn này
                  </div>
                ) : (
                  items.map((cand) => {
                    const pos = state.positions.find((p) => p.id === cand.appliedPositionId);
                    const dept = state.departments.find((d) => d.id === cand.appliedDepartmentId);
                    const posting = cand.jobPostingId
                      ? state.jobPostings.find((j) => j.id === cand.jobPostingId)
                      : null;
                    const convertedEmp = cand.convertedEmployeeId
                      ? state.employees.find((e) => e.id === cand.convertedEmployeeId)
                      : null;

                    return (
                      <article
                        key={cand.id}
                        className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">
                              {cand.fullName}
                            </h3>
                            {posting && (
                              <span className="font-mono text-[11px] font-semibold text-slate-500">
                                {posting.code}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs font-medium text-brand-text">
                            {pos?.title ?? '—'} · {dept?.name ?? '—'}
                          </p>
                          <div className="mt-1.5 text-xs text-slate-500">
                            {cand.source} · Nộp {formatDateVN(cand.appliedDate)}
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1">
                          <div className="truncate">{cand.email}</div>
                          <div className="font-mono tabular-nums">{cand.phone}</div>
                          <div className="font-mono tabular-nums whitespace-nowrap text-slate-700">
                            Lương kỳ vọng: {formatVND(cand.expectedSalary)}
                          </div>
                        </div>

                        {cand.notes && (
                          <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">
                            {cand.notes}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                          {stage === 'Mới ứng tuyển' && (
                            <button
                              type="button"
                              onClick={() => onMoveStage(cand.id, 'Phỏng vấn')}
                              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <span>Chuyển sang Phỏng vấn</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {stage === 'Phỏng vấn' && (
                            <div className="flex w-full items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onMoveStage(cand.id, 'Mới ứng tuyển')}
                                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                Lùi bước
                              </button>
                              <button
                                type="button"
                                onClick={() => onMoveStage(cand.id, 'Trúng tuyển')}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                              >
                                <span>Đạt — Trúng tuyển</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}

                          {stage === 'Trúng tuyển' && (
                            <>
                              {convertedEmp ? (
                                <div className="w-full flex items-center justify-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">
                                    Đã nhận việc ({convertedEmp.code} · {convertedEmp.contractCode})
                                  </span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openConvertModal(cand)}
                                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-brand-on transition-colors hover:bg-brand-hover"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  <span>Chuyển thành nhân viên</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Create New Job Posting Modal */}
      <Modal
        open={postingModalOpen}
        onClose={() => setPostingModalOpen(false)}
        title="Đăng tin tuyển dụng mới"
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleCreatePosting} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="job-code" className="block text-xs font-semibold text-slate-700 mb-1">
                Mã tin tuyển dụng
              </label>
              <input
                id="job-code"
                required
                value={postingForm.code}
                onChange={(e) => setPostingForm({ ...postingForm, code: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="job-pos" className="block text-xs font-semibold text-slate-700 mb-1">
                Chức danh cần tuyển
              </label>
              <select
                id="job-pos"
                value={postingForm.positionId}
                onChange={(e) => {
                  const pos = state.positions.find((p) => p.id === e.target.value);
                  const dept = state.departments.find((d) => d.id === pos?.departmentId);
                  setPostingForm((prev) => ({
                    ...prev,
                    positionId: e.target.value,
                    departmentId: pos?.departmentId ?? prev.departmentId,
                    branchId: dept?.branchId ?? prev.branchId,
                    salaryRange: pos?.salaryRange ?? prev.salaryRange,
                  }));
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                {state.positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="job-dept" className="block text-xs font-semibold text-slate-700 mb-1">
                Phòng ban
              </label>
              <select
                id="job-dept"
                value={postingForm.departmentId}
                onChange={(e) => setPostingForm({ ...postingForm, departmentId: e.target.value })}
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
              <label htmlFor="job-branch" className="block text-xs font-semibold text-slate-700 mb-1">
                Địa điểm / Chi nhánh
              </label>
              <select
                id="job-branch"
                value={postingForm.branchId}
                onChange={(e) => setPostingForm({ ...postingForm, branchId: e.target.value })}
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
              <label htmlFor="job-qty" className="block text-xs font-semibold text-slate-700 mb-1">
                Số lượng tuyển
              </label>
              <input
                id="job-qty"
                type="number"
                min={1}
                max={50}
                required
                value={postingForm.headcount}
                onChange={(e) =>
                  setPostingForm({ ...postingForm, headcount: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="job-sal" className="block text-xs font-semibold text-slate-700 mb-1">
                Mức lương dự kiến
              </label>
              <input
                id="job-sal"
                required
                value={postingForm.salaryRange}
                onChange={(e) => setPostingForm({ ...postingForm, salaryRange: e.target.value })}
                placeholder="20.000.000 - 30.000.000 ₫"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="job-deadline" className="block text-xs font-semibold text-slate-700 mb-1">
                Hạn nộp hồ sơ
              </label>
              <input
                id="job-deadline"
                type="date"
                required
                value={postingForm.deadline}
                onChange={(e) => setPostingForm({ ...postingForm, deadline: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="job-desc" className="block text-xs font-semibold text-slate-700 mb-1">
              Mô tả yêu cầu công việc
            </label>
            <textarea
              id="job-desc"
              rows={2}
              value={postingForm.description}
              onChange={(e) => setPostingForm({ ...postingForm, description: e.target.value })}
              placeholder="Mô tả ngắn trách nhiệm, yêu cầu kinh nghiệm..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPostingModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
            >
              Đăng tin tuyển dụng
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Candidate Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Thêm hồ sơ ứng viên mới"
      >
        <form onSubmit={handleCreateCandidate} className="space-y-4">
          <div>
            <label htmlFor="cand-posting" className="block text-xs font-semibold text-slate-700 mb-1">
              Thuộc tin tuyển dụng
            </label>
            <select
              id="cand-posting"
              value={newCandForm.jobPostingId}
              onChange={(e) => handleSelectPostingInCandForm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">-- Ứng tuyển tự do (không gắn tin) --</option>
              {state.jobPostings.map((j) => {
                const p = state.positions.find((pos) => pos.id === j.positionId);
                return (
                  <option key={j.id} value={j.id}>
                    {j.code} — {p?.title ?? 'Vị trí'} ({j.status})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cand-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên
              </label>
              <input
                id="cand-name"
                required
                value={newCandForm.fullName}
                onChange={(e) => setNewCandForm({ ...newCandForm, fullName: e.target.value })}
                placeholder="VD: Trần Minh Quân"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="cand-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại
              </label>
              <input
                id="cand-phone"
                required
                value={newCandForm.phone}
                onChange={(e) => setNewCandForm({ ...newCandForm, phone: e.target.value })}
                placeholder="0909 123 456"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cand-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email liên hệ
              </label>
              <input
                id="cand-email"
                type="email"
                required
                value={newCandForm.email}
                onChange={(e) => setNewCandForm({ ...newCandForm, email: e.target.value })}
                placeholder="quan.tran@gmail.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="cand-source" className="block text-xs font-semibold text-slate-700 mb-1">
                Nguồn ứng tuyển
              </label>
              <select
                id="cand-source"
                value={newCandForm.source}
                onChange={(e) => setNewCandForm({ ...newCandForm, source: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="ITviec">ITviec</option>
                <option value="TopCV">TopCV</option>
                <option value="VietnamWorks">VietnamWorks</option>
                <option value="Giới thiệu nội bộ">Giới thiệu nội bộ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="cand-dept" className="block text-xs font-semibold text-slate-700 mb-1">
                Phòng ban
              </label>
              <select
                id="cand-dept"
                value={newCandForm.appliedDepartmentId}
                onChange={(e) =>
                  setNewCandForm({ ...newCandForm, appliedDepartmentId: e.target.value })
                }
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
              <label htmlFor="cand-pos" className="block text-xs font-semibold text-slate-700 mb-1">
                Vị trí ứng tuyển
              </label>
              <select
                id="cand-pos"
                value={newCandForm.appliedPositionId}
                onChange={(e) =>
                  setNewCandForm({ ...newCandForm, appliedPositionId: e.target.value })
                }
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
              <label htmlFor="cand-sal" className="block text-xs font-semibold text-slate-700 mb-1">
                Lương kỳ vọng (VNĐ)
              </label>
              <input
                id="cand-sal"
                type="number"
                min={0}
                step={500000}
                value={newCandForm.expectedSalary}
                onChange={(e) =>
                  setNewCandForm({ ...newCandForm, expectedSalary: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cand-notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Đánh giá sơ bộ / Ghi chú
            </label>
            <textarea
              id="cand-notes"
              rows={2}
              value={newCandForm.notes}
              onChange={(e) => setNewCandForm({ ...newCandForm, notes: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
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
              Thêm ứng viên
            </button>
          </div>
        </form>
      </Modal>

      {/* Convert Candidate to Employee + Probation Contract Onboarding Modal */}
      <Modal
        open={Boolean(convertingCandidate)}
        onClose={() => setConvertingCandidate(null)}
        title="Chuyển ứng viên thành nhân viên & Tạo hợp đồng thử việc"
        subtitle={convertingCandidate ? `Ứng viên: ${convertingCandidate.fullName}` : ''}
        maxWidthClass="max-w-2xl"
      >
        {convertingCandidate && (
          <form onSubmit={handleConfirmConvert} className="space-y-4">
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 leading-relaxed">
              Hệ thống sẽ đồng thời thực hiện 2 thao tác: (1) Tạo{' '}
              <strong>Hồ sơ nhân sự mới</strong> trạng thái <strong>Thử việc</strong> bên Core HR,
              và (2) Tự động phát hành <strong>Hợp đồng thử việc 2 tháng</strong> bên phân hệ{' '}
              <strong>Hợp đồng lao động</strong>.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="onboard-date"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Ngày nhận việc
                </label>
                <input
                  id="onboard-date"
                  type="date"
                  required
                  value={onboardForm.joinDate}
                  onChange={(e) => setOnboardForm({ ...onboardForm, joinDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="onboard-sal"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Lương thử việc / căn bản (VNĐ)
                </label>
                <input
                  id="onboard-sal"
                  type="number"
                  min={0}
                  step={500000}
                  required
                  value={onboardForm.baseSalary}
                  onChange={(e) =>
                    setOnboardForm({ ...onboardForm, baseSalary: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="onboard-allow"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Phụ cấp (VNĐ)
                </label>
                <input
                  id="onboard-allow"
                  type="number"
                  min={0}
                  step={100000}
                  required
                  value={onboardForm.allowance}
                  onChange={(e) =>
                    setOnboardForm({ ...onboardForm, allowance: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
              <div className="text-xs font-semibold text-slate-700">
                Thông tin pháp lý (Đồng bộ vào Hồ sơ &amp; Hợp đồng thử việc)
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="onboard-dob"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Ngày sinh
                  </label>
                  <input
                    id="onboard-dob"
                    type="date"
                    required
                    value={onboardForm.dateOfBirth}
                    onChange={(e) =>
                      setOnboardForm({ ...onboardForm, dateOfBirth: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="onboard-gender"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Giới tính
                  </label>
                  <select
                    id="onboard-gender"
                    value={onboardForm.gender}
                    onChange={(e) =>
                      setOnboardForm({ ...onboardForm, gender: e.target.value as 'Nam' | 'Nữ' })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="onboard-cccd"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Số CCCD / CMND
                  </label>
                  <input
                    id="onboard-cccd"
                    required
                    value={onboardForm.nationalId}
                    onChange={(e) =>
                      setOnboardForm({ ...onboardForm, nationalId: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="onboard-cccd-date"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Ngày cấp CCCD
                  </label>
                  <input
                    id="onboard-cccd-date"
                    type="date"
                    required
                    value={onboardForm.nationalIdIssueDate}
                    onChange={(e) =>
                      setOnboardForm({ ...onboardForm, nationalIdIssueDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="onboard-cccd-place"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Nơi cấp CCCD
                  </label>
                  <input
                    id="onboard-cccd-place"
                    required
                    value={onboardForm.nationalIdIssuePlace}
                    onChange={(e) =>
                      setOnboardForm({ ...onboardForm, nationalIdIssuePlace: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="onboard-address"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Địa chỉ thường trú
                </label>
                <input
                  id="onboard-address"
                  required
                  value={onboardForm.address}
                  onChange={(e) => setOnboardForm({ ...onboardForm, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConvertingCandidate(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-hover"
              >
                Xác nhận &amp; Tạo Hợp đồng thử việc
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
