// ...existing code...
import { useState, useEffect, useCallback } from "react";
import axios from "@/lib/axios";

export interface Customer {
  id: string;
  name: string;
  points: number;
}

export function useCustomerTagging() {
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

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.name);
  };

  const clearCustomer = () => setSelectedCustomer(null);

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
// ...existing code...