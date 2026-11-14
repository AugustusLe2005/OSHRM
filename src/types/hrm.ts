export type UserRole = 'admin' | 'ess';

export type NavSection =
  | 'dashboard'
  | 'organization'
  | 'employees'
  | 'contracts'
  | 'recruitment'
  | 'attendance'
  | 'payroll'
  | 'kpi'
  | 'settings';

export type LogoIconKey =
  | 'building'
  | 'layers'
  | 'shield'
  | 'globe'
  | 'cpu'
  | 'briefcase'
  | 'compass'
  | 'award';

export interface SystemSettings {
  organizationName: string;
  slogan: string;
  taxCode: string;
  address: string;
  phone: string;
  legalRepresentative: string;
  legalRepresentativeTitle: string;
  themeColor: string;
  logoIcon: LogoIconKey;
  customLogoUrl?: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  isHeadquarters: boolean;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  branchId: string;
  managerName: string;
  description: string;
}

export interface Position {
  id: string;
  code: string;
  title: string;
  departmentId: string;
  level: string;
  salaryRange: string;
}

export type EmployeeStatus = 'Đang làm việc' | 'Thử việc' | 'Nghỉ việc';
export type ContractType =
  | 'HĐLĐ Không xác định thời hạn'
  | 'HĐLĐ 24 tháng'
  | 'HĐLĐ 12 tháng'
  | 'Hợp đồng Thử việc 2 tháng';

export interface Employee {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  gender: 'Nam' | 'Nữ';
  dateOfBirth: string;
  nationalId: string;
  nationalIdIssueDate: string;
  nationalIdIssuePlace: string;
  address: string;
  departmentId: string;
  positionId: string;
  branchId: string;
  joinDate: string;
  contractType: ContractType;
  contractCode: string;
  contractStartDate: string;
  contractEndDate: string;
  baseSalary: number;
  allowance: number;
  dependents: number;
  annualLeaveTotal: number;
  annualLeaveRemaining: number;
  bankAccount: string;
  bankName: string;
  status: EmployeeStatus;
}

export type LaborContractKind =
  | 'Thử việc 2 tháng'
  | 'Xác định thời hạn 12 tháng'
  | 'Xác định thời hạn 24 tháng'
  | 'Không xác định thời hạn';

export type LaborContractStatus =
  | 'Đang hiệu lực'
  | 'Thử việc'
  | 'Sắp hết hạn'
  | 'Hết hạn'
  | 'Đã thanh lý';

export type PaymentMethod = 'Chuyển khoản ngân hàng' | 'Tiền mặt';

export interface LaborContract {
  id: string;
  contractNumber: string;
  employeeId: string;
  contractType: LaborContractKind;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD or 'Không thời hạn'
  baseSalary: number;
  allowance: number;
  paymentMethod: PaymentMethod;
  payDay: number;
  workLocation: string;
  jobDuties?: string;
  signedDate: string;
  statusOverride?: 'Đã thanh lý';
  terminatedDate?: string;
  terminationReason?: string;
}

export type JobPostingStatus = 'Đang tuyển' | 'Tạm dừng' | 'Đã đóng';

export interface JobPosting {
  id: string;
  code: string;
  positionId: string;
  departmentId: string;
  branchId: string;
  headcount: number;
  salaryRange: string;
  deadline: string;
  status: JobPostingStatus;
  description: string;
  createdAt: string;
}

export type CandidateStage = 'Mới ứng tuyển' | 'Phỏng vấn' | 'Trúng tuyển';

export interface Candidate {
  id: string;
  jobPostingId?: string;
  fullName: string;
  email: string;
  phone: string;
  appliedPositionId: string;
  appliedDepartmentId: string;
  appliedBranchId: string;
  source: string;
  expectedSalary: number;
  appliedDate: string;
  interviewDate?: string;
  notes: string;
  stage: CandidateStage;
  convertedEmployeeId?: string;
}

export type AttendanceStatus = 'Đúng giờ' | 'Đi muộn' | 'Nghỉ phép';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string | null; // HH:mm:ss
  checkOutTime: string | null; // HH:mm:ss
  workHours: number;
  status: AttendanceStatus;
  note?: string;
}

export type LeaveRequestType = 'Nghỉ phép năm' | 'Nghỉ không lương' | 'Tăng ca (OT)';
export type RequestStatus = 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';

export interface LeaveOtRequest {
  id: string;
  employeeId: string;
  type: LeaveRequestType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: number;
  otHours: number;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface KpiItem {
  id: string;
  employeeId: string;
  quarter: string;
  title: string;
  category: string;
  targetValue: number;
  actualValue: number;
  unit: string;
  weight: number; // %
  completionPercent: number; // 0 - 150
  deadline: string;
  evaluatorNote: string;
}

export interface PayslipBreakdown {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  departmentName: string;
  positionTitle: string;
  month: string; // YYYY-MM
  standardWorkDays: number;
  actualWorkDays: number;
  baseSalary: number;
  allowance: number;
  approvedOtHours: number;
  otPay: number;
  grossSalary: number;
  insuranceDeduction: number; // 10.5% BHXH + BHYT + BHTN
  personalDeduction: number; // 11,000,000
  dependentDeduction: number; // dependents * 4,400,000
  taxableIncome: number;
  personalIncomeTax: number;
  netSalary: number;
}

export interface HrmState {
  branches: Branch[];
  departments: Department[];
  positions: Position[];
  employees: Employee[];
  contracts: LaborContract[];
  jobPostings: JobPosting[];
  candidates: Candidate[];
  attendance: AttendanceRecord[];
  requests: LeaveOtRequest[];
  kpis: KpiItem[];
  settings: SystemSettings;
}
