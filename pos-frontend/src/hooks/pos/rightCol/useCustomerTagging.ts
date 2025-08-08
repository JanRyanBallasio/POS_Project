import { useState, useEffect } from "react";

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
  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_backend_api_url}/customers`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAllCustomers(json.data);
      } else {
        setAllCustomers([]);
      }
    } catch (error) {
      setAllCustomers([]);
    }
  };
  // Fetch customers from backend
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_backend_api_url}/customers`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAllCustomers(json.data);
        } else {
          setAllCustomers([]);
        }
      } catch (error) {
        setAllCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  // Filter customers by query
  useEffect(() => {
    setFilteredCustomers(
      allCustomers.filter((c) =>
        c.name.toLowerCase().includes(customerQuery.toLowerCase())
      )
    );
  }, [customerQuery, allCustomers]);
  useEffect(() => {
    fetchCustomers();
  }, []);

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
    clearCustomer, // <-- make sure this is returned!
    fetchCustomers,
    allCustomers,
    setAllCustomers,
  };
}