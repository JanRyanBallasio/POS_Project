import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserIcon, Plus } from "lucide-react";
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
  clearCustomer: () => void; // <-- prop from parent
  onAddCustomer: () => void;
}

export default function CustomerSearch({
  customerQuery,
  setCustomerQuery,
  filteredCustomers,
  selectedCustomer,
  selectCustomer,
  clearCustomer, // <-- use the prop, do not redeclare!
  onAddCustomer,
}: CustomerSearchProps) {
  const id = useId();

  return (
    <div className="w-full mb-4">
      <Label htmlFor={id} className="mb-2 block">
        Customer Name
      </Label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <UserIcon className="w-4 h-4" />
          </span>
          <Input
            id={id}
            className="pl-9"
            placeholder="Search Name"
            value={selectedCustomer ? selectedCustomer.name : customerQuery}
            onChange={(e) => {
              setCustomerQuery(e.target.value);
              clearCustomer(); // Clear selection if user starts typing
            }}
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
                  onClick={() => {
                    selectCustomer(customer);
                    setCustomerQuery(customer.name);
                  }}
                >
                  <span>{customer.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {customer.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button type="button" onClick={onAddCustomer} className="ml-2">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}