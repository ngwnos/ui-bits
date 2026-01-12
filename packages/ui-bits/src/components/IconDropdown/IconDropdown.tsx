import React from "react";
import IconButton from "../IconButton";
import DropdownBase from "../Dropdown/DropdownBase";
import { type DropdownOption } from "../Dropdown/types";

export interface IconDropdownOption extends DropdownOption {
  icon?: React.ReactElement;
}

export interface IconDropdownProps {
  label?: string;
  showLabel?: boolean;
  ariaLabel?: string;
  options: IconDropdownOption[];
  value?: string;
  defaultValue?: string;
  icon?: React.ReactElement;
  showMenuIcons?: boolean;
  onChange?: (value: string, option: IconDropdownOption) => void;
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
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function IconDropdown({
  label,
  showLabel = false,
  ariaLabel,
  options,
  value,
  defaultValue,
  icon,
  showMenuIcons = false,
  onChange,
  open,
  defaultOpen,
  onOpenChange,
  colorA,
  colorB,
  borderStyle = "a",
  borderMask,
  borderRadius,
  width,
  fontSize,
  disabled = false,
  className,
  style,
}: IconDropdownProps) {
  const resolvedFontSize = fontSize ?? 12;
  const resolvedAriaLabel = ariaLabel ?? label;
  const rootClassName = ["dropdown-root--icon", className].filter(Boolean).join(" ");
  const menuWidth = React.useMemo(() => {
    if (!options.length) return undefined;
    const maxLabel = options.reduce((current, option) => (
      option.label.length > current.length ? option.label : current
    ), "");
    if (typeof document === "undefined") {
      const iconWidth = showMenuIcons ? (resolvedFontSize * (1 + 0.35 * 2) + 2) : 0;
      const iconGap = showMenuIcons ? resolvedFontSize * 0.4 : 0;
      return `calc(${maxLabel.length}ch + ${Math.max(2, Math.round(resolvedFontSize * 0.6))}em + ${Math.round(iconWidth + iconGap)}px)`;
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      const iconWidth = showMenuIcons ? (resolvedFontSize * (1 + 0.35 * 2) + 2) : 0;
      const iconGap = showMenuIcons ? resolvedFontSize * 0.4 : 0;
      return `calc(${maxLabel.length}ch + ${Math.max(2, Math.round(resolvedFontSize * 0.6))}em + ${Math.round(iconWidth + iconGap)}px)`;
    }
    context.font = `600 ${resolvedFontSize}px 'IBM Plex Mono', monospace`;
    const maxTextWidth = options.reduce((max, option) => (
      Math.max(max, context.measureText(option.label).width)
    ), 0);
    const horizontalPadding = resolvedFontSize * 2;
    const iconWidth = showMenuIcons ? (resolvedFontSize * (1 + 0.35 * 2) + 2) : 0;
    const iconGap = showMenuIcons ? resolvedFontSize * 0.4 : 0;
    return `${Math.ceil(maxTextWidth + horizontalPadding + iconWidth + iconGap)}px`;
  }, [options, resolvedFontSize, showMenuIcons]);
  const rootStyle: React.CSSProperties = {
    width: width == null ? "fit-content" : undefined,
    "--dropdown-menu-width": menuWidth,
    ...style,
  } as React.CSSProperties;

  return (
    <DropdownBase
      label={label}
      showLabel={showLabel}
      ariaLabel={resolvedAriaLabel}
      options={options}
      value={value}
      defaultValue={defaultValue}
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
      showOptionIcons={showMenuIcons}
      disabled={disabled}
      className={rootClassName}
      style={rootStyle}
      renderTrigger={({
        open: resolvedOpen,
        disabled: triggerDisabled,
        buttonRef,
        activeOption,
        onTriggerClick,
        onTriggerKeyDown,
        ariaLabelledBy,
        ariaLabel: triggerAriaLabel,
        ariaControls,
      }) => {
        const resolvedOption = activeOption as IconDropdownOption | undefined;
        const triggerIcon = resolvedOption?.icon ?? icon;
        return (
          <IconButton
            ref={buttonRef}
            behavior="toggle"
            toggled={resolvedOpen}
            onClick={onTriggerClick}
            onKeyDown={onTriggerKeyDown}
            aria-haspopup="listbox"
            aria-expanded={resolvedOpen}
            aria-controls={ariaControls}
            aria-labelledby={ariaLabelledBy}
            aria-label={triggerAriaLabel}
            fontSize={resolvedFontSize}
            colorA={colorA}
            colorB={colorB}
            borderStyle="none"
            disabled={triggerDisabled}
          >
            {triggerIcon}
          </IconButton>
        );
      }}
    />
  );
}
