import React from "react";
export type WebGpuStatusBorderStyle = "a" | "b" | "none";
export interface WebGpuStatusProps extends React.HTMLAttributes<HTMLDivElement> {
    colorA?: string;
    colorB?: string;
    borderStyle?: WebGpuStatusBorderStyle;
    fontSize?: number;
}
declare const WebGpuStatus: React.ForwardRefExoticComponent<WebGpuStatusProps & React.RefAttributes<HTMLDivElement>>;
export default WebGpuStatus;
