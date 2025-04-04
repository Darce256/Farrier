import { useState, useEffect, useCallback, useRef } from "react";
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
  AlertCircle,
  Edit,
  Trash2,
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
import { useIsMobile } from "@/hooks/useIsMobile";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CustomersTab from "./CustomersTab";
import { useSearchParams } from "react-router-dom";
import HorsesTab from "./HorsesTab";

interface Shoeing {
  Horses: any; // Keep this for backward compatibility
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
  horse_id: string | null; // Add horse_id field
  customers: {
    "Display Name": string;
    Horses: string;
  };
  alert?: string | null;
  is_new_horse?: boolean;
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

// Update the CustomerData interface by replacing the generic index signature
interface CustomerData {
  id: string;
  "Display Name": string;
  email?: string;
  companyName?: string;
  address?: string;
  phoneNumber?: string;
  // Removing generic index signature to avoid duplication
}

// Add these constants at the top of your file
const QUICKBOOKS_CLIENT_ID = import.meta.env.VITE_QUICKBOOKS_CLIENT_ID;

// If you need to dynamically set the redirect URI based on the current environment:
const isDevelopment = import.meta.env.MODE === "development";
const dynamicRedirectUri = isDevelopment
  ? "http://localhost:5173/quickbooks-callback"
  : "https://www.jtesimms.com/quickbooks-callback";

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const options = React.Children.toArray(children).filter((child) =>
    (child as React.ReactElement).props.children
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      setSelectedIndex((prev) => Math.min(prev + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const itemHeight = 35;
  const height = Math.min(300, itemHeight * options.length);

  useEffect(() => {
    // Focus the input when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <SelectContent ref={ref} className={`p-0 ${className}`} {...props}>
      <div onKeyDown={handleKeyDown} className="p-2">
        <Input
          ref={inputRef}
          placeholder="Search customers..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mb-2"
          onTouchStart={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
        <List
          height={height}
          itemCount={options.length}
          itemSize={itemHeight}
          width="100%"
          overscanCount={5}
        >
          {({ index, style }) => (
            <div style={style}>
              {React.cloneElement(options[index] as React.ReactElement, {
                onMouseEnter: () => setSelectedIndex(index),
                style: {
                  backgroundColor:
                    index === selectedIndex
                      ? "rgba(0, 0, 0, 0.08)"
                      : "transparent",
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

// Add this interface for the horse data
interface Horse {
  Name: string;
  "Barn / Trainer": string;
  "Owner Email": string | null;
  "Owner Phone": string | null;
  History: string | null;
  "Horse Notes History": string | null;
  "Note w/ Time Stamps (from History)": string | null;
  id: string;
  status: string;
  alert: string | null;
  created_at: string;
}

// Update the ReviewHorseModal component
interface ReviewHorseModalProps {
  horse: Shoeing;
  onClose: () => void;
  onUpdate?: (updatedHorse: Shoeing) => void; // Add this prop
}

// Add this helper function for phone number formatting
const formatPhoneNumber = (value: string) => {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, "");

  // Format as (XXX) XXX-XXXX
  if (cleaned.length >= 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6,
      10
    )}`;
  } else if (cleaned.length > 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  } else if (cleaned.length > 3) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else if (cleaned.length > 0) {
    return `(${cleaned}`;
  }
  return cleaned;
};

// Add this helper function to validate email
const isValidEmail = (email: string | null): boolean => {
  if (!email) return true; // Allow empty email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

function ReviewHorseModal({ horse, onClose, onUpdate }: ReviewHorseModalProps) {
  const [horseDetails, setHorseDetails] = useState<Horse | null>(null);
  const [editedDetails, setEditedDetails] = useState<Horse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [barns, setBarns] = useState<string[]>([]);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Fetch unique barns
  useEffect(() => {
    async function fetchBarns() {
      try {
        const { data, error } = await supabase
          .from("horses")
          .select('"Barn / Trainer"') // Added double quotes
          .not('"Barn / Trainer"', "is", null); // Added double quotes here too

        if (error) throw error;

        // Get unique barns and sort them
        const uniqueBarns = Array.from(
          new Set(data.map((item) => item["Barn / Trainer"]))
        )
          .filter(Boolean)
          .sort();

        setBarns(uniqueBarns);
      } catch (err) {
        console.error("Error fetching barns:", err);
      }
    }

    fetchBarns();
  }, []);

  useEffect(() => {
    async function fetchHorseDetails() {
      try {
        // If we already have horse details and an ID, use that instead of parsing the horse string
        if (horseDetails?.id) {
          const { data, error } = await supabase
            .from("horses")
            .select("*")
            .eq("id", horseDetails.id)
            .single();

          if (error) throw error;
          if (!data) throw new Error("Horse not found");

          setHorseDetails(data);
          setEditedDetails(data);
          return;
        }

        // If horse has horse_id, use that for the initial fetch
        if (horse.horse_id) {
          const { data, error } = await supabase
            .from("horses")
            .select("*")
            .eq("id", horse.horse_id)
            .single();

          if (error) throw error;
          if (!data) throw new Error("Horse not found");

          setHorseDetails(data);
          setEditedDetails(data);
          return;
        }

        // Fall back to the old string parsing method for backward compatibility
        const [horseName, barnTrainer] = horse.Horses.split(" - ");
        const cleanBarnTrainer = barnTrainer.replace(/[\[\]]/g, "");
        const { data, error } = await supabase
          .from("horses")
          .select("*")
          .eq("Name", horseName)
          .eq('"Barn / Trainer"', cleanBarnTrainer)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Horse not found");

        setHorseDetails(data);
        setEditedDetails(data);
      } catch (err) {
        console.error("Error fetching horse details:", err);
        setError("Failed to load horse details");
      } finally {
        setLoading(false);
      }
    }

    fetchHorseDetails();
  }, [horse, horseDetails?.id]); // Add horse.horse_id to dependencies

  // Update the handleInputChange function
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editedDetails) return;

    const { id, value } = e.target;

    // Validate email when it changes
    if (id === "Owner Email" && value) {
      if (!isValidEmail(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError(null);
      }
    }

    setEditedDetails((prev) => ({
      ...prev!,
      [id]: value,
    }));
  };

  const handleBarnChange = (value: string) => {
    if (!editedDetails) return;
    setEditedDetails((prev) => ({
      ...prev!,
      "Barn / Trainer": value,
    }));
  };

  const handleSave = async () => {
    if (!editedDetails) return;

    try {
      // Update the horse record
      const { error: horseError } = await supabase
        .from("horses")
        .update({
          Name: editedDetails.Name,
          "Barn / Trainer": editedDetails["Barn / Trainer"],
          "Owner Email": editedDetails["Owner Email"],
          "Owner Phone": editedDetails["Owner Phone"],
          alert: editedDetails.alert,
          History: editedDetails.History,
          "Horse Notes History": editedDetails["Horse Notes History"],
        })
        .eq("id", editedDetails.id);

      if (horseError) throw horseError;

      // Get the existing description's service part (after the hyphen)
      const descriptionParts = horse.Description?.split(" - ");
      const servicePart = descriptionParts?.[1] || "";

      // Create new description with updated horse name
      const newDescription = `${editedDetails.Name} - ${servicePart}`;

      // For backward compatibility, still update the Horses string field
      const newHorsesFormat = `${editedDetails.Name} - [${editedDetails["Barn / Trainer"]}]`;

      // Update the shoeing record with both the string format and horse_id
      const { data: updatedShoeing, error: shoeingError } = await supabase
        .from("shoeings")
        .update({
          Horses: newHorsesFormat,
          "Horse Name": editedDetails.Name,
          "Owner Email": editedDetails["Owner Email"],
          Description: newDescription,
          horse_id: editedDetails.id, // Add horse_id for proper relationship
        })
        .eq("id", horse.id)
        .select()
        .single();

      if (shoeingError) throw shoeingError;

      // Update customer_horses junction table if this is a new horse
      if (horse.is_new_horse && horse["QB Customers"]) {
        // First, find the customer ID based on the QB Customers name
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("id")
          .eq("Display Name", horse["QB Customers"])
          .single();

        if (!customerError && customerData) {
          // Check if the relationship already exists
          const { data: existingRelation, error: relationCheckError } =
            await supabase
              .from("customer_horses")
              .select("*")
              .eq("customer_id", customerData.id)
              .eq("horse_id", editedDetails.id)
              .single();

          if (!existingRelation && !relationCheckError) {
            // Create a new relationship in the junction table
            await supabase.from("customer_horses").insert({
              customer_id: customerData.id,
              horse_id: editedDetails.id,
            });
          }
        }
      }

      setHorseDetails(editedDetails);
      setIsEditing(false);

      // Call the onUpdate callback with the updated shoeing
      if (onUpdate && updatedShoeing) {
        onUpdate(updatedShoeing);
      }

      toast.success("Horse details updated successfully");
    } catch (err) {
      console.error("Error updating horse:", err);
      toast.error("Failed to update horse details");
    }
  };

  const handleCancelEdit = () => {
    // Reset editedDetails back to original horseDetails
    setEditedDetails(horseDetails);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading horse details...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <p className="text-red-500">{error}</p>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review New Horse: {horse["Horse Name"]}</DialogTitle>
        </DialogHeader>

        {editedDetails && (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                {isEditing ? (
                  <Input
                    id="Name"
                    value={editedDetails.Name}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm">{editedDetails.Name}</p>
                )}
              </div>
              <div>
                <Label>Barn / Trainer</Label>
                {isEditing ? (
                  <Select
                    value={editedDetails["Barn / Trainer"]}
                    onValueChange={handleBarnChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a barn" />
                    </SelectTrigger>
                    <SelectContent>
                      {barns.map((barn) => (
                        <SelectItem key={barn} value={barn}>
                          {barn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{editedDetails["Barn / Trainer"]}</p>
                )}
              </div>
              <div>
                <Label>Owner Email</Label>
                {isEditing ? (
                  <div className="space-y-1">
                    <Input
                      id="Owner Email"
                      type="email"
                      value={editedDetails["Owner Email"] || ""}
                      onChange={handleInputChange}
                      className={`mt-1 ${emailError ? "border-red-500" : ""}`}
                      placeholder="email@example.com"
                      onBlur={(e) => {
                        if (e.target.value && !isValidEmail(e.target.value)) {
                          setEmailError("Please enter a valid email address");
                        }
                      }}
                    />
                    {emailError && (
                      <p className="text-sm text-red-500">{emailError}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm">
                    {editedDetails["Owner Email"] || "N/A"}
                  </p>
                )}
              </div>
              <div>
                <Label>Owner Phone</Label>
                {isEditing ? (
                  <Input
                    id="Owner Phone"
                    type="tel" // Change to tel type
                    value={editedDetails["Owner Phone"] || ""}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setEditedDetails((prev) => ({
                        ...prev!,
                        "Owner Phone": formatted,
                      }));
                    }}
                    className="mt-1"
                    placeholder="(123) 456-7890"
                  />
                ) : (
                  <p className="text-sm">
                    {editedDetails["Owner Phone"] || "N/A"}
                  </p>
                )}
              </div>
              <div>
                <Label>Status</Label>
                <p className="text-sm">{editedDetails.status}</p>
              </div>
              <div>
                <Label>Created At</Label>
                <p className="text-sm">
                  {new Date(editedDetails.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-2">
              <Label>Alert</Label>
              {isEditing ? (
                <Input
                  id="alert"
                  value={editedDetails.alert || ""}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              ) : (
                editedDetails.alert && (
                  <p className="text-sm text-red-500">{editedDetails.alert}</p>
                )
              )}
            </div>

            <div className="mt-2">
              <Label>History</Label>
              {isEditing ? (
                <Textarea
                  id="History"
                  value={editedDetails.History || ""}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              ) : (
                editedDetails.History && (
                  <p className="text-sm whitespace-pre-wrap">
                    {editedDetails.History}
                  </p>
                )
              )}
            </div>

            <div className="mt-2">
              <Label>Horse Notes History</Label>
              {isEditing ? (
                <Textarea
                  id="Horse Notes History"
                  value={editedDetails["Horse Notes History"] || ""}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              ) : (
                editedDetails["Horse Notes History"] && (
                  <p className="text-sm whitespace-pre-wrap">
                    {editedDetails["Horse Notes History"]}
                  </p>
                )
              )}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="hover:bg-black hover:text-white"
                disabled={
                  Boolean(emailError) ||
                  (Boolean(editedDetails?.["Owner Email"]) &&
                    !isValidEmail(editedDetails?.["Owner Email"] || ""))
                }
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                className="hover:bg-black hover:text-white"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SentInvoicesTabProps {
  handleQuickBooksConnect: () => void;
  isQuickBooksConnected: boolean | null;
}

function SentInvoicesTab({
  handleQuickBooksConnect,
  isQuickBooksConnected,
}: SentInvoicesTabProps) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 25;

  const hasMorePages = currentPage * itemsPerPage < totalCount;

  const fetchInvoices = useCallback(
    async (page: number) => {
      if (!user || !isQuickBooksConnected) return;
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
        setError("Failed to fetch invoices. Please try again later.");
      } finally {
        setLoading(false);
      }
    },
    [user, isQuickBooksConnected]
  );

  useEffect(() => {
    if (isQuickBooksConnected) {
      fetchInvoices(currentPage);
    }
  }, [currentPage, fetchInvoices, isQuickBooksConnected]);

  if (!isQuickBooksConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="h-12 w-12 text-yellow-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          QuickBooks Connection Required
        </h2>
        <p className="text-gray-600 mb-4 text-center">
          You need to connect to QuickBooks to view and manage invoices.
        </p>
        <Button
          onClick={handleQuickBooksConnect}
          className="hover:bg-black hover:text-white"
        >
          Connect to QuickBooks
        </Button>
      </div>
    );
  }

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
          onClick={() => setCurrentPage((prev) => prev - 1)}
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
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={!hasMorePages}
          variant="outline"
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ShoeingsApprovalPanel() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "approval";
  const [activeTab, setActiveTab] = useState(initialTab);
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
  const [reviewingHorse, setReviewingHorse] = useState<Shoeing | null>(null);
  const [deletingShoeing, setDeletingShoeing] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isMobile = useIsMobile();

  // Add this new function
  const handleOpenReviewModal = (shoeing: Shoeing) => {
    setReviewingHorse(shoeing);
  };

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

  useEffect(() => {
    if (quickBooksData && groupedShoeings) {
      const newSelectedCustomers = { ...selectedCustomers };

      // Keep track of promises to resolve before updating state
      const customerHorsePromises: Promise<void>[] = [];

      Object.entries(groupedShoeings).forEach(
        ([key, { displayName, shoeings }]) => {
          if (key !== "noCustomer") {
            // Find the matching QuickBooks customer by display name (case-insensitive)
            const matchingCustomer = quickBooksData.customers.find(
              (customer) =>
                customer.displayName.toLowerCase() === displayName.toLowerCase()
            );

            if (matchingCustomer) {
              console.log("Found matching QB customer:", {
                groupKey: key,
                displayName,
                matchingCustomer: matchingCustomer.displayName,
                customerId: matchingCustomer.id,
              });

              newSelectedCustomers[key] = matchingCustomer.id; // Set for the group key

              // Also set for each individual shoeing in this group
              shoeings.forEach((shoeing) => {
                newSelectedCustomers[shoeing.id] = matchingCustomer.id;
              });
            } else {
              // If no exact match, try to find a partial match
              const partialMatch = quickBooksData.customers.find(
                (customer) =>
                  customer.displayName
                    .toLowerCase()
                    .includes(displayName.toLowerCase()) ||
                  displayName
                    .toLowerCase()
                    .includes(customer.displayName.toLowerCase())
              );

              if (partialMatch) {
                console.log("Found partial matching QB customer:", {
                  groupKey: key,
                  displayName,
                  partialMatch: partialMatch.displayName,
                  customerId: partialMatch.id,
                });

                newSelectedCustomers[key] = partialMatch.id;
                shoeings.forEach((shoeing) => {
                  newSelectedCustomers[shoeing.id] = partialMatch.id;
                });
              }
            }
          }
        }
      );

      // Handle shoeings without customers (noCustomer group)
      if (groupedShoeings.noCustomer) {
        groupedShoeings.noCustomer.shoeings.forEach((shoeing) => {
          // Only process if we have a horse_id and no customer is already selected
          if (shoeing.horse_id && !newSelectedCustomers[shoeing.id]) {
            // Create a promise to find customer based on horse_id from junction table
            const promise = fetchCustomerForHorse(shoeing.horse_id)
              .then((customerData) => {
                if (customerData && quickBooksData) {
                  // Find matching QuickBooks customer
                  const qbCustomer = quickBooksData.customers.find(
                    (c) =>
                      c.displayName.toLowerCase() ===
                      customerData["Display Name"].toLowerCase()
                  );

                  if (qbCustomer) {
                    console.log(
                      `Pre-selecting customer for shoeing ${shoeing.id} based on customer_horses relationship:`,
                      {
                        horseId: shoeing.horse_id,
                        horseName: shoeing["Horse Name"],
                        customerId: qbCustomer.id,
                        customerName: qbCustomer.displayName,
                      }
                    );

                    newSelectedCustomers[shoeing.id] = qbCustomer.id;
                  }
                }
              })
              .catch((err) => {
                console.error("Error finding customer for horse:", err);
              });

            customerHorsePromises.push(promise);
          }
        });
      }

      // Wait for all promises to resolve before updating the state
      Promise.all(customerHorsePromises).then(() => {
        setSelectedCustomers(newSelectedCustomers);
      });
    }
  }, [quickBooksData, groupedShoeings]);

  useEffect(() => {}, [selectedCustomers]);

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
          .select("*, is_new_horse")
          .eq("status", "pending")
          .order("Date of Service", { ascending: false });

      if (pendingShoeingsError) throw pendingShoeingsError;

      // If no pending shoeings, return early with empty state
      if (!pendingShoeings || pendingShoeings.length === 0) {
        setGroupedShoeings({} as GroupedShoeings);
        return;
      }

      // Get unique horse_ids from pending shoeings when available, otherwise use Horses string
      const uniqueHorseIdentifiers: string[] = [];
      const horseIdConditions: { horse_id: string }[] = [];
      const horsesStringValues: string[] = [];

      for (const shoeing of pendingShoeings) {
        if (shoeing.horse_id) {
          if (!uniqueHorseIdentifiers.includes(shoeing.horse_id)) {
            uniqueHorseIdentifiers.push(shoeing.horse_id);
            horseIdConditions.push({ horse_id: shoeing.horse_id });
          }
        } else if (!uniqueHorseIdentifiers.includes(shoeing.Horses)) {
          uniqueHorseIdentifiers.push(shoeing.Horses);
          horsesStringValues.push(shoeing.Horses);
        }
      }

      // Fetch all shoeings for these horses, including Owner Email
      let allShoeings: Shoeing[] = [];

      // First, get shoeings by horse_id if any
      if (horseIdConditions.length > 0) {
        const { data: shoeingsByHorseId, error: horseIdError } = await supabase
          .from("shoeings")
          .select("*")
          .or(
            horseIdConditions
              .map((cond) => `horse_id.eq.${cond.horse_id}`)
              .join(",")
          );

        if (!horseIdError && shoeingsByHorseId) {
          allShoeings = [...allShoeings, ...shoeingsByHorseId] as Shoeing[];
        }
      }

      // Then, get shoeings by Horses string for backward compatibility
      if (horsesStringValues.length > 0) {
        const { data: shoeingsByHorsesString, error: horsesStringError } =
          await supabase
            .from("shoeings")
            .select("*")
            .in("Horses", horsesStringValues);

        if (!horsesStringError && shoeingsByHorsesString) {
          // Add only shoeings that aren't already fetched by horse_id
          const shoeingIdsAlreadyFetched = allShoeings.map((s) => s.id);
          const newShoeings = shoeingsByHorsesString.filter(
            (s) => !shoeingIdsAlreadyFetched.includes(s.id)
          ) as Shoeing[];
          allShoeings = [...allShoeings, ...newShoeings];
        }
      }

      // Ensure allShoeings is an array, even if empty
      const safeAllShoeings = allShoeings || [];

      // Group shoeings by horse_id when available, otherwise fallback to Horses string
      const groupedByHorse = safeAllShoeings.reduce(
        (acc: { [key: string]: any[] }, shoeing: any) => {
          const horseKey = shoeing.horse_id || shoeing.Horses;
          if (!acc[horseKey]) {
            acc[horseKey] = [];
          }
          acc[horseKey].push(shoeing);
          return acc;
        },
        {}
      );

      // Determine QB Customer for each horse and create final grouping
      const grouped = pendingShoeings.reduce(
        (acc: GroupedShoeings, shoeing: any) => {
          const horseKey = shoeing.horse_id || shoeing.Horses;
          const horseShoeings = groupedByHorse[horseKey] || [];

          // Always prioritize the current shoeing's QB Customer if it exists
          if (shoeing["QB Customers"]) {
            const currentCustomer = shoeing["QB Customers"];
            console.log("Using current shoeing's QB Customer:", {
              horse: shoeing.horse_id || shoeing.Horses,
              customer: currentCustomer,
              shoeingId: shoeing.id,
            });

            if (!acc[currentCustomer]) {
              acc[currentCustomer] = {
                displayName: currentCustomer,
                shoeings: [],
              };
            }
            acc[currentCustomer].shoeings.push(shoeing);
            return acc;
          }

          // Only fall back to counting if the current shoeing has no QB Customer
          // Count QB Customers for this horse
          const customerCounts = horseShoeings.reduce(
            (counts: { [key: string]: number }, s: any) => {
              if (s["QB Customers"]) {
                counts[s["QB Customers"]] =
                  (counts[s["QB Customers"]] || 0) + 1;
              }
              return counts;
            },
            {}
          );

          console.log("Customer counts for horse:", {
            horse: shoeing.horse_id || shoeing.Horses,
            counts: customerCounts,
            shoeingId: shoeing.id,
          });

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

      // After the existing grouped calculation, enhance with customer_horses relationships
      try {
        // For shoeings with horse_id but no customer, check the junction table
        if (grouped.noCustomer && grouped.noCustomer.shoeings.length > 0) {
          const shoeingsWithHorseId = grouped.noCustomer.shoeings.filter(
            (shoeing) => shoeing.horse_id && !shoeing["QB Customers"]
          );

          if (shoeingsWithHorseId.length > 0) {
            // Extract all horse_ids to check
            const horseIds = shoeingsWithHorseId
              .map((s) => s.horse_id)
              .filter(Boolean) as string[];

            // Fetch customer relationships for these horses from the junction table
            const { data: customerHorses, error: relationError } =
              await supabase
                .from("customer_horses")
                .select("horse_id, customer_id")
                .in("horse_id", horseIds);

            if (!relationError && customerHorses && customerHorses.length > 0) {
              // Create a map of horse_id to customer_id
              const horseToCustomerMap = customerHorses.reduce(
                (map: Record<string, string>, rel) => {
                  map[rel.horse_id] = rel.customer_id;
                  return map;
                },
                {}
              );

              // Fetch all relevant customers to get their display names
              const customerIds = [
                ...new Set(customerHorses.map((ch) => ch.customer_id)),
              ];
              const { data: customers, error: customerError } = await supabase
                .from("customers")
                .select('id, "Display Name"')
                .in("id", customerIds);

              if (!customerError && customers) {
                // Create a map of customer_id to display name
                const customerDisplayNames = customers.reduce(
                  (map: Record<string, string>, cust) => {
                    map[cust.id] = cust["Display Name"];
                    return map;
                  },
                  {}
                );

                // Now update the grouped structure for shoeings with known customer relationships
                const updatedGrouped = { ...grouped };

                // Process each shoeing in the noCustomer group
                const remainingNoCustomer: Shoeing[] = [];

                for (const shoeing of grouped.noCustomer.shoeings) {
                  if (
                    shoeing.horse_id &&
                    horseToCustomerMap[shoeing.horse_id]
                  ) {
                    const customerId = horseToCustomerMap[shoeing.horse_id];
                    const customerName = customerDisplayNames[customerId];

                    if (customerName) {
                      // Add this shoeing to the appropriate customer group
                      if (!updatedGrouped[customerName]) {
                        updatedGrouped[customerName] = {
                          displayName: customerName,
                          shoeings: [],
                        };
                      }

                      // Move the shoeing to the customer group
                      updatedGrouped[customerName].shoeings.push({
                        ...shoeing,
                        "QB Customers": customerName, // Set the QB Customers field
                      });

                      console.log(
                        `Auto-assigned shoeing ${shoeing.id} to customer ${customerName} based on customer_horses relationship`
                      );
                      continue; // Skip adding to remainingNoCustomer
                    }
                  }

                  // If we reach here, the shoeing stays in noCustomer
                  remainingNoCustomer.push(shoeing);
                }

                // Update the noCustomer group with remaining shoeings
                if (remainingNoCustomer.length > 0) {
                  updatedGrouped.noCustomer = {
                    displayName: "No Customer",
                    shoeings: remainingNoCustomer,
                  };
                } else {
                  // If no shoeings left, remove the noCustomer group
                  delete updatedGrouped.noCustomer;
                }

                // Use the updated grouping
                setGroupedShoeings(updatedGrouped);
                return; // Exit early since we've set the state
              }
            }
          }
        }

        // If we didn't early return with enhanced grouping, set the original grouping
        setGroupedShoeings(grouped);
      } catch (error) {
        console.error(
          "Error enhancing shoeings with customer relationships:",
          error
        );
        setGroupedShoeings(grouped); // Fallback to original grouping
      }
    } catch (error) {
      console.error("Failed to fetch pending shoeings:", error);
      toast.error("Failed to fetch pending shoeings");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAccept(shoeingId: string) {
    if (!isQuickBooksConnected) {
      toast.error("Please connect to QuickBooks before creating invoices");
      return;
    }

    setIsAccepting(shoeingId);
    try {
      const shoeing = Object.values(groupedShoeings)
        .flatMap((group) => group.shoeings)
        .find((s) => s.id === shoeingId);

      if (!shoeing) {
        throw new Error("Shoeing not found");
      }

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

      if (error) throw error;

      if (data.invoice && data.invoice.Invoice) {
        const currentDate = format(new Date(), "MM/dd/yyyy");

        // Update shoeing status, QB Customers, and is_new_horse
        const { error: shoeingUpdateError } = await supabase
          .from("shoeings")
          .update({
            status: "completed",
            Invoice: data.invoice.Invoice.DocNumber,
            "QB Customers": selectedCustomer.displayName,
            "Date Sent": currentDate,
            is_new_horse: false, // Add this line to update is_new_horse
          })
          .eq("id", shoeingId);

        if (shoeingUpdateError) throw shoeingUpdateError;

        // Find customer ID from Supabase based on QB display name
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("id")
          .eq("Display Name", selectedCustomer.displayName)
          .single();

        if (!customerError && customerData && shoeing.horse_id) {
          // Check if the relationship already exists
          const { data: existingRelation, error: relationCheckError } =
            await supabase
              .from("customer_horses")
              .select("*")
              .eq("customer_id", customerData.id)
              .eq("horse_id", shoeing.horse_id)
              .single();

          if (!existingRelation && !relationCheckError) {
            // Create a new relationship in the junction table
            await supabase.from("customer_horses").insert({
              customer_id: customerData.id,
              horse_id: shoeing.horse_id,
            });
          }
        } else if (shoeing.Horses && !shoeing.horse_id) {
          // Fallback to the old method for backward compatibility
          const [horseName, barnTrainer] = shoeing.Horses.split(" - ");
          const cleanBarnTrainer = barnTrainer.replace(/[\[\]]/g, "");

          // First get the horse ID
          const { data: horseData, error: horseError } = await supabase
            .from("horses")
            .select("id")
            .eq("Name", horseName)
            .eq('"Barn / Trainer"', cleanBarnTrainer)
            .single();

          if (!horseError && horseData && customerData) {
            // Check if the relationship already exists
            const { data: existingRelation, error: relationCheckError } =
              await supabase
                .from("customer_horses")
                .select("*")
                .eq("customer_id", customerData.id)
                .eq("horse_id", horseData.id)
                .single();

            if (!existingRelation && !relationCheckError) {
              // Create a new relationship in the junction table
              await supabase.from("customer_horses").insert({
                customer_id: customerData.id,
                horse_id: horseData.id,
              });
            }

            // Also update the horse record for future use
            const { error: horseUpdateError } = await supabase
              .from("horses")
              .update({
                Customers: selectedCustomer.displayName,
              })
              .eq("id", horseData.id);

            if (horseUpdateError) {
              console.error("Failed to update horse record:", horseUpdateError);
            }
          }
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
    setSelectedCustomers((prev) => {
      const newState = { ...prev };
      newState[key] = customerId; // Update the group key
      if (groupedShoeings[key]) {
        groupedShoeings[key].shoeings.forEach((shoeing) => {
          newState[shoeing.id] = customerId; // Update each shoeing in the group
        });
      }
      return newState;
    });
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
    if (!isQuickBooksConnected) {
      toast.error("Please connect to QuickBooks before creating invoices");
      return;
    }

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
        const currentDate = format(new Date(), "MM/dd/yyyy");

        // Find customer ID from Supabase based on QB display name
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("id")
          .eq("Display Name", groupedShoeings[key].displayName)
          .single();

        // Update all shoeings in this group and create customer_horse relationships
        for (const shoeing of shoeingsToAccept) {
          // Update the shoeing record
          await supabase
            .from("shoeings")
            .update({
              status: "completed",
              Invoice: data.invoice.Invoice.DocNumber,
              "QB Customers": groupedShoeings[key].displayName,
              "Date Sent": currentDate,
            })
            .eq("id", shoeing.id);

          // Update customer_horses junction table if we have both IDs
          if (!customerError && customerData) {
            if (shoeing.horse_id) {
              // Check if the relationship already exists
              const { data: existingRelation, error: relationCheckError } =
                await supabase
                  .from("customer_horses")
                  .select("*")
                  .eq("customer_id", customerData.id)
                  .eq("horse_id", shoeing.horse_id)
                  .single();

              if (!existingRelation && !relationCheckError) {
                // Create a new relationship in the junction table
                await supabase.from("customer_horses").insert({
                  customer_id: customerData.id,
                  horse_id: shoeing.horse_id,
                });
              }
            } else if (shoeing.Horses) {
              // Fallback to the old method for backward compatibility
              const [horseName, barnTrainer] = shoeing.Horses.split(" - ");
              const cleanBarnTrainer = barnTrainer.replace(/[\[\]]/g, "");

              // First get the horse ID
              const { data: horseData, error: horseError } = await supabase
                .from("horses")
                .select("id")
                .eq("Name", horseName)
                .eq('"Barn / Trainer"', cleanBarnTrainer)
                .single();

              if (!horseError && horseData) {
                // Check if the relationship already exists
                const { data: existingRelation, error: relationCheckError } =
                  await supabase
                    .from("customer_horses")
                    .select("*")
                    .eq("customer_id", customerData.id)
                    .eq("horse_id", horseData.id)
                    .single();

                if (!existingRelation && !relationCheckError) {
                  // Create a new relationship in the junction table
                  await supabase.from("customer_horses").insert({
                    customer_id: customerData.id,
                    horse_id: horseData.id,
                  });
                }

                // Also update the horse record for future use
                const { error: horseUpdateError } = await supabase
                  .from("horses")
                  .update({
                    Customers: groupedShoeings[key].displayName,
                  })
                  .eq("id", horseData.id);

                if (horseUpdateError) {
                  console.error(
                    "Failed to update horse record:",
                    horseUpdateError
                  );
                }
              }
            }
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

  const handleAcceptNewHorse = async (shoeingId: string) => {
    try {
      const { error } = await supabase
        .from("shoeings")
        .update({ is_new_horse: false })
        .eq("id", shoeingId);

      if (error) throw error;

      toast.success("New horse accepted");
      fetchPendingShoeings(); // Refresh the shoeings list
    } catch (error) {
      console.error("Error accepting new horse:", error);
      toast.error("Failed to accept new horse");
    }
  };

  const handleRejectNewHorse = async (shoeingId: string) => {
    try {
      const { error } = await supabase
        .from("shoeings")
        .update({ status: "rejected" })
        .eq("id", shoeingId);

      if (error) throw error;

      toast.success("New horse rejected");
      fetchPendingShoeings(); // Refresh the shoeings list
    } catch (error) {
      console.error("Error rejecting new horse:", error);
      toast.error("Failed to reject new horse");
    }
  };

  const handleEditNewHorse = (shoeing: Shoeing) => {
    // This function will open the edit modal
    setEditingShoeing(shoeing);
  };

  // Add this function to handle horse updates
  const handleHorseUpdate = (updatedHorse: Shoeing) => {
    // Update the horse in the groupedShoeings state
    setGroupedShoeings((prev) => {
      const newGroupedShoeings = { ...prev };

      // Find the group containing the horse
      Object.keys(newGroupedShoeings).forEach((key) => {
        const group = newGroupedShoeings[key];
        const index = group.shoeings.findIndex((s) => s.id === updatedHorse.id);

        if (index !== -1) {
          // Update the horse in the group
          group.shoeings[index] = updatedHorse;
        }
      });

      return newGroupedShoeings;
    });

    // Close the review modal
    setReviewingHorse(null);

    // Show success message
    toast.success("Horse details updated successfully");
  };

  const handleDelete = async (shoeingId: string) => {
    try {
      setDeletingShoeing(shoeingId);

      const { error } = await supabase
        .from("shoeings")
        .delete()
        .eq("id", shoeingId);

      if (error) throw error;

      toast.success("Shoeing record deleted successfully");
      fetchPendingShoeings(); // Refresh the list
    } catch (error) {
      console.error("Error deleting shoeing:", error);
      toast.error("Failed to delete shoeing record");
    } finally {
      setDeletingShoeing(null);
      setShowDeleteConfirm(false);
    }
  };

  function DeleteConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
  }) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              shoeing record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  function renderShoeingApprovalContent() {
    if (isLoading) {
      return <SkeletonLoader />;
    }

    // Remove the QuickBooks connection check dialog and replace with a warning banner
    // for invoice-related features when not connected
    const showQuickBooksWarning = isQuickBooksConnected === false;

    return (
      <>
        <h1 className="text-2xl font-bold mb-4">Shoeing Management</h1>

        {showQuickBooksWarning && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Sent Invoices</h2>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                <p className="text-sm text-yellow-700">
                  QuickBooks is not connected. Invoice features will be disabled
                  until you
                  <Button
                    variant="link"
                    onClick={handleQuickBooksConnect}
                    className="text-yellow-700 underline px-1"
                  >
                    connect to QuickBooks
                  </Button>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-8">
              <AlertCircle className="h-12 w-12 text-yellow-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                QuickBooks Connection Required
              </h2>
              <p className="text-gray-600 mb-4 text-center">
                You need to connect to QuickBooks to view and manage invoices.
              </p>
              <Button
                onClick={handleQuickBooksConnect}
                className="hover:bg-black hover:text-white"
              >
                Connect to QuickBooks
              </Button>
            </div>
          </div>
        )}

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
                          {shoeing.is_new_horse && (
                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-800 border-yellow-300 mr-2"
                            >
                              <AlertCircle className="w-4 h-4 mr-2" />
                              New Horse -
                              <Button
                                variant="link"
                                className="text-yellow-800 ml-1 hover:underline p-0 h-auto"
                                onClick={() => handleOpenReviewModal(shoeing)}
                              >
                                review?
                              </Button>
                            </Badge>
                          )}
                          <p>Date: {shoeing["Date of Service"]}</p>
                          <p>
                            Barn:{" "}
                            {shoeing.Horses.split(" - ")[1]?.replace(
                              /[\[\]]/g,
                              ""
                            )}
                          </p>{" "}
                          {/* Add this line */}
                          <p>Location: {shoeing["Location of Service"]}</p>
                          <p>
                            Total Cost: $
                            {shoeing["Total Cost"]?.replace(/\$/g, "") ?? ""}
                          </p>
                          <p className="mb-4">
                            <strong>Description:</strong> {shoeing.Description}
                          </p>
                        </CardContent>
                        <div className="p-4 mt-auto flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditShoeing(shoeing)}
                            className="flex-1 bg-primary text-white hover:bg-black hover:text-white"
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
                            className="w-1/2 mr-2 hover:bg-black hover:text-white"
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
                            className="w-1/2 ml-2 "
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
                const selectedCustomerId = selectedCustomers[key] || "";

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
                                <div className="flex justify-between items-center mb-2">
                                  <h3 className="font-semibold text-lg">
                                    {shoeing["Horse Name"]}
                                  </h3>
                                  {shoeing.is_new_horse && (
                                    <div className="flex items-center">
                                      <Badge
                                        variant="outline"
                                        className="bg-yellow-100 text-yellow-800 border-yellow-300 mr-2"
                                      >
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        New Horse -
                                        <Button
                                          variant="link"
                                          className="text-blue-600 hover:underline p-0 h-auto"
                                          onClick={() =>
                                            handleOpenReviewModal(shoeing)
                                          }
                                        >
                                          review?
                                        </Button>
                                      </Badge>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="mr-1"
                                        onClick={() =>
                                          handleAcceptNewHorse(shoeing.id)
                                        }
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="mr-1"
                                        onClick={() =>
                                          handleRejectNewHorse(shoeing.id)
                                        }
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleEditNewHorse(shoeing)
                                        }
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                {/* Render shoeing details */}
                                <p>Date: {shoeing["Date of Service"]}</p>
                                <p>
                                  Barn:{" "}
                                  {shoeing.Horses.split(" - ")[1]?.replace(
                                    /[\[\]]/g,
                                    ""
                                  )}
                                </p>{" "}
                                {/* Add this line */}
                                <p>
                                  Location: {shoeing["Location of Service"]}
                                </p>
                                <p>
                                  Total Cost: $
                                  {shoeing["Total Cost"]?.replace(/\$/g, "") ??
                                    ""}
                                </p>
                                <div className="mb-4">
                                  <p className="font-semibold">Services:</p>
                                  <p>
                                    {shoeing.Description.split(" - ")[1] ||
                                      shoeing.Description}
                                  </p>
                                  {shoeing["Other Custom Services"] && (
                                    <p className="mt-1 text-sm">
                                      <span className="font-medium">
                                        Custom Services:
                                      </span>{" "}
                                      {shoeing["Other Custom Services"]}
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                              <div className="p-4 mt-auto flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditShoeing(shoeing)}
                                  className="flex-1 bg-primary text-white hover:bg-black hover:text-white"
                                >
                                  <Pencil className="w-4 h-4 mr-2" /> Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setDeletingShoeing(shoeing.id);
                                    setShowDeleteConfirm(true);
                                  }}
                                  className="flex-1"
                                  disabled={deletingShoeing === shoeing.id}
                                >
                                  {deletingShoeing === shoeing.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                        <div className="flex items-center mt-4 space-x-4">
                          <Button
                            className="hover:bg-black hover:text-white"
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
                            value={selectedCustomerId}
                            onValueChange={(value) =>
                              handleCustomerSelect(key, value)
                            }
                          >
                            <SelectTrigger className="w-[200px] bg-white">
                              <SelectValue>
                                {quickBooksData?.customers.find(
                                  (c) => c.id === selectedCustomerId
                                )?.displayName || "Select customer"}
                              </SelectValue>
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
        {reviewingHorse && (
          <ReviewHorseModal
            horse={reviewingHorse}
            onClose={() => setReviewingHorse(null)}
            onUpdate={handleHorseUpdate}
          />
        )}
        {deletingShoeing && (
          <DeleteConfirmDialog
            open={showDeleteConfirm}
            onOpenChange={setShowDeleteConfirm}
            onConfirm={() => deletingShoeing && handleDelete(deletingShoeing)}
          />
        )}
      </>
    );
  }

  const tabOptions = [
    { value: "approval", label: "Shoeing Approval" },
    { value: "permissions", label: "Permissions" },
    { value: "sent-invoices", label: "Sent Invoices" },
    { value: "locations", label: "Locations" },
    { value: "prices", label: "Prices" },
    { value: "customers", label: "Customers" },
    { value: "horses", label: "Horses" },
  ];

  const renderTabContent = () => (
    <>
      <TabsContent value="approval">
        {renderShoeingApprovalContent()}
      </TabsContent>
      <TabsContent value="permissions">
        <PermissionsTab />
      </TabsContent>
      <TabsContent value="sent-invoices">
        <SentInvoicesTab
          handleQuickBooksConnect={handleQuickBooksConnect}
          isQuickBooksConnected={isQuickBooksConnected}
        />
      </TabsContent>
      <TabsContent value="locations">
        <LocationsEditor />
      </TabsContent>
      <TabsContent value="prices">
        <PricesTab />
      </TabsContent>
      <TabsContent value="customers">
        <CustomersTab />
      </TabsContent>
      <TabsContent value="horses">
        <HorsesTab />
      </TabsContent>
    </>
  );

  // Add this effect to fetch data when tab changes
  useEffect(() => {
    if (activeTab === "approval") {
      fetchPendingShoeings();
    }
  }, [activeTab]);

  // Update the tab change handler
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "approval") {
      fetchPendingShoeings();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        {isMobile ? (
          <div className="mb-4">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select tab" />
              </SelectTrigger>
              <SelectContent>
                {tabOptions.map((tab) => (
                  <SelectItem key={tab.value} value={tab.value}>
                    {tab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="mb-4 bg-primary text-white inline-flex h-auto">
              {tabOptions.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="px-3 py-2"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
        )}
        {renderTabContent()}
      </Tabs>
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
      // Strip any $ symbols from Total Cost when loading into the editor
      const sanitizedTotalCost =
        shoeing["Total Cost"]?.replace(/\$/g, "") ?? "";

      setEditedShoeing({
        ...shoeing,
        "Total Cost": sanitizedTotalCost,
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

    setEditedShoeing((prev: any) => {
      if (id === "Total Cost") {
        // Remove any $ symbols from the input
        const sanitizedValue = value.replace(/\$/g, "");

        // Basic validation for decimal numbers
        if (
          sanitizedValue === "" ||
          sanitizedValue === "." ||
          /^\d*\.?\d{0,2}$/.test(sanitizedValue)
        ) {
          return {
            ...prev,
            [id]: sanitizedValue,
          };
        }
        return prev; // Keep previous value if validation fails
      }

      // Handle other fields normally
      return {
        ...prev,
        [id]: value,
      };
    });
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
      // Create a copy of editedShoeing with properly formatted Total Cost
      const formattedShoeing = {
        ...editedShoeing,
        "Total Cost": editedShoeing["Total Cost"]
          ? editedShoeing["Total Cost"].replace(/^\$+/, "") // Remove leading $ symbols
          : editedShoeing["Total Cost"],
      };

      onSave(formattedShoeing);
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
              type="text"
              inputMode="decimal"
              value={editedShoeing["Total Cost"] ?? ""}
              onChange={handleInputChange}
              className="col-span-3"
              placeholder="0.00"
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

// Add this new component at the end of the file
interface ReviewHorseModalProps {
  horse: Shoeing;
  onClose: () => void;
  onUpdate?: (updatedHorse: Shoeing) => void; // Add this prop
}

// Update the fetchCustomerForHorse function's return type
const fetchCustomerForHorse = async (
  horseId: string
): Promise<CustomerData | null> => {
  try {
    // First get the customer_id from the junction table
    const { data: junctionData, error: junctionError } = await supabase
      .from("customer_horses")
      .select("customer_id")
      .eq("horse_id", horseId)
      .single();

    if (junctionError || !junctionData) {
      return null;
    }

    // Then get the customer details
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", junctionData.customer_id)
      .single();

    if (customerError || !customerData) {
      return null;
    }

    // Add type safety by ensuring we have the required fields
    return {
      id: customerData.id,
      "Display Name": customerData["Display Name"],
      email: customerData.email,
      companyName: customerData.companyName,
      address: customerData.address,
      phoneNumber: customerData.phoneNumber,
    } as CustomerData;
  } catch (error) {
    console.error("Error in fetchCustomerForHorse:", error);
    return null;
  }
};
