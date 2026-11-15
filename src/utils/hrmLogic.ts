import type {
  AttendanceRecord,
  Branch,
  Candidate,
  ContractType,
  Employee,
  KpiItem,
  LaborContract,
  LaborContractKind,
  LaborContractStatus,
  LeaveOtRequest,
  LogoIconKey,
  NavSection,
  PayrollAdjustment,
  PayslipBreakdown,
  PitBracketDetail,
  RequestStatus,
  SystemSettings,
  UserRole,
} from '../types/hrm';

export const STANDARD_WORK_DAYS = 22;
export const STANDARD_HOURS_PER_DAY = 8;
export const INSURANCE_RATE = 0.105; // 10.5% (8% BHXH + 1.5% BHYT + 1% BHTN)
export const PERSONAL_TAX_DEDUCTION = 11_000_000;
export const DEPENDENT_TAX_DEDUCTION = 4_400_000;

export const PIT_BRACKETS: Array<{
  level: number;
  label: string;
  limit: number;
  rate: number;
}> = [
  { level: 1, label: 'Đến 5 triệu (5%)', limit: 5_000_000, rate: 0.05 },
  { level: 2, label: 'Trên 5 - 10 triệu (10%)', limit: 10_000_000, rate: 0.1 },
  { level: 3, label: 'Trên 10 - 18 triệu (15%)', limit: 18_000_000, rate: 0.15 },
  { level: 4, label: 'Trên 18 - 32 triệu (20%)', limit: 32_000_000, rate: 0.2 },
  { level: 5, label: 'Trên 32 - 52 triệu (25%)', limit: 52_000_000, rate: 0.25 },
  { level: 6, label: 'Trên 52 - 80 triệu (30%)', limit: 80_000_000, rate: 0.3 },
  { level: 7, label: 'Trên 80 triệu (35%)', limit: Infinity, rate: 0.35 },
];

/**
 * Computes progressive Vietnamese Personal Income Tax (Thuế TNCN - 7 bậc)
 * with step-by-step bracket breakdown for formula verification.
 */
export function calculateProgressivePITDetailed(taxableIncome: number): {
  totalTax: number;
  brackets: PitBracketDetail[];
} {
  if (taxableIncome <= 0) {
    return { totalTax: 0, brackets: [] };
  }

  let tax = 0;
  let prevLimit = 0;
  const details: PitBracketDetail[] = [];

  for (const bracket of PIT_BRACKETS) {
    if (taxableIncome <= prevLimit) break;
    const chunk = Math.min(taxableIncome, bracket.limit) - prevLimit;
    const bracketTax = chunk * bracket.rate;
    tax += bracketTax;
    details.push({
      level: bracket.level,
      label: bracket.label,
      rate: bracket.rate,
      taxableAmount: Math.round(chunk),
      taxAmount: Math.round(bracketTax),
    });
    prevLimit = bracket.limit;
  }

  return {
    totalTax: Math.round(tax),
    brackets: details,
  };
}

/**
 * Progressive Vietnamese Personal Income Tax (Thuế TNCN - 7 bậc)
 */
export function calculateProgressivePIT(taxableIncome: number): number {
  return calculateProgressivePITDetailed(taxableIncome).totalTax;
}

export function getPayrollAdjustmentForEmployee(
  adjustments: PayrollAdjustment[] | undefined,
  employeeId: string,
  month: string
): Pick<PayrollAdjustment, 'bonus' | 'deduction' | 'adjustmentNote'> {
  const found = adjustments?.find((a) => a.employeeId === employeeId && a.month === month);
  return {
    bonus: Math.max(0, Math.round(found?.bonus ?? 0)),
    deduction: Math.max(0, Math.round(found?.deduction ?? 0)),
    adjustmentNote: found?.adjustmentNote ?? '',
  };
}

/**
 * Computes full monthly Payslip breakdown:
 * Gross = Prorated Base Salary + Allowance + OT Pay + Manual Bonus
 * Taxable Income = max(0, Gross - 10.5% Insurance - 11M Personal - Dependents * 4.4M)
 * Net = max(0, Gross - 10.5% Insurance - Personal Income Tax - Manual Deduction)
 */
export function calculatePayslip(params: {
  employee: Employee;
  departmentName: string;
  positionTitle: string;
  month: string;
  approvedOtHours: number;
  actualWorkDays?: number;
  adjustment?: Partial<Pick<PayrollAdjustment, 'bonus' | 'deduction' | 'adjustmentNote'>>;
}): PayslipBreakdown {
  const { employee, departmentName, positionTitle, month, approvedOtHours } = params;
  const actualWorkDays = params.actualWorkDays ?? STANDARD_WORK_DAYS;
  const proratedBaseSalary =
    actualWorkDays === STANDARD_WORK_DAYS
      ? employee.baseSalary
      : Math.round((employee.baseSalary * actualWorkDays) / STANDARD_WORK_DAYS);

  const bonus = Math.max(0, Math.round(params.adjustment?.bonus ?? 0));
  const deduction = Math.max(0, Math.round(params.adjustment?.deduction ?? 0));
  const adjustmentNote = (params.adjustment?.adjustmentNote ?? '').trim();

  const hourlyRate = employee.baseSalary / (STANDARD_WORK_DAYS * STANDARD_HOURS_PER_DAY);
  const otPay = Math.round(approvedOtHours * hourlyRate * 1.5);
  const grossSalary = proratedBaseSalary + employee.allowance + otPay + bonus;

  const insuranceDeduction = Math.round(employee.baseSalary * INSURANCE_RATE);
  const personalDeduction = PERSONAL_TAX_DEDUCTION;
  const dependentDeduction = employee.dependents * DEPENDENT_TAX_DEDUCTION;

  const taxableIncome = Math.max(
    0,
    grossSalary - insuranceDeduction - personalDeduction - dependentDeduction
  );
  const pitResult = calculateProgressivePITDetailed(taxableIncome);
  const personalIncomeTax = pitResult.totalTax;
  const netSalary = Math.max(
    0,
    grossSalary - insuranceDeduction - personalIncomeTax - deduction
  );

  return {
    employeeId: employee.id,
    employeeCode: employee.code,
    fullName: employee.fullName,
    departmentName,
    positionTitle,
    month,
    standardWorkDays: STANDARD_WORK_DAYS,
    actualWorkDays,
    proratedBaseSalary,
    baseSalary: employee.baseSalary,
    allowance: employee.allowance,
    approvedOtHours,
    hourlyRate,
    otPay,
    bonus,
    deduction,
    adjustmentNote,
    grossSalary,
    insuranceDeduction,
    dependentsCount: employee.dependents,
    personalDeduction,
    dependentDeduction,
    taxableIncome,
    personalIncomeTax,
    pitBrackets: pitResult.brackets,
    netSalary,
  };
}

/**
 * Computes approved OT hours for a given employee in a specific YYYY-MM month
 */
export function getApprovedOtHoursForMonth(
  requests: LeaveOtRequest[],
  employeeId: string,
  month: string
): number {
  return requests
    .filter(
      (r) =>
        r.employeeId === employeeId &&
        r.type === 'Tăng ca (OT)' &&
        r.status === 'Đã duyệt' &&
        r.startDate.startsWith(month)
    )
    .reduce((sum, r) => sum + (r.otHours || 0), 0);
}

/**
 * Approves or rejects a leave/OT request and automatically deducts annual leave days
 * when an annual leave request transitions from 'Chờ duyệt' -> 'Đã duyệt'.
 */
export function applyRequestDecision(params: {
  requests: LeaveOtRequest[];
  employees: Employee[];
  requestId: string;
  decision: Exclude<RequestStatus, 'Chờ duyệt'>;
  reviewerName: string;
  reviewedAt: string;
}): {
  requests: LeaveOtRequest[];
  employees: Employee[];
  error?: string;
} {
  const target = params.requests.find((r) => r.id === params.requestId);
  if (!target) {
    return {
      requests: params.requests,
      employees: params.employees,
      error: 'Không tìm thấy đơn yêu cầu.',
    };
  }

  if (target.status !== 'Chờ duyệt') {
    return {
      requests: params.requests,
      employees: params.employees,
      error: 'Đơn này đã được xử lý trước đó.',
    };
  }

  let updatedEmployees = params.employees;

  if (decisionIsLeaveDeduction(target, params.decision)) {
    const emp = params.employees.find((e) => e.id === target.employeeId);
    if (!emp) {
      return {
        requests: params.requests,
        employees: params.employees,
        error: 'Không tìm thấy nhân viên gửi đơn.',
      };
    }
    if (emp.annualLeaveRemaining < target.days) {
      return {
        requests: params.requests,
        employees: params.employees,
        error: `Nhân viên ${emp.fullName} chỉ còn ${emp.annualLeaveRemaining} ngày phép năm (yêu cầu ${target.days} ngày).`,
      };
    }

    updatedEmployees = params.employees.map((e) =>
      e.id === target.employeeId
        ? { ...e, annualLeaveRemaining: Math.max(0, e.annualLeaveRemaining - target.days) }
        : e
    );
  }

  const updatedRequests = params.requests.map((r) =>
    r.id === params.requestId
      ? {
          ...r,
          status: params.decision,
          reviewedBy: params.reviewerName,
          reviewedAt: params.reviewedAt,
        }
      : r
  );

  return {
    requests: updatedRequests,
    employees: updatedEmployees,
  };
}

function decisionIsLeaveDeduction(
  request: LeaveOtRequest,
  decision: Exclude<RequestStatus, 'Chờ duyệt'>
): boolean {
  return decision === 'Đã duyệt' && request.type === 'Nghỉ phép năm' && request.days > 0;
}

/**
 * Generates next employee code like NV-011
 */
export function generateNextEmployeeCode(employees: Employee[]): string {
  const maxNum = employees.reduce((max, emp) => {
    const match = emp.code.match(/NV-(\d+)/i);
    if (!match) return max;
    const n = parseInt(match[1], 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `NV-${String(maxNum + 1).padStart(3, '0')}`;
}

export function mapLaborKindToEmployeeContractType(kind: LaborContractKind): ContractType {
  switch (kind) {
    case 'Thử việc 2 tháng':
      return 'Hợp đồng Thử việc 2 tháng';
    case 'Xác định thời hạn 12 tháng':
      return 'HĐLĐ 12 tháng';
    case 'Xác định thời hạn 24 tháng':
      return 'HĐLĐ 24 tháng';
    case 'Không xác định thời hạn':
      return 'HĐLĐ Không xác định thời hạn';
  }
}

export function mapEmployeeContractTypeToLaborKind(contractType: ContractType): LaborContractKind {
  switch (contractType) {
    case 'Hợp đồng Thử việc 2 tháng':
      return 'Thử việc 2 tháng';
    case 'HĐLĐ 12 tháng':
      return 'Xác định thời hạn 12 tháng';
    case 'HĐLĐ 24 tháng':
      return 'Xác định thời hạn 24 tháng';
    case 'HĐLĐ Không xác định thời hạn':
      return 'Không xác định thời hạn';
  }
}

/**
 * Generates next Vietnamese administrative contract number e.g. 2611/HĐTV or 2612/HĐLĐ
 */
export function generateNextContractNumber(
  contracts: LaborContract[],
  suffix: 'HĐLĐ' | 'HĐTV' = 'HĐLĐ',
  dateIso: string = getTodayIsoLocal()
): string {
  const yearPrefix = dateIso.slice(2, 4) || '26';
  const maxSeq = contracts.reduce((max, c) => {
    const match = c.contractNumber.match(/^(\d{2})(\d{2,})\/HĐ/i);
    if (!match) return max;
    const seq = parseInt(match[2], 10);
    return Number.isNaN(seq) ? max : Math.max(max, seq);
  }, 10);
  return `${yearPrefix}${String(maxSeq + 1).padStart(2, '0')}/${suffix}`;
}

/**
 * Computes live contract lifecycle status based on endDate and referenceDate (YYYY-MM-DD)
 */
export function computeContractStatus(
  contract: Pick<LaborContract, 'contractType' | 'endDate' | 'statusOverride'>,
  referenceDate: string = getTodayIsoLocal()
): LaborContractStatus {
  if (contract.statusOverride === 'Đã thanh lý') {
    return 'Đã thanh lý';
  }

  if (contract.endDate && contract.endDate !== 'Không thời hạn') {
    const refMs = new Date(`${referenceDate}T00:00:00`).getTime();
    const endMs = new Date(`${contract.endDate}T00:00:00`).getTime();
    if (!Number.isNaN(refMs) && !Number.isNaN(endMs)) {
      const daysLeft = Math.ceil((endMs - refMs) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) return 'Hết hạn';
      if (daysLeft <= 30) return 'Sắp hết hạn';
    }
  }

  if (contract.contractType === 'Thử việc 2 tháng') {
    return 'Thử việc';
  }

  return 'Đang hiệu lực';
}

export function computeContractEndDate(startDate: string, kind: LaborContractKind): string {
  if (kind === 'Không xác định thời hạn') return 'Không thời hạn';
  if (kind === 'Thử việc 2 tháng') return addMonthsToIsoDate(startDate, 2);
  if (kind === 'Xác định thời hạn 12 tháng') return addMonthsToIsoDate(startDate, 12);
  return addMonthsToIsoDate(startDate, 24);
}

/**
 * Converts a candidate from ATS into BOTH a Core HR Employee record and an initial 2-month Probation LaborContract.
 */
export function convertCandidateToEmployee(params: {
  candidate: Candidate;
  employees: Employee[];
  contracts?: LaborContract[];
  branches?: Branch[];
  joinDate: string;
  baseSalary?: number;
  allowance?: number;
  gender?: 'Nam' | 'Nữ';
  dateOfBirth?: string;
  nationalId?: string;
  nationalIdIssueDate?: string;
  nationalIdIssuePlace?: string;
  address?: string;
}): {
  newEmployee: Employee;
  newContract: LaborContract;
  updatedCandidate: Candidate;
} {
  const { candidate, employees, joinDate } = params;
  const contracts = params.contracts ?? [];
  const branches = params.branches ?? [];

  const code = generateNextEmployeeCode(employees);
  const newEmployeeId = `emp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const salary = params.baseSalary ?? (candidate.expectedSalary || 18_000_000);
  const allowance = params.allowance ?? 1_500_000;

  const probationEnd = addMonthsToIsoDate(joinDate, 2);
  const contractNumber = generateNextContractNumber(contracts, 'HĐTV', joinDate);
  const branch = branches.find((b) => b.id === candidate.appliedBranchId);
  const workLocation = branch?.address ?? 'Trụ sở chính Công ty';

  const newEmployee: Employee = {
    id: newEmployeeId,
    code,
    fullName: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone,
    gender: params.gender ?? 'Nam',
    dateOfBirth: params.dateOfBirth ?? '1997-05-15',
    nationalId: params.nationalId ?? `0010970${Math.floor(10000 + Math.random() * 89999)}`,
    nationalIdIssueDate: params.nationalIdIssueDate ?? '2022-04-20',
    nationalIdIssuePlace: params.nationalIdIssuePlace ?? 'Cục Cảnh sát QLHC về TTXH',
    address: params.address ?? 'Việt Nam (Cập nhật từ hồ sơ tuyển dụng)',
    departmentId: candidate.appliedDepartmentId,
    positionId: candidate.appliedPositionId,
    branchId: candidate.appliedBranchId,
    joinDate,
    contractType: 'Hợp đồng Thử việc 2 tháng',
    contractCode: contractNumber,
    contractStartDate: joinDate,
    contractEndDate: probationEnd,
    baseSalary: salary,
    allowance,
    dependents: 0,
    annualLeaveTotal: 12,
    annualLeaveRemaining: 12,
    bankAccount: 'Đang cập nhật',
    bankName: 'Techcombank',
    status: 'Thử việc',
  };

  const newContract: LaborContract = {
    id: `ctr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    contractNumber,
    employeeId: newEmployeeId,
    contractType: 'Thử việc 2 tháng',
    startDate: joinDate,
    endDate: probationEnd,
    baseSalary: salary,
    allowance,
    paymentMethod: 'Chuyển khoản ngân hàng',
    payDay: 10,
    workLocation,
    jobDuties: 'Thực hiện công việc chuyên môn theo mô tả vị trí và thử việc theo quy định.',
    signedDate: joinDate,
  };

  const updatedCandidate: Candidate = {
    ...candidate,
    stage: 'Trúng tuyển',
    convertedEmployeeId: newEmployeeId,
  };

  return { newEmployee, newContract, updatedCandidate };
}

export function addMonthsToIsoDate(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '2027-11-14';
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * Records check-in or check-out for an employee on a specific YYYY-MM-DD date.
 */
export function recordAttendanceAction(params: {
  records: AttendanceRecord[];
  employeeId: string;
  date: string;
  time: string; // HH:mm:ss
  action: 'check-in' | 'check-out';
}): AttendanceRecord[] {
  const { records, employeeId, date, time, action } = params;
  const existing = records.find((r) => r.employeeId === employeeId && r.date === date);

  if (action === 'check-in') {
    if (existing && existing.checkInTime) {
      return records;
    }
    const isLate = time > '08:30:59';
    const newRecord: AttendanceRecord = {
      id: existing?.id ?? `att-${employeeId}-${date}`,
      employeeId,
      date,
      checkInTime: time,
      checkOutTime: existing?.checkOutTime ?? null,
      workHours: existing?.workHours ?? 0,
      status: isLate ? 'Đi muộn' : 'Đúng giờ',
      note: isLate ? 'Check-in sau 08:30' : 'Đúng giờ quy định',
    };
    if (existing) {
      return records.map((r) => (r.id === existing.id ? newRecord : r));
    }
    return [newRecord, ...records];
  }

  // check-out
  if (!existing || !existing.checkInTime) {
    return records;
  }

  const workHours = computeHoursBetween(existing.checkInTime, time);
  return records.map((r) =>
    r.id === existing.id
      ? {
          ...r,
          checkOutTime: time,
          workHours,
        }
      : r
  );
}

export function computeHoursBetween(startTime: string, endTime: string): number {
  const toSeconds = (t: string) => {
    const [h = '0', m = '0', s = '0'] = t.split(':');
    return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10);
  };
  const diff = Math.max(0, toSeconds(endTime) - toSeconds(startTime));
  return Math.round((diff / 3600) * 100) / 100;
}

/**
 * Calculates weighted KPI score for an employee across KPI items.
 */
export function calculateKpiOverallScore(kpis: KpiItem[], employeeId: string): {
  weightedScore: number;
  totalWeight: number;
  rating: 'Xuất sắc' | 'Đạt yêu cầu' | 'Cần cải thiện' | 'Chưa có KPI';
} {
  const items = kpis.filter((k) => k.employeeId === employeeId);
  if (items.length === 0) {
    return { weightedScore: 0, totalWeight: 0, rating: 'Chưa có KPI' };
  }

  const totalWeight = items.reduce((sum, k) => sum + k.weight, 0);
  if (totalWeight <= 0) {
    const avg = Math.round(items.reduce((s, k) => s + k.completionPercent, 0) / items.length);
    return {
      weightedScore: avg,
      totalWeight: 0,
      rating: avg >= 95 ? 'Xuất sắc' : avg >= 75 ? 'Đạt yêu cầu' : 'Cần cải thiện',
    };
  }

  const weighted = Math.round(
    items.reduce((sum, k) => sum + k.completionPercent * k.weight, 0) / totalWeight
  );

  return {
    weightedScore: weighted,
    totalWeight,
    rating: weighted >= 95 ? 'Xuất sắc' : weighted >= 75 ? 'Đạt yêu cầu' : 'Cần cải thiện',
  };
}

export function formatVND(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))} ₫`;
}

export function formatDateVN(isoDate: string): string {
  if (!isoDate) return '—';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getTodayIsoLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeLocal(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  organizationName: 'OSHRM',
  slogan: 'Open Source Human Resource Management',
  taxCode: '0108998877',
  address: 'Tầng 18, Keangnam Landmark, Phạm Hùng, Nam Từ Liêm, Hà Nội',
  phone: '024 7300 8866',
  legalRepresentative: 'Nguyễn Minh Anh',
  legalRepresentativeTitle: 'Giám đốc Nhân sự',
  themeColor: '#2563eb',
  logoIcon: 'building',
  customLogoUrl: '',
};

export interface ThemeColorPreset {
  name: string;
  hex: string;
}

export const THEME_COLOR_PRESETS: ThemeColorPreset[] = [
  { name: 'Xanh Cobalt (Mặc định)', hex: '#2563eb' },
  { name: 'Xanh Ngọc (Emerald)', hex: '#059669' },
  { name: 'Xanh Teal (Doanh nghiệp)', hex: '#0d9488' },
  { name: 'Tím Indigo (Hiện đại)', hex: '#4f46e5' },
  { name: 'Đỏ Crimson (Năng động)', hex: '#dc2626' },
  { name: 'Than Slate (Tối giản)', hex: '#0f172a' },
];

const VALID_LOGO_ICONS: LogoIconKey[] = [
  'building',
  'layers',
  'shield',
  'globe',
  'cpu',
  'briefcase',
  'compass',
  'award',
];

function normalizeHex(hex: string): string {
  const cleaned = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
    return cleaned.toLowerCase();
  }
  return DEFAULT_SYSTEM_SETTINGS.themeColor;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const safe = normalizeHex(hex).slice(1);
  return {
    r: parseInt(safe.slice(0, 2), 16),
    g: parseInt(safe.slice(2, 4), 16),
    b: parseInt(safe.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
  );
}

function mixHex(hexA: string, hexB: string, weightA: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const wB = 1 - weightA;
  return rgbToHex(a.r * weightA + b.r * wB, a.g * weightA + b.g * wB, a.b * weightA + b.b * wB);
}

/**
 * Derives accessible hover, soft background, border, and readable text shades
 * from any chosen brand hex color.
 */
export function resolveThemePalette(hexColor: string): {
  primary: string;
  hover: string;
  soft: string;
  border: string;
  text: string;
  onPrimary: string;
} {
  const primary = normalizeHex(hexColor);
  const { r, g, b } = hexToRgb(primary);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return {
    primary,
    hover: mixHex(primary, '#000000', 0.84),
    soft: mixHex(primary, '#ffffff', 0.1),
    border: mixHex(primary, '#ffffff', 0.32),
    text: luminance > 0.65 ? mixHex(primary, '#000000', 0.55) : mixHex(primary, '#000000', 0.88),
    onPrimary: luminance > 0.72 ? '#0f172a' : '#ffffff',
  };
}

export function serializeSystemSettingsJson(settings: SystemSettings): string {
  return JSON.stringify(
    {
      schema: 'oshrm-white-label-config-v1',
      exportedAt: new Date().toISOString(),
      settings,
    },
    null,
    2
  );
}

export function parseSystemSettingsJson(
  rawJson: string,
  fallback: SystemSettings = DEFAULT_SYSTEM_SETTINGS
): { settings?: SystemSettings; error?: string } {
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return { error: 'Tệp JSON không hợp lệ.' };
    }

    const record = parsed as Record<string, unknown>;
    const candidate =
      record.settings && typeof record.settings === 'object'
        ? (record.settings as Record<string, unknown>)
        : record;

    if (
      typeof candidate.organizationName !== 'string' ||
      candidate.organizationName.trim().length === 0
    ) {
      return { error: 'Tệp cấu hình thiếu tên doanh nghiệp (organizationName).' };
    }

    const iconCandidate = candidate.logoIcon;
    const logoIcon: LogoIconKey =
      typeof iconCandidate === 'string' && VALID_LOGO_ICONS.includes(iconCandidate as LogoIconKey)
        ? (iconCandidate as LogoIconKey)
        : fallback.logoIcon;

    const settings: SystemSettings = {
      organizationName: candidate.organizationName.trim().slice(0, 80),
      slogan:
        typeof candidate.slogan === 'string' && candidate.slogan.trim()
          ? candidate.slogan.trim().slice(0, 140)
          : fallback.slogan,
      taxCode:
        typeof candidate.taxCode === 'string' ? candidate.taxCode.trim().slice(0, 32) : fallback.taxCode,
      address:
        typeof candidate.address === 'string' ? candidate.address.trim().slice(0, 200) : fallback.address,
      phone:
        typeof candidate.phone === 'string' ? candidate.phone.trim().slice(0, 32) : fallback.phone,
      legalRepresentative:
        typeof candidate.legalRepresentative === 'string'
          ? candidate.legalRepresentative.trim().slice(0, 80)
          : fallback.legalRepresentative,
      legalRepresentativeTitle:
        typeof candidate.legalRepresentativeTitle === 'string'
          ? candidate.legalRepresentativeTitle.trim().slice(0, 80)
          : fallback.legalRepresentativeTitle,
      themeColor:
        typeof candidate.themeColor === 'string'
          ? normalizeHex(candidate.themeColor)
          : fallback.themeColor,
      logoIcon,
      customLogoUrl:
        typeof candidate.customLogoUrl === 'string' ? candidate.customLogoUrl.trim() : '',
    };

    return { settings };
  } catch {
    return { error: 'Không thể đọc tệp JSON. Vui lòng kiểm tra định dạng tệp.' };
  }
}

export const DEFAULT_DEMO_PASSWORD = '123456';

export const ESS_ALLOWED_NAVS: NavSection[] = [
  'employees',
  'contracts',
  'attendance',
  'payroll',
  'kpi',
];

export const ADMIN_ALLOWED_NAVS: NavSection[] = [
  'dashboard',
  'organization',
  'employees',
  'contracts',
  'recruitment',
  'attendance',
  'payroll',
  'kpi',
  'settings',
];

export function resolveEmployeeRole(employee: Employee): UserRole {
  if (employee.id === 'emp-6' || employee.departmentId === 'dept-hr') {
    return 'admin';
  }
  return 'ess';
}

export function getDefaultNavForRole(role: UserRole): NavSection {
  return role === 'admin' ? 'dashboard' : 'employees';
}

export function isNavAllowedForRole(nav: NavSection, role: UserRole): boolean {
  if (role === 'admin') return ADMIN_ALLOWED_NAVS.includes(nav);
  return ESS_ALLOWED_NAVS.includes(nav);
}

export function authenticateUser(params: {
  identifier: string;
  password: string;
  employees: Employee[];
}):
  | { success: true; employee: Employee; role: UserRole }
  | { success: false; error: string } {
  const cleanId = params.identifier.trim().toLowerCase();
  const cleanPass = params.password;

  if (!cleanId) {
    return {
      success: false,
      error: 'Vui lòng nhập Email công việc hoặc Mã nhân viên.',
    };
  }

  if (!cleanPass) {
    return {
      success: false,
      error: 'Vui lòng nhập mật khẩu đăng nhập.',
    };
  }

  const matched = params.employees.find(
    (emp) => emp.email.toLowerCase() === cleanId || emp.code.toLowerCase() === cleanId
  );

  if (!matched) {
    return {
      success: false,
      error: 'Không tìm thấy tài khoản khớp với Email hoặc Mã nhân viên đã nhập.',
    };
  }

  if (matched.status === 'Nghỉ việc') {
    return {
      success: false,
      error: 'Tài khoản này đã ngừng hoạt động do nhân sự đã nghỉ việc.',
    };
  }

  if (cleanPass !== DEFAULT_DEMO_PASSWORD) {
    return {
      success: false,
      error: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại (mật khẩu mặc định: 123456).',
    };
  }

  return {
    success: true,
    employee: matched,
    role: resolveEmployeeRole(matched),
  };
}


