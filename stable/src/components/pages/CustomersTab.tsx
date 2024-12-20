import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2, Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { HorseSelect } from "@/components/ui/horse-select";

interface Customer {
  id: string;
  "Display Name": string | null;
  "Company/Horses Name": string | null;
  Horses: string | null;
  "Barn / Trainer": string | null;
  "Owner Notes": string | null;
  "Owner Email": string | null;
  Review: string | null;
  Phone: string | null;
  created_at: string;
}

interface Horse {
  Name: string;
  "Barn / Trainer": string;
  id: string;
}

export default function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;
  const [horses, setHorses] = useState<Horse[]>([]);
  const [showForm] = useState(false);
  const navigate = useNavigate();

  const fetchCustomers = useCallback(async () => {
    try {
      let query = supabase.from("customers").select("*", { count: "exact" });

      if (searchQuery) {
        query = query.or(
          `"Display Name".ilike.%${searchQuery}%,` +
            `"Company/Horses Name".ilike.%${searchQuery}%,` +
            `"Barn / Trainer".ilike.%${searchQuery}%,` +
            `"Owner Email".ilike.%${searchQuery}%`
        );
      }

      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(start, end);

      if (error) throw error;

      setCustomers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage, itemsPerPage]);

  const fetchHorses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("horses")
        .select('id, Name, "Barn / Trainer"')
        .order("Name");

      if (error) throw error;
      setHorses(data || []);
    } catch (error) {
      console.error("Error fetching horses:", error);
      toast.error("Failed to fetch horses");
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchHorses();
  }, [fetchCustomers, fetchHorses]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerData = Object.fromEntries(formData.entries());
    const selectedHorses = customerData.Horses
      ? String(customerData.Horses)
          .split(",")
          .map((h: string) => h.trim())
      : [];

    try {
      if (editingCustomer) {
        // Update the customer record
        const { error } = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", editingCustomer.id);

        if (error) throw error;

        // Update any pending shoeings for this customer's horses
        if (selectedHorses.length > 0) {
          const { error: shoeingsError } = await supabase
            .from("shoeings")
            .update({
              "Owner Email": customerData["Owner Email"],
            })
            .in("Horse Name", selectedHorses)
            .eq("status", "pending");

          if (shoeingsError) throw shoeingsError;
        }

        toast.success("Customer updated successfully");
      } else {
        // Create new customer
        const { error } = await supabase
          .from("customers")
          .insert([customerData]);
        if (error) throw error;

        // Update any pending shoeings for the selected horses
        if (selectedHorses.length > 0) {
          const { error: shoeingsError } = await supabase
            .from("shoeings")
            .update({
              "Owner Email": customerData["Owner Email"],
            })
            .in("Horse Name", selectedHorses)
            .eq("status", "pending");

          if (shoeingsError) throw shoeingsError;
        }

        toast.success("Customer added successfully");
      }

      setIsModalOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Failed to save customer");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;

      toast.success("Customer deleted successfully");
      await fetchCustomers();

      setShowDeleteConfirm(false);
      setDeletingCustomerId(null);
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customers</h2>
        <Button
          onClick={() => navigate("/customers/new")}
          className="hover:bg-black hover:text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-6 bg-white mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingCustomer ? "Edit Customer" : "Add New Customer"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="Display Name">Display Name</Label>
                <Input
                  id="Display Name"
                  name="Display Name"
                  defaultValue={editingCustomer?.["Display Name"] || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Company/Horses Name">Company/Horses Name</Label>
                <Input
                  id="Company/Horses Name"
                  name="Company/Horses Name"
                  defaultValue={editingCustomer?.["Company/Horses Name"] || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Barn / Trainer">Barn / Trainer</Label>
                <Input
                  id="Barn / Trainer"
                  name="Barn / Trainer"
                  defaultValue={editingCustomer?.["Barn / Trainer"] || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Owner Email">Email</Label>
                <Input
                  id="Owner Email"
                  name="Owner Email"
                  type="email"
                  defaultValue={editingCustomer?.["Owner Email"] || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Phone">Phone</Label>
                <Input
                  id="Phone"
                  name="Phone"
                  defaultValue={editingCustomer?.Phone || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Horses">Horses</Label>
                <HorseSelect
                  horses={horses}
                  selectedHorses={
                    editingCustomer?.Horses
                      ? editingCustomer.Horses.split(",").map((h: string) =>
                          h.trim()
                        )
                      : []
                  }
                  onHorseChange={(selected: string[]) => {
                    const formElement = document.querySelector("form");
                    if (formElement) {
                      const input = formElement.querySelector(
                        'input[name="Horses"]'
                      ) as HTMLInputElement;
                      if (input) {
                        const formattedHorses = selected.map(
                          (horseName) =>
                            `${horseName} - [${
                              horses.find((h) => h.Name === horseName)?.[
                                "Barn / Trainer"
                              ] || ""
                            }]`
                        );
                        input.value = formattedHorses.join(", ");
                      }
                    }
                  }}
                  placeholder="Search and select horses..."
                />
                <Input
                  id="Horses"
                  name="Horses"
                  type="hidden"
                  defaultValue={editingCustomer?.Horses || ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="Owner Notes">Notes</Label>
              <Textarea
                id="Owner Notes"
                name="Owner Notes"
                defaultValue={editingCustomer?.["Owner Notes"] || ""}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 bg-white"
          />
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-primary">
            <TableRow>
              <TableHead className="text-white">Display Name</TableHead>
              <TableHead className="text-white">Company/Horses</TableHead>
              <TableHead className="text-white">Barn / Trainer</TableHead>
              <TableHead className="text-white">Email</TableHead>
              <TableHead className="text-white">Phone</TableHead>
              <TableHead className="text-right text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer["Display Name"]}</TableCell>
                <TableCell>{customer["Company/Horses Name"]}</TableCell>
                <TableCell>{customer["Barn / Trainer"]}</TableCell>
                <TableCell>{customer["Owner Email"]}</TableCell>
                <TableCell>{customer.Phone}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigate(`/customers/edit/${customer.id}`);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeletingCustomerId(customer.id);
                      setShowDeleteConfirm(true);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {customers.length} of {totalCount} customers
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              customer record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingCustomerId && handleDelete(deletingCustomerId)
              }
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
