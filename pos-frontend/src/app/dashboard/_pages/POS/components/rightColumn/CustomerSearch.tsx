import { useId, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserIcon, Plus, CheckCircle } from "lucide-react";
import React from "react";

interface Customer {
  id: string;
  name: string;
  points: number;
}

interface CustomerSearchProps {
  customerQuery: string;
  setCustomerQuery: (val: string) => void;
  filteredCustomers: Customer[];
  selectedCustomer: Customer | null;
  selectCustomer: (customer: Customer) => void;
  clearCustomer: () => void;
  onAddCustomer: () => void;
  onCustomerSelected?: () => void;
}

export default function CustomerSearch({
  customerQuery,
  setCustomerQuery,
  filteredCustomers,
  selectedCustomer,
  selectCustomer,
  clearCustomer,
  onAddCustomer,
  onCustomerSelected,
}: CustomerSearchProps) {
  const id = useId();
  const customerInputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const isAutoSelecting =
    filteredCustomers.length === 1 &&
    customerQuery.trim().length >= 2 &&
    !selectedCustomer;

  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredCustomers]);

  useEffect(() => {
    const handleCustomerShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        e.stopPropagation();
        customerInputRef.current?.focus();
        customerInputRef.current?.select();
      }
    };
    document.addEventListener("keydown", handleCustomerShortcut);
    return () => document.removeEventListener("keydown", handleCustomerShortcut);
  }, []);

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (e.ctrlKey && e.key.toLowerCase() !== "c") {
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredCustomers.length > 0) {
        setSelectedIndex((prev) =>
          prev < filteredCustomers.length - 1 ? prev + 1 : 0
        );
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredCustomers.length > 0) {
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCustomers.length - 1
        );
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredCustomers.length) {
        handleCustomerSelect(filteredCustomers[selectedIndex]);
        return;
      }
      if (filteredCustomers.length > 0 && !selectedCustomer) {
        handleCustomerSelect(filteredCustomers[0]);
        return;
      }
      if (selectedCustomer) {
        onCustomerSelected?.();
      }
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setSelectedIndex(-1);
      customerInputRef.current?.blur();
    }
  };

  const handleInputFocus = () => {
    (window as any).customerSearchActive = true;
    customerInputRef.current?.select();
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      (window as any).customerSearchActive = false;
    }, 150);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setCustomerQuery(e.target.value);
    setSelectedIndex(-1);
    if (selectedCustomer) clearCustomer();
  };

  const handleCustomerSelect = (customer: Customer) => {
    selectCustomer(customer);
    setSelectedIndex(-1);
    (window as any).customerSearchActive = false;
    customerInputRef.current?.blur();
  };

  // Limit visible results to 5
  const visibleResults = filteredCustomers.slice(0, 4);

  return (
    <div
      className="w-full mb-4"
      onClick={handleContainerClick}
      data-customer-search="true"
    >
      <div className="flex items-center justify-between mb-2">
        <Label
          htmlFor={id}
          className="uppercase tracking-wide text-sm font-semibold"
        >
          Customer Name
        </Label>
        <span className="text-xs text-gray-400">(Ctrl+C)</span>
      </div>

      {/* Outer flex is relative so dropdown can stretch across both input + button */}
      <div className="flex items-center gap-2 relative">
        {/* Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <UserIcon className="w-4 h-4" />
          </span>
          <Input
            ref={customerInputRef}
            id={id}
            className="pl-9 pr-10"
            placeholder="Search Name"
            value={customerQuery}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            autoComplete="off"
            data-customer-search="true"
          />
          {isAutoSelecting && (
            <CheckCircle
              className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 animate-pulse"
              size={16}
            />
          )}
        </div>

        {/* Add Button */}
        <Button
          type="button"
          onClick={() => onAddCustomer()}
          className="ml-2 rounded-lg"
        >
          <Plus className="w-4 h-4 mr-1" />

        </Button>

        {/* Dropdown (absolute, stretches full width across input + button) */}
        {customerQuery && !selectedCustomer && (
          <div
            className="
              absolute left-0 right-0 top-full mt-2
              bg-white border rounded-xl shadow-lg
              z-50
              max-h-72 overflow-auto
            "
          >
            {visibleResults.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No results
              </div>
            ) : (
              visibleResults.map((customer, index) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleCustomerSelect(customer)}
                  className={`w-full text-left px-4 py-3 text-sm 
                              ${selectedIndex === index
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                    }`}
                >
                  <span className="block truncate">{customer.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
