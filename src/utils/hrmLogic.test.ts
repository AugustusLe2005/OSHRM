import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyRequestDecision,
  authenticateUser,
  calculateKpiOverallScore,
  calculatePayslip,
  calculateProgressivePIT,
  computeContractStatus,
  convertCandidateToEmployee,
  DEFAULT_DEMO_PASSWORD,
  DEFAULT_SYSTEM_SETTINGS,
  generateNextContractNumber,
  getDefaultNavForRole,
  isNavAllowedForRole,
  parseSystemSettingsJson,
  recordAttendanceAction,
  resolveEmployeeRole,
  resolveThemePalette,
  serializeSystemSettingsJson,
} from './hrmLogic';
import type { Candidate, Employee, KpiItem, LaborContract, LeaveOtRequest } from '../types/hrm';

const mockEmployee: Employee = {
  id: 'emp-1',
  code: 'NV-001',
  fullName: 'Trần Quốc Bảo',
  email: 'bao.tran@peoplecore.vn',
  phone: '0901234567',
  gender: 'Nam',
  dateOfBirth: '1995-04-12',
  nationalId: '001095012345',
  nationalIdIssueDate: '2022-01-18',
  nationalIdIssuePlace: 'Cục Cảnh sát QLHC về TTXH',
  address: 'Hà Nội',
  departmentId: 'dept-tech',
  positionId: 'pos-dev',
  branchId: 'br-hn',
  joinDate: '2024-01-10',
  contractType: 'HĐLĐ Không xác định thời hạn',
  contractCode: 'HĐLĐ-2024-001',
  contractStartDate: '2024-01-10',
  contractEndDate: 'Không thời hạn',
  baseSalary: 30_000_000,
  allowance: 2_000_000,
  dependents: 1,
  annualLeaveTotal: 12,
  annualLeaveRemaining: 10,
  bankAccount: '19033445566',
  bankName: 'Techcombank',
  status: 'Đang làm việc',
};

test('calculateProgressivePIT handles zero and multi-bracket taxable income accurately', () => {
  assert.equal(calculateProgressivePIT(0), 0);
  assert.equal(calculateProgressivePIT(4_000_000), 200_000); // 4M * 5%
  // 12M: 5M*5% (250k) + 5M*10% (500k) + 2M*15% (300k) = 1,050,000
  assert.equal(calculateProgressivePIT(12_000_000), 1_050_000);
});

test('calculatePayslip computes OT, 10.5% insurance, PIT and Net salary accurately', () => {
  const slip = calculatePayslip({
    employee: mockEmployee,
    departmentName: 'Khối Công nghệ',
    positionTitle: 'Kỹ sư Phần mềm',
    month: '2026-11',
    approvedOtHours: 8,
  });

  // hourlyRate = 30,000,000 / 176 = 170,454.545...
  // otPay = Math.round(8 * hourlyRate * 1.5) = 2,045,455
  assert.equal(slip.otPay, 2_045_455);
  assert.equal(slip.grossSalary, 34_045_455);
  assert.equal(slip.insuranceDeduction, 3_150_000); // 10.5% of 30M
  // deductions = 3,150,000 + 11,000,000 + 4,400,000 = 18,550,000
  // taxable = 34,045,455 - 18,550,000 = 15,495,455
  assert.equal(slip.taxableIncome, 15_495_455);
  // PIT = 250k + 500k + (5,495,455 * 0.15 = 824,318.25) = 1,574,318
  assert.equal(slip.personalIncomeTax, 1_574_318);
  assert.equal(slip.netSalary, 34_045_455 - 3_150_000 - 1_574_318);
});

test('applyRequestDecision deducts annual leave when approved and preserves when rejected', () => {
  const requests: LeaveOtRequest[] = [
    {
      id: 'req-1',
      employeeId: 'emp-1',
      type: 'Nghỉ phép năm',
      startDate: '2026-11-20',
      endDate: '2026-11-21',
      days: 2,
      otHours: 0,
      reason: 'Việc gia đình',
      status: 'Chờ duyệt',
      createdAt: '2026-11-14',
    },
    {
      id: 'req-2',
      employeeId: 'emp-1',
      type: 'Nghỉ phép năm',
      startDate: '2026-11-25',
      endDate: '2026-11-25',
      days: 1,
      otHours: 0,
      reason: 'Khám sức khỏe',
      status: 'Chờ duyệt',
      createdAt: '2026-11-14',
    },
  ];

  const approved = applyRequestDecision({
    requests,
    employees: [mockEmployee],
    requestId: 'req-1',
    decision: 'Đã duyệt',
    reviewerName: 'Nguyễn Minh Anh',
    reviewedAt: '2026-11-14',
  });

  assert.equal(approved.error, undefined);
  assert.equal(approved.employees[0].annualLeaveRemaining, 8);
  assert.equal(approved.requests[0].status, 'Đã duyệt');

  const rejected = applyRequestDecision({
    requests: approved.requests,
    employees: approved.employees,
    requestId: 'req-2',
    decision: 'Từ chối',
    reviewerName: 'Nguyễn Minh Anh',
    reviewedAt: '2026-11-14',
  });

  assert.equal(rejected.employees[0].annualLeaveRemaining, 8);
  assert.equal(rejected.requests[1].status, 'Từ chối');
});

test('convertCandidateToEmployee creates next NV code, links candidate, and generates 2-month probation contract', () => {
  const candidate: Candidate = {
    id: 'cand-1',
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@gmail.com',
    phone: '0988111222',
    appliedPositionId: 'pos-dev',
    appliedDepartmentId: 'dept-tech',
    appliedBranchId: 'br-hn',
    source: 'LinkedIn',
    expectedSalary: 24_000_000,
    appliedDate: '2026-11-01',
    notes: 'Pass phỏng vấn kỹ thuật',
    stage: 'Trúng tuyển',
  };

  const { newEmployee, newContract, updatedCandidate } = convertCandidateToEmployee({
    candidate,
    employees: [mockEmployee],
    contracts: [],
    joinDate: '2026-11-15',
  });

  assert.equal(newEmployee.code, 'NV-002');
  assert.equal(newEmployee.fullName, 'Lê Hoàng Nam');
  assert.equal(newEmployee.status, 'Thử việc');
  assert.equal(newEmployee.baseSalary, 24_000_000);
  assert.equal(newContract.employeeId, newEmployee.id);
  assert.equal(newContract.contractType, 'Thử việc 2 tháng');
  assert.equal(newContract.startDate, '2026-11-15');
  assert.match(newContract.contractNumber, /^\d{4}\/HĐTV$/);
  assert.equal(updatedCandidate.convertedEmployeeId, newEmployee.id);
});

test('computeContractStatus and generateNextContractNumber handle all Vietnamese contract lifecycle states', () => {
  assert.equal(
    computeContractStatus(
      { contractType: 'Thử việc 2 tháng', endDate: '2027-01-15' },
      '2026-11-14'
    ),
    'Thử việc'
  );
  assert.equal(
    computeContractStatus(
      { contractType: 'Xác định thời hạn 12 tháng', endDate: '2026-12-01' },
      '2026-11-14'
    ),
    'Sắp hết hạn'
  );
  assert.equal(
    computeContractStatus(
      { contractType: 'Xác định thời hạn 12 tháng', endDate: '2026-11-01' },
      '2026-11-14'
    ),
    'Hết hạn'
  );
  assert.equal(
    computeContractStatus(
      { contractType: 'Không xác định thời hạn', endDate: 'Không thời hạn' },
      '2026-11-14'
    ),
    'Đang hiệu lực'
  );
  assert.equal(
    computeContractStatus(
      {
        contractType: 'Không xác định thời hạn',
        endDate: 'Không thời hạn',
        statusOverride: 'Đã thanh lý',
      },
      '2026-11-14'
    ),
    'Đã thanh lý'
  );

  const sampleContracts: LaborContract[] = [
    {
      id: 'c1',
      contractNumber: '2508/HĐLĐ',
      employeeId: 'emp-1',
      contractType: 'Xác định thời hạn 24 tháng',
      startDate: '2025-04-10',
      endDate: '2027-04-10',
      baseSalary: 20_000_000,
      allowance: 1_500_000,
      paymentMethod: 'Chuyển khoản ngân hàng',
      payDay: 10,
      workLocation: 'Hà Nội',
      signedDate: '2025-04-10',
    },
  ];
  assert.equal(generateNextContractNumber(sampleContracts, 'HĐLĐ', '2026-11-14'), '2611/HĐLĐ');
});

test('recordAttendanceAction records check-in status and computes check-out work hours', () => {
  const afterIn = recordAttendanceAction({
    records: [],
    employeeId: 'emp-1',
    date: '2026-11-14',
    time: '08:25:00',
    action: 'check-in',
  });

  assert.equal(afterIn.length, 1);
  assert.equal(afterIn[0].status, 'Đúng giờ');

  const afterOut = recordAttendanceAction({
    records: afterIn,
    employeeId: 'emp-1',
    date: '2026-11-14',
    time: '17:55:00',
    action: 'check-out',
  });

  assert.equal(afterOut[0].checkOutTime, '17:55:00');
  assert.equal(afterOut[0].workHours, 9.5);
});

test('calculateKpiOverallScore computes weighted score and rating', () => {
  const kpis: KpiItem[] = [
    {
      id: 'k1',
      employeeId: 'emp-1',
      quarter: 'Q4/2026',
      title: 'Hoàn thành Sprint',
      category: 'Kỹ thuật',
      targetValue: 100,
      actualValue: 100,
      unit: '%',
      weight: 60,
      completionPercent: 100,
      deadline: '2026-12-31',
      evaluatorNote: 'Tốt',
    },
    {
      id: 'k2',
      employeeId: 'emp-1',
      quarter: 'Q4/2026',
      title: 'Giảm bug production',
      category: 'Chất lượng',
      targetValue: 10,
      actualValue: 9,
      unit: 'vấn đề',
      weight: 40,
      completionPercent: 90,
      deadline: '2026-12-31',
      evaluatorNote: 'Đạt',
    },
  ];

  const score = calculateKpiOverallScore(kpis, 'emp-1');
  assert.equal(score.weightedScore, 96);
  assert.equal(score.rating, 'Xuất sắc');
});

test('resolveThemePalette derives valid shades and falls back on malformed hex', () => {
  const emerald = resolveThemePalette('#059669');
  assert.equal(emerald.primary, '#059669');
  assert.equal(emerald.onPrimary, '#ffffff');
  assert.match(emerald.hover, /^#[0-9a-f]{6}$/);
  assert.match(emerald.soft, /^#[0-9a-f]{6}$/);

  const fallback = resolveThemePalette('not-a-color');
  assert.equal(fallback.primary, DEFAULT_SYSTEM_SETTINGS.themeColor);
});

test('serializeSystemSettingsJson and parseSystemSettingsJson roundtrip cleanly and reject invalid input', () => {
  const custom = {
    ...DEFAULT_SYSTEM_SETTINGS,
    organizationName: 'TechViet Corp',
    slogan: 'Build Better Teams',
    taxCode: '0312345678',
    themeColor: '#059669',
    logoIcon: 'cpu' as const,
  };

  const json = serializeSystemSettingsJson(custom);
  const parsed = parseSystemSettingsJson(json);
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.settings?.organizationName, 'TechViet Corp');
  assert.equal(parsed.settings?.themeColor, '#059669');
  assert.equal(parsed.settings?.logoIcon, 'cpu');

  const invalid = parseSystemSettingsJson('{invalid json');
  assert.ok(invalid.error);

  const missingOrg = parseSystemSettingsJson(JSON.stringify({ slogan: 'Only slogan' }));
  assert.ok(missingOrg.error);
});

test('authenticateUser validates email, case-insensitive employee code, password, and status', () => {
  const hrAdmin: Employee = {
    ...mockEmployee,
    id: 'emp-6',
    code: 'NV-006',
    fullName: 'Nguyễn Minh Anh',
    email: 'anh.nguyen@oshrm.vn',
    departmentId: 'dept-hr',
  };
  const terminatedEmp: Employee = {
    ...mockEmployee,
    id: 'emp-99',
    code: 'NV-099',
    email: 'old@oshrm.vn',
    status: 'Nghỉ việc',
  };
  const employees = [mockEmployee, hrAdmin, terminatedEmp];

  // Empty identifier
  const blankId = authenticateUser({
    identifier: '   ',
    password: DEFAULT_DEMO_PASSWORD,
    employees,
  });
  assert.equal(blankId.success, false);

  // Empty password
  const blankPass = authenticateUser({
    identifier: 'NV-001',
    password: '',
    employees,
  });
  assert.equal(blankPass.success, false);

  // Unknown identifier
  const unknown = authenticateUser({
    identifier: 'nobody@oshrm.vn',
    password: DEFAULT_DEMO_PASSWORD,
    employees,
  });
  assert.equal(unknown.success, false);

  // Wrong password
  const badPass = authenticateUser({
    identifier: 'NV-001',
    password: 'wrong-password',
    employees,
  });
  assert.equal(badPass.success, false);

  // Terminated employee blocked
  const resigned = authenticateUser({
    identifier: 'NV-099',
    password: DEFAULT_DEMO_PASSWORD,
    employees,
  });
  assert.equal(resigned.success, false);

  // Login by email (HR Admin -> admin role)
  const adminByEmail = authenticateUser({
    identifier: 'ANH.NGUYEN@OSHRM.VN',
    password: DEFAULT_DEMO_PASSWORD,
    employees,
  });
  assert.equal(adminByEmail.success, true);
  if (adminByEmail.success) {
    assert.equal(adminByEmail.role, 'admin');
    assert.equal(adminByEmail.employee.id, 'emp-6');
  }

  // Login by employee code (case-insensitive -> ess role)
  const essByCode = authenticateUser({
    identifier: 'nv-001',
    password: DEFAULT_DEMO_PASSWORD,
    employees,
  });
  assert.equal(essByCode.success, true);
  if (essByCode.success) {
    assert.equal(essByCode.role, 'ess');
    assert.equal(essByCode.employee.id, 'emp-1');
  }
});

test('RBAC helpers enforce strict separation between Admin and ESS modules', () => {
  assert.equal(getDefaultNavForRole('admin'), 'dashboard');
  assert.equal(getDefaultNavForRole('ess'), 'employees');
  assert.equal(resolveEmployeeRole(mockEmployee), 'ess');

  // Admin can access all 9 modules
  assert.equal(isNavAllowedForRole('dashboard', 'admin'), true);
  assert.equal(isNavAllowedForRole('organization', 'admin'), true);
  assert.equal(isNavAllowedForRole('recruitment', 'admin'), true);
  assert.equal(isNavAllowedForRole('settings', 'admin'), true);

  // ESS strictly blocked from admin modules
  assert.equal(isNavAllowedForRole('dashboard', 'ess'), false);
  assert.equal(isNavAllowedForRole('organization', 'ess'), false);
  assert.equal(isNavAllowedForRole('recruitment', 'ess'), false);
  assert.equal(isNavAllowedForRole('settings', 'ess'), false);

  // ESS allowed in self-service modules
  assert.equal(isNavAllowedForRole('employees', 'ess'), true);
  assert.equal(isNavAllowedForRole('contracts', 'ess'), true);
  assert.equal(isNavAllowedForRole('attendance', 'ess'), true);
  assert.equal(isNavAllowedForRole('payroll', 'ess'), true);
  assert.equal(isNavAllowedForRole('kpi', 'ess'), true);
});

