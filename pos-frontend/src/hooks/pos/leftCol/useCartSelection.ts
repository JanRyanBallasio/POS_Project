import { useState } from "react";

export function useCartSelection<T = string>() {
  const [selectedRowId, setSelectedRowId] = useState<T | null>(null);

  const selectRow = (rowId: T) => {
    setSelectedRowId(rowId);
  };

  const clearSelection = () => {
    setSelectedRowId(null);
  };

  return {
    selectedRowId,
    selectRow,
    clearSelection,
  };
}