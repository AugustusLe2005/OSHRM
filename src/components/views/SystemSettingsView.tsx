import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  RotateCcw,
  Save,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import type { LogoIconKey, SystemSettings } from '../../types/hrm';
import {
  DEFAULT_SYSTEM_SETTINGS,
  parseSystemSettingsJson,
  resolveThemePalette,
  serializeSystemSettingsJson,
  THEME_COLOR_PRESETS,
} from '../../utils/hrmLogic';
import { BrandMark, LOGO_ICON_OPTIONS } from '../BrandMark';

interface SystemSettingsViewProps {
  settings: SystemSettings;
  onSaveSettings: (next: SystemSettings, message?: string) => void;
  onErrorToast: (message: string) => void;
}

export function SystemSettingsView({
  settings,
  onSaveSettings,
  onErrorToast,
}: SystemSettingsViewProps) {
  const [form, setForm] = useState<SystemSettings>(settings);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const previewPalette = resolveThemePalette(form.themeColor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organizationName.trim()) {
      onErrorToast('Vui lòng nhập Tên doanh nghiệp / tổ chức.');
      return;
    }
    onSaveSettings({
      ...form,
      organizationName: form.organizationName.trim(),
      slogan: form.slogan.trim() || DEFAULT_SYSTEM_SETTINGS.slogan,
      taxCode: form.taxCode.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      legalRepresentative: form.legalRepresentative.trim(),
      legalRepresentativeTitle: form.legalRepresentativeTitle.trim(),
    });
  };

  const handleExportJson = () => {
    const jsonContent = serializeSystemSettingsJson(form);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const slug =
      form.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'oshrm';
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slug}-oshrm-config.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseSystemSettingsJson(text, DEFAULT_SYSTEM_SETTINGS);
      if (result.error || !result.settings) {
        onErrorToast(result.error ?? 'Tệp cấu hình không hợp lệ.');
        return;
      }
      setForm(result.settings);
      onSaveSettings(
        result.settings,
        `Đã nhập cấu hình hệ thống cho "${result.settings.organizationName}".`
      );
    } catch {
      onErrorToast('Không thể đọc tệp cấu hình đã chọn.');
    }
  };

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 512 * 1024) {
      onErrorToast('Ảnh logo tải lên không được vượt quá 512KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, customLogoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Open Source Config Export / Import Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Cấu hình White-label &amp; Sao lưu hệ thống
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Tùy chỉnh nhận diện thương hiệu doanh nghiệp trên toàn bộ giao diện, phiếu lương hoặc
            xuất/nhập tệp cấu hình (.JSON).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportJson}
            aria-label="Chọn tệp cấu hình JSON"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Nhập cấu hình (.JSON)</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Xuất cấu hình (.JSON)</span>
          </button>
        </div>
      </div>

      {/* Main 2-column Layout: Form + Live White-label Preview */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-8 rounded-xl border border-slate-200 bg-white p-6 space-y-6"
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Thông tin doanh nghiệp / tổ chức
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="setting-org-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Tên doanh nghiệp / tổ chức
                </label>
                <input
                  id="setting-org-name"
                  required
                  value={form.organizationName}
                  onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                  placeholder="VD: OSHRM hoặc Công ty Cổ phần ABC"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="setting-tax-code"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Mã số thuế (MST)
                </label>
                <input
                  id="setting-tax-code"
                  value={form.taxCode}
                  onChange={(e) => setForm({ ...form, taxCode: e.target.value })}
                  placeholder="0108998877"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="setting-slogan"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Slogan / Mô tả ngắn
                </label>
                <input
                  id="setting-slogan"
                  value={form.slogan}
                  onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                  placeholder="Open Source Human Resource Management"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="setting-phone"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Điện thoại doanh nghiệp
                </label>
                <input
                  id="setting-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="024 7300 8866"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="setting-legal-rep"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Người đại diện pháp luật
                </label>
                <input
                  id="setting-legal-rep"
                  value={form.legalRepresentative}
                  onChange={(e) => setForm({ ...form, legalRepresentative: e.target.value })}
                  placeholder="Nguyễn Minh Anh"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="setting-legal-rep-title"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Chức vụ người đại diện
                </label>
                <input
                  id="setting-legal-rep-title"
                  value={form.legalRepresentativeTitle}
                  onChange={(e) => setForm({ ...form, legalRepresentativeTitle: e.target.value })}
                  placeholder="Giám đốc Nhân sự"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="setting-address"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Địa chỉ trụ sở chính
              </label>
              <input
                id="setting-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Số nhà, Đường, Quận/Huyện, Tỉnh/Thành phố"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          {/* Theme Color Picker */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold text-slate-900">Màu chủ đạo (Theme Color)</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Áp dụng cho nút hành động chính, thanh điều hướng đang chọn, biểu đồ và tiêu đề phiếu
              lương.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {THEME_COLOR_PRESETS.map((preset) => {
                const isSelected = form.themeColor.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setForm({ ...form, themeColor: preset.hex })}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded border border-black/10 flex items-center justify-center text-white"
                      style={{ backgroundColor: preset.hex }}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate">{preset.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label htmlFor="setting-custom-color" className="text-xs font-medium text-slate-600">
                Hoặc chọn mã màu tùy chỉnh:
              </label>
              <input
                id="setting-custom-color"
                type="color"
                value={previewPalette.primary}
                onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                className="h-8 w-12 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
              />
              <input
                type="text"
                aria-label="Mã màu Hex"
                value={form.themeColor}
                onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                className="w-28 rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-xs uppercase focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          {/* Logo / Icon Selector */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold text-slate-900">Biểu tượng / Logo doanh nghiệp</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Chọn icon đại diện có sẵn hoặc tải lên ảnh logo riêng của công ty bạn.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {LOGO_ICON_OPTIONS.map(({ key, label, Icon }) => {
                const selected = form.logoIcon === key && !form.customLogoUrl;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, logoIcon: key as LogoIconKey, customLogoUrl: '' })
                    }
                    aria-label={`Chọn biểu tượng ${label}`}
                    className={`flex items-center justify-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                      selected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomLogoUpload}
                aria-label="Tải lên ảnh logo"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Tải ảnh logo riêng</span>
              </button>
              {form.customLogoUrl && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, customLogoUrl: '' })}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Gỡ ảnh logo, dùng lại icon</span>
                </button>
              )}
            </div>
          </div>

          {/* Form Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={() => {
                setForm(DEFAULT_SYSTEM_SETTINGS);
                onSaveSettings(DEFAULT_SYSTEM_SETTINGS, 'Đã khôi phục cấu hình mặc định OSHRM.');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Khôi phục mặc định OSHRM</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-on transition-colors hover:bg-brand-hover whitespace-nowrap"
            >
              <Save className="h-4 w-4" />
              <span>Lưu cấu hình</span>
            </button>
          </div>
        </form>

        {/* Live White-label Preview Column */}
        <aside className="xl:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="text-xs font-semibold text-slate-500">
              Xem trước nhận diện trực tiếp
            </div>

            {/* Sidebar & Login Preview */}
            <div className="rounded-lg bg-slate-900 p-4 text-white space-y-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg overflow-hidden"
                  style={
                    form.customLogoUrl
                      ? { backgroundColor: '#ffffff' }
                      : { backgroundColor: previewPalette.primary, color: previewPalette.onPrimary }
                  }
                >
                  {form.customLogoUrl ? (
                    <img
                      src={form.customLogoUrl}
                      alt={form.organizationName}
                      className="h-full w-full object-contain p-0.5"
                    />
                  ) : (
                    (() => {
                      const matched =
                        LOGO_ICON_OPTIONS.find((o) => o.key === form.logoIcon) ??
                        LOGO_ICON_OPTIONS[0];
                      const PreviewIcon = matched.Icon;
                      return <PreviewIcon className="h-4 w-4" />;
                    })()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">
                    {form.organizationName || 'OSHRM'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {form.slogan || 'Open Source Human Resource Management'}
                  </div>
                </div>
              </div>

              <div
                className="rounded-md px-3 py-2 text-xs font-medium"
                style={{
                  backgroundColor: previewPalette.primary,
                  color: previewPalette.onPrimary,
                }}
              >
                Mục menu đang chọn
              </div>
            </div>

            {/* Payslip Header Preview */}
            <div className="rounded-lg border border-slate-200 p-4 space-y-2">
              <div className="text-xs font-semibold" style={{ color: previewPalette.text }}>
                {form.organizationName || 'OSHRM'}
              </div>
              <div className="text-sm font-bold text-slate-900">Phiếu thanh toán tiền lương</div>
              <div className="text-xs text-slate-500 space-y-0.5">
                <div>MST: {form.taxCode || '—'} · ĐT: {form.phone || '—'}</div>
                <div>Đ/c: {form.address || '—'}</div>
                <div>
                  Đại diện: {form.legalRepresentative || '—'} ({form.legalRepresentativeTitle || '—'})
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
