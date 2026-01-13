import React, { createContext, useContext, useId } from "react";

export interface ControlIdConfig {
  autoIds: boolean;
  prefix?: string;
}

const ControlIdContext = createContext<ControlIdConfig>({ autoIds: false });

export function ControlIdProvider({
  autoIds = false,
  prefix,
  children,
}: ControlIdConfig & { children: React.ReactNode }) {
  return (
    <ControlIdContext.Provider value={{ autoIds, prefix }}>
      {children}
    </ControlIdContext.Provider>
  );
}

export function useControlIdConfig() {
  return useContext(ControlIdContext);
}

function toControlIdSegment(value: string) {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return sanitized;
}

function joinPrefix(prefix: string | undefined, segment: string) {
  if (!prefix) return segment;
  const trimmed = prefix.replace(/\.+$/, "");
  return `${trimmed}.${segment}`;
}

export function useResolvedControlId(
  explicitId: string | undefined,
  label?: string,
  fallbackLabel?: string,
) {
  const { autoIds, prefix } = useControlIdConfig();
  const reactId = useId();
  if (explicitId) return explicitId;
  if (!autoIds) return undefined;
  const candidate = label ?? fallbackLabel ?? reactId;
  const segment = toControlIdSegment(candidate) || toControlIdSegment(reactId) || "control";
  return joinPrefix(prefix, segment);
}

export function useResolvedControlIdPrefix(explicitPrefix?: string, label?: string) {
  const { autoIds, prefix } = useControlIdConfig();
  if (explicitPrefix) return explicitPrefix;
  if (!autoIds) return undefined;
  const segment = label ? toControlIdSegment(label) : "";
  if (!segment) return prefix;
  return joinPrefix(prefix, segment);
}
