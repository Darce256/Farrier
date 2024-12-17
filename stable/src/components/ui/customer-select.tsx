import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface Customer {
  id: string;
  "Display Name": string;
}

interface CustomerSelectProps {
  selectedCustomers: string[];
  onCustomerChange: (selected: string[]) => void;
  placeholder?: string;
}

export function CustomerSelect({
  selectedCustomers,
  onCustomerChange,
  placeholder = "Select customers...",
}: CustomerSelectProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select('id, "Display Name"')
        .order("Display Name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer["Display Name"].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCustomer = (customerName: string) => {
    const newSelected = selectedCustomers.includes(customerName)
      ? selectedCustomers.filter((name) => name !== customerName)
      : [...selectedCustomers, customerName];
    onCustomerChange(newSelected);
  };

  return (
    <div className="relative">
      <div
        className="border rounded-md p-2 min-h-[38px] cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedCustomers.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedCustomers.map((customer) => (
              <span
                key={customer}
                className="bg-primary text-white px-2 py-1 rounded-md text-sm flex items-center gap-1"
              >
                {customer}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCustomer(customer);
                  }}
                />
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute w-full z-10 top-full mt-1 bg-white border rounded-md shadow-lg">
          <div className="p-2">
            <input
              type="text"
              className="w-full border rounded-md px-2 py-1"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ScrollArea className="max-h-[200px]">
            <div className="p-1">
              {filteredCustomers.map((customer) => (
                <Button
                  key={customer.id}
                  type="button"
                  variant="ghost"
                  className="w-full text-left flex items-center justify-between px-2 py-1 hover:bg-accent"
                  onClick={() => toggleCustomer(customer["Display Name"])}
                >
                  {customer["Display Name"]}
                  {selectedCustomers.includes(customer["Display Name"]) && (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
