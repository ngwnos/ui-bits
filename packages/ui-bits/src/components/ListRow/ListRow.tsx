import React from "react";
import "./list-row.css";

export interface ListRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  active?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
}

const ListRow = React.forwardRef<HTMLDivElement, ListRowProps>((props, ref) => {
  const {
    active = false,
    disabled = false,
    onSelect,
    selectable = true,
    className,
    tabIndex,
    role,
    onClick,
    onKeyDown,
    ...rest
  } = props;

  const resolvedTabIndex = selectable ? (tabIndex ?? (disabled ? -1 : 0)) : tabIndex;
  const resolvedRole = role ?? (selectable ? "listitem" : undefined);

  const handleClick: React.MouseEventHandler<HTMLDivElement> = React.useCallback((event) => {
    onClick?.(event);
    if (event.defaultPrevented || disabled || !selectable) return;
    onSelect?.();
  }, [disabled, onClick, onSelect, selectable]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = React.useCallback((event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled || !selectable || !onSelect) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect();
  }, [disabled, onKeyDown, onSelect, selectable]);

  return (
    <div
      ref={ref}
      className={[
        "ui-bits-list-row",
        selectable ? "ui-bits-list-row--selectable" : "",
        active ? "ui-bits-list-row--active" : "",
        className,
      ].filter(Boolean).join(" ")}
      role={resolvedRole}
      tabIndex={resolvedTabIndex}
      aria-disabled={disabled || undefined}
      aria-current={active ? "true" : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...rest}
    />
  );
});

ListRow.displayName = "ListRow";

export default ListRow;
