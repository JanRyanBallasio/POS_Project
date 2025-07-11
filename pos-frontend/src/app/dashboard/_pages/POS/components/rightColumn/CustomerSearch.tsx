import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
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
}

export default function CustomerSearch({
  customerQuery,
  setCustomerQuery,
  filteredCustomers,
  selectedCustomer,
  selectCustomer,
}: CustomerSearchProps) {
  return (
    <>
      <Label htmlFor="customer-search" className="mb-2 mt-4">
        Customer Name
      </Label>
      <div className="relative mb-2">
        <Search
          className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <Input
          id="customer-search"
          className="pl-9"
          placeholder="Search Name"
          value={customerQuery}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setCustomerQuery(e.target.value)}
          autoComplete="off"
        />
        {customerQuery && !selectedCustomer && (
          <div className="absolute z-10 left-0 right-0 bg-white border rounded shadow max-h-40 overflow-y-auto">
            {filteredCustomers.length === 0 && (
              <div className="p-2 text-gray-500 text-center">
                No results
              </div>
            )}
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                onClick={() => selectCustomer(customer)}
              >
                <span>{customer.name}</span>
                <span className="text-xs text-gray-500">
                  {customer.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}