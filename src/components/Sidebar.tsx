import React from 'react';
import {
  LayoutDashboard,
  Network,
  Users,
  FileSignature,
  Briefcase,
  Clock,
  Receipt,
  Target,
  Settings,
  RotateCcw,
  LogOut,
  X,
} from 'lucide-react';
import type { Employee, NavSection, SystemSettings, UserRole } from '../types/hrm';
import { BrandMark } from './BrandMark';

interface SidebarProps {
  role: UserRole;
  currentUser: Employee | null;
  settings: SystemSettings;
  activeNav: NavSection;
  pendingRequestsCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectNav: (nav: NavSection) => void;
  onLogout: () => void;
  onRequestReset: () => void;
}

interface NavItemConfig {
  id: NavSection;
  label: string;
  essLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, adminOnly: true },
  { id: 'organization', label: 'Cơ cấu tổ chức', icon: Network, adminOnly: true },
  { id: 'employees', label: 'Hồ sơ nhân sự', essLabel: 'Hồ sơ cá nhân', icon: Users },
  { id: 'contracts', label: 'Hợp đồng lao động', essLabel: 'Hợp đồng của tôi', icon: FileSignature },
  { id: 'recruitment', label: 'Tuyển dụng (ATS)', icon: Briefcase, adminOnly: true },
  { id: 'attendance', label: 'Chấm công & Nghỉ phép', icon: Clock },
  { id: 'payroll', label: 'Tính lương (Payroll)', essLabel: 'Phiếu lương của tôi', icon: Receipt },
  { id: 'kpi', label: 'Đánh giá KPI', essLabel: 'KPI của tôi', icon: Target },
  { id: 'settings', label: 'Cài đặt Hệ thống', icon: Settings, adminOnly: true },
];

export function Sidebar({
  role,
  currentUser,
  settings,
  activeNav,
  pendingRequestsCount,
  mobileOpen,
  onCloseMobile,
  onSelectNav,
  onLogout,
  onRequestReset,
}: SidebarProps) {
  const visibleItems = NAV_ITEMS.filter((item) => role === 'admin' || !item.adminOnly);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-200">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <BrandMark settings={settings} size="sm" />
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap truncate">
            {settings.organizationName}
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Đóng thanh điều hướng"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Role Context */}
      <div className="px-4 pt-4 pb-2">
        <div className="rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-2.5">
          <div className="text-xs font-medium text-slate-400">
            {role === 'admin' ? 'Quản trị viên HR (Admin)' : 'Nhân viên (ESS)'}
          </div>
          <div className="mt-0.5 text-sm font-semibold text-white truncate">
            {currentUser?.fullName ?? 'Người dùng'}
          </div>
          <div className="text-xs text-slate-400 font-mono truncate">{currentUser?.code}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Điều hướng chính" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          const label = role === 'ess' && item.essLabel ? item.essLabel : item.label;
          const showPendingCount =
            role === 'admin' && item.id === 'attendance' && pendingRequestsCount > 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectNav(item.id);
                onCloseMobile();
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-brand text-brand-on'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </span>
              {showPendingCount && (
                <span className="font-mono text-xs font-semibold tabular-nums text-amber-300">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Utility Actions & Open Source Attribution */}
      <div className="border-t border-slate-800 p-3 space-y-1.5 shrink-0">
        <button
          type="button"
          onClick={onRequestReset}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white whitespace-nowrap"
        >
          <RotateCcw className="h-4 w-4 shrink-0 text-slate-400" />
          <span>Reset dữ liệu mẫu</span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white whitespace-nowrap"
        >
          <LogOut className="h-4 w-4 shrink-0 text-slate-400" />
          <span>Đăng xuất</span>
        </button>
        <div className="pt-2 mt-1 border-t border-slate-800/80 px-2 text-center text-[11px] leading-snug text-slate-400">
          Powered by OSHRM • Open Source MIT License
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 border-r border-slate-200 no-print">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden no-print">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-64 max-w-[80vw] h-full">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
