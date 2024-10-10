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
import { Check, X, Search, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/Contexts/AuthProvider";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
}

interface Horse {
  id: string;
  Name: string;
  Customers: string | null;
}

interface Customer {
  id: string;
  "Display Name": string;
  "Company/Horses Name": string;
  Horses: string | null;
  "Owner Email": string | null;
}

interface GroupedShoeings {
  [key: string]: { displayName: string; shoeings: Shoeing[] };
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

// Add these constants at the top of your file
const QUICKBOOKS_CLIENT_ID = import.meta.env.VITE_QUICKBOOKS_CLIENT_ID;
const QUICKBOOKS_REDIRECT_URI = import.meta.env.VITE_QUICKBOOKS_REDIRECT_URI;

export default function ShoeingsApprovalPanel() {
  const [groupedShoeings, setGroupedShoeings] = useState<GroupedShoeings>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
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

  const fetchQuickBooksData = useCallback(async () => {
    if (!user) return;
    try {
      console.log("Fetching QuickBooks data...");
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
    const state = encodeURIComponent("testState"); // You might want to generate a random state for security
    const authUri = `https://appcenter.intuit.com/connect/oauth2?client_id=${QUICKBOOKS_CLIENT_ID}&redirect_uri=${QUICKBOOKS_REDIRECT_URI}&response_type=code&scope=${scopes}&state=${state}`;
    window.location.href = authUri;
  };

  async function fetchPendingShoeings() {
    setIsLoading(true);
    try {
      // Fetch pending shoeings
      const { data: shoeings, error: shoeingsError } = await supabase
        .from("shoeings")
        .select("*")
        .eq("status", "pending")
        .order("Date of Service", { ascending: false });

      if (shoeingsError) throw shoeingsError;

      if (!shoeings || shoeings.length === 0) {
        setGroupedShoeings({});
        return;
      }

      console.log("Fetched shoeings:", shoeings);

      // Fetch all customers
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select('"Display Name", Horses');

      if (customersError) throw customersError;

      console.log("Fetched customers:", customers);

      // Group shoeings by customer display name
      const grouped = shoeings.reduce(
        (acc: GroupedShoeings, shoeing: Shoeing) => {
          const shoeingHorseValue = `${shoeing["Horses"]}`;
          console.log(`Processing shoeing: ${shoeingHorseValue}`);

          let customerDisplayName = "Unknown";

          // Find matching customer
          const matchingCustomer = customers.find(
            (customer) =>
              customer.Horses && customer.Horses.includes(shoeingHorseValue)
          );

          if (matchingCustomer) {
            customerDisplayName = matchingCustomer["Display Name"];
          } else {
            console.log(`No matching customer found for: ${shoeingHorseValue}`);
          }

          const key = customerDisplayName;

          if (!acc[key]) {
            acc[key] = { displayName: customerDisplayName, shoeings: [] };
          }
          acc[key].shoeings.push(shoeing);
          return acc;
        },
        {}
      );

      console.log("Grouped shoeings:", grouped);

      setGroupedShoeings(grouped);
    } catch (error) {
      console.error("Failed to fetch pending shoeings:", error);
      toast.error("Failed to fetch pending shoeings");
    } finally {
      setIsLoading(false);
    }
  }

  const handleAccept = async (key: string) => {
    console.log("handleAccept called with key:", key);
    try {
      const shoeings = groupedShoeings[key].shoeings;
      const selectedCustomerId = selectedCustomers[key];

      if (!selectedCustomerId) {
        toast.error("Please select a QuickBooks customer before accepting");
        return;
      }

      console.log(
        "Shoeings to be processed:",
        JSON.stringify(shoeings, null, 2)
      );

      if (!quickBooksData) {
        throw new Error("QuickBooks data not loaded");
      }

      const { data, error } = await supabase.functions.invoke(
        "quickbooks-create-invoice",
        {
          body: JSON.stringify({
            userId: user?.id,
            shoeings,
            customerId: selectedCustomerId,
          }),
        }
      );

      if (error) {
        console.error("Error from Edge Function:", error);
        throw error;
      }

      console.log("Invoice creation response:", JSON.stringify(data, null, 2));

      if (data.invoice && data.invoice.Invoice) {
        // Update shoeings status in your database
        for (const shoeing of shoeings) {
          const { error: updateError } = await supabase
            .from("shoeings")
            .update({
              status: "completed",
              Invoice: data.invoice.Invoice.Id,
            })
            .eq("id", shoeing.id);

          if (updateError) {
            console.error("Error updating shoeing status:", updateError);
            throw updateError;
          }
        }

        const invoiceNumber =
          data.invoice.Invoice.DocNumber ||
          data.invoice.Invoice.Id ||
          "Unknown";
        toast.success(
          `Shoeings accepted and invoice #${invoiceNumber} created in QuickBooks`
        );
        fetchPendingShoeings();
        setSelectedCustomers((prev) => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      } else {
        throw new Error("Failed to create invoice in QuickBooks");
      }
    } catch (error) {
      console.error("Error in handleAccept:", error);
      toast.error(
        `Failed to accept shoeings and create invoice: ${error.message}`
      );
    }
  };

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

  const toggleAccordion = (id: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredGroupedShoeings = Object.entries(groupedShoeings).reduce(
    (acc, [key, { displayName, shoeings }]) => {
      const filteredShoeings = shoeings.filter(
        (shoeing) =>
          shoeing["Horse Name"]
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          shoeing.Description.toLowerCase().includes(
            searchTerm.toLowerCase()
          ) ||
          shoeing["Location of Service"]
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
      if (filteredShoeings.length > 0) {
        acc[key] = { displayName, shoeings: filteredShoeings };
      }
      return acc;
    },
    {} as GroupedShoeings
  );

  function formatPrice(price: string | null): string {
    if (!price || price.trim() === "") {
      return "$0.00";
    }
    return price.startsWith("$") ? price : `$${price}`;
  }

  function formatPriceToNumber(price: string | null): number {
    if (!price) return 0;
    return parseFloat(price.replace(/[^0-9.-]+/g, ""));
  }

  const handleCustomerSelect = (key: string, customerId: string) => {
    setSelectedCustomers((prev) => ({ ...prev, [key]: customerId }));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shoeing Management Panel</h1>
      <Tabs defaultValue="approval" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="approval">Shoeing Approval</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="sent-invoices">Sent Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="approval">
          {renderShoeingApprovalContent()}
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsTab />
        </TabsContent>

        <TabsContent value="sent-invoices">
          <SentInvoicesTab />
        </TabsContent>
      </Tabs>
    </div>
  );

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
        {isLoading ? (
          <p>Loading...</p>
        ) : Object.keys(groupedShoeings).length === 0 ? (
          <p>No pending shoeings found.</p>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="space-y-4 bg-gray-100 p-4 rounded-md"
          >
            {Object.entries(groupedShoeings).map(
              ([key, { displayName, shoeings }]) => (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="text-lg font-semibold flex items-center justify-between w-full">
                    <span className="flex-grow pr-2 break-words">
                      {displayName} ({shoeings.length} shoeing
                      {shoeings.length > 1 ? "s" : ""})
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {shoeings.map((shoeing) => (
                        <Card
                          key={shoeing.id}
                          className="grid grid-rows-[auto_1fr_auto] h-full"
                        >
                          <CardContent className="p-4">
                            <h2 className="text-xl font-semibold mb-2">
                              {shoeing["Horse Name"]}
                            </h2>
                            <p className="text-sm text-gray-500 mb-2">
                              {new Date(
                                shoeing["Date of Service"]
                              ).toLocaleDateString()}
                            </p>
                            <p className="mb-2">
                              <strong>Location:</strong>{" "}
                              {shoeing["Location of Service"]}
                            </p>
                            <p className="mb-2">
                              <strong>Description:</strong>{" "}
                              {shoeing.Description}
                            </p>
                            {shoeing["Shoe Notes"] && (
                              <p className="mb-2">
                                <strong>Notes:</strong> {shoeing["Shoe Notes"]}
                              </p>
                            )}
                            <p className="font-semibold">
                              <strong>Total:</strong>{" "}
                              {formatPrice(shoeing["Total Cost"])}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="flex items-center mt-4 space-x-4">
                      <Button
                        onClick={() => handleAccept(key)}
                        disabled={!selectedCustomers[key]}
                      >
                        Accept All
                      </Button>
                      <Select
                        value={selectedCustomers[key] || ""}
                        onValueChange={(value) =>
                          handleCustomerSelect(key, value)
                        }
                        className="bg-white"
                      >
                        <SelectTrigger className="w-[200px] bg-white">
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {quickBooksData?.customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            )}
          </Accordion>
        )}
      </>
    );
  }
}

function SentInvoicesTab() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Sent Invoices</h2>
      <p>Sent invoices content goes here.</p>
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
