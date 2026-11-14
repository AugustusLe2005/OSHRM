import React from 'react';
import {
  ArrowRight,
  Users,
  FileSignature,
  Briefcase,
  Calculator,
  ShieldCheck,
  UserCheck,
  Check,
} from 'lucide-react';
import type { SystemSettings } from '../types/hrm';
import { BrandMark } from './BrandMark';

interface LandingPageProps {
  settings: SystemSettings;
  employeeCount: number;
  departmentCount: number;
  onGoToLogin: () => void;
}

const CORE_VALUES = [
  {
    index: '01.',
    title: 'Hồ sơ nhân sự 360°',
    description:
      'Quản lý tập trung lý lịch cá nhân, thông tin pháp lý CCCD, phòng ban, chức danh và lịch sử công tác theo thời gian thực.',
    icon: Users,
  },
  {
    index: '02.',
    title: 'Hợp đồng lao động chuẩn pháp lý',
    description:
      'Theo dõi vòng đời hợp đồng thử việc, xác định thời hạn, cảnh báo sắp hết hạn và in mẫu hợp đồng chuẩn Bộ luật Lao động 2019.',
    icon: FileSignature,
  },
  {
    index: '03.',
    title: 'Tuyển dụng ATS',
    description:
      'Đăng tin tuyển dụng, quản lý phễu ứng viên trực quan và tự động khởi tạo hồ sơ Core HR kèm hợp đồng thử việc chỉ với một thao tác.',
    icon: Briefcase,
  },
  {
    index: '04.',
    title: 'Chấm công & Tính lương tự động',
    description:
      'Check-in/out trực tiếp, duyệt đơn nghỉ phép tự động trừ phép năm, tính lương theo BHXH 10.5%, thuế TNCN 7 bậc và xuất phiếu lương.',
    icon: Calculator,
  },
];

export function LandingPage({
  settings,
  employeeCount,
  departmentCount,
  onGoToLogin,
}: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar (3-zone contract) */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Brand Logo + Org Name */}
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <BrandMark settings={settings} size="sm" />
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap truncate max-w-[200px] sm:max-w-[280px]">
              {settings.organizationName}
            </span>
          </div>

          {/* Zone 2: Clean Single-line Nav Links */}
          <nav
            aria-label="Điều hướng trang giới thiệu"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#gia-tri-cot-loi"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Giá trị cốt lõi
            </a>
            <a
              href="#phan-quyen-rbac"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Phân quyền RBAC
            </a>
            <a
              href="#ma-nguon-mo"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Kiến trúc mở
            </a>
          </nav>

          {/* Zone 3: Single Primary Login CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={onGoToLogin}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand whitespace-nowrap shrink-0"
            >
              <span>Đăng nhập hệ thống</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="text-xs font-semibold tracking-wide text-brand-text">
                  Nền tảng Quản trị Nhân sự Doanh nghiệp · {settings.slogan}
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12] [text-wrap:balance]">
                  Vận hành nhân sự, hợp đồng lao động và tiền lương chuẩn mực trên {settings.organizationName}
                </h1>

                <p className="max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
                  Nền tảng HRM mã nguồn mở toàn diện giúp bộ phận nhân sự quản trị trọn vẹn vòng đời
                  nhân viên từ tuyển dụng ATS, ký kết hợp đồng pháp lý đến chấm công, tính lương và
                  đánh giá KPI minh bạch.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={onGoToLogin}
                    className="inline-flex items-center gap-2.5 rounded-lg bg-brand px-6 py-3.5 text-base font-semibold text-brand-on transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand whitespace-nowrap shrink-0"
                  >
                    <span>Truy cập không gian làm việc</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Adjacent Quantitative Proof Strip */}
                <div className="grid grid-cols-3 gap-6 border-t border-slate-200 pt-7 max-w-xl">
                  <div>
                    <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                      9
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Phân hệ nghiệp vụ liên thông</div>
                  </div>
                  <div>
                    <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                      {employeeCount}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Hồ sơ mẫu ({departmentCount} phòng ban)
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                      100%
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Chuẩn Bộ luật Lao động 2019</div>
                  </div>
                </div>
              </div>

              {/* Right Workspace Architectural Preview Card */}
              <div className="lg:col-span-5">
                <div className="rounded-xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BrandMark settings={settings} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {settings.organizationName}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          Enterprise HRM Architecture
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-slate-400">MIT Open Source</span>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-4">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Liên thông dữ liệu thời gian thực</span>
                        <span className="font-mono text-emerald-400">Active</span>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-white">
                        ATS Trúng tuyển → Core HR → Hợp đồng thử việc
                      </div>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                        Chuyển đổi ứng viên tự động sinh mã nhân viên mới và hợp đồng thử việc 2
                        tháng chuẩn pháp lý.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3.5">
                        <div className="text-xs text-slate-400">Cổng Quản trị (Admin)</div>
                        <div className="mt-1 text-sm font-semibold text-white">Toàn quyền HR</div>
                        <div className="mt-1 text-xs text-slate-400">
                          9 phân hệ &amp; White-label
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3.5">
                        <div className="text-xs text-slate-400">Cổng Nhân viên (ESS)</div>
                        <div className="mt-1 text-sm font-semibold text-white">Tự phục vụ</div>
                        <div className="mt-1 text-xs text-slate-400">
                          Chấm công, phép &amp; lương
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Core Value Pillars */}
        <section id="gia-tri-cot-loi" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
              Bốn trụ cột quản trị nhân sự cốt lõi
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
              Thiết kế chuyên biệt theo quy trình hành chính và pháp luật lao động Việt Nam, loại bỏ
              thao tác rời rạc giữa các bảng tính thủ công.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {CORE_VALUES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.index}
                  className="rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-brand-border"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-xs font-mono font-semibold text-brand-text">
                      {item.index}
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Role-Based Access Control (RBAC) Overview */}
        <section id="phan-quyen-rbac" className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Kiểm soát truy cập theo vai trò (RBAC)
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                Phân tách rành mạch không gian điều hành của bộ phận Nhân sự và không gian tự phục vụ
                bảo mật của từng nhân viên.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-brand-on">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Quản trị viên HR (Admin)
                    </h3>
                    <p className="text-xs text-slate-500">Toàn quyền điều hành doanh nghiệp</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-brand-text shrink-0 mt-0.5" />
                    <span>
                      Dashboard tổng quan, Cơ cấu tổ chức, Hồ sơ nhân sự &amp; Hợp đồng lao động
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-brand-text shrink-0 mt-0.5" />
                    <span>
                      Quản lý Tuyển dụng ATS, duyệt đơn nghỉ phép/OT, tính bảng lương toàn công ty
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-brand-text shrink-0 mt-0.5" />
                    <span>Giao &amp; chấm điểm KPI, tùy chỉnh nhận diện White-label hệ thống</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Nhân viên (ESS - Self-Service)
                    </h3>
                    <p className="text-xs text-slate-500">Không gian cá nhân được bảo vệ riêng tư</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-slate-700 shrink-0 mt-0.5" />
                    <span>Xem hồ sơ cá nhân, hợp đồng lao động của bản thân và xuất bản in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-slate-700 shrink-0 mt-0.5" />
                    <span>Chấm công Check-in/Check-out trực tuyến và gửi đơn xin nghỉ phép/OT</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-slate-700 shrink-0 mt-0.5" />
                    <span>
                      Xem phiếu lương (Payslip) cá nhân &amp; theo dõi kết quả KPI được giao
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Open Source Banner */}
        <section id="ma-nguon-mo" className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-xl font-bold text-slate-900">
                Sẵn sàng trải nghiệm không gian làm việc {settings.organizationName}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Đăng nhập bằng tài khoản nhân viên hoặc sử dụng bộ tài khoản Demo có sẵn để kiểm thử
                đầy đủ phân quyền Admin và ESS.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoToLogin}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-on transition-colors hover:bg-brand-hover whitespace-nowrap shrink-0"
            >
              <span>Đăng nhập hệ thống</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="font-medium text-slate-700">
            Powered by OSHRM • Open Source MIT License
          </div>
          <div>
            {settings.organizationName} · {settings.address}
          </div>
        </div>
      </footer>
    </div>
  );
}
