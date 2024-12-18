import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Customer {
  id: string;
  "Display Name": string;
}

interface CustomerSelectProps {
  selectedCustomers: string[];
  onCustomerChange: (selected: string[]) => void;
  placeholder?: string;
  maxDisplay?: number;
}

export function CustomerSelect({
  selectedCustomers,
  onCustomerChange,
  placeholder = "Select customers...",
  maxDisplay = 3,
}: CustomerSelectProps) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select('id, "Display Name"')
      .order('"Display Name"', { ascending: true });

    if (data) {
      setCustomers(data);
    }
  };

  const handleSelect = (customerName: string) => {
    const isSelected = selectedCustomers.includes(customerName);
    const newSelected = isSelected
      ? selectedCustomers.filter((name) => name !== customerName)
      : [...selectedCustomers, customerName];
    onCustomerChange(newSelected);
  };

  const handleClear = () => {
    onCustomerChange([]);
  };

  const handleRemove = (customerToRemove: string) => {
    const newSelected = selectedCustomers.filter(
      (name) => name !== customerToRemove
    );
    onCustomerChange(newSelected);
  };

  const filteredCustomers = customers.filter((customer) =>
    customer["Display Name"].toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between relative h-auto min-h-10 flex-wrap bg-white text-black"
        >
          <div className="flex flex-wrap gap-1 p-1">
            {selectedCustomers.length > 0 ? (
              <>
                {selectedCustomers.slice(0, maxDisplay).map((customer) => (
                  <Badge
                    key={customer}
                    className="m-0.5 pr-0.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {customer}
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(customer);
                      }}
                      className="h-auto p-1 hover:bg-transparent"
                    >
                      <X className="h-3 w-3 text-primary-foreground" />
                    </Button>
                  </Badge>
                ))}
                {selectedCustomers.length > maxDisplay && (
                  <Badge className="m-0.5 bg-primary text-primary-foreground">
                    +{selectedCustomers.length - maxDisplay} more
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <div className="flex shrink-0 items-center self-stretch px-1">
            {selectedCustomers.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="h-auto p-1 hover:bg-transparent"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Button>
                <Separator orientation="vertical" className="mx-1 h-4" />
              </>
            )}
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-white" align="start">
        <div className="flex items-center border-b px-3 bg-white">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 bg-white"
          />
        </div>
        <ScrollArea className="h-[200px]">
          {filteredCustomers.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No customers found.
            </div>
          ) : (
            <div className="p-1">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none text-black hover:bg-accent hover:text-accent-foreground",
                    selectedCustomers.includes(customer["Display Name"]) &&
                      "bg-accent"
                  )}
                  onClick={() => handleSelect(customer["Display Name"])}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCustomers.includes(customer["Display Name"])
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {customer["Display Name"]}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
