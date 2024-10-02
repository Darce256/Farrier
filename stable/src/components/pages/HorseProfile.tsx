import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Horse } from "@/lib/horseService";
import { supabase } from "@/lib/supabaseClient";
import { House } from "lucide-react"; // Import the Barn icon

export default function HorseProfile() {
  const { id } = useParams<{ id: string }>();
  const [horse, setHorse] = useState<Horse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHorse() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("horses")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setHorse(data);
      } catch (err) {
        console.error("Error fetching horse:", err);
        setError("Failed to load horse profile");
      } finally {
        setLoading(false);
      }
    }

    fetchHorse();
  }, [id]);

  if (loading) return <div className="container mx-auto p-4">Loading...</div>;
  if (error) return <div className="container mx-auto p-4">{error}</div>;
  if (!horse)
    return <div className="container mx-auto p-4">Horse not found</div>;

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full rounded-lg shadow-md border border-gray-200">
        <CardHeader className="bg-primary p-6 rounded-t-lg">
          <div className="flex items-center gap-4">
            <div className="grid gap-1">
              <h2 className="text-2xl font-bold text-white">{horse.Name}</h2>
              <div className="flex items-center text-white/80">
                <House className="w-4 h-4 mr-2" />
                <p>{horse["Barn / Trainer"]}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 grid gap-6">
          <div className="grid gap-2">
            <h3 className="text-lg font-semibold">About {horse.Name}</h3>
            <p className="text-muted-foreground">
              {horse["Note w/ Time Stamps (from History)"] ||
                "No additional information available."}
            </p>
          </div>
          <Separator />
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Key Facts</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center">
                <House className="w-4 h-4 mr-2" />
                <span className="font-medium">Barn / Trainer:</span>
              </div>
              <div>
                <span>{horse["Barn / Trainer"] || "Unknown"}</span>
              </div>
              {/* Add more key facts here as needed */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
