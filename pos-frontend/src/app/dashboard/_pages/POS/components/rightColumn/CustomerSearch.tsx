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
  onCustomerSelected?: () => void; // Callback when customer is selected
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
  const isAutoSelecting = filteredCustomers.length === 1 && customerQuery.trim().length >= 2 && !selectedCustomer;

  // Reset selected index when filtered customers change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredCustomers]);

  // Handle Ctrl+C shortcut to focus customer input
  useEffect(() => {
    const handleCustomerShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        e.stopPropagation();
        if (customerInputRef.current) {
          customerInputRef.current.focus();
          customerInputRef.current.select();
        }
      }
    };

    document.addEventListener('keydown', handleCustomerShortcut);
    return () => document.removeEventListener('keydown', handleCustomerShortcut);
  }, []);

  // Prevent clicks from bubbling up and losing focus
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (customerInputRef.current) {
      customerInputRef.current.focus();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();

    // Prevent any global keyboard shortcuts while typing in customer search
    if (e.ctrlKey) {
      // Allow Ctrl+C for focus shortcut
      if (e.key.toLowerCase() === 'c') {
        return;
      }
      // Block all other Ctrl combinations
      e.preventDefault();
      return;
    }

    // Handle arrow key navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredCustomers.length > 0) {
        setSelectedIndex(prev => 
          prev < filteredCustomers.length - 1 ? prev + 1 : 0
        );
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredCustomers.length > 0) {
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCustomers.length - 1
        );
      }
      return;
    }

    // Handle Enter key
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If we have a selected index, select that customer
      if (selectedIndex >= 0 && selectedIndex < filteredCustomers.length) {
        handleCustomerSelect(filteredCustomers[selectedIndex]);
        return;
      }
      
      // If no index selected but we have customers, select the first one
      if (filteredCustomers.length > 0 && !selectedCustomer) {
        handleCustomerSelect(filteredCustomers[0]);
        return;
      }
      
      // If customer is already selected, notify parent that Enter was pressed
      if (selectedCustomer) {
        if (onCustomerSelected) {
          onCustomerSelected();
        }
        return;
      }
    }

    // Handle Escape key to clear selection
    if (e.key === 'Escape') {
      e.preventDefault();
      setSelectedIndex(-1);
      if (customerInputRef.current) {
        customerInputRef.current.blur();
      }
      return;
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    (window as any).customerSearchActive = true;
    e.target.select();
  };
  
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay blur to allow clicking on dropdown items
    setTimeout(() => {
      (window as any).customerSearchActive = false;
    }, 150);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("📝 CustomerSearch: Input changed to:", e.target.value);
    e.stopPropagation();
    setCustomerQuery(e.target.value);
    setSelectedIndex(-1); // Reset selection when typing
    if (selectedCustomer) {
      clearCustomer(); // Clear selection if user edits input
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    selectCustomer(customer);
    setSelectedIndex(-1);
    (window as any).customerSearchActive = false;
    if (customerInputRef.current) {
      customerInputRef.current.blur();
    }
  };

  return (
    <div className="w-full mb-4" onClick={handleContainerClick} data-customer-search="true">
      <Label htmlFor={id} className="mb-2 block">
        Customer Name <span className="text-sm text-gray-500">(Ctrl+C)</span>
      </Label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <UserIcon className="w-4 h-4" />
          </span>
          <Input
            ref={customerInputRef}
            id={id}
            className="pl-9 pr-10"
            placeholder="Search Name (Ctrl+C to focus)"
            value={customerQuery}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onClick={handleInputClick}
            autoComplete="off"
            data-customer-search="true"
          />
          {isAutoSelecting && (
            <CheckCircle
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 animate-pulse"
              size={16}
            />
          )}
          {customerQuery && !selectedCustomer && (
            <div className="absolute z-10 left-0 right-0 bg-white border rounded shadow max-h-40 overflow-y-auto top-full mt-1">
              {filteredCustomers.length === 0 && (
                <div className="p-2 text-gray-500 text-center">
                  No results
                </div>
              )}
              {filteredCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className={`p-2 hover:bg-gray-100 cursor-pointer flex justify-between ${
                    selectedIndex === index 
                      ? 'bg-blue-100 border-blue-200' 
                      : isAutoSelecting 
                        ? 'bg-green-50 border-green-200' 
                        : ''
                  }`}
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <span className="flex items-center gap-2">
                    {customer.name}
                    {isAutoSelecting && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Auto-selecting...
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {customer.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddCustomer();
          }}
          className="ml-2"
        >
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}