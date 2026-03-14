import React, { createContext, useContext, useMemo, useState } from "react";

type InputParameterSelectionContextValue = {
  /**
   * Selected inputParameterId normalized to a string.
   * Many API DTOs represent IDs as strings, but some UI flows may temporarily hold numbers.
   * This context is the canonical normalization boundary.
   */
  selectedInputParameterId: string | null;

  // PUBLIC_INTERFACE
  setSelectedInputParameterId: (id: string | number | null) => void;
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
   * Invariants:
   *  - selectedInputParameterId is either null or a non-empty string.
   * Errors:
   *  - none (pure state container)
   */
  const [selectedInputParameterId, _setSelectedInputParameterId] = useState<string | null>(null);

  function normalizeId(id: string | number | null): string | null {
    if (id === null) return null;
    const s = String(id).trim();
    return s ? s : null;
  }

  const setSelectedInputParameterId = (id: string | number | null) => {
    _setSelectedInputParameterId(normalizeId(id));
  };

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
