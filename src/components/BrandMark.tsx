import React, { useEffect, useState } from 'react';
import {
  Award,
  Briefcase,
  Building2,
  Compass,
  Cpu,
  Globe,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import type { LogoIconKey, SystemSettings } from '../types/hrm';

export const LOGO_ICON_OPTIONS: Array<{
  key: LogoIconKey;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'building', label: 'Tòa nhà', Icon: Building2 },
  { key: 'layers', label: 'Nền tảng', Icon: Layers },
  { key: 'shield', label: 'Bảo mật', Icon: ShieldCheck },
  { key: 'globe', label: 'Toàn cầu', Icon: Globe },
  { key: 'cpu', label: 'Công nghệ', Icon: Cpu },
  { key: 'briefcase', label: 'Doanh nghiệp', Icon: Briefcase },
  { key: 'compass', label: 'Định hướng', Icon: Compass },
  { key: 'award', label: 'Thương hiệu', Icon: Award },
];

interface BrandMarkProps {
  settings: Pick<SystemSettings, 'organizationName' | 'logoIcon' | 'customLogoUrl'>;
  size?: 'sm' | 'md' | 'lg';
}

export function BrandMark({ settings, size = 'md' }: BrandMarkProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [settings.customLogoUrl]);

  const sizeClass =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const iconClass =
    size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  const matched =
    LOGO_ICON_OPTIONS.find((opt) => opt.key === settings.logoIcon) ?? LOGO_ICON_OPTIONS[0];
  const Icon = matched.Icon;

  if (settings.customLogoUrl && !imgFailed) {
    return (
      <div
        className={`${sizeClass} shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white flex items-center justify-center`}
      >
        <img
          src={settings.customLogoUrl}
          alt={settings.organizationName}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-contain p-0.5"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} shrink-0 flex items-center justify-center rounded-lg bg-brand text-brand-on transition-colors`}
    >
      <Icon className={iconClass} />
    </div>
  );
}
