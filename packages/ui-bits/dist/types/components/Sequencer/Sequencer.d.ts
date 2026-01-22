import React from "react";
import "./sequencer.css";
export interface SequencerEvent {
    timeMs: number;
    note: number;
}
export interface SequencerHandle {
    recordNote: (note: string | number, timeMs?: number) => void;
    clear: () => void;
}
export interface SequencerProps {
    heightUnits?: number;
    fontSize?: number;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    colorA?: string;
    colorB?: string;
    minNote?: number | string;
    maxNote?: number | string;
    durationMs?: number;
    eventRadius?: number;
    maxEvents?: number;
    suspended?: boolean;
    className?: string;
    style?: React.CSSProperties;
    ariaLabel?: string;
}
declare const Sequencer: React.ForwardRefExoticComponent<SequencerProps & React.RefAttributes<SequencerHandle>>;
export default Sequencer;
