import React from "react";

const AnimationSuspensionContext = React.createContext(false);

export interface AnimationSuspensionProviderProps {
  suspended?: boolean;
  children: React.ReactNode;
}

export function AnimationSuspensionProvider({
  suspended = false,
  children,
}: AnimationSuspensionProviderProps) {
  const parentSuspended = React.useContext(AnimationSuspensionContext);
  const value = parentSuspended || suspended;
  return (
    <AnimationSuspensionContext.Provider value={value}>
      {children}
    </AnimationSuspensionContext.Provider>
  );
}

export function useAnimationSuspended(explicit?: boolean) {
  const inherited = React.useContext(AnimationSuspensionContext);
  return inherited || Boolean(explicit);
}
