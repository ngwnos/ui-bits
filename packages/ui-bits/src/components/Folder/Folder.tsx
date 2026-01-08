import React from "react";
import { AnimationSuspensionProvider } from "../../animationSuspension";
import IconButton from "../IconButton";

export type FolderBorderStyle = "a" | "b" | "none";

export interface FolderProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  colorA?: string;
  colorB?: string;
  borderStyle?: FolderBorderStyle;
  fontSize?: number;
  padding?: number | string;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  keepMounted?: boolean;
  suspended?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

const FALLBACK_COLOR_A = "#2f2f2f";
const FALLBACK_COLOR_B = "#f0f0f0";
const SLIDER_LINE_HEIGHT = 1;
const SLIDER_PAD_Y_EM = 0.35;
const SLIDER_BORDER_WIDTH = 1;

function resolveSize(value?: number | string): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

function computeHeaderHeight(fontSize: number) {
  const contentHeight = fontSize * (SLIDER_LINE_HEIGHT + SLIDER_PAD_Y_EM * 2);
  return Math.round(contentHeight + SLIDER_BORDER_WIDTH * 2);
}

const Folder = React.forwardRef<HTMLDivElement, FolderProps>((props, ref) => {
  const {
    label,
    colorA = FALLBACK_COLOR_A,
    colorB = FALLBACK_COLOR_B,
    borderStyle = "a",
    fontSize = 12,
    padding = 0,
    collapsed,
    defaultCollapsed = false,
    keepMounted = true,
    suspended,
    onCollapseChange,
    style,
    className,
    children,
    ...rest
  } = props;
  const isControlled = collapsed !== undefined;
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const isCollapsed = isControlled ? collapsed : internalCollapsed;
  const resolvedPadding = resolveSize(padding) ?? "0px";
  const resolvedBorderColor = borderStyle === "a"
    ? colorA
    : borderStyle === "b"
      ? colorB
      : "transparent";
  const headerBackground = isCollapsed ? colorB : colorA;
  const headerTextColor = isCollapsed ? colorA : colorB;
  const headerHeight = computeHeaderHeight(fontSize);
  const headerBorderWidth = 1;
  const headerOuterHeight = headerHeight + headerBorderWidth;
  const bodyGap = Math.max(6, Math.round(fontSize * 0.4));
  const bodyPaddingY = `${bodyGap}px`;
  const renderBody = !isCollapsed || keepMounted;
  const suspendChildren = Boolean(suspended || (keepMounted && isCollapsed));
  const toggleValue = isCollapsed ? "collapsed" : "expanded";
  const toggleOptions = [
    { value: "collapsed", ariaLabel: "Expand section", title: "Expand section" },
    { value: "expanded", ariaLabel: "Collapse section", title: "Collapse section" },
  ];

  const commitCollapse = (next: boolean) => {
    if (!isControlled) {
      setInternalCollapsed(next);
    }
    onCollapseChange?.(next);
  };
  const handleToggle = (nextValue: string) => {
    const next = nextValue === "collapsed";
    commitCollapse(next);
  };
  const handleHeaderClick = () => {
    commitCollapse(!isCollapsed);
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        borderTop: `1px solid ${resolvedBorderColor}`,
        borderBottom: "none",
        borderLeft: "none",
        borderRight: "none",
        borderRadius: 3,
        overflow: "hidden",
        ...(style ?? {}),
      }}
      {...rest}
    >
      <div
        style={{
          minHeight: headerOuterHeight,
          height: headerOuterHeight,
          display: "grid",
          gridTemplateColumns: `${headerHeight}px 1fr ${headerHeight}px`,
          alignItems: "center",
          padding: `0 ${resolvedPadding}`,
          borderBottom: `1px solid ${resolvedBorderColor}`,
          background: headerBackground,
          color: headerTextColor,
          boxSizing: "border-box",
          fontSize,
          fontWeight: 600,
          lineHeight: 1,
          cursor: "pointer",
          transition: "background 120ms ease, color 120ms ease",
        }}
        onClick={handleHeaderClick}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
          <IconButton
            behavior="cycle"
            value={toggleValue}
            options={toggleOptions}
            onChange={(value) => handleToggle(value)}
            borderStyle="none"
            fontSize={fontSize}
            colorA={headerTextColor}
            colorB={headerBackground}
            aria-label={toggleOptions[isCollapsed ? 0 : 1]?.ariaLabel}
            title={toggleOptions[isCollapsed ? 0 : 1]?.title}
            onClick={(event) => event.stopPropagation()}
          >
            {isCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
              </svg>
            )}
          </IconButton>
        </div>
        <span style={{ textAlign: "center" }}>{label}</span>
        <div />
      </div>
      {renderBody && (
        <div
          style={{
            paddingLeft: resolveSize(padding),
            paddingRight: resolveSize(padding),
            paddingTop: bodyPaddingY,
            paddingBottom: 0,
            display: isCollapsed ? "none" : "flex",
            flexDirection: "column",
            gap: bodyGap,
            background: headerTextColor,
          }}
          aria-hidden={isCollapsed}
        >
          <AnimationSuspensionProvider suspended={suspendChildren}>
            {children}
          </AnimationSuspensionProvider>
        </div>
      )}
    </div>
  );
});

Folder.displayName = "Folder";

export default Folder;
