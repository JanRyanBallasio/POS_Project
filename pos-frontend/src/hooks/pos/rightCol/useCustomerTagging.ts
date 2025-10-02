import { useState, useEffect, useCallback } from 'react';
import axios from '@/lib/axios';

export interface Customer {
  id: string;
  name: string;
  points: number;
}

export function useCustomerTagging(onAutoSelect?: (customer: Customer) => void) {
  const [customerQuery, setCustomerQuery] = useState('');
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const resp = await axios.get("/customers");
      const json = resp.data;
      if (json && json.success && Array.isArray(json.data)) {
        setAllCustomers(json.data);
      } else {
        console.warn('Invalid customer response format:', json);
        setAllCustomers([]);
      }
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setAllCustomers([]);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = allCustomers.filter(customer =>
    customer.name.toLowerCase().includes(customerQuery.toLowerCase())
  );

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.name);
    onAutoSelect?.(customer);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerQuery('');
  };

  return {
    customerQuery,
    setCustomerQuery,
    filteredCustomers,
    selectedCustomer,
    selectCustomer,
    clearCustomer,
    allCustomers,
    setAllCustomers,
    refetchCustomers: fetchCustomers
  };
}