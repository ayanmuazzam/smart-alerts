import React from 'react';

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export type MonoIconTone =
  | 'blue'
  | 'indigo'
  | 'green'
  | 'emerald'
  | 'amber'
  | 'orange'
  | 'rose'
  | 'slate'
  | 'violet'
  | 'cyan';

const TONES: Record<
  MonoIconTone,
  { background: string; shadow: string }
> = {
  blue: {
    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    shadow: '0 4px 10px rgba(59, 130, 246, 0.28)',
  },
  indigo: {
    background: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
    shadow: '0 4px 10px rgba(99, 102, 241, 0.28)',
  },
  green: {
    background: 'linear-gradient(135deg, #22C55E 0%, #15803D 100%)',
    shadow: '0 4px 10px rgba(34, 197, 94, 0.28)',
  },
  emerald: {
    background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    shadow: '0 4px 10px rgba(16, 185, 129, 0.28)',
  },
  amber: {
    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    shadow: '0 4px 10px rgba(245, 158, 11, 0.28)',
  },
  orange: {
    background: 'linear-gradient(135deg, #F97316 0%, #C2410C 100%)',
    shadow: '0 4px 10px rgba(249, 115, 22, 0.28)',
  },
  rose: {
    background: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
    shadow: '0 4px 10px rgba(244, 63, 94, 0.28)',
  },
  slate: {
    background: 'linear-gradient(135deg, #64748B 0%, #334155 100%)',
    shadow: '0 4px 10px rgba(51, 65, 85, 0.28)',
  },
  violet: {
    background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    shadow: '0 4px 10px rgba(139, 92, 246, 0.28)',
  },
  cyan: {
    background: 'linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)',
    shadow: '0 4px 10px rgba(6, 182, 212, 0.28)',
  },
};

export type MonoIconBadgeProps = {
  children: React.ReactNode;
  tone?: MonoIconTone;
  size?: number;
  radius?: number;
  muted?: boolean;
  title?: string;
};

/**
 * Minimalist monochromatic icon tile: solid/gradient background + white glyph.
 * Use for section headers, KPI cards, and list row avatars across the dashboard.
 */
export function MonoIconBadge({
  children,
  tone = 'blue',
  size = 40,
  radius = 10,
  muted = false,
  title,
}: MonoIconBadgeProps) {
  const t = TONES[tone] || TONES.blue;
  return (
    <div
      title={title}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: t.background,
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: muted ? 'none' : t.shadow,
        flexShrink: 0,
        opacity: muted ? 0.65 : 1,
        fontFamily: FONT_SANS,
      }}
    >
      {children}
    </div>
  );
}

/** Inline monochrome icon color for buttons / text (not tiled). */
export const MONO_ICON = {
  onDark: '#FFFFFF',
  onLight: '#0F172A',
  muted: '#64748B',
  accent: '#1D4ED8',
} as const;
