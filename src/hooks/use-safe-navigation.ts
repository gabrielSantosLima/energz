import { router, usePathname, type Href } from 'expo-router';
import { useCallback, useRef } from 'react';

const DUPLICATE_WINDOW_MS = 800;

function hrefKey(href: Href): string {
  if (typeof href === 'string') {
    return href;
  }
  return `${href.pathname}?${JSON.stringify(href.params ?? {})}`;
}

function hrefPath(href: Href): string {
  const key = typeof href === 'string' ? href : href.pathname;
  return key.split('?')[0];
}

export function useSafeNavigation(): (href: Href) => void {
  const pathname = usePathname();
  const lastNavigation = useRef<{ key: string; at: number } | null>(null);

  return useCallback(
    (href: Href) => {
      if (pathname === hrefPath(href)) {
        return;
      }

      const key = hrefKey(href);
      const now = Date.now();
      const last = lastNavigation.current;
      if (last && last.key === key && now - last.at < DUPLICATE_WINDOW_MS) {
        return;
      }

      lastNavigation.current = { key, at: now };
      router.push(href);
    },
    [pathname],
  );
}
