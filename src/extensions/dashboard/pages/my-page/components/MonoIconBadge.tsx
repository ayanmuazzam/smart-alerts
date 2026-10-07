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

/**
 * Pastel squircle + monoline stroke icon.
 * Style: outlined / stroke-based line art on soft badge — no filled tiles, no 3D, no heavy shadows.
 */
const TONES: Record<
  MonoIconTone,
  { background: string; color: string; border: string }
> = {
  blue: { background: '#EFF6FF', color: '#2563EB', border: '#DBEAFE' },
  indigo: { background: '#EEF2FF', color: '#4F46E5', border: '#E0E7FF' },
  green: { background: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  emerald: { background: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  amber: { background: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  orange: { background: '#FFF7ED', color: '#EA580C', border: '#FED7AA' },
  rose: { background: '#FFF1F2', color: '#E11D48', border: '#FECDD3' },
  slate: { background: '#F8FAFC', color: '#475569', border: '#E2E8F0' },
  violet: { background: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  cyan: { background: '#ECFEFF', color: '#0891B2', border: '#A5F3FC' },
};

export type MonoIconBadgeProps = {
  children: React.ReactNode;
  tone?: MonoIconTone;
  size?: number;
  /** Squircle radius; defaults to ~28% of size for soft rounded-square look. */
  radius?: number;
  muted?: boolean;
  title?: string;
};

/**
 * Soft pastel squircle container for outlined / monoline Wix icons.
 * Icons inherit `currentColor` (stroke tone). Prefer @wix/wix-ui-icons-common line icons.
 */
export function MonoIconBadge({
  children,
  tone = 'blue',
  size = 40,
  radius,
  muted = false,
  title,
}: MonoIconBadgeProps) {
  const t = TONES[tone] || TONES.blue;
  const squircleRadius = radius ?? Math.round(size * 0.28);
  return (
    <div
      title={title}
      style={{
        width: size,
        height: size,
        borderRadius: squircleRadius,
        background: t.background,
        color: t.color,
        border: `1px solid ${t.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'none',
        flexShrink: 0,
        opacity: muted ? 0.55 : 1,
        fontFamily: FONT_SANS,
        // Encourage stroke-like rendering of vector icons
        lineHeight: 0,
      }}
    >
      {children}
    </div>
  );
}

/** Stroke / monoline icon colors for buttons and text (not tiled). */
export const MONO_ICON = {
  onDark: '#FFFFFF',
  onLight: '#334155',
  muted: '#64748B',
  accent: '#2563EB',
  stroke: '#334155',
} as const;

export const MONO_ICON_TONES = TONES;
