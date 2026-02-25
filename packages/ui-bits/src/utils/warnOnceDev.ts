const warnedKeys = new Set<string>();

function isDevelopmentEnvironment() {
  if (
    typeof import.meta !== "undefined"
    && typeof import.meta.env !== "undefined"
    && typeof import.meta.env.DEV === "boolean"
  ) {
    return import.meta.env.DEV;
  }
  const nodeEnv = (
    typeof globalThis !== "undefined"
    && "process" in globalThis
    && typeof (globalThis as { process?: { env?: { NODE_ENV?: unknown } } }).process?.env?.NODE_ENV === "string"
  )
    ? (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV
    : undefined;
  if (nodeEnv !== undefined) {
    return nodeEnv !== "production";
  }
  return true;
}

export function warnOnceDev(key: string, message: string) {
  if (!isDevelopmentEnvironment()) return;
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  console.warn(message);
}
