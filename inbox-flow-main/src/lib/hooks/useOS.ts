import { useMemo } from 'react';

export function useOS() {
  return useMemo(() => {
    const ua = navigator.userAgent;
    if (/Mac|iPhone|iPad|iPod/.test(ua)) return 'mac' as const;
    return 'windows' as const;
  }, []);
}

/** Returns the correct modifier key label for the user's OS */
export function useModKey() {
  const os = useOS();
  return os === 'mac' ? '⌘' : 'Ctrl';
}
