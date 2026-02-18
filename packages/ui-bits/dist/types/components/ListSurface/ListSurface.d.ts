import React from "react";
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
declare const ListSurface: React.ForwardRefExoticComponent<ListSurfaceProps & React.RefAttributes<HTMLDivElement>>;
export default ListSurface;
