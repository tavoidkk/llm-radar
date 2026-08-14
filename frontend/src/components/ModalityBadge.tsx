'use client';

import type { LucideIcon } from 'lucide-react';
import { Type, Image, Mic, Video, FileText } from '@/components/Icons';

const MODALITY_MAP: Record<string, { icon: LucideIcon; label: string }> = {
  text: { icon: Type, label: 'Text' },
  image: { icon: Image, label: 'Image' },
  audio: { icon: Mic, label: 'Audio' },
  video: { icon: Video, label: 'Video' },
  file: { icon: FileText, label: 'File' },
  document: { icon: FileText, label: 'Document' },
  code: { icon: FileText, label: 'Code' },
};

export function ModalityBadge({ kind }: { kind: string }): JSX.Element {
  const key = kind.trim().toLowerCase();
  const entry = MODALITY_MAP[key] ?? { icon: FileText, label: kind.trim() || 'Unknown' };
  const Icon = entry.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-ink/15 bg-bg px-1.5 py-0.5 text-[11px] font-medium text-ink/80">
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {entry.label}
    </span>
  );
}