import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Database,
  Eye,
  EyeOff,
  AlertCircle,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  LogIn,
  RotateCcw,
} from 'lucide-react';
import type { Employee, SystemSettings, UserRole } from '../types/hrm';
import { DEFAULT_DEMO_PASSWORD } from '../utils/hrmLogic';
import { BrandMark } from './BrandMark';

const MSSQL_API_BASE_URL = 'http://localhost:5000';

export interface ExternalAuthInfo {
  employeeId?: string;
  role?: UserRole;
  fullName?: string;
  employeeCode?: string;
  email?: string;
}

interface LoginScreenProps {
  employees: Employee[];
  settings: SystemSettings;
  savedIdentifier?: string;
  onBackToLanding: () => void;
  onSubmitLogin: (params: {
    identifier: string;
    password: string;
    rememberMe: boolean;
    externalAuth?: ExternalAuthInfo;
  }) => { success: boolean; error?: string };
  onResetData: () => void;
}

export function LoginScreen({
  employees,
  settings,
  savedIdentifier = '',
  onBackToLanding,
  onSubmitLogin,
  onResetData,
}: LoginScreenProps) {
  const [identifier, setIdentifier] = useState(savedIdentifier);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mssqlConnected, setMssqlConnected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2500);

    const checkBackendConnection = async () => {
      try {
        const res = await fetch(`${MSSQL_API_BASE_URL}/api/employees`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (res.ok) {
          setMssqlConnected(true);
        }
      } catch {
        setMssqlConnected(false);
      } finally {
        window.clearTimeout(timer);
      }
    };

    checkBackendConnection();

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const adminDemo =
    employees.find((e) => e.id === 'emp-6') ??
    employees.find((e) => e.departmentId === 'dept-hr') ??
    employees[0];
  const essDemo =
    employees.find((e) => e.id === 'emp-2') ??
    employees.find((e) => e.departmentId !== 'dept-hr') ??
    employees[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage('Vui lòng nhập Email công việc hoặc Mã nhân viên.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu đăng nhập.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(`${MSSQL_API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password,
        }),
        signal: controller.signal,
      });

      if (res.status === 401) {
        let apiMsg = 'Sai tài khoản hoặc mật khẩu. Vui lòng kiểm tra lại.';
        try {
          const errData = (await res.json()) as { error?: string; message?: string };
          apiMsg = errData?.error || errData?.message || apiMsg;
        } catch {
          // Use default 401 message
        }
        setErrorMessage(apiMsg);
        return;
      }

      if (res.status >= 500 || res.status === 404) {
        throw new Error(`HTTP_${res.status}`);
      }

      const data = (await res.json()) as Record<string, unknown>;
      if (res.ok && data?.success === true) {
        console.log('[OSHRM Hybrid Auth] MSSQL Login thành công:', data);
        setMssqlConnected(true);

        const rawUser =
          (data.user as Record<string, unknown> | undefined) ??
          (data.data as Record<string, unknown> | undefined) ??
          data;

        const rawRole = String(rawUser?.role ?? rawUser?.RoleId ?? '').toLowerCase();
        const resolvedRole: UserRole | undefined =
          rawRole === 'admin' || rawRole === 'ess' ? (rawRole as UserRole) : undefined;

        const externalAuth: ExternalAuthInfo = {
          employeeId:
            typeof (rawUser?.employeeId ?? rawUser?.EmployeeId) === 'string'
              ? String(rawUser.employeeId ?? rawUser.EmployeeId)
              : undefined,
          role: resolvedRole,
          fullName:
            typeof (rawUser?.fullName ?? rawUser?.FullName) === 'string'
              ? String(rawUser.fullName ?? rawUser.FullName)
              : undefined,
          employeeCode:
            typeof (rawUser?.employeeCode ?? rawUser?.EmployeeCode) === 'string'
              ? String(rawUser.employeeCode ?? rawUser.EmployeeCode)
              : undefined,
          email:
            typeof (rawUser?.email ?? rawUser?.Email) === 'string'
              ? String(rawUser.email ?? rawUser.Email)
              : undefined,
        };

        const loginResult = onSubmitLogin({
          identifier: cleanIdentifier,
          password,
          rememberMe,
          externalAuth,
        });
        if (!loginResult.success) {
          setErrorMessage(loginResult.error ?? 'Đăng nhập thất bại. Vui lòng thử lại.');
        }
        return;
      }

      const failMsg =
        typeof data?.error === 'string'
          ? data.error
          : typeof data?.message === 'string'
            ? data.message
            : 'Sai tài khoản hoặc mật khẩu. Vui lòng kiểm tra lại.';
      setErrorMessage(failMsg);
    } catch {
      console.warn(
        '[OSHRM Hybrid Auth] Không thể kết nối Backend SQL Server (http://localhost:5000). Tự động chuyển sang xác thực cục bộ (Offline Mode).'
      );
      const fallbackRes = onSubmitLogin({
        identifier: cleanIdentifier,
        password,
        rememberMe,
      });
      if (!fallbackRes.success) {
        setErrorMessage(fallbackRes.error ?? 'Đăng nhập thất bại. Vui lòng thử lại.');
      } else {
        setErrorMessage(null);
      }
    } finally {
      window.clearTimeout(timer);
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (targetEmailOrCode: string) => {
    setIdentifier(targetEmailOrCode);
    setPassword(DEFAULT_DEMO_PASSWORD);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar with Back Link & Hybrid MSSQL Status */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-0 lg:px-8">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại trang giới thiệu</span>
          </button>

          <div className="flex flex-wrap items-center gap-3 min-w-0">
            {mssqlConnected && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 whitespace-nowrap shrink-0"
              >
                <Database className="h-3.5 w-3.5 shrink-0" />
                <span>MSSQL Connected: OSHRM_DB</span>
              </span>
            )}

            <div className="flex items-center gap-2.5 min-w-0">
              <BrandMark settings={settings} size="sm" />
              <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap truncate max-w-[200px]">
                {settings.organizationName}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Centered Enterprise Login Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-5">
          {/* Login Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="text-center space-y-2">
              <div className="mx-auto flex justify-center">
                <BrandMark settings={settings} size="lg" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 pt-1">
                Đăng nhập {settings.organizationName}
              </h1>
              <p className="text-xs text-slate-500">{settings.slogan}</p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-800"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="login-identifier"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Email công việc (hoặc Mã nhân viên)
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="VD: anh.nguyen@oshrm.vn hoặc NV-006"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Nhập mật khẩu (mặc định: 123456)"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-900 focus:border-brand focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label
                  htmlFor="login-remember"
                  className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none"
                >
                  <input
                    id="login-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-brand"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>

                <button
                  type="button"
                  onClick={onResetData}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset dữ liệu mẫu</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-on transition-colors hover:bg-brand-hover disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand whitespace-nowrap"
              >
                <LogIn className="h-4 w-4" />
                <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}</span>
              </button>
            </form>
          </div>

          {/* Subtle Compact Demo Accounts Box */}
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold text-slate-800">
                Tài khoản trải nghiệm nhanh (Demo)
              </h2>
              <span className="font-mono text-[11px] text-slate-500">
                Mật khẩu: {DEFAULT_DEMO_PASSWORD}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill(adminDemo?.email ?? 'anh.nguyen@oshrm.vn')}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:border-brand-border hover:bg-brand-soft hover:text-brand-text"
              >
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand-text" />
                  <span>Điền nhanh Quản trị viên HR (Admin)</span>
                </span>
                <span className="hidden sm:inline font-mono text-[11px] font-normal text-slate-500">
                  {adminDemo?.code ?? 'NV-006'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill(essDemo?.email ?? 'bao.tran@oshrm.vn')}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-100"
              >
                <span className="inline-flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                  <span>Điền nhanh Nhân viên (ESS)</span>
                </span>
                <span className="hidden sm:inline font-mono text-[11px] font-normal text-slate-500">
                  {essDemo?.code ?? 'NV-002'}
                </span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Hoặc nhập trực tiếp Email / Mã NV (VD: <span className="font-mono">NV-001</span>..
              <span className="font-mono">NV-010</span>) để đăng nhập đúng hồ sơ tương ứng.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        Powered by OSHRM • Open Source MIT License
      </footer>
    </div>
  );
}
