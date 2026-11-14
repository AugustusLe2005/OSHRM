import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import type { Employee, NavSection, SystemSettings, UserRole } from '../types/hrm';

interface TopBarProps {
  role: UserRole;
  currentUser: Employee | null;
  settings: SystemSettings;
  activeNav: NavSection;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

const SECTION_TITLES: Record<NavSection, { admin: string; ess: string }> = {
  dashboard: { admin: 'Tổng quan doanh nghiệp', ess: 'Tổng quan' },
  organization: { admin: 'Cơ cấu tổ chức', ess: 'Cơ cấu tổ chức' },
  employees: { admin: 'Hồ sơ nhân sự (Core HR)', ess: 'Hồ sơ cá nhân' },
  contracts: { admin: 'Hợp đồng lao động', ess: 'Hợp đồng của tôi' },
  recruitment: { admin: 'Tuyển dụng (ATS)', ess: 'Tuyển dụng' },
  attendance: { admin: 'Chấm công & Nghỉ phép', ess: 'Chấm công & Nghỉ phép' },
  payroll: { admin: 'Tính lương (Payroll)', ess: 'Phiếu lương của tôi' },
  kpi: { admin: 'Đánh giá KPI', ess: 'KPI của tôi' },
  settings: { admin: 'Cài đặt Hệ thống', ess: 'Cài đặt Hệ thống' },
};

export function TopBar({
  role,
  currentUser,
  settings,
  activeNav,
  onOpenMobileMenu,
  onLogout,
}: TopBarProps) {
  const title = SECTION_TITLES[activeNav][role];

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 sm:gap-8 border-b border-slate-200 bg-white px-4 lg:px-8 no-print">
      {/* Zone 1: Mobile Menu + Breadcrumb Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Mở menu điều hướng"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden shrink-0"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="hidden sm:inline text-slate-400 whitespace-nowrap truncate max-w-[200px]">
            {settings.organizationName}
          </span>
          <span className="hidden sm:inline text-slate-300" aria-hidden="true">
            /
          </span>
          <h1 className="text-base font-semibold text-slate-900 truncate whitespace-nowrap">
            {title}
          </h1>
        </div>
      </div>

      {/* Zone 2: Clean Account Context */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap shrink-0">
        <span>{currentUser?.fullName}</span>
        <span aria-hidden="true">·</span>
        <span>{role === 'admin' ? 'Quản trị viên HR' : 'Nhân viên (ESS)'}</span>
      </div>

      {/* Zone 3: Single Primary Sign-Out Action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
