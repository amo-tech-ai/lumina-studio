"use client";

import { createContext, useContext, useState } from "react";

interface ActiveBrandContextValue {
  activeBrandId: string | null;
  setActiveBrandId: (id: string | null) => void;
}

const ActiveBrandContext = createContext<ActiveBrandContextValue>({
  activeBrandId: null,
  setActiveBrandId: () => {},
});

export function ActiveBrandProvider({ children }: { children: React.ReactNode }) {
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  return (
    <ActiveBrandContext.Provider value={{ activeBrandId, setActiveBrandId }}>
      {children}
    </ActiveBrandContext.Provider>
  );
}

export function useActiveBrand() {
  return useContext(ActiveBrandContext);
}
