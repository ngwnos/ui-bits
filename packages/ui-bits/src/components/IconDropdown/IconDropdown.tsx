import React from "react";
import { useResolvedControlId } from "../../controlStore";
import { usePanelTheme } from "../../panelGap";
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
  iconUsesOptionColors?: boolean;
  preventFocusOnPointerDown?: boolean;
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
  controlId?: string;
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
  iconUsesOptionColors = true,
  preventFocusOnPointerDown = false,
  onChange,
  open,
  defaultOpen,
  onOpenChange,
  colorA,
  colorB,
  borderStyle,
  borderMask,
  borderRadius,
  width,
  fontSize,
  disabled = false,
  controlId,
  className,
  style,
}: IconDropdownProps) {
  const panelTheme = usePanelTheme();
  const resolvedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const resolvedColorA = colorA ?? panelTheme?.colorA;
  const resolvedColorB = colorB ?? panelTheme?.colorB;
  const resolvedBorderStyle = borderStyle ?? panelTheme?.borderStyle ?? "a";
  const resolvedAriaLabel = ariaLabel ?? label;
  const resolvedControlId = useResolvedControlId(controlId, label, resolvedAriaLabel);
  const rootClassName = ["dropdown-root--icon", className].filter(Boolean).join(" ");
  const pointerDownRef = React.useRef(false);
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
      colorA={resolvedColorA}
      colorB={resolvedColorB}
      borderStyle={resolvedBorderStyle}
      borderMask={borderMask}
      borderRadius={borderRadius}
      width={width}
      fontSize={fontSize}
      showOptionIcons={showMenuIcons}
      returnFocusOnSelect={!preventFocusOnPointerDown}
      disabled={disabled}
      controlId={resolvedControlId}
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
        const triggerColorA = iconUsesOptionColors
          ? (resolvedOption?.colorA ?? resolvedColorA)
          : resolvedColorA;
        const triggerColorB = iconUsesOptionColors
          ? (resolvedOption?.colorB ?? resolvedColorB)
          : resolvedColorB;
        const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
          if (preventFocusOnPointerDown) {
            pointerDownRef.current = true;
            event.preventDefault();
          }
        };
        const handleClick = () => {
          onTriggerClick();
          if (preventFocusOnPointerDown && pointerDownRef.current) {
            pointerDownRef.current = false;
            requestAnimationFrame(() => buttonRef.current?.blur());
          }
        };
        return (
          <IconButton
            ref={buttonRef}
            behavior="toggle"
            toggled={resolvedOpen}
            onClick={handleClick}
            onKeyDown={onTriggerKeyDown}
            onPointerDown={handlePointerDown}
            aria-haspopup="listbox"
            aria-expanded={resolvedOpen}
            aria-controls={ariaControls}
            aria-labelledby={ariaLabelledBy}
            aria-label={triggerAriaLabel}
            fontSize={resolvedFontSize}
            colorA={triggerColorA}
            colorB={triggerColorB}
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
