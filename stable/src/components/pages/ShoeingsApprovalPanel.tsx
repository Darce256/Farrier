import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Search } from "lucide-react";
import toast from "react-hot-toast";

interface Shoeing {
  id: string;
  "Date of Service": string;
  "Horse Name": string;
  Description: string;
  "Location of Service": string;
  "Base Service": string | null; // Changed from "Cost of Service"
  "Cost of Front Add-On's": string | null;
  "Cost of Hind Add-On's": string | null;
  "Total Cost": string | null;
  status: string;
}

export default function ShoeingsApprovalPanel() {
  const [shoeings, setShoeings] = useState<Shoeing[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPendingShoeings();
  }, []);

  async function fetchPendingShoeings() {
    const { data, error } = await supabase
      .from("shoeings")
      .select(
        'id, "Date of Service", "Horse Name", Description, "Location of Service", "Base Service", "Cost of Front Add-Ons", "Cost of Hind Add-Ons", "Total Cost", status'
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
    const { error } = await supabase
      .from("shoeings")
      .update({ status: "completed" })
      .eq("id", id);

    if (error) {
      console.error("Error accepting shoeing:", error);
      toast.error("Failed to accept shoeing");
    } else {
      toast.success("Shoeing accepted successfully");
      fetchPendingShoeings();
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from("shoeings")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      console.error("Error rejecting shoeing:", error);
      toast.error("Failed to reject shoeing");
    } else {
      toast.success("Shoeing rejected successfully");
      fetchPendingShoeings();
    }
  };

  const filteredShoeings = shoeings.filter(
    (shoeing) =>
      shoeing["Horse Name"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      shoeing.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shoeing["Location of Service"]
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

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
          <Card key={shoeing.id} className="overflow-hidden">
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
              <div className="mb-2">
                <p>
                  <strong>Base Price:</strong> $
                  {parseFloat(shoeing["Cost of Service"] || "0").toFixed(2)}
                </p>
                <p>
                  <strong>Front Add-Ons:</strong> $
                  {parseFloat(shoeing["Cost of Front Add-Ons"] || "0").toFixed(
                    2
                  )}
                </p>
                <p>
                  <strong>Hind Add-Ons:</strong> $
                  {parseFloat(shoeing["Cost of Hind Add-On's"] || "0").toFixed(
                    2
                  )}
                </p>
                <p className="font-semibold">
                  <strong>Total:</strong> $
                  {parseFloat(shoeing["Total Cost"] || "0").toFixed(2)}
                </p>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button
                  onClick={() => handleReject(shoeing.id)}
                  className="bg-white hover:bg-white  text-black hover:text-black flex-grow border border-black"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button
                  onClick={() => handleAccept(shoeing.id)}
                  className="bg-primary  text-white flex-grow"
                  size="sm"
                >
                  <Check className="w-4 h-4 mr-1" /> Accept
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
