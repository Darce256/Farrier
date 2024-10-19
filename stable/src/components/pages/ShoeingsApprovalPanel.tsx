import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton"; // Make sure you have this component
import {
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/Contexts/AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionsTab } from "@/components/PermissionsTab";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react"; // Make sure to import this icon
import { format } from "date-fns"; // You might need to install this package
import { parse } from "date-fns";
import LocationsEditor from "./LocationsEditor";
import PricesTab from "./PricesTab"; // Add this import
import { ScrollArea } from "@/components/ui/scroll-area";
import { FixedSizeList as List } from "react-window";
import { useInView } from "react-intersection-observer";
import React from "react";

interface Shoeing {
  id: string;
  "Date of Service": string;
  "Horse Name": string;
  "Barn / Trainer": string;
  Description: string;
  "Location of Service": string;
  "Base Service": string | null;
  "Cost of Service": string | null;
  "Cost of Front Add-Ons": string | null;
  "Cost of Hind Add-Ons": string | null;
  "Total Cost": string | null;
  status: string;
  "Other Custom Services": string | null;
  "Shoe Notes": string | null;
  "QB Customers": string | null;
  "Owner Email": string | null;
  customers: {
    "Display Name": string;
    Horses: string;
  };
  alert?: string | null; // Add this line
}

interface GroupedShoeings {
  [key: string]: {
    displayName: string;
    shoeings: Shoeing[];
  };
}

interface QuickBooksData {
  items: Array<{ id: string; name: string; description: string }>;
  customers: Array<{
    id: string;
    displayName: string;
    companyName: string;
    email: string;
  }>;
}

interface Invoice {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  CustomerRef: { name: string; value: string };
  TotalAmt: number;
  Balance: number;
}

interface Location {
  id: number;
  service_location: string;
  location_color: string;
}

// Add these constants at the top of your file
const QUICKBOOKS_CLIENT_ID = import.meta.env.VITE_QUICKBOOKS_CLIENT_ID;

// If you need to dynamically set the redirect URI based on the current environment:
const isDevelopment = import.meta.env.MODE === "development";
const dynamicRedirectUri = isDevelopment
  ? "http://localhost:5173/quickbooks-callback"
  : "https://bobbysimms.vercel.app/quickbooks-callback";

// Add this helper function at the top of your file, outside of the component
function formatInvoiceDescription(description: string): string {
  return `${description}`.trim();
}

// Add this new component for virtualized select items

const FilteredVirtualizedSelectContent = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string }
>(({ children, className, ...props }, ref) => {
  const [filter, setFilter] = useState("");
  const options = React.Children.toArray(children).filter((child) =>
    (child as React.ReactElement).props.children
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      setSelectedIndex((prev) => Math.min(prev + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const itemHeight = 35;
  const height = Math.min(300, itemHeight * options.length);

  return (
    <SelectContent ref={ref} className={`p-0 ${className}`} {...props}>
      <div onKeyDown={handleKeyDown} className="p-2">
        <Input
          placeholder="Search customers..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mb-2"
        />
        <List
          height={height}
          itemCount={options.length}
          itemSize={itemHeight}
          width="100%"
          overscanCount={5}
        >
          {({ index, style }) => (
            <div style={{ ...style, width: "100%" }}>
              {React.cloneElement(options[index] as React.ReactElement, {
                onMouseEnter: () => setSelectedIndex(index),
                style: {
                  backgroundColor:
                    index === selectedIndex
                      ? "rgba(0, 0, 0, 0.08)"
                      : "transparent",
                  width: "100%",
                  padding: "8px",
                },
              })}
            </div>
          )}
        </List>
      </div>
    </SelectContent>
  );
});

const LazyAccordionContent = ({ children }: { children: React.ReactNode }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px 0px",
  });

  return (
    <div ref={ref}>
      {inView ? children : <div style={{ height: "200px" }}>Loading...</div>}
    </div>
  );
};

export default function ShoeingsApprovalPanel() {
  const [groupedShoeings, setGroupedShoeings] = useState<GroupedShoeings>(
    {} as GroupedShoeings
  );

  const { user } = useAuth();
  const [isQuickBooksConnected, setIsQuickBooksConnected] = useState<
    boolean | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quickBooksData, setQuickBooksData] = useState<QuickBooksData | null>(
    null
  );
  const [selectedCustomers, setSelectedCustomers] = useState<
    Record<string, string>
  >({});
  const [editingShoeing, setEditingShoeing] = useState<Shoeing | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  const fetchQuickBooksData = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke(
        "quickbooks-create-invoice",
        {
          body: JSON.stringify({ userId: user.id }),
        }
      );

      if (error) throw error;

      if (data && data.items && data.customers) {
        setQuickBooksData({ items: data.items, customers: data.customers });
      } else {
        throw new Error("Invalid response structure from Edge Function");
      }
    } catch (error) {
      console.error("Error fetching QuickBooks data:", error);
      toast.error("Failed to fetch QuickBooks data");
    }
  }, [user]);

  const checkQuickBooksConnection = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("quickbooks_tokens")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        const expiresAt = new Date(data.expires_at);
        const now = new Date();
        if (expiresAt > now) {
          setIsQuickBooksConnected(true);
          await fetchQuickBooksData();
          await fetchPendingShoeings();
        } else {
          await refreshQuickBooksToken(data.refresh_token);
        }
      } else {
        setIsQuickBooksConnected(false);
      }
    } catch (error) {
      console.error("Error checking QuickBooks connection:", error);
      setIsQuickBooksConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchQuickBooksData]);

  useEffect(() => {
    checkQuickBooksConnection();
    fetchLocations();
  }, [checkQuickBooksConnection]);

  const refreshQuickBooksToken = async (refreshToken: string) => {
    try {
      // Call your token refresh function (you might need to implement this)
      const { data, error } = await supabase.functions.invoke(
        "refresh-quickbooks-token",
        {
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );

      if (error) throw error;

      // Update the token in the database
      await supabase
        .from("quickbooks_tokens")
        .update({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: new Date(
            Date.now() + data.expires_in * 1000
          ).toISOString(),
        })
        .eq("user_id", user?.id);

      setIsQuickBooksConnected(true);
      await fetchQuickBooksData();
    } catch (error) {
      console.error("Error refreshing QuickBooks token:", error);
      setIsQuickBooksConnected(false);
    }
  };

  const handleQuickBooksConnect = () => {
    const scopes = encodeURIComponent(
      "com.intuit.quickbooks.accounting openid profile email phone address"
    );
    const state = encodeURIComponent("testState");
    const authUri = `https://appcenter.intuit.com/connect/oauth2?client_id=${QUICKBOOKS_CLIENT_ID}&redirect_uri=${dynamicRedirectUri}&response_type=code&scope=${scopes}&state=${state}`;
    window.location.href = authUri;
  };

  async function fetchPendingShoeings() {
    setIsLoading(true);
    try {
      const { data: pendingShoeings, error: pendingShoeingsError } =
        await supabase
          .from("shoeings")
          .select("*")
          .eq("status", "pending")
          .order("Date of Service", { ascending: false });

      if (pendingShoeingsError) throw pendingShoeingsError;

      console.log("Fetched pending shoeings:", pendingShoeings);

      if (!pendingShoeings || pendingShoeings.length === 0) {
        setGroupedShoeings({} as GroupedShoeings);
        return;
      }

      // Get unique Horses values from pending shoeings
      const uniqueHorses = [
        ...new Set(pendingShoeings.map((shoeing) => shoeing.Horses)),
      ];

      // Fetch all shoeings for these horses, including Owner Email
      const { data: allShoeings, error: allShoeingsError } = await supabase
        .from("shoeings")
        .select("*") // Use double quotes for column names with spaces
        .in("Horses", uniqueHorses);

      if (allShoeingsError) throw allShoeingsError;

      // Group all shoeings by Horses
      const groupedByHorse = allShoeings.reduce(
        (acc: { [key: string]: any[] }, shoeing: any) => {
          if (!acc[shoeing.Horses]) {
            acc[shoeing.Horses] = [];
          }
          acc[shoeing.Horses].push(shoeing);
          return acc;
        },
        {}
      );

      // Determine QB Customer for each horse and create final grouping
      const grouped = pendingShoeings.reduce(
        (acc: GroupedShoeings, shoeing: any) => {
          const horseShoeings = groupedByHorse[shoeing.Horses];

          // Count QB Customers for this horse
          const customerCounts = horseShoeings.reduce(
            (counts: { [key: string]: number }, s: any) => {
              if (s["QB Customers"]) {
                const cleanCustomer = s["QB Customers"]
                  .replace(/^"|"$/g, "")
                  .trim();
                counts[cleanCustomer] = (counts[cleanCustomer] || 0) + 1;
              }
              return counts;
            },
            {}
          );

          // Find the most common QB Customer
          let qbCustomer = "No Customer";
          let maxCount = 0;
          for (const [customer, count] of Object.entries(customerCounts)) {
            if (count > maxCount) {
              qbCustomer = customer;
              maxCount = count;
            }
          }

          if (!qbCustomer || qbCustomer === "No Customer") {
            if (!acc.noCustomer) {
              acc.noCustomer = { displayName: "No Customer", shoeings: [] };
            }
            acc.noCustomer.shoeings.push(shoeing);
          } else {
            if (!acc[qbCustomer]) {
              acc[qbCustomer] = { displayName: qbCustomer, shoeings: [] };
            }
            acc[qbCustomer].shoeings.push(shoeing);
          }

          return acc;
        },
        {}
      );

      setGroupedShoeings(grouped);
    } catch (error) {
      console.error("Failed to fetch pending shoeings:", error);
      toast.error("Failed to fetch pending shoeings");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAccept(shoeingId: string) {
    setIsAccepting(shoeingId);
    try {
      const shoeing = Object.values(groupedShoeings)
        .flatMap((group) => group.shoeings)
        .find((s) => s.id === shoeingId);

      if (!shoeing) {
        throw new Error("Shoeing not found");
      }

      // For grouped shoeings, use the group name (key) as the customer
      const groupKey = Object.keys(groupedShoeings).find((key) =>
        groupedShoeings[key].shoeings.some((s) => s.id === shoeingId)
      );

      const selectedCustomerId =
        groupKey !== "noCustomer" ? groupKey : selectedCustomers[shoeingId];

      if (!selectedCustomerId) {
        toast.error("Please select a QuickBooks customer before accepting");
        return;
      }

      if (!quickBooksData) {
        throw new Error("QuickBooks data not loaded");
      }

      // Find the selected customer's display name
      const selectedCustomer =
        groupKey !== "noCustomer"
          ? {
              id: groupKey,
              displayName:
                groupedShoeings[groupKey as keyof typeof groupedShoeings]
                  ?.displayName || groupKey,
            }
          : quickBooksData?.customers.find((c) => c.id === selectedCustomerId);

      if (!selectedCustomer) {
        throw new Error("Selected customer not found");
      }

      // Prepare the shoeing data with description and Owner Email
      const shoeingWithDescription = {
        ...shoeing,
        invoiceDescription: formatInvoiceDescription(shoeing.Description),
        "Owner Email": shoeing["Owner Email"],
      };

      const { data, error } = await supabase.functions.invoke(
        "quickbooks-create-invoice",
        {
          body: JSON.stringify({
            userId: user?.id,
            shoeings: [shoeingWithDescription],
            customerId: selectedCustomer.id,
          }),
        }
      );

      if (error) {
        console.error("Error from Edge Function:", error);
        throw error;
      }

      console.log("Data from Edge Function:", data);
      if (data.invoice && data.invoice.Invoice) {
        // Update shoeing status and QB Customers in your database
        console.log(
          "Updating shoeing status and QB Customers:",
          data.invoice.Invoice.Id
        );
        const { error: updateError } = await supabase
          .from("shoeings")
          .update({
            status: "completed",
            Invoice: data.invoice.Invoice.DocNumber,
            "QB Customers": selectedCustomer.displayName,
          })
          .eq("id", shoeingId);

        if (updateError) {
          console.error(
            "Error updating shoeing status and QB Customers:",
            updateError
          );
          throw updateError;
        }

        const invoiceNumber =
          data.invoice.Invoice.DocNumber ||
          data.invoice.Invoice.Id ||
          "Unknown";
        toast.success(
          `Shoeing accepted and invoice #${invoiceNumber} created in QuickBooks`
        );
        fetchPendingShoeings();
        setSelectedCustomers((prev) => {
          const newState = { ...prev };
          delete newState[shoeingId];
          return newState;
        });
      } else {
        throw new Error("Failed to create invoice in QuickBooks");
      }
    } catch (error: any) {
      console.error("Error in handleAccept:", error);
      toast.error(
        `Failed to accept shoeing and create invoice: ${error.message}`
      );
    } finally {
      setIsAccepting(null);
    }
  }

  const handleReject = async (id: string) => {
    try {
      // Start a transaction
      const { data: shoeing, error: fetchError } = await supabase
        .from("shoeings")
        .select('user_id, "Horse Name"')
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from("shoeings")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (updateError) throw updateError;

      // Create a notification for the user who created the shoeing
      if (shoeing.user_id) {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            mentioned_user_id: shoeing.user_id,
            message: `Your shoeing request for ${shoeing["Horse Name"]} has been rejected.`,
            type: "shoeing_rejected",
            related_id: id,
            creator_id: user?.id, // The current user (admin) who rejected the shoeing
          });

        if (notificationError) throw notificationError;
      }

      toast.success("Shoeing rejected successfully");
      fetchPendingShoeings();
    } catch (error) {
      toast.error("Failed to reject shoeing");
    }
  };

  const handleCustomerSelect = (key: string, customerId: string) => {
    setSelectedCustomers((prev) => ({ ...prev, [key]: customerId }));
  };

  const handleEditShoeing = (shoeing: Shoeing) => {
    setEditingShoeing(shoeing);
  };

  const handleSaveEdit = async (updatedShoeing: Shoeing) => {
    try {
      const { error } = await supabase
        .from("shoeings")
        .update({
          "Date of Service": updatedShoeing["Date of Service"],
          Description: updatedShoeing.Description,
          "Location of Service": updatedShoeing["Location of Service"],
          "Total Cost": updatedShoeing["Total Cost"],
          "Shoe Notes": updatedShoeing["Shoe Notes"],
          "Other Custom Services": updatedShoeing["Other Custom Services"],
        })
        .eq("id", updatedShoeing.id);

      if (error) throw error;

      toast.success("Shoeing updated successfully");
      setEditingShoeing(null);
      fetchPendingShoeings();
    } catch (error) {
      console.error("Error updating shoeing:", error);
      toast.error("Failed to update shoeing");
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("id, service_location, location_color")
        .order("service_location");

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to fetch locations");
    }
  };

  // Add this function to your component
  const handleAcceptAll = async (key: string) => {
    setIsAccepting(key);
    try {
      const shoeingsToAccept = groupedShoeings[key].shoeings;
      const selectedCustomerId = selectedCustomers[key];

      if (!selectedCustomerId) {
        toast.error("Please select a QuickBooks customer before accepting");
        return;
      }

      // Prepare the shoeings data
      const shoeingsWithDescription = shoeingsToAccept.map((shoeing) => ({
        ...shoeing,
        invoiceDescription: formatInvoiceDescription(shoeing.Description),
        "Owner Email": shoeing["Owner Email"],
      }));

      const { data, error } = await supabase.functions.invoke(
        "quickbooks-create-invoice",
        {
          body: JSON.stringify({
            userId: user?.id,
            shoeings: shoeingsWithDescription,
            customerId: selectedCustomerId,
          }),
        }
      );

      if (error) throw error;

      if (data.invoice && data.invoice.Invoice) {
        // Update all shoeings in this group
        const updatePromises = shoeingsToAccept.map((shoeing) =>
          supabase
            .from("shoeings")
            .update({
              status: "completed",
              Invoice: data.invoice.Invoice.DocNumber,
              "QB Customers": groupedShoeings[key].displayName,
            })
            .eq("id", shoeing.id)
        );

        await Promise.all(updatePromises);

        const invoiceNumber =
          data.invoice.Invoice.DocNumber ||
          data.invoice.Invoice.Id ||
          "Unknown";
        toast.success(
          `Shoeings accepted and invoice #${invoiceNumber} created in QuickBooks`
        );
        fetchPendingShoeings();
      } else {
        throw new Error("Failed to create invoice in QuickBooks");
      }
    } catch (error: any) {
      console.error("Error in handleAcceptAll:", error);
      toast.error(
        `Failed to accept shoeings and create invoice: ${error.message}`
      );
    } finally {
      setIsAccepting(null);
    }
  };

  function renderShoeingApprovalContent() {
    if (isQuickBooksConnected === null || isLoading) {
      return <SkeletonLoader />;
    }

    if (isQuickBooksConnected === false) {
      return (
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect to QuickBooks</DialogTitle>
            </DialogHeader>
            <p>
              Please connect to QuickBooks before accessing the Shoeing Approval
              Panel.
            </p>
            <Button onClick={handleQuickBooksConnect}>
              Connect to QuickBooks
            </Button>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <>
        <h1 className="text-2xl font-bold mb-4">Shoeing Management</h1>
        <Accordion
          type="multiple"
          className="space-y-4 bg-gray-100 p-4 rounded-md"
        >
          {groupedShoeings.noCustomer && (
            <AccordionItem key="noCustomer" value="noCustomer">
              <AccordionTrigger className="text-lg font-semibold flex items-center justify-between w-full">
                <span className="flex-grow pr-2 break-words">
                  Shoeings Without Customers (
                  {groupedShoeings.noCustomer.shoeings.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <LazyAccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedShoeings.noCustomer.shoeings.map((shoeing) => (
                      <Card key={shoeing.id} className="flex flex-col h-full">
                        <CardContent className="flex-grow p-4 flex flex-col">
                          {/* Render shoeing details */}
                          <h3 className="font-semibold text-lg mb-2">
                            {shoeing["Horse Name"]}
                          </h3>
                          <p>Date: {shoeing["Date of Service"]}</p>
                          <p>Barn: {shoeing["Barn / Trainer"]}</p>
                          <p>Location: {shoeing["Location of Service"]}</p>
                          <p>Total Cost: ${shoeing["Total Cost"]}</p>
                          <p className="mb-4">
                            <strong>Description:</strong> {shoeing.Description}
                          </p>
                        </CardContent>
                        <div className="p-4 mt-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditShoeing(shoeing)}
                            className="w-full bg-primary text-white hover:bg-black hover:text-white"
                          >
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </Button>
                        </div>
                        <div className="p-4">
                          <Select
                            onValueChange={(value) =>
                              handleCustomerSelect(shoeing.id, value)
                            }
                            value={selectedCustomers[shoeing.id] || ""}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select QuickBooks Customer" />
                            </SelectTrigger>
                            <FilteredVirtualizedSelectContent className="min-w-[300px]">
                              {quickBooksData?.customers.map((customer) => (
                                <SelectItem
                                  key={customer.id}
                                  value={customer.id}
                                  className="whitespace-nowrap"
                                >
                                  {customer.displayName}
                                </SelectItem>
                              ))}
                            </FilteredVirtualizedSelectContent>
                          </Select>
                        </div>
                        <div className="p-4 flex justify-between">
                          <Button
                            onClick={() => handleAccept(shoeing.id)}
                            disabled={
                              !selectedCustomers[shoeing.id] ||
                              isAccepting === shoeing.id
                            }
                            className="w-1/2 mr-2"
                          >
                            {isAccepting === shoeing.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-2 h-4 w-4" />
                            )}
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleReject(shoeing.id)}
                            variant="destructive"
                            className="w-1/2 ml-2"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </LazyAccordionContent>
              </AccordionContent>
            </AccordionItem>
          )}
          {Object.entries(groupedShoeings).map(
            ([key, { displayName, shoeings }]) => {
              if (key !== "noCustomer") {
                return (
                  <AccordionItem key={key} value={key}>
                    <AccordionTrigger className="text-lg font-semibold flex items-center justify-between w-full">
                      <span className="flex-grow pr-2 break-words">
                        {displayName} ({shoeings.length})
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <LazyAccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {shoeings.map((shoeing) => (
                            <Card
                              key={shoeing.id}
                              className="flex flex-col h-full"
                            >
                              <CardContent className="flex-grow p-4 flex flex-col">
                                {/* Render shoeing details */}
                                <h3 className="font-semibold text-lg mb-2">
                                  {shoeing["Horse Name"]}
                                </h3>
                                <p>Date: {shoeing["Date of Service"]}</p>
                                <p>Barn: {shoeing["Barn / Trainer"]}</p>
                                <p>
                                  Location: {shoeing["Location of Service"]}
                                </p>
                                <p>Total Cost: ${shoeing["Total Cost"]}</p>
                                <p className="mb-4">
                                  <strong>Description:</strong>{" "}
                                  {shoeing.Description}
                                </p>
                              </CardContent>
                              <div className="p-4 mt-auto">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditShoeing(shoeing)}
                                  className="w-full bg-primary text-white hover:bg-black hover:text-white"
                                >
                                  <Pencil className="w-4 h-4 mr-2" /> Edit
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                        <div className="flex items-center mt-4 space-x-4">
                          <Button
                            onClick={() => handleAcceptAll(key)}
                            disabled={
                              !selectedCustomers[key] || isAccepting === key
                            }
                          >
                            {isAccepting === key ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending to QuickBooks...
                              </>
                            ) : (
                              "Accept All"
                            )}
                          </Button>
                          <Select
                            value={selectedCustomers[key] || ""}
                            onValueChange={(value) =>
                              handleCustomerSelect(key, value)
                            }
                          >
                            <SelectTrigger className="w-[200px] bg-white">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <FilteredVirtualizedSelectContent className="min-w-[300px]">
                              {quickBooksData?.customers.map((customer) => (
                                <SelectItem
                                  key={customer.id}
                                  value={customer.id}
                                  className="whitespace-nowrap"
                                >
                                  {customer.displayName}
                                </SelectItem>
                              ))}
                            </FilteredVirtualizedSelectContent>
                          </Select>
                        </div>
                      </LazyAccordionContent>
                    </AccordionContent>
                  </AccordionItem>
                );
              }
              return null;
            }
          )}
        </Accordion>
        <EditShoeingModal
          shoeing={editingShoeing}
          onClose={() => setEditingShoeing(null)}
          onSave={handleSaveEdit}
          locations={locations}
        />
      </>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <Tabs defaultValue="approval" className="w-full">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="mb-4 bg-primary text-white inline-flex h-auto">
            <TabsTrigger value="approval" className="px-3 py-2">
              Shoeing Approval
            </TabsTrigger>
            <TabsTrigger value="permissions" className="px-3 py-2">
              Permissions
            </TabsTrigger>
            <TabsTrigger value="sent-invoices" className="px-3 py-2">
              Sent Invoices
            </TabsTrigger>
            <TabsTrigger value="locations" className="px-3 py-2">
              Locations
            </TabsTrigger>
            <TabsTrigger value="prices" className="px-3 py-2">
              Prices
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value="approval">
          {renderShoeingApprovalContent()}
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsTab />
        </TabsContent>

        <TabsContent value="sent-invoices">
          <SentInvoicesTab />
        </TabsContent>

        <TabsContent value="locations">
          <LocationsEditor />
        </TabsContent>

        <TabsContent value="prices">
          <PricesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SentInvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { user } = useAuth();
  const itemsPerPage = 25;

  const hasMorePages = currentPage * itemsPerPage < totalCount;

  const fetchInvoices = useCallback(
    async (page: number) => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke(
          "quickbooks-get-invoices",
          {
            body: JSON.stringify({ userId: user.id, page, itemsPerPage }),
          }
        );

        if (error) throw error;

        setInvoices(data.invoices);
        setTotalCount(data.totalCount);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Failed to fetch invoices. Please try again later.");
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchInvoices(currentPage);
  }, [currentPage, fetchInvoices]);

  const handleNextPage = () => {
    if (hasMorePages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  if (loading) return <div>Loading invoices...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Sent Invoices</h2>
      <Table className="w-full bg-white text-black rounded-lg p-4">
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-black">
              Invoice Number
            </TableHead>
            <TableHead className="font-bold text-black">Date</TableHead>
            <TableHead className="font-bold text-black">Customer</TableHead>
            <TableHead className="font-bold text-black">Total Amount</TableHead>
            <TableHead className="font-bold text-black">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.Id}>
              <TableCell>{invoice.DocNumber}</TableCell>
              <TableCell>
                {new Date(invoice.TxnDate).toLocaleDateString()}
              </TableCell>
              <TableCell>{invoice.CustomerRef.name}</TableCell>
              <TableCell>${invoice.TotalAmt.toFixed(2)}</TableCell>
              <TableCell>${invoice.Balance.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between items-center mt-4">
        <Button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          variant="outline"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <span>
          Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)} | Showing{" "}
          {(currentPage - 1) * itemsPerPage + 1} -{" "}
          {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
        </span>
        <Button
          onClick={handleNextPage}
          disabled={!hasMorePages}
          variant="outline"
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="container mx-auto p-4">
      <Skeleton className="w-1/2 h-8 mb-4 bg-primary" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-0">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="w-3/4 h-6 bg-primary" />{" "}
              {/* Accordion title */}
              <Skeleton className="w-6 h-6 bg-primary" /> {/* Chevron icon */}
            </div>
            <Skeleton className="w-full h-12 mt-2 bg-primary" />{" "}
            {/* Accept All button and Select customer */}
          </div>
        ))}
      </div>
    </div>
  );
}

interface EditShoeingModalProps {
  shoeing: Shoeing | null;
  onClose: () => void;
  onSave: (updatedShoeing: Shoeing) => void;
  locations: Location[];
}

function EditShoeingModal({
  shoeing,
  onClose,
  onSave,
  locations,
}: EditShoeingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editedShoeing, setEditedShoeing] = useState<any | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (shoeing) {
      setEditedShoeing({
        ...shoeing,
        // No need to convert "Date of Service" to a Date object
      });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [shoeing]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    if (id === "Total Cost") {
      // Allow empty string, otherwise enforce non-negative whole number
      if (value === "") {
        setEditedShoeing((prev: any) => ({
          ...prev,
          [id]: "",
        }));
      } else {
        // Remove any non-digit characters and convert to a number
        const numericValue = parseInt(value.replace(/\D/g, ""), 10);
        // If it's not a number or is negative, set to 0
        const validValue =
          isNaN(numericValue) || numericValue < 0 ? 0 : numericValue;
        setEditedShoeing((prev: any) => ({
          ...prev,
          [id]: validValue,
        }));
      }
    } else {
      setEditedShoeing((prev: any) => ({
        ...prev,
        [id]: value,
      }));
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setEditedShoeing((prev: any) => {
      if (!prev) return null;
      const newShoeing = {
        ...prev,
        "Date of Service": date ? format(date, "M/d/yyyy") : undefined,
      };
      return newShoeing;
    });
    setIsCalendarOpen(false);
  };

  const handleSaveClick = () => {
    if (editedShoeing) {
      onSave(editedShoeing);
      handleClose();
    }
  };

  const handleLocationChange = (value: string) => {
    setEditedShoeing((prev: any) => {
      if (!prev) return null;
      return { ...prev, "Location of Service": value };
    });
  };

  if (!editedShoeing) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="z-50 bg-white ">
        <DialogHeader>
          <DialogTitle>
            Edit Shoeing for {editedShoeing["Horse Name"]}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 ">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="Date of Service" className="text-right">
              Service Date
            </Label>
            <div className="relative">
              <Button
                variant={"outline"}
                className="w-[240px] justify-start text-left font-normal bg-white"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {editedShoeing["Date of Service"] ? (
                  editedShoeing["Date of Service"]
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
              {isCalendarOpen && (
                <div className="absolute top-full left-0 z-[9999] bg-white shadow-lg rounded-md overflow-hidden mt-1">
                  <Calendar
                    mode="single"
                    selected={
                      editedShoeing["Date of Service"]
                        ? parse(
                            editedShoeing["Date of Service"],
                            "M/d/yyyy",
                            new Date()
                          )
                        : undefined
                    }
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="Description" className="text-right">
              Description
            </Label>
            <Input
              id="Description"
              value={editedShoeing.Description}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="Location of Service" className="text-right">
              Location
            </Label>
            <Select
              value={editedShoeing["Location of Service"]}
              onValueChange={handleLocationChange}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem
                    key={location.id}
                    value={location.service_location}
                  >
                    {location.service_location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="Total Cost" className="text-right">
              Total Cost
            </Label>
            <Input
              id="Total Cost"
              type="text" // Changed to "text" to allow empty input
              inputMode="numeric" // Brings up numeric keyboard on mobile
              pattern="[0-9]*" // Allows only numbers
              value={editedShoeing["Total Cost"] ?? ""} // Use empty string if null or undefined
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="Other Custom Services" className="text-right">
              Custom Services
            </Label>
            <Textarea
              id="Other Custom Services"
              value={editedShoeing["Other Custom Services"] || ""}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="Shoe Notes" className="text-right">
              Shoe Notes
            </Label>
            <Textarea
              id="Shoe Notes"
              value={editedShoeing["Shoe Notes"] || ""}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            Cancel
          </Button>
          <Button
            className="hover:bg-black hover:text-white my-2 sm:my-0"
            onClick={handleSaveClick}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
