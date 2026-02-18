import React from "react";
import "./list-row.css";
export interface ListRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
    active?: boolean;
    disabled?: boolean;
    onSelect?: () => void;
    selectable?: boolean;
}
declare const ListRow: React.ForwardRefExoticComponent<ListRowProps & React.RefAttributes<HTMLDivElement>>;
export default ListRow;
