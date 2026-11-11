import { useId } from 'react';

/**
 * Generates a collision-safe SVG `<defs>` identifier scoped to the current React component instance.
 * Sanitizes React 19 `useId()` delimiters (such as `«r0»` or `:r0:`) into valid XML/CSS ID characters
 * so `url(#id)` references resolve reliably across multi-instance dashboard windows and SSR static markup.
 */
export function useSafeSvgId(prefix?: string): string {
  const rawId = useId();
  const sanitized = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return prefix ? `${prefix}-${sanitized}` : sanitized;
}
