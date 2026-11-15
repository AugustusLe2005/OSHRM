import { useCallback, useEffect, useState } from 'react';
import { createSeedData } from '../data/seedData';
import type {
  Branch,
  Candidate,
  CandidateStage,
  Department,
  Employee,
  HrmState,
  JobPosting,
  JobPostingStatus,
  KpiItem,
  LaborContract,
  LaborContractKind,
  LeaveOtRequest,
  NavSection,
  Position,
  RequestStatus,
  SystemSettings,
  UserRole,
} from '../types/hrm';
import {
  ADMIN_ALLOWED_NAVS,
  applyRequestDecision,
  authenticateUser,
  convertCandidateToEmployee,
  DEFAULT_SYSTEM_SETTINGS,
  getCurrentTimeLocal,
  getDefaultNavForRole,
  getTodayIsoLocal,
  isNavAllowedForRole,
  mapEmployeeContractTypeToLaborKind,
  mapLaborKindToEmployeeContractType,
  recordAttendanceAction,
  resolveEmployeeRole,
  resolveThemePalette,
} from '../utils/hrmLogic';

const STORAGE_KEY = 'peoplecore_hrm_state_v1';
const SESSION_KEY = 'peoplecore_hrm_session_v1';
const SAVED_ID_KEY = 'oshrm_saved_identifier_v1';

export interface AuthSession {
  role: UserRole;
  employeeId: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

function hydrateEmployee(emp: Employee, seedEmployees: Employee[]): Employee {
  const matched = seedEmployees.find((s) => s.id === emp.id);
  return {
    ...emp,
    nationalIdIssueDate:
      emp.nationalIdIssueDate || matched?.nationalIdIssueDate || '2021-06-15',
    nationalIdIssuePlace:
      emp.nationalIdIssuePlace ||
      matched?.nationalIdIssuePlace ||
      'Cục Cảnh sát QLHC về TTXH',
  };
}

function synthesizeContractsFromEmployees(
  employees: Employee[],
  branches: Branch[]
): LaborContract[] {
  return employees.map((emp, idx) => {
    const branch = branches.find((b) => b.id === emp.branchId);
    return {
      id: `ctr-sync-${emp.id}`,
      contractNumber: emp.contractCode || `25${String(idx + 1).padStart(2, '0')}/HĐLĐ`,
      employeeId: emp.id,
      contractType: mapEmployeeContractTypeToLaborKind(emp.contractType),
      startDate: emp.contractStartDate || emp.joinDate,
      endDate: emp.contractEndDate || 'Không thời hạn',
      baseSalary: emp.baseSalary,
      allowance: emp.allowance,
      paymentMethod: 'Chuyển khoản ngân hàng',
      payDay: 10,
      workLocation: branch?.address ?? 'Trụ sở chính Công ty',
      jobDuties: 'Thực hiện công việc chuyên môn theo mô tả chức danh và sự phân công của quản lý.',
      signedDate: emp.contractStartDate || emp.joinDate,
    };
  });
}

function loadInitialState(): HrmState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<HrmState>;
      if (
        Array.isArray(parsed.employees) &&
        Array.isArray(parsed.departments) &&
        Array.isArray(parsed.branches) &&
        Array.isArray(parsed.positions)
      ) {
        const seed = createSeedData();
        const employees = (parsed.employees ?? seed.employees).map((e) =>
          hydrateEmployee(e, seed.employees)
        );
        const branches = parsed.branches ?? seed.branches;
        const contracts =
          Array.isArray(parsed.contracts) && parsed.contracts.length > 0
            ? parsed.contracts
            : synthesizeContractsFromEmployees(employees, branches);
        const jobPostings =
          Array.isArray(parsed.jobPostings) && parsed.jobPostings.length > 0
            ? parsed.jobPostings
            : seed.jobPostings;

        return {
          branches,
          departments: parsed.departments ?? seed.departments,
          positions: parsed.positions ?? seed.positions,
          employees,
          contracts,
          jobPostings,
          candidates: parsed.candidates ?? seed.candidates,
          attendance: parsed.attendance ?? seed.attendance,
          requests: parsed.requests ?? seed.requests,
          kpis: parsed.kpis ?? seed.kpis,
          settings: parsed.settings
            ? { ...DEFAULT_SYSTEM_SETTINGS, ...parsed.settings }
            : seed.settings,
        };
      }
    }
  } catch {
    // Fallback to seed data when localStorage is unavailable or corrupted
  }
  return createSeedData();
}

function loadInitialSession(): AuthSession | null {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        const roleParam = params.get('role') === 'ess' ? 'ess' : 'admin';
        return {
          role: roleParam,
          employeeId: roleParam === 'admin' ? 'emp-6' : 'emp-2',
        };
      }
      const sessionRaw = sessionStorage.getItem(SESSION_KEY);
      if (sessionRaw) {
        return JSON.parse(sessionRaw) as AuthSession;
      }
    }
    const localRaw = localStorage.getItem(SESSION_KEY);
    if (localRaw) {
      return JSON.parse(localRaw) as AuthSession;
    }
  } catch {
    // Ignore storage parse error
  }
  return null;
}

function loadSavedIdentifier(): string {
  try {
    return localStorage.getItem(SAVED_ID_KEY) ?? '';
  } catch {
    return '';
  }
}

function parseNavFromLocation(): NavSection | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const queryNav = params.get('nav');
  const hashNav = window.location.hash.replace(/^#/, '');
  const candidate = (queryNav || hashNav) as NavSection;
  return ADMIN_ALLOWED_NAVS.includes(candidate) ? candidate : null;
}

export function useHrmStore() {
  const [state, setState] = useState<HrmState>(loadInitialState);
  const [session, setSession] = useState<AuthSession | null>(loadInitialSession);
  const [savedIdentifier, setSavedIdentifier] = useState<string>(loadSavedIdentifier);
  const [activeNav, setActiveNavState] = useState<NavSection>(() => {
    const initial = loadInitialSession();
    const role: UserRole = initial?.role ?? 'admin';
    const requested = parseNavFromLocation();
    if (requested && isNavAllowedForRole(requested, role)) {
      return requested;
    }
    return getDefaultNavForRole(role);
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const palette = resolveThemePalette(state.settings.themeColor);
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', palette.primary);
    root.style.setProperty('--brand-hover', palette.hover);
    root.style.setProperty('--brand-soft', palette.soft);
    root.style.setProperty('--brand-border', palette.border);
    root.style.setProperty('--brand-text', palette.text);
    root.style.setProperty('--brand-on-primary', palette.onPrimary);
    document.title = `${state.settings.organizationName} - ${state.settings.slogan}`;
  }, [state.settings]);

  const pushToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Strict RBAC guard on activeNav + URL hash attempts
  useEffect(() => {
    if (!session) return;
    if (!isNavAllowedForRole(activeNav, session.role)) {
      const fallback = getDefaultNavForRole(session.role);
      setActiveNavState(fallback);
      pushToast(
        'error',
        'Truy cập bị từ chối: Tài khoản Nhân viên (ESS) không có quyền truy cập phân hệ Quản trị.'
      );
    }
  }, [activeNav, pushToast, session]);

  useEffect(() => {
    if (typeof window === 'undefined' || !session) return;

    const enforceHashRbac = () => {
      const candidate = parseNavFromLocation();
      if (!candidate) return;
      if (isNavAllowedForRole(candidate, session.role)) {
        setActiveNavState(candidate);
      } else {
        const fallback = getDefaultNavForRole(session.role);
        setActiveNavState(fallback);
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}#${fallback}`
        );
        pushToast(
          'error',
          'Truy cập bị từ chối: Tài khoản Nhân viên (ESS) không có quyền truy cập phân hệ Quản trị.'
        );
      }
    };

    enforceHashRbac();
    window.addEventListener('hashchange', enforceHashRbac);
    return () => window.removeEventListener('hashchange', enforceHashRbac);
  }, [pushToast, session]);

  const setActiveNav = useCallback(
    (nextNav: NavSection) => {
      if (!session) return;
      if (!isNavAllowedForRole(nextNav, session.role)) {
        const fallback = getDefaultNavForRole(session.role);
        setActiveNavState(fallback);
        pushToast(
          'error',
          'Truy cập bị từ chối: Tài khoản Nhân viên (ESS) không có quyền truy cập phân hệ Quản trị.'
        );
        return;
      }
      setActiveNavState(nextNav);
    },
    [pushToast, session]
  );

  const submitLogin = useCallback(
    (params: {
      identifier: string;
      password: string;
      rememberMe: boolean;
      externalAuth?: {
        employeeId?: string;
        role?: UserRole;
        fullName?: string;
        employeeCode?: string;
        email?: string;
      };
    }) => {
      let resolvedRole: UserRole;
      let resolvedEmployeeId: string;
      let displayName: string;

      if (params.externalAuth) {
        const ext = params.externalAuth;
        const cleanId = params.identifier.trim().toLowerCase();
        const matchedEmp = state.employees.find(
          (emp) =>
            (ext.employeeId && emp.id === ext.employeeId) ||
            (ext.employeeCode && emp.code.toLowerCase() === ext.employeeCode.toLowerCase()) ||
            (ext.email && emp.email.toLowerCase() === ext.email.toLowerCase()) ||
            emp.email.toLowerCase() === cleanId ||
            emp.code.toLowerCase() === cleanId
        );

        resolvedRole =
          ext.role === 'admin' || ext.role === 'ess'
            ? ext.role
            : matchedEmp
              ? resolveEmployeeRole(matchedEmp)
              : 'ess';
        resolvedEmployeeId = matchedEmp?.id ?? ext.employeeId ?? 'emp-2';
        displayName = matchedEmp?.fullName ?? ext.fullName ?? params.identifier.trim();
      } else {
        const auth = authenticateUser({
          identifier: params.identifier,
          password: params.password,
          employees: state.employees,
        });

        if (!auth.success) {
          return { success: false, error: auth.error };
        }

        resolvedRole = auth.role;
        resolvedEmployeeId = auth.employee.id;
        displayName = auth.employee.fullName;
      }

      const nextSession: AuthSession = {
        role: resolvedRole,
        employeeId: resolvedEmployeeId,
      };

      try {
        if (params.rememberMe) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
          sessionStorage.removeItem(SESSION_KEY);
          localStorage.setItem(SAVED_ID_KEY, params.identifier.trim());
          setSavedIdentifier(params.identifier.trim());
        } else {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(SAVED_ID_KEY);
          setSavedIdentifier('');
        }
      } catch {
        // Ignore storage errors
      }

      const defaultNav = getDefaultNavForRole(resolvedRole);
      setSession(nextSession);
      setActiveNavState(defaultNav);
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }

      pushToast(
        'success',
        `Đăng nhập thành công (${resolvedRole === 'admin' ? 'Quản trị viên HR' : 'Nhân viên ESS'}) — ${displayName}`
      );
      return { success: true };
    },
    [pushToast, state.employees]
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch {
      // Ignore
    }
    setSession(null);
    pushToast('info', 'Đã đăng xuất khỏi không gian làm việc.');
  }, [pushToast]);

  const resetToSeedData = useCallback(() => {
    const fresh = createSeedData();
    setState(fresh);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // Ignore
    }
    if (session) {
      const fallbackId = session.role === 'admin' ? 'emp-6' : 'emp-2';
      const refreshed: AuthSession = { role: session.role, employeeId: fallbackId };
      setSession(refreshed);
      setActiveNavState(getDefaultNavForRole(session.role));
      try {
        if (localStorage.getItem(SESSION_KEY)) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(refreshed));
        }
        if (sessionStorage.getItem(SESSION_KEY)) {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(refreshed));
        }
      } catch {
        // Ignore
      }
    }
    pushToast('info', 'Đã khôi phục toàn bộ dữ liệu mẫu ban đầu (10 nhân viên, 4 phòng ban).');
  }, [pushToast, session]);

  // Organization CRUD
  const saveBranch = useCallback(
    (branch: Omit<Branch, 'id'> & { id?: string }) => {
      setState((prev) => {
        if (branch.id) {
          return {
            ...prev,
            branches: prev.branches.map((b) => (b.id === branch.id ? (branch as Branch) : b)),
          };
        }
        const created: Branch = { ...branch, id: `br-${Date.now()}` };
        return { ...prev, branches: [...prev.branches, created] };
      });
      pushToast('success', branch.id ? 'Đã cập nhật chi nhánh.' : 'Đã thêm chi nhánh mới.');
    },
    [pushToast]
  );

  const deleteBranch = useCallback(
    (branchId: string) => {
      const hasDept = state.departments.some((d) => d.branchId === branchId);
      const hasEmp = state.employees.some((e) => e.branchId === branchId);
      if (hasDept || hasEmp) {
        pushToast('error', 'Không thể xóa chi nhánh đang có phòng ban hoặc nhân viên trực thuộc.');
        return false;
      }
      setState((prev) => ({
        ...prev,
        branches: prev.branches.filter((b) => b.id !== branchId),
      }));
      pushToast('success', 'Đã xóa chi nhánh.');
      return true;
    },
    [pushToast, state.departments, state.employees]
  );

  const saveDepartment = useCallback(
    (dept: Omit<Department, 'id'> & { id?: string }) => {
      setState((prev) => {
        if (dept.id) {
          return {
            ...prev,
            departments: prev.departments.map((d) => (d.id === dept.id ? (dept as Department) : d)),
          };
        }
        const created: Department = { ...dept, id: `dept-${Date.now()}` };
        return { ...prev, departments: [...prev.departments, created] };
      });
      pushToast('success', dept.id ? 'Đã cập nhật phòng ban.' : 'Đã thêm phòng ban mới.');
    },
    [pushToast]
  );

  const deleteDepartment = useCallback(
    (deptId: string) => {
      const hasEmp = state.employees.some((e) => e.departmentId === deptId);
      if (hasEmp) {
        pushToast('error', 'Không thể xóa phòng ban đang có nhân sự hoạt động.');
        return false;
      }
      setState((prev) => ({
        ...prev,
        departments: prev.departments.filter((d) => d.id !== deptId),
        positions: prev.positions.filter((p) => p.departmentId !== deptId),
      }));
      pushToast('success', 'Đã xóa phòng ban.');
      return true;
    },
    [pushToast, state.employees]
  );

  const savePosition = useCallback(
    (pos: Omit<Position, 'id'> & { id?: string }) => {
      setState((prev) => {
        if (pos.id) {
          return {
            ...prev,
            positions: prev.positions.map((p) => (p.id === pos.id ? (pos as Position) : p)),
          };
        }
        const created: Position = { ...pos, id: `pos-${Date.now()}` };
        return { ...prev, positions: [...prev.positions, created] };
      });
      pushToast('success', pos.id ? 'Đã cập nhật chức danh.' : 'Đã thêm chức danh mới.');
    },
    [pushToast]
  );

  const deletePosition = useCallback(
    (posId: string) => {
      const hasEmp = state.employees.some((e) => e.positionId === posId);
      if (hasEmp) {
        pushToast('error', 'Không thể xóa chức danh đang có nhân viên đảm nhiệm.');
        return false;
      }
      setState((prev) => ({
        ...prev,
        positions: prev.positions.filter((p) => p.id !== posId),
      }));
      pushToast('success', 'Đã xóa chức danh.');
      return true;
    },
    [pushToast, state.employees]
  );

  // Employee CRUD
  const saveEmployee = useCallback(
    (emp: Omit<Employee, 'id'> & { id?: string }) => {
      setState((prev) => {
        if (emp.id) {
          return {
            ...prev,
            employees: prev.employees.map((e) => (e.id === emp.id ? (emp as Employee) : e)),
          };
        }
        const created: Employee = { ...emp, id: `emp-${Date.now()}` };
        return { ...prev, employees: [created, ...prev.employees] };
      });
      pushToast('success', emp.id ? 'Đã cập nhật hồ sơ nhân viên.' : 'Đã thêm nhân viên mới.');
    },
    [pushToast]
  );

  const deleteEmployee = useCallback(
    (employeeId: string) => {
      if (session?.employeeId === employeeId) {
        pushToast('error', 'Không thể xóa tài khoản đang đăng nhập.');
        return false;
      }
      setState((prev) => ({
        ...prev,
        employees: prev.employees.filter((e) => e.id !== employeeId),
        contracts: prev.contracts.filter((c) => c.employeeId !== employeeId),
        attendance: prev.attendance.filter((a) => a.employeeId !== employeeId),
        requests: prev.requests.filter((r) => r.employeeId !== employeeId),
        kpis: prev.kpis.filter((k) => k.employeeId !== employeeId),
      }));
      pushToast('success', 'Đã xóa hồ sơ nhân viên khỏi hệ thống.');
      return true;
    },
    [pushToast, session?.employeeId]
  );

  // Labor Contracts CRUD & Lifecycle
  const createContract = useCallback(
    (contract: Omit<LaborContract, 'id'>) => {
      const created: LaborContract = { ...contract, id: `ctr-${Date.now()}` };
      setState((prev) => ({
        ...prev,
        contracts: [created, ...prev.contracts],
        employees: prev.employees.map((emp) =>
          emp.id === created.employeeId
            ? {
                ...emp,
                contractCode: created.contractNumber,
                contractType: mapLaborKindToEmployeeContractType(created.contractType),
                contractStartDate: created.startDate,
                contractEndDate: created.endDate,
                baseSalary: created.baseSalary,
                allowance: created.allowance,
                status: created.contractType === 'Thử việc 2 tháng' ? 'Thử việc' : 'Đang làm việc',
              }
            : emp
        ),
      }));
      pushToast('success', `Đã tạo hợp đồng lao động ${created.contractNumber}.`);
    },
    [pushToast]
  );

  const extendContract = useCallback(
    (
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
    ) => {
      const existing = state.contracts.find((c) => c.id === contractId);
      if (!existing) return;

      setState((prev) => ({
        ...prev,
        contracts: prev.contracts.map((c) =>
          c.id === contractId
            ? {
                ...c,
                ...updates,
                signedDate: updates.startDate,
                statusOverride: undefined,
                terminatedDate: undefined,
                terminationReason: undefined,
              }
            : c
        ),
        employees: prev.employees.map((emp) =>
          emp.id === existing.employeeId
            ? {
                ...emp,
                contractCode: updates.contractNumber,
                contractType: mapLaborKindToEmployeeContractType(updates.contractType),
                contractStartDate: updates.startDate,
                contractEndDate: updates.endDate,
                baseSalary: updates.baseSalary,
                allowance: updates.allowance,
                status: updates.contractType === 'Thử việc 2 tháng' ? 'Thử việc' : 'Đang làm việc',
              }
            : emp
        ),
      }));
      pushToast('success', `Đã gia hạn hợp đồng ${updates.contractNumber}.`);
    },
    [pushToast, state.contracts]
  );

  const terminateContract = useCallback(
    (contractId: string, terminatedDate: string, reason: string) => {
      const existing = state.contracts.find((c) => c.id === contractId);
      if (!existing) return;

      setState((prev) => ({
        ...prev,
        contracts: prev.contracts.map((c) =>
          c.id === contractId
            ? {
                ...c,
                statusOverride: 'Đã thanh lý',
                terminatedDate,
                terminationReason: reason,
              }
            : c
        ),
      }));
      pushToast('info', `Đã thanh lý hợp đồng ${existing.contractNumber}.`);
    },
    [pushToast, state.contracts]
  );

  // Recruitment (ATS) - Job Postings & Candidates
  const addJobPosting = useCallback(
    (posting: Omit<JobPosting, 'id' | 'createdAt'>) => {
      const created: JobPosting = {
        ...posting,
        id: `job-${Date.now()}`,
        createdAt: getTodayIsoLocal(),
      };
      setState((prev) => ({
        ...prev,
        jobPostings: [created, ...prev.jobPostings],
      }));
      pushToast('success', `Đã đăng tin tuyển dụng ${created.code}.`);
    },
    [pushToast]
  );

  const updateJobPostingStatus = useCallback(
    (postingId: string, status: JobPostingStatus) => {
      setState((prev) => ({
        ...prev,
        jobPostings: prev.jobPostings.map((j) => (j.id === postingId ? { ...j, status } : j)),
      }));
      pushToast('info', `Đã cập nhật trạng thái tin tuyển dụng sang "${status}".`);
    },
    [pushToast]
  );

  const addCandidate = useCallback(
    (cand: Omit<Candidate, 'id'>) => {
      const created: Candidate = { ...cand, id: `cand-${Date.now()}` };
      setState((prev) => ({
        ...prev,
        candidates: [created, ...prev.candidates],
      }));
      pushToast('success', `Đã tiếp nhận hồ sơ ứng viên ${cand.fullName}.`);
    },
    [pushToast]
  );

  const moveCandidateStage = useCallback(
    (candidateId: string, stage: CandidateStage) => {
      setState((prev) => ({
        ...prev,
        candidates: prev.candidates.map((c) => (c.id === candidateId ? { ...c, stage } : c)),
      }));
      pushToast('info', `Đã chuyển ứng viên sang bước "${stage}".`);
    },
    [pushToast]
  );

  const convertCandidate = useCallback(
    (
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
    ) => {
      const candidate = state.candidates.find((c) => c.id === candidateId);
      if (!candidate) return;
      if (candidate.convertedEmployeeId) {
        pushToast('info', 'Ứng viên này đã được chuyển thành nhân viên trước đó.');
        return;
      }

      const { newEmployee, newContract, updatedCandidate } = convertCandidateToEmployee({
        candidate,
        employees: state.employees,
        contracts: state.contracts,
        branches: state.branches,
        joinDate: overrides?.joinDate || getTodayIsoLocal(),
        baseSalary: overrides?.baseSalary,
        allowance: overrides?.allowance,
        gender: overrides?.gender,
        dateOfBirth: overrides?.dateOfBirth,
        nationalId: overrides?.nationalId,
        nationalIdIssueDate: overrides?.nationalIdIssueDate,
        nationalIdIssuePlace: overrides?.nationalIdIssuePlace,
        address: overrides?.address,
      });

      setState((prev) => ({
        ...prev,
        employees: [newEmployee, ...prev.employees],
        contracts: [newContract, ...prev.contracts],
        candidates: prev.candidates.map((c) => (c.id === candidateId ? updatedCandidate : c)),
      }));
      pushToast(
        'success',
        `Đã tạo hồ sơ ${newEmployee.fullName} (${newEmployee.code}) và Hợp đồng thử việc ${newContract.contractNumber}.`
      );
    },
    [pushToast, state.branches, state.candidates, state.contracts, state.employees]
  );

  // Attendance Check-in / Check-out
  const checkInOut = useCallback(
    (employeeId: string, action: 'check-in' | 'check-out') => {
      const date = getTodayIsoLocal();
      const time = getCurrentTimeLocal();
      setState((prev) => ({
        ...prev,
        attendance: recordAttendanceAction({
          records: prev.attendance,
          employeeId,
          date,
          time,
          action,
        }),
      }));
      pushToast(
        'success',
        action === 'check-in'
          ? `Check-in thành công lúc ${time}.`
          : `Check-out thành công lúc ${time}.`
      );
    },
    [pushToast]
  );

  // Leave / OT Requests
  const createRequest = useCallback(
    (req: Omit<LeaveOtRequest, 'id' | 'status' | 'createdAt'>) => {
      const created: LeaveOtRequest = {
        ...req,
        id: `req-${Date.now()}`,
        status: 'Chờ duyệt',
        createdAt: getTodayIsoLocal(),
      };
      setState((prev) => ({
        ...prev,
        requests: [created, ...prev.requests],
      }));
      pushToast('success', `Đã gửi đơn "${req.type}" chờ phê duyệt.`);
    },
    [pushToast]
  );

  const reviewRequest = useCallback(
    (requestId: string, decision: Exclude<RequestStatus, 'Chờ duyệt'>) => {
      const reviewer = state.employees.find((e) => e.id === session?.employeeId);
      const result = applyRequestDecision({
        requests: state.requests,
        employees: state.employees,
        requestId,
        decision,
        reviewerName: reviewer?.fullName ?? 'Quản trị viên HR',
        reviewedAt: getTodayIsoLocal(),
      });

      if (result.error) {
        pushToast('error', result.error);
        return false;
      }

      setState((prev) => ({
        ...prev,
        requests: result.requests,
        employees: result.employees,
      }));
      pushToast(
        decision === 'Đã duyệt' ? 'success' : 'info',
        decision === 'Đã duyệt'
          ? 'Đã duyệt đơn (tự động cập nhật ngày phép năm nếu là nghỉ phép).'
          : 'Đã từ chối đơn yêu cầu.'
      );
      return true;
    },
    [pushToast, session?.employeeId, state.employees, state.requests]
  );

  // KPI Management
  const addKpi = useCallback(
    (kpi: Omit<KpiItem, 'id'>) => {
      const created: KpiItem = { ...kpi, id: `kpi-${Date.now()}` };
      setState((prev) => ({
        ...prev,
        kpis: [created, ...prev.kpis],
      }));
      pushToast('success', 'Đã giao chỉ tiêu KPI mới.');
    },
    [pushToast]
  );

  const updateKpiProgress = useCallback(
    (kpiId: string, updates: { actualValue: number; completionPercent: number; evaluatorNote: string }) => {
      setState((prev) => ({
        ...prev,
        kpis: prev.kpis.map((k) => (k.id === kpiId ? { ...k, ...updates } : k)),
      }));
      pushToast('success', 'Đã cập nhật điểm hoàn thành KPI.');
    },
    [pushToast]
  );

  const deleteKpi = useCallback(
    (kpiId: string) => {
      setState((prev) => ({
        ...prev,
        kpis: prev.kpis.filter((k) => k.id !== kpiId),
      }));
      pushToast('success', 'Đã xóa mục KPI.');
    },
    [pushToast]
  );

  const updateSettings = useCallback(
    (nextSettings: SystemSettings, message?: string) => {
      setState((prev) => ({
        ...prev,
        settings: nextSettings,
      }));
      pushToast('success', message ?? 'Đã lưu cấu hình hệ thống thành công.');
    },
    [pushToast]
  );

  const currentUser =
    state.employees.find((e) => e.id === session?.employeeId) ?? state.employees[0] ?? null;

  return {
    state,
    session,
    savedIdentifier,
    currentUser,
    activeNav,
    setActiveNav,
    toasts,
    pushToast,
    dismissToast,
    submitLogin,
    logout,
    resetToSeedData,
    saveBranch,
    deleteBranch,
    saveDepartment,
    deleteDepartment,
    savePosition,
    deletePosition,
    saveEmployee,
    deleteEmployee,
    createContract,
    extendContract,
    terminateContract,
    addJobPosting,
    updateJobPostingStatus,
    addCandidate,
    moveCandidateStage,
    convertCandidate,
    checkInOut,
    createRequest,
    reviewRequest,
    addKpi,
    updateKpiProgress,
    deleteKpi,
    updateSettings,
  };
}
