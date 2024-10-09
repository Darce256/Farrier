import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Search, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/Contexts/AuthProvider"; // Update this import
import axios from "axios"; // Make sure to install axios if you haven't already

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
  "Other Custom Services": string | null; // Add this line
  "Shoe Notes": string | null; // Add this line
}

export default function ShoeingsApprovalPanel() {
  const [shoeings, setShoeings] = useState<Shoeing[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { user } = useAuth(); // Use the useAuth hook to get the current user

  useEffect(() => {
    fetchPendingShoeings();
  }, []);

  async function fetchPendingShoeings() {
    const { data, error } = await supabase
      .from("shoeings")
      .select(
        'id, "Date of Service", "Horse Name", Description, "Location of Service", "Base Service", "Cost of Service", "Cost of Front Add-Ons", "Cost of Hind Add-Ons", "Total Cost", status, "Other Custom Services", "Shoe Notes"'
      )
      .eq("status", "pending")
      .order("Date of Service", { ascending: false });

    if (error) {
      console.error("Error fetching shoeings:", error);
      toast.error("Failed to fetch pending shoeings");
    } else {
      setShoeings(data as any[]);
    }
  }

  const handleAccept = async (id: string) => {
    try {
      // Update the shoeing status in Supabase
      const { error } = await supabase
        .from("shoeings")
        .update({ status: "completed" })
        .eq("id", id);

      if (error) throw error;

      // Fetch the shoeing details
      const { data: shoeing, error: fetchError } = await supabase
        .from("shoeings")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Format price fields
      const formattedShoeing = {
        ...shoeing,
        "Cost of Service": formatPriceToNumber(shoeing["Cost of Service"]),
        "Cost of Front Add-Ons": formatPriceToNumber(
          shoeing["Cost of Front Add-Ons"]
        ),
        "Cost of Hind Add-Ons": formatPriceToNumber(
          shoeing["Cost of Hind Add-Ons"]
        ),
        "Total Cost": formatPriceToNumber(shoeing["Total Cost"]),
      };

      // Call the webhook
      const webhookUrl =
        "https://hook.us1.make.com/798unwi7mntog9f1du94m0qwsstofx9u";
      await axios.post(webhookUrl, formattedShoeing);

      toast.success("Shoeing accepted and invoice creation initiated");
      fetchPendingShoeings();
    } catch (error) {
      console.error("Error accepting shoeing:", error);
      toast.error("Failed to accept shoeing");
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
      console.error("Error rejecting shoeing:", error);
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

  const filteredShoeings = shoeings.filter(
    (shoeing) =>
      shoeing["Horse Name"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      shoeing.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shoeing["Location of Service"]
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  function formatPrice(price: string | null): string {
    if (!price || price.trim() === "") {
      return "$0.00";
    }
    // If the price doesn't start with '$', add it
    return price.startsWith("$") ? price : `$${price}`;
  }

  // Helper function to format price strings to numbers
  function formatPriceToNumber(price: string | null): number {
    if (!price) return 0;
    return parseFloat(price.replace(/[^0-9.-]+/g, ""));
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShoeings.map((shoeing: any) => (
          <Card
            key={shoeing.id}
            className="grid grid-rows-[auto_1fr_auto] h-full"
          >
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-2">
                {shoeing["Horse Name"]}
              </h2>
              <p className="text-sm text-gray-500 mb-2">
                {new Date(shoeing["Date of Service"]).toLocaleDateString()}
              </p>
              <p className="mb-2">
                <strong>Location:</strong> {shoeing["Location of Service"]}
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
                    <strong>Total:</strong> {formatPrice(shoeing["Total Cost"])}
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
                <Button
                  onClick={() => handleAccept(shoeing.id)}
                  className="bg-green-500 text-white flex-grow hover:bg-green-600"
                  variant="default"
                  size="sm"
                >
                  <Check className="w-4 h-4 mr-1" /> Accept
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
