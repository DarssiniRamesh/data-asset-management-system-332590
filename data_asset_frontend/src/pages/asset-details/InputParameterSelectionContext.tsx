import React, { createContext, useContext, useMemo, useState } from "react";

type InputParameterSelectionContextValue = {
  selectedInputParameterId: string | null;
  // PUBLIC_INTERFACE
  setSelectedInputParameterId: (id: string | null) => void;
};

const InputParameterSelectionContext = createContext<InputParameterSelectionContextValue | null>(null);

// PUBLIC_INTERFACE
export function InputParameterSelectionProvider({ children }: { children: React.ReactNode }) {
  /** Contract:
   * Purpose:
   *  - Provides a single source of truth for the currently selected inputParameterId on Asset Details.
   *  - The Associated Input Parameters tab is the primary selector per BRD step 04.01.
   * Consumers:
   *  - EF Source Mapping / Throughput Setup / Data Input tabs (and any other child-input-parameter-scoped modules).
   * State:
   *  - selectedInputParameterId: string | null
   */
  const [selectedInputParameterId, setSelectedInputParameterId] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      selectedInputParameterId,
      setSelectedInputParameterId,
    }),
    [selectedInputParameterId],
  );

  return (
    <InputParameterSelectionContext.Provider value={value}>
      {children}
    </InputParameterSelectionContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useInputParameterSelection(): InputParameterSelectionContextValue {
  /** Contract:
   * Must be used within InputParameterSelectionProvider.
   */
  const ctx = useContext(InputParameterSelectionContext);
  if (!ctx) throw new Error("useInputParameterSelection must be used within InputParameterSelectionProvider");
  return ctx;
}
