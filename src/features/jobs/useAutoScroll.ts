import { useEffect, useRef } from 'react';

/** Keeps a scrollable element pinned to its bottom as `contentLength` grows — unless the reader
 * has scrolled up to look at something earlier. */
export function useAutoScroll<T extends HTMLElement>(contentLength: number) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) el.scrollTop = el.scrollHeight;
  }, [contentLength]);
  return ref;
}
