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
import { useQueryClient } from "react-query";

interface Horse {
  id: string;
  Name: string;
  Customers: string | null;
  "Barn / Trainer": string | null;
  "Owner Email": string | null;
  "Owner Phone": string | null;
  History: string | null;
  "Horse Notes History": string | null;
  "Note w/ Time Stamps (from History)": string | null;
  status: string;
  alert: string | null;
  created_at: string;
}

export default function HorsesTab() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingHorseId, setDeletingHorseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchHorses = useCallback(async () => {
    try {
      let query = supabase.from("horses").select("*", { count: "exact" });

      if (searchQuery) {
        query = query.or(
          `Name.ilike.%${searchQuery}%,` +
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

      setHorses(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching horses:", error);
      toast.error("Failed to fetch horses");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage]);

  useEffect(() => {
    fetchHorses();
  }, [fetchHorses]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("horses").delete().eq("id", id);
      if (error) throw error;

      await queryClient.invalidateQueries("horses");
      toast.success("Horse deleted successfully");
      await fetchHorses();

      setShowDeleteConfirm(false);
      setDeletingHorseId(null);
    } catch (error) {
      console.error("Error deleting horse:", error);
      toast.error("Failed to delete horse");
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
        <h2 className="text-2xl font-bold">Horses</h2>
        <Button
          onClick={() => navigate("/horses/new")}
          className="hover:bg-black hover:text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Horse
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search horses..."
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
              <TableHead className="text-white">Name</TableHead>
              <TableHead className="text-white">Barn / Trainer</TableHead>
              <TableHead className="text-white">Owner Email</TableHead>
              <TableHead className="text-white">Owner Phone</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-right text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {horses.map((horse) => (
              <TableRow key={horse.id}>
                <TableCell>{horse.Name}</TableCell>
                <TableCell>{horse["Barn / Trainer"]}</TableCell>
                <TableCell>{horse["Owner Email"]}</TableCell>
                <TableCell>{horse["Owner Phone"]}</TableCell>
                <TableCell>{horse.status}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigate(`/horses/edit/${horse.id}`);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeletingHorseId(horse.id);
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
          Showing {horses.length} of {totalCount} horses
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
              horse record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingHorseId && handleDelete(deletingHorseId)}
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
