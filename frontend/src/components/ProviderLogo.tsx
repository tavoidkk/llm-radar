'use client';

import { useState } from 'react';
import { PROVIDER_BRAND_COLOR, normalizeProvider, providerLogoPath } from '@/lib/logos';

export interface ProviderLogoProps {
  provider: string;
  name?: string;
  size?: number;
}

export function ProviderLogo({ provider, name, size = 20 }: ProviderLogoProps): JSX.Element {
  const [failed, setFailed] = useState(false);
  const key = normalizeProvider(provider);

  if (!failed) {
    return (
      <img
        src={providerLogoPath(provider)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className="shrink-0"
      />
    );
  }

  const color = PROVIDER_BRAND_COLOR[key] ?? '#4b5563';
  const label = (name ?? provider).trim().replace(/^[^A-Za-z0-9]+/, '');
  const initial = label.charAt(0).toUpperCase() || '?';

  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded font-bold text-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.45 }}
    >
      {initial}
    </span>
  );
}
