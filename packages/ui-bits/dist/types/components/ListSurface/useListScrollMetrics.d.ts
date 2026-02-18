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
export declare function useListScrollMetrics(options?: UseListScrollMetricsOptions): {
    listRef: React.RefObject<HTMLDivElement | null>;
    handleScroll: () => void;
    updateScrollMetrics: () => void;
    scrollMetrics: ScrollMetrics;
    isScrolling: boolean;
    hasOverflow: boolean;
    thumbHeight: number;
    thumbTop: number;
};
export {};
