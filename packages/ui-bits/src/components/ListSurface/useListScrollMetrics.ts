import React from "react";

export interface UseListScrollMetricsOptions {
  minThumbHeight?: number;
  scrollingResetDelayMs?: number;
}

type ScrollMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

const DEFAULT_MIN_THUMB_HEIGHT = 12;
const DEFAULT_SCROLLING_RESET_DELAY_MS = 650;

export function useListScrollMetrics(options: UseListScrollMetricsOptions = {}) {
  const {
    minThumbHeight = DEFAULT_MIN_THUMB_HEIGHT,
    scrollingResetDelayMs = DEFAULT_SCROLLING_RESET_DELAY_MS,
  } = options;

  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollMetrics, setScrollMetrics] = React.useState<ScrollMetrics>(() => ({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  }));
  const [isScrolling, setIsScrolling] = React.useState(false);
  const scrollTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateScrollMetrics = React.useCallback(() => {
    const node = listRef.current;
    if (!node) return;
    const next = {
      scrollTop: node.scrollTop,
      scrollHeight: node.scrollHeight,
      clientHeight: node.clientHeight,
    };
    setScrollMetrics((prev) => {
      if (
        prev.scrollTop === next.scrollTop
        && prev.scrollHeight === next.scrollHeight
        && prev.clientHeight === next.clientHeight
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const handleScroll = React.useCallback(() => {
    updateScrollMetrics();
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      scrollTimeoutRef.current = null;
    }, scrollingResetDelayMs);
  }, [scrollingResetDelayMs, updateScrollMetrics]);

  React.useLayoutEffect(() => {
    updateScrollMetrics();
  });

  React.useEffect(() => {
    const node = listRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => updateScrollMetrics());
    observer.observe(node);
    return () => observer.disconnect();
  }, [updateScrollMetrics]);

  React.useEffect(() => (
    () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    }
  ), []);

  const hasOverflow = scrollMetrics.scrollHeight - scrollMetrics.clientHeight > 1;
  const thumbHeight = hasOverflow
    ? Math.max(
      minThumbHeight,
      Math.round(scrollMetrics.clientHeight * (scrollMetrics.clientHeight / scrollMetrics.scrollHeight)),
    )
    : 0;
  const maxThumbTop = Math.max(0, scrollMetrics.clientHeight - thumbHeight);
  const thumbTop = hasOverflow && scrollMetrics.scrollHeight > scrollMetrics.clientHeight
    ? Math.round((scrollMetrics.scrollTop / (scrollMetrics.scrollHeight - scrollMetrics.clientHeight)) * maxThumbTop)
    : 0;

  return {
    listRef,
    handleScroll,
    updateScrollMetrics,
    scrollMetrics,
    isScrolling,
    hasOverflow,
    thumbHeight,
    thumbTop,
  };
}
