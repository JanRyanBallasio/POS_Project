import { useState, useEffect } from "react";

export interface Customer {
  id: string;
  name: string;
  points: number;
}

const dummyCustomers: Customer[] = [
  { id: "1", name: "Juan Dela Cruz", points: 12 },
  { id: "2", name: "Maria Santos", points: 25 },
  { id: "3", name: "Pedro Reyes", points: 7 },
  { id: "4", name: "Ana Lopez", points: 40 },
];

export function useCustomerTagging() {
  const [customerQuery, setCustomerQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] =
    useState<Customer[]>(dummyCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  useEffect(() => {
    setFilteredCustomers(
      dummyCustomers.filter((c) =>
        c.name.toLowerCase().includes(customerQuery.toLowerCase())
      )
    );
  }, [customerQuery]);

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.name);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerQuery("");
  };

  return {
    customerQuery,
    setCustomerQuery,
    filteredCustomers,
    selectedCustomer,
    selectCustomer,
    clearCustomer,
  };
}
