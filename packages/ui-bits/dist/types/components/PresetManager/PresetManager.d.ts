import React from "react";
import { type PresetSnapshot } from "../../presetStore";
import "./preset-manager.css";
export interface PresetManagerPreset {
    id?: string;
    name: string;
    readonly?: boolean;
    snapshot?: PresetSnapshot;
}
export interface PresetManagerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "onSelect"> {
    presets?: PresetManagerPreset[];
    onSave?: (name: string) => void;
    onSelect?: (preset: PresetManagerPreset) => void;
    onDelete?: (preset: PresetManagerPreset) => void;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    emptyLabel?: string;
    saveLabel?: string;
    maxListHeight?: number | string;
    colorA?: string;
    colorB?: string;
    fontSize?: number;
    disabled?: boolean;
}
declare const PresetManager: React.ForwardRefExoticComponent<PresetManagerProps & React.RefAttributes<HTMLDivElement>>;
export default PresetManager;
