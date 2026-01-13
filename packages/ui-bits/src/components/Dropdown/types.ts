export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  colorA?: string;
  colorB?: string;
  borderStyle?: "a" | "b" | "none";
}
