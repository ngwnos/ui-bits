import React from "react";
import DropdownBase from "./DropdownBase";
import { useResolvedControlId } from "../../controlStore";
import { type DropdownOption } from "./types";

export interface DropdownProps {
  label: string;
  labelInline?: boolean;
  overlayMenu?: boolean;
  options: DropdownOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string, option: DropdownOption) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  colorA?: string;
  colorB?: string;
  borderStyle?: "a" | "b" | "none";
  borderMask?: Partial<Record<"top" | "right" | "bottom" | "left", boolean>>;
  borderRadius?: number;
  width?: number | string;
  fontSize?: number;
  compact?: boolean;
  disabled?: boolean;
  controlId?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Dropdown({
  label,
  labelInline,
  overlayMenu = true,
  options,
  value,
  defaultValue,
  placeholder = "Select an option",
  onChange,
  open,
  defaultOpen = false,
  onOpenChange,
  colorA,
  colorB,
  borderStyle,
  borderMask,
  borderRadius,
  width,
  fontSize,
  compact,
  disabled = false,
  controlId,
  className,
  style,
}: DropdownProps) {
  const resolvedControlId = useResolvedControlId(controlId, label);

  return (
    <DropdownBase
      label={label}
      labelInline={labelInline}
      overlayMenu={overlayMenu}
      options={options}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={onChange}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      colorA={colorA}
      colorB={colorB}
      borderStyle={borderStyle}
      borderMask={borderMask}
      borderRadius={borderRadius}
      width={width}
      fontSize={fontSize}
      compact={compact}
      disabled={disabled}
      controlId={resolvedControlId}
      className={className}
      style={style}
      renderTrigger={({ 
        id,
        open: resolvedOpen,
        disabled: triggerDisabled,
        buttonRef,
        displayLabel,
        showPlaceholder,
        onTriggerClick,
        onTriggerKeyDown,
        ariaLabelledBy,
        ariaControls,
      }) => (
        <button
          ref={buttonRef}
          id={id}
          type="button"
          className="dropdown-trigger"
          aria-haspopup="listbox"
          aria-expanded={resolvedOpen}
          aria-labelledby={ariaLabelledBy}
          aria-controls={ariaControls}
          onClick={onTriggerClick}
          onKeyDown={onTriggerKeyDown}
          disabled={triggerDisabled}
          data-open={resolvedOpen ? "true" : "false"}
        >
          <span className={`dropdown-value${showPlaceholder ? " dropdown-placeholder" : ""}`}>
            {displayLabel}
          </span>
          <span className="dropdown-caret" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      )}
    />
  );
}
