import { useState, useEffect } from "react";
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

interface Shoeing {
  id: string;
  "Date of Service": string;
  "Horse Name": string;
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
  [key: string]: Shoeing[];
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

  useEffect(() => {
    checkQuickBooksConnection();
    fetchPendingShoeings();
  }, [user]);

  const checkQuickBooksConnection = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("quickbooks_tokens")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        // Check if the token is expired
        const expiresAt = new Date(data.expires_at);
        const now = new Date();
        if (expiresAt > now) {
          setIsQuickBooksConnected(true);
        } else {
          // Token is expired, attempt to refresh
          await refreshQuickBooksToken(data.refresh_token);
        }
      } else {
        setIsQuickBooksConnected(false);
      }
    } catch (error) {
      console.error("Error checking QuickBooks connection:", error);
      setIsQuickBooksConnected(false);
    }
  };

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

      let allHorses: Horse[] = [];
      let count = 0;
      let hasMore = true;

      while (hasMore) {
        const {
          data: horses,
          error: horsesError,
          count: totalCount,
        } = await supabase
          .from("horses")
          .select("*", { count: "exact" })
          .range(count, count + 999);

        if (horsesError) throw horsesError;

        if (horses) {
          allHorses = [...allHorses, ...horses];
          count += horses.length;
        }

        hasMore = totalCount !== null && count < totalCount;
      }

      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("*");

      if (customersError) throw customersError;

      // Create barn/trainer to email map
      const barnTrainerToEmailMap = new Map<string, string>();
      customers.forEach((customer: any) => {
        if (customer["Horses"] && customer["Owner Email"]) {
          const horses = customer["Horses"]
            .split(",")
            .map((h: string) => h.trim());
          horses.forEach((horse: any) => {
            const barnTrainer = horse.match(/\[(.*?)\]/)?.[1];
            if (barnTrainer) {
              barnTrainerToEmailMap.set(
                barnTrainer.toLowerCase(),
                customer["Owner Email"]
              );
            }
          });
        }
      });

      // Create horse entry to customer map
      const horseEntryToCustomerMap = new Map<
        string,
        { name: string; email: string }
      >();
      customers.forEach((customer: Customer) => {
        if (customer["Horses"] && customer["Owner Email"]) {
          const horses = customer["Horses"].split(",").map((h) => h.trim());
          horses.forEach((horse) => {
            horseEntryToCustomerMap.set(horse.toLowerCase(), {
              name: customer["Display Name"],
              email: customer["Owner Email"] || "",
            });
          });
        }
      });

      // Group shoeings
      const grouped = shoeings.reduce((acc: GroupedShoeings, shoeing: any) => {
        const horseEntry = shoeing.Horses?.trim().toLowerCase();
        let customerEmail = horseEntry
          ? horseEntryToCustomerMap.get(horseEntry)?.email
          : undefined;

        if (!customerEmail) {
          if (shoeing["Owner Email"]) {
            customerEmail = shoeing["Owner Email"];
          } else if (shoeing["QB Customers"]) {
            const qbCustomers = JSON.parse(shoeing["QB Customers"]);
            const emails = qbCustomers.match(
              /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
            );
            customerEmail = emails ? emails[0] : "Unknown";
          } else {
            customerEmail = "Unknown";
          }
        }

        if (!acc[customerEmail as string]) {
          acc[customerEmail as string] = [];
        }
        acc[customerEmail as string].push(shoeing);
        return acc;
      }, {});

      setGroupedShoeings(grouped);
    } catch (error) {
      toast.error("Failed to fetch pending shoeings");
    } finally {
      setIsLoading(false);
    }
  }

  const handleAccept = async (customerEmail: string) => {
    try {
      const shoeings = groupedShoeings[customerEmail];

      const { data, error } = await supabase.functions.invoke(
        "quickbooks-create-invoice",
        {
          body: JSON.stringify({
            shoeings,
            customerEmail,
            userId: user?.id,
          }),
        }
      );

      if (error) throw error;

      // Update shoeings status in your database
      for (const shoeing of shoeings) {
        const { error } = await supabase
          .from("shoeings")
          .update({ status: "completed" })
          .eq("id", shoeing.id);

        if (error) throw error;
      }

      toast.success("Shoeings accepted and invoice created in QuickBooks");
      fetchPendingShoeings();
    } catch (error) {
      console.error("Error in handleAccept:", error);
      toast.error("Failed to accept shoeings and create invoice");
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
    (acc, [email, shoeings]) => {
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
        acc[email] = filteredShoeings;
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shoeing Approval Panel</h1>
      <div className="mb-4 relative">
        <Input
          type="text"
          placeholder="Search Shoeings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
      </div>
      {Object.keys(groupedShoeings).length === 0 ? (
        <p>No pending shoeings found.</p>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {Object.entries(groupedShoeings).map(([email, shoeings]) => (
            <AccordionItem key={email} value={email}>
              <AccordionTrigger className="text-lg font-semibold">
                {email} ({shoeings.length} shoeing
                {shoeings.length > 1 ? "s" : ""})
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
                          <strong>Description:</strong> {shoeing.Description}
                        </p>
                        {shoeing["Shoe Notes"] && (
                          <p className="mb-2">
                            <strong>Notes:</strong> {shoeing["Shoe Notes"]}
                          </p>
                        )}
                        <div className="mb-2">
                          <div
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => toggleAccordion(shoeing.id)}
                          >
                            <p className="font-semibold">
                              <strong>Total:</strong>{" "}
                              {formatPrice(shoeing["Total Cost"])}
                            </p>
                            {expandedCards.has(shoeing.id) ? (
                              <ChevronUp size={20} />
                            ) : (
                              <ChevronDown size={20} />
                            )}
                          </div>
                          {expandedCards.has(shoeing.id) && (
                            <div className="mt-2 pl-4 border-l-2 border-gray-200">
                              <p>
                                <strong>Base Service:</strong>{" "}
                                {shoeing["Base Service"] || "N/A"}
                              </p>
                              <p>
                                <strong>Base Price:</strong>{" "}
                                {formatPrice(shoeing["Cost of Service"])}
                              </p>
                              <p>
                                <strong>Front Add-Ons:</strong>{" "}
                                {formatPrice(shoeing["Cost of Front Add-Ons"])}
                              </p>
                              <p>
                                <strong>Hind Add-Ons:</strong>{" "}
                                {formatPrice(shoeing["Cost of Hind Add-Ons"])}
                              </p>
                              {shoeing["Other Custom Services"] && (
                                <p>
                                  <strong>Custom Services:</strong>{" "}
                                  {shoeing["Other Custom Services"]}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <div className="self-end p-4">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleReject(shoeing.id)}
                            className="bg-red-500 text-white flex-grow border"
                            variant="destructive"
                            size="sm"
                          >
                            <X className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <Button
                    onClick={() => handleAccept(email)}
                    className="bg-green-500 text-white hover:bg-green-600"
                    variant="default"
                  >
                    <Check className="w-4 h-4 mr-1" /> Accept All
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="container mx-auto p-4">
      <Skeleton className="w-1/2 h-8 mb-4" /> {/* Title skeleton */}
      <Skeleton className="w-full h-10 mb-4" /> {/* Search input skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="w-3/4 h-6 mb-2" /> {/* Accordion title */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((j) => (
                <Card key={j} className="h-64">
                  <CardContent className="p-4">
                    <Skeleton className="w-3/4 h-6 mb-2" />
                    <Skeleton className="w-1/2 h-4 mb-2" />
                    <Skeleton className="w-full h-4 mb-2" />
                    <Skeleton className="w-full h-4 mb-2" />
                    <Skeleton className="w-3/4 h-4 mb-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
