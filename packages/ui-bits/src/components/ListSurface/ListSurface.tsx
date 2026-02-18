import React from "react";
import { useListScrollMetrics } from "./useListScrollMetrics";
import "./list-surface.css";

export interface ListSurfaceProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  children?: React.ReactNode;
  isEmpty?: boolean;
  emptyState?: React.ReactNode;
  columns?: number;
  listClassName?: string;
  listStyle?: React.CSSProperties;
  listRole?: React.AriaRole;
  onListScroll?: React.UIEventHandler<HTMLDivElement>;
  listRef?: React.Ref<HTMLDivElement>;
  minThumbHeight?: number;
  scrollingResetDelayMs?: number;
  showScrollbar?: boolean;
}

function setRefValue<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  (ref as React.MutableRefObject<T | null>).current = value;
}

const ListSurface = React.forwardRef<HTMLDivElement, ListSurfaceProps>((props, ref) => {
  const {
    children,
    isEmpty = false,
    emptyState = null,
    columns,
    listClassName,
    listStyle,
    listRole = "list",
    onListScroll,
    listRef: externalListRef,
    minThumbHeight,
    scrollingResetDelayMs,
    showScrollbar = true,
    className,
    style,
    ...rest
  } = props;

  const {
    listRef,
    handleScroll,
    hasOverflow,
    thumbHeight,
    thumbTop,
    isScrolling,
  } = useListScrollMetrics({
    minThumbHeight,
    scrollingResetDelayMs,
  });

  const handleListRef = React.useCallback((node: HTMLDivElement | null) => {
    listRef.current = node;
    setRefValue(externalListRef, node);
  }, [externalListRef, listRef]);

  const handleListScroll: React.UIEventHandler<HTMLDivElement> = React.useCallback((event) => {
    onListScroll?.(event);
    handleScroll();
  }, [handleScroll, onListScroll]);

  const resolvedColumns = Number.isFinite(columns) && columns && columns > 0
    ? Math.floor(columns)
    : undefined;

  const resolvedListStyle = React.useMemo(() => {
    if (resolvedColumns === undefined) {
      return listStyle;
    }
    return {
      "--ui-bits-list-columns": resolvedColumns,
      ...(listStyle ?? {}),
    } as React.CSSProperties;
  }, [listStyle, resolvedColumns]);

  return (
    <div
      ref={ref}
      className={["ui-bits-list-surface", className].filter(Boolean).join(" ")}
      style={style}
      {...rest}
    >
      <div
        className={[
          "ui-bits-list-surface__wrap",
          isScrolling ? "ui-bits-list-surface__wrap--scrolling" : "",
        ].filter(Boolean).join(" ")}
      >
        <div
          ref={handleListRef}
          className={["ui-bits-list-surface__list", listClassName].filter(Boolean).join(" ")}
          style={resolvedListStyle}
          role={listRole}
          onScroll={handleListScroll}
        >
          {isEmpty ? (
            <div className="ui-bits-list-surface__empty">{emptyState}</div>
          ) : children}
        </div>
        {showScrollbar && hasOverflow ? (
          <div className="ui-bits-list-surface__scrollbar" aria-hidden="true">
            <div
              className="ui-bits-list-surface__scrollbar-thumb"
              style={{ height: `${thumbHeight}px`, transform: `translateY(${thumbTop}px)` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
});

ListSurface.displayName = "ListSurface";

export default ListSurface;
