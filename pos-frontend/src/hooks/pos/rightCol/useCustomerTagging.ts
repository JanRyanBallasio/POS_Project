import { useState, useEffect, useCallback } from "react";
import axios from "@/lib/axios";

export interface Customer {
  id: string;
  name: string;
  points: number;
}

export function useCustomerTagging(onAutoSelect?: (customer: Customer) => void) {
  const [customerQuery, setCustomerQuery] = useState("");
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const resp = await axios.get("/customers"); // -> /api/customers (axios base)
      const json = resp.data;
      if (json && json.success && Array.isArray(json.data)) {
        setAllCustomers(json.data);
      } else {
        setAllCustomers([]);
      }
    } catch (err) {
      setAllCustomers([]);
    }
  }, []);

  // Fetch customers once on mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Filter customers by query
  useEffect(() => {
    setFilteredCustomers(
      allCustomers.filter((c) =>
        c.name?.toLowerCase().includes(customerQuery.toLowerCase())
      )
    );
  }, [customerQuery, allCustomers]);

  // FIXED: Auto-select when only one customer is found - CRITICAL TIMING FIX
  useEffect(() => {
    if (filteredCustomers.length === 1 && customerQuery.trim().length >= 2 && onAutoSelect && !selectedCustomer) {
      const autoSelectTimer = setTimeout(() => {
        const customer = filteredCustomers[0];
        
        console.log("🎯 useCustomerTagging: About to auto-select customer:", customer.name);
        
        // CRITICAL FIX: Set a longer delay before clearing the flag to prevent race conditions
        onAutoSelect(customer);
        selectCustomer(customer);
        setCustomerQuery(customer.name);
        
        // CRITICAL FIX: Use a longer delay to ensure all events are properly handled
        setTimeout(() => {
          console.log("🎯 useCustomerTagging: Clearing global flag after auto-selection");
          (window as any).customerSearchActive = false;
        }, 200); // Longer delay to prevent race condition
        
      }, 800); // Increased delay to 800ms to prevent premature auto-selection

      return () => clearTimeout(autoSelectTimer);
    }
  }, [filteredCustomers, customerQuery, onAutoSelect, selectedCustomer]);

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.name);
    // ADDED: Clear global flag when manually selecting customer too - with delay
    setTimeout(() => {
      (window as any).customerSearchActive = false;
    }, 100);
  };

  // UPDATED: Clear both selected customer AND query - AGGRESSIVE CLEAR
  const clearCustomer = () => {
    console.log("🧹 useCustomerTagging: Clearing customer data");
    setSelectedCustomer(null);
    setCustomerQuery(""); // <-- Add this line to clear the input!
    (window as any).customerSearchActive = false;
  };

  return {
    customerQuery,
    setCustomerQuery,
    filteredCustomers,
    selectedCustomer,
    selectCustomer,
    clearCustomer,
    fetchCustomers,
    allCustomers,
    setAllCustomers,
  };
}