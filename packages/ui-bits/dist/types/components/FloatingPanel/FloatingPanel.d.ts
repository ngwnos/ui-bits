import React from "react";
import "./floating-panel.css";
export type FloatingPanelBorderStyle = "a" | "b" | "none";
export interface FloatingPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    header?: React.ReactNode;
    headerControls?: React.ReactNode;
    title?: React.ReactNode;
    collapsible?: boolean;
    showDockButton?: boolean;
    dockOnMount?: boolean;
    colorA?: string;
    colorB?: string;
    borderStyle?: FloatingPanelBorderStyle;
    transparent?: boolean;
    bodyBlur?: number;
    bodyOpacity?: number;
    defaultBodyOpacity?: number;
    onBodyOpacityChange?: (opacity: number) => void;
    showOpacityControl?: boolean;
    verticalGap?: number;
    collapsed?: boolean;
    defaultCollapsed?: boolean;
    keepMounted?: boolean;
    suspended?: boolean;
    draggable?: boolean;
    position?: {
        x: number;
        y: number;
    };
    onPositionChange?: (position: {
        x: number;
        y: number;
    }) => void;
    defaultPosition?: {
        x: number;
        y: number;
    };
    constrainBodyToViewport?: boolean;
    viewportMargin?: number;
    onCollapseChange?: (collapsed: boolean) => void;
    width?: number | string;
    padding?: number | string;
    paddingLeft?: number | string;
    paddingRight?: number | string;
    paddingBottom?: number | string;
    radius?: number;
    shadow?: string;
    fontSize?: number;
}
declare const FloatingPanel: React.ForwardRefExoticComponent<FloatingPanelProps & React.RefAttributes<HTMLDivElement>>;
export default FloatingPanel;
