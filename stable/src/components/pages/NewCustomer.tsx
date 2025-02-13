import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { HorseSelect } from "../ui/horse-select";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Horse {
  id: string;
  Name: string;
  "Barn / Trainer": string;
}

interface Customer {
  id: string;
  "Display Name": string | null;
  "Company/Horses Name": string | null;
  Horses: string | null;
  "Barn / Trainer": string | null;
  "Owner Notes": string | null;
  "Owner Email": string | null;
  Phone: string | null;
  created_at: string;
}

// Email validation helper function
const validateEmails = (emails: string): boolean => {
  if (!emails.trim()) return true; // Allow empty
  const emailList = emails.split(",").map((e) => e.trim());
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailList.every((email) => emailRegex.test(email));
};

export default function NewCustomer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [selectedHorses, setSelectedHorses] = useState<string[]>([]);
  const [barnInput, setBarnInput] = useState("");
  const [existingBarns, setExistingBarns] = useState<string[]>([]);
  const [showBarnSuggestions, setShowBarnSuggestions] = useState(false);
  const [emailError, setEmailError] = useState<string>("");

  useEffect(() => {
    fetchHorses();
    fetchExistingBarns();
    if (id) {
      fetchCustomer();
    }
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("#barn-trainer-input")) {
        setShowBarnSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchHorses = async () => {
    try {
      const { data, error } = await supabase
        .from("horses")
        .select('id, Name, "Barn / Trainer", Customers')
        .order("Name");

      if (error) throw error;
      setHorses(data || []);
    } catch (error) {
      console.error("Error fetching horses:", error);
      toast.error("Failed to fetch horses");
    }
  };

  const fetchExistingBarns = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select('"Barn / Trainer"')
        .not('"Barn / Trainer"', "is", null);

      if (error) throw error;

      const uniqueBarns = Array.from(
        new Set(data.map((item) => item["Barn / Trainer"]))
      )
        .filter(Boolean)
        .sort();

      setExistingBarns(uniqueBarns);
    } catch (err) {
      console.error("Error fetching barns:", err);
    }
  };

  const fetchCustomer = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setCustomer(data);
      setBarnInput(data["Barn / Trainer"] || "");
      setSelectedHorses(
        data.Horses
          ? data.Horses.split(",")
              .map((h: string) => {
                const h_trim = h.trim();
                const dashBracketMatch = h_trim.match(
                  /^(.+?)\s*-\s*\[(.+?)\]$/
                );
                if (dashBracketMatch) {
                  const [_, name, barn] = dashBracketMatch;
                  return `${name.trim()}__${barn.trim()}`;
                }
                return h_trim;
              })
              .filter(Boolean)
          : []
      );
    } catch (error) {
      console.error("Error fetching customer:", error);
      toast.error("Failed to fetch customer");
    }
  };

  const formatHorseName = (horseName: string) => {
    const [name, barn] = horseName.split("__");
    const horse = horses.find(
      (h) => h.Name === name && (h["Barn / Trainer"] || "No Barn") === barn
    );
    if (!horse) return horseName;
    return `${horse.Name} - [${horse["Barn / Trainer"] || "No Barn"}]`;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emails = e.target.value;
    if (!validateEmails(emails)) {
      setEmailError("Please enter valid email addresses separated by commas");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerData = Object.fromEntries(formData.entries());

    // Validate emails before submission
    if (!validateEmails(customerData["Owner Email"] as string)) {
      toast.error("Please fix the email format before submitting");
      return;
    }

    try {
      // Format horse entries consistently
      const formattedHorses = selectedHorses
        .map(formatHorseName)
        .filter(Boolean);
      console.log("Selected Horses:", selectedHorses);
      console.log("Formatted Horses:", formattedHorses);
      customerData.Horses = formattedHorses.join(", ");

      if (id) {
        // Get current customer's horses before update
        const { data: currentCustomer } = await supabase
          .from("customers")
          .select("Horses")
          .eq("id", id)
          .single();

        const previousHorses = currentCustomer?.Horses
          ? currentCustomer.Horses.split(",")
              .map((h: string) => {
                const h_trim = h.trim();
                // Extract name and barn from "name - [barn]" format
                const dashBracketMatch = h_trim.match(
                  /^(.+?)\s*-\s*\[(.+?)\]$/
                );
                if (dashBracketMatch) {
                  const [_, name, barn] = dashBracketMatch;
                  return `${name.trim()}__${barn.trim()}`;
                }
                return h_trim;
              })
              .filter(Boolean)
          : [];

        // Update customer record
        const { error } = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", id);
        if (error) throw error;

        // Handle horse relationships
        // Remove customer from unselected horses
        for (const horseName of previousHorses) {
          if (!selectedHorses.includes(horseName)) {
            // Parse horse name and barn from the format "name__barn"
            const match = horseName.match(/^(.+?)__(.+?)$/);
            if (!match) {
              console.log("Failed to parse horse name format:", horseName);
              continue;
            }
            const [_, name, barn] = match;

            const { data: horseData } = await supabase
              .from("horses")
              .select("*")
              .ilike("Name", name.trim())
              .ilike('"Barn / Trainer"', barn.trim())
              .maybeSingle();

            console.log("Horse query debug:", {
              searchName: name.trim(),
              searchBarn: barn.trim(),
              result: horseData,
              query:
                'SELECT * FROM horses WHERE Name ILIKE $1 AND "Barn / Trainer" ILIKE $2',
            });

            if (horseData) {
              const currentCustomers = horseData.Customers
                ? horseData.Customers.split(",").map((c: string) => c.trim())
                : [];
              const updatedCustomers = currentCustomers
                .filter((c: string) => c !== customerData["Display Name"])
                .join(", ");

              await supabase
                .from("horses")
                .update({ Customers: updatedCustomers || null })
                .ilike("Name", name.trim())
                .ilike('"Barn / Trainer"', barn.trim());

              // Update any pending shoeings for this horse to remove the customer
              const formattedHorseName = `${name.trim()} - [${barn.trim()}]`;

              const { data: shoeings, error: findError } = await supabase
                .from("shoeings")
                .select("*")
                .eq("Horses", formattedHorseName)
                .eq("QB Customers", customerData["Display Name"])
                .eq("status", "pending");

              if (findError) {
                console.error(
                  "Error finding pending shoeings to update:",
                  findError
                );
              } else {
                console.log("Found pending shoeings to update:", shoeings);

                if (shoeings && shoeings.length > 0) {
                  const { error: updateError } = await supabase
                    .from("shoeings")
                    .update({
                      "QB Customers": null,
                      "Owner Email": null,
                    })
                    .eq("Horses", formattedHorseName)
                    .eq("QB Customers", customerData["Display Name"])
                    .eq("status", "pending");

                  if (updateError) {
                    console.error(
                      "Error updating pending shoeings:",
                      updateError
                    );
                  } else {
                    console.log(
                      "Successfully cleared QB Customers for pending shoeings:",
                      {
                        horseName: formattedHorseName,
                        count: shoeings.length,
                      }
                    );
                  }
                } else {
                  console.log(
                    "No pending shoeings found to update for:",
                    formattedHorseName
                  );
                }
              }
            }
          }
        }

        // Add customer to newly selected horses
        for (const horseName of selectedHorses) {
          if (!previousHorses.includes(horseName)) {
            // Parse horse name and barn from the format "name__barn"
            const match = horseName.match(/^(.+?)__(.+?)$/);
            if (!match) {
              console.log("Failed to parse horse name format:", horseName);
              continue;
            }
            const [_, name, barn] = match;

            const { data: horseData } = await supabase
              .from("horses")
              .select("*")
              .ilike("Name", name.trim())
              .ilike('"Barn / Trainer"', barn.trim())
              .maybeSingle();

            if (horseData) {
              const currentCustomers = horseData.Customers
                ? horseData.Customers.split(",").map((c: string) => c.trim())
                : [];

              if (!currentCustomers.includes(customerData["Display Name"])) {
                currentCustomers.push(customerData["Display Name"]);

                try {
                  // First verify the horse exists
                  const { data: _verifyHorse, error: verifyError } =
                    await supabase
                      .from("horses")
                      .select("*")
                      .ilike("Name", name.trim())
                      .ilike('"Barn / Trainer"', barn.trim())
                      .maybeSingle();

                  if (verifyError) {
                    console.error("Failed to verify horse exists:", {
                      error: verifyError,
                      horseName: name.trim(),
                      barnName: barn.trim(),
                    });
                    throw verifyError;
                  }

                  // Now attempt the update
                  const { data: _updateData, error: updateError } =
                    await supabase
                      .from("horses")
                      .update({ Customers: currentCustomers.join(", ") })
                      .ilike("Name", name.trim())
                      .ilike('"Barn / Trainer"', barn.trim())
                      .select();

                  if (updateError) {
                    console.error("Failed to update horse customers:", {
                      error: updateError,
                      horseName: name.trim(),
                      barnName: barn.trim(),
                      newCustomers: currentCustomers.join(", "),
                    });
                    throw updateError;
                  }

                  // Verify the update was successful
                  const { data: _verifyUpdate, error: verifyUpdateError } =
                    await supabase
                      .from("horses")
                      .select("*")
                      .ilike("Name", name.trim())
                      .ilike('"Barn / Trainer"', barn.trim())
                      .maybeSingle();

                  if (verifyUpdateError) {
                    console.error(
                      "Failed to verify update:",
                      verifyUpdateError
                    );
                  }
                } catch (error) {
                  console.error(
                    "Exception during horse update process:",
                    error
                  );
                  throw error;
                }
              } else {
                console.log("Customer already exists for horse:", {
                  horseName: name.trim(),
                  customers: currentCustomers,
                  displayName: customerData["Display Name"],
                });
              }
            } else {
              console.log("No horse data found for:", {
                horseName: name.trim(),
                barnName: barn.trim(),
              });
            }
          }
        }

        // Update all pending shoeings for currently selected horses
        if (selectedHorses.length > 0) {
          // Parse horse names to include barn info in the IN clause
          const formattedHorseNames = selectedHorses
            .map((horseName) => {
              const match = horseName.match(/^(.+?)__(.+?)$/);
              if (!match) {
                console.log("Failed to parse horse name format:", horseName);
                return null;
              }
              const [_, name, barn] = match;
              return `${name.trim()} - [${barn.trim()}]`;
            })
            .filter(Boolean);

          const { error: shoeingError } = await supabase
            .from("shoeings")
            .update({
              "QB Customers": customerData["Display Name"],
              "Owner Email": customerData["Owner Email"],
            })
            .in("Horses", formattedHorseNames)
            .eq("status", "pending");

          if (shoeingError) {
            console.error(
              "Error updating shoeings for selected horses:",
              shoeingError
            );
          }
        }

        toast.success("Customer updated successfully");
      } else {
        // Create new customer
        const { error } = await supabase
          .from("customers")
          .insert([customerData]);
        if (error) throw error;

        // Add customer to all selected horses
        for (const horseName of selectedHorses) {
          // Parse horse name and barn from the format "name__barn"
          const match = horseName.match(/^(.+?)__(.+?)$/);
          console.log("Horse parsing:", { horseName, match });
          if (!match) {
            console.log("Failed to parse horse name format:", horseName);
            continue;
          }
          const [_, name, barn] = match;
          console.log("Parsed horse:", {
            name: name.trim(),
            barn: barn.trim(),
          });

          const { data: horseData, error: _horseError } = await supabase
            .from("horses")
            .select("*")
            .ilike("Name", name.trim())
            .ilike('"Barn / Trainer"', barn.trim())
            .maybeSingle();

          console.log("Horse query debug:", {
            searchName: name.trim(),
            searchBarn: barn.trim(),
            result: horseData,
            query:
              'SELECT * FROM horses WHERE Name ILIKE $1 AND "Barn / Trainer" ILIKE $2',
          });

          if (horseData) {
            const currentCustomers = horseData.Customers
              ? horseData.Customers.split(",").map((c: string) => c.trim())
              : [];

            if (!currentCustomers.includes(customerData["Display Name"])) {
              currentCustomers.push(customerData["Display Name"]);

              try {
                // First verify the horse exists
                const { data: _verifyHorse, error: verifyError } =
                  await supabase
                    .from("horses")
                    .select("*")
                    .ilike("Name", name.trim())
                    .ilike('"Barn / Trainer"', barn.trim())
                    .maybeSingle();

                if (verifyError) {
                  console.error("Failed to verify horse exists:", {
                    error: verifyError,
                    horseName: name.trim(),
                    barnName: barn.trim(),
                  });
                  throw verifyError;
                }

                // Now attempt the update
                const { data: _updateData, error: updateError } = await supabase
                  .from("horses")
                  .update({ Customers: currentCustomers.join(", ") })
                  .ilike("Name", name.trim())
                  .ilike('"Barn / Trainer"', barn.trim())
                  .select();

                if (updateError) {
                  console.error("Failed to update horse customers:", {
                    error: updateError,
                    horseName: name.trim(),
                    barnName: barn.trim(),
                    newCustomers: currentCustomers.join(", "),
                  });
                  throw updateError;
                }

                // Verify the update was successful
                const { data: _verifyUpdate, error: verifyUpdateError } =
                  await supabase
                    .from("horses")
                    .select("*")
                    .ilike("Name", name.trim())
                    .ilike('"Barn / Trainer"', barn.trim())
                    .maybeSingle();

                if (verifyUpdateError) {
                  console.error("Failed to verify update:", verifyUpdateError);
                }
              } catch (error) {
                console.error("Exception during horse update process:", error);
                throw error;
              }
            }
          }
        }

        // Update shoeings for selected horses
        if (selectedHorses.length > 0) {
          // Parse horse names to include barn info in the IN clause
          const horseNames = selectedHorses
            .map((horseName) => {
              const match = horseName.match(/^(.+?)__(.+?)$/);
              if (!match) {
                console.log("Failed to parse horse name format:", horseName);
                return null;
              }
              const [_, name] = match;
              return name.trim();
            })
            .filter(Boolean);

          await supabase
            .from("shoeings")
            .update({
              "QB Customers": customerData["Display Name"],
              "Owner Email": customerData["Owner Email"],
            })
            .in("Horses", horseNames)
            .eq("status", "pending");
        }

        toast.success("Customer added successfully");
      }
      navigate("/shoeings-approval-panel?tab=customers");
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Failed to save customer");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {id ? "Edit Customer" : "Add New Customer"}
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate("/shoeings-approval-panel?tab=customers")}
        >
          Cancel
        </Button>
      </div>

      <div className="border rounded-lg p-6 bg-white">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Display Name">Display Name</Label>
              <Input
                id="Display Name"
                name="Display Name"
                required
                defaultValue={customer?.["Display Name"] || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Company/Horses Name">Company/Horses Name</Label>
              <Input
                id="Company/Horses Name"
                name="Company/Horses Name"
                defaultValue={customer?.["Company/Horses Name"] || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Barn / Trainer">Barn / Trainer</Label>
              <div className="relative" id="barn-trainer-input">
                <Input
                  id="Barn / Trainer"
                  name="Barn / Trainer"
                  value={barnInput}
                  onChange={(e) => {
                    setBarnInput(e.target.value);
                    setShowBarnSuggestions(true);
                  }}
                  onFocus={() => setShowBarnSuggestions(true)}
                />
                {showBarnSuggestions && existingBarns.length > 0 && (
                  <div className="absolute w-full z-10 top-full mt-1 bg-white border rounded-md shadow-lg">
                    <ScrollArea className="max-h-[200px]">
                      <div className="p-1">
                        {existingBarns
                          .filter((barn) =>
                            barn.toLowerCase().includes(barnInput.toLowerCase())
                          )
                          .map((barn) => (
                            <Button
                              key={barn}
                              type="button"
                              variant="ghost"
                              className="w-full text-left flex items-center px-2 py-1 hover:bg-accent"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setBarnInput(barn);
                                setShowBarnSuggestions(false);
                              }}
                            >
                              {barn}
                            </Button>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="Owner Email">Email(s)</Label>
              <Input
                id="Owner Email"
                name="Owner Email"
                type="text"
                defaultValue={customer?.["Owner Email"] || ""}
                onChange={handleEmailChange}
                placeholder="Enter email addresses separated by commas"
              />
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="Phone">Phone</Label>
              <Input
                id="Phone"
                name="Phone"
                defaultValue={customer?.Phone || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Horses">Horses</Label>
              <HorseSelect
                horses={horses}
                selectedHorses={selectedHorses}
                onHorseChange={(selected) => {
                  setSelectedHorses(selected);
                  const input = document.querySelector(
                    'input[name="Horses"]'
                  ) as HTMLInputElement;
                  if (input) {
                    const formattedHorses = selected
                      .map(formatHorseName)
                      .filter(Boolean);
                    input.value = formattedHorses.join(", ");
                  }
                }}
                placeholder="Search and select horses..."
              />
              <Input
                id="Horses"
                name="Horses"
                type="hidden"
                value={
                  horses.length > 0
                    ? selectedHorses
                        .map(formatHorseName)
                        .filter(Boolean)
                        .join(", ")
                    : ""
                }
                readOnly
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="Owner Notes">Notes</Label>
            <Textarea
              id="Owner Notes"
              name="Owner Notes"
              defaultValue={customer?.["Owner Notes"] || ""}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/shoeings-approval-panel?tab=customers")}
            >
              Cancel
            </Button>
            <Button type="submit">Save Customer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
