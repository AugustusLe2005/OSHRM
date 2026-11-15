import type {
  Department,
  Employee,
  LaborContract,
  LaborContractStatus,
  PayslipBreakdown,
  Position,
} from '../types/hrm';
import { formatDateVN } from './hrmLogic';

export const UTF8_BOM = '\uFEFF';

export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsvWithBom(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
): string {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return UTF8_BOM + [headerLine, ...dataLines].join('\r\n');
}

export function buildPayrollCsv(params: {
  payslips: PayslipBreakdown[];
  employees: Employee[];
}): string {
  const headers = [
    'Mã NV',
    'Họ và tên',
    'Phòng ban',
    'Lương cơ bản',
    'Phụ cấp',
    'Tiền tăng ca',
    'Thưởng / Điều chỉnh',
    'Khấu trừ / Phạt',
    'Ghi chú điều chỉnh',
    'Khấu trừ BHXH (10.5%)',
    'Thuế TNCN',
    'Lương thực nhận (Net)',
    'Trạng thái',
  ];

  const rows = params.payslips.map((slip) => {
    const emp = params.employees.find((e) => e.id === slip.employeeId);
    return [
      slip.employeeCode,
      slip.fullName,
      slip.departmentName,
      slip.baseSalary,
      slip.allowance,
      slip.otPay,
      slip.bonus,
      slip.deduction,
      slip.adjustmentNote,
      slip.insuranceDeduction,
      slip.personalIncomeTax,
      slip.netSalary,
      emp?.status ?? 'Đang làm việc',
    ];
  });

  return buildCsvWithBom(headers, rows);
}

export function buildEmployeesCsv(params: {
  employees: Employee[];
  departments: Department[];
  positions: Position[];
}): string {
  const headers = [
    'Mã NV',
    'Họ tên',
    'Giới tính',
    'Ngày sinh',
    'Số CCCD',
    'Phòng ban',
    'Chức vụ',
    'Email',
    'SĐT',
    'Ngày vào làm',
    'Trạng thái',
  ];

  const rows = params.employees.map((emp) => {
    const dept = params.departments.find((d) => d.id === emp.departmentId)?.name ?? '—';
    const pos = params.positions.find((p) => p.id === emp.positionId)?.title ?? '—';
    return [
      emp.code,
      emp.fullName,
      emp.gender,
      formatDateVN(emp.dateOfBirth),
      emp.nationalId,
      dept,
      pos,
      emp.email,
      emp.phone,
      formatDateVN(emp.joinDate),
      emp.status,
    ];
  });

  return buildCsvWithBom(headers, rows);
}

export function buildContractsCsv(params: {
  items: Array<{
    contract: LaborContract;
    status: LaborContractStatus;
    employee: Employee | null;
  }>;
  departments: Department[];
}): string {
  const headers = [
    'Số hợp đồng',
    'Mã NV',
    'Nhân viên',
    'Phòng ban',
    'Loại hợp đồng',
    'Ngày bắt đầu',
    'Ngày hết hạn',
    'Lương căn bản',
    'Phụ cấp',
    'Hình thức trả lương',
    'Ngày trả lương',
    'Trạng thái',
  ];

  const rows = params.items.map(({ contract, status, employee }) => {
    const dept = employee
      ? params.departments.find((d) => d.id === employee.departmentId)?.name ?? '—'
      : '—';

    return [
      contract.contractNumber,
      employee?.code ?? '—',
      employee?.fullName ?? 'Nhân sự đã xóa',
      dept,
      contract.contractType,
      formatDateVN(contract.startDate),
      contract.endDate === 'Không thời hạn' ? 'Không thời hạn' : formatDateVN(contract.endDate),
      contract.baseSalary,
      contract.allowance,
      contract.paymentMethod,
      `Ngày ${contract.payDay} hằng tháng`,
      status,
    ];
  });

  return buildCsvWithBom(headers, rows);
}

export function downloadCsvFile(filename: string, csvContent: string): void {
  const contentWithBom = csvContent.startsWith(UTF8_BOM) ? csvContent : UTF8_BOM + csvContent;
  const blob = new Blob([contentWithBom], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
