import React from "react";
export type FolderBorderStyle = "a" | "b" | "none";
export interface FolderProps extends React.HTMLAttributes<HTMLDivElement> {
    label: React.ReactNode;
    colorA?: string;
    colorB?: string;
    borderStyle?: FolderBorderStyle;
    fontSize?: number;
    headerHeight?: number;
    padding?: number | string;
    verticalGap?: number;
    inheritPanelSurface?: boolean;
    transparent?: boolean;
    showBody?: boolean;
    collapsed?: boolean;
    defaultCollapsed?: boolean;
    keepMounted?: boolean;
    suspended?: boolean;
    onCollapseChange?: (collapsed: boolean) => void;
}
declare const Folder: React.ForwardRefExoticComponent<FolderProps & React.RefAttributes<HTMLDivElement>>;
export default Folder;
