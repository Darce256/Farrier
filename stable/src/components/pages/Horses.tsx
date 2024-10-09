import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { IoFlagOutline, IoFlagSharp } from "react-icons/io5";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { LiaHorseHeadSolid } from "react-icons/lia";
import { getHorses, Horse } from "@/lib/horseService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { Skeleton } from "@/components/ui/skeleton";
import { createPortal } from "react-dom";
import { useDebounce } from "use-debounce";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useQueryClient } from "react-query";
import React from "react";
import { FixedSizeGrid as Grid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { AlertCircle } from "lucide-react";

interface Shoeing {
  id: string;
  "Date of Service": string;
  "Base Service": string;
  "Front Add-On's": string;
  "Other Custom Services": string;
  "Location of Service": string;
  "Total Cost": number | string | null;
  "Shoe Notes": string;
}

interface XRayImagesResponse {
  "x-ray-images": string[];
}

export default function Horses() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [filterBarnTrainer, setFilterBarnTrainer] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    horse: Horse | null;
    lightboxImages: string[];
    lightboxIndex: number | null;
  }>({
    isOpen: false,
    horse: null,
    lightboxImages: [],
    lightboxIndex: null,
  });

  const [showAlertsOnly, setShowAlertsOnly] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: fetchedHorses,
    isLoading,
    error: queryError,
  } = useQuery("horses", getHorses, {
    refetchOnWindowFocus: false,
    staleTime: 300000, // 5 minutes
  });

  const handleAlertUpdate = useCallback(
    async (horseId: string, newAlertText: string) => {
      // Update local state
      queryClient.setQueryData<Horse[]>("horses", (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((horse: Horse) =>
          horse.id === horseId ? { ...horse, alert: newAlertText } : horse
        );
      });

      // Invalidate and refetch
      await queryClient.invalidateQueries("horses");
    },
    [queryClient]
  );

  useEffect(() => {
    console.log("Fetched horses:", fetchedHorses);
    console.log("Is loading:", isLoading);
    console.log("Error:", queryError);
  }, [fetchedHorses, isLoading, queryError]);

  const sortedHorses = useMemo(
    () =>
      fetchedHorses?.sort((a, b) =>
        (a.Name || "").localeCompare(b.Name || "")
      ) || [],
    [fetchedHorses]
  );

  const uniqueBarnTrainers = useMemo(
    () =>
      [
        ...new Set(
          sortedHorses.map((horse) => horse["Barn / Trainer"] || "Unknown")
        ),
      ]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [sortedHorses]
  );
  const filteredHorses = useMemo(() => {
    return sortedHorses.filter((horse) => {
      if (!horse.Name && !horse["Barn / Trainer"]) {
        return false;
      }

      const matchesBarnTrainer =
        !filterBarnTrainer || horse["Barn / Trainer"] === filterBarnTrainer;

      const matchesAlert =
        !showAlertsOnly || (horse.alert && horse.alert.trim() !== "");

      if (debouncedSearchQuery) {
        const lowerSearchQuery = debouncedSearchQuery.toLowerCase();
        return (
          matchesBarnTrainer &&
          matchesAlert &&
          (horse.Name?.toLowerCase().includes(lowerSearchQuery) ||
            horse["Barn / Trainer"]?.toLowerCase().includes(lowerSearchQuery))
        );
      }

      return matchesBarnTrainer && matchesAlert;
    });
  }, [sortedHorses, debouncedSearchQuery, filterBarnTrainer, showAlertsOnly]);

  useEffect(() => {
    console.log("Filtered horses:", filteredHorses);
  }, [filteredHorses]);

  useEffect(() => {
    if (queryError) {
      console.error("Error in fetchHorses:", queryError);
      setError("Failed to fetch horses. Please try again later.");
    }
  }, [queryError]);

  useEffect(() => {
    if (!isLoading && filteredHorses.length > 0) {
      console.log("Setting content visible");
      const timer = setTimeout(() => setContentVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      console.log("Setting content invisible");
      setContentVisible(false);
    }
  }, [isLoading, filteredHorses]);

  const clearFilters = () => {
    setFilterBarnTrainer(null);
    setSearchQuery("");
    setShowAlertsOnly(false);
  };

  const openModal = (horse: Horse) => {
    setModalState((prev) => ({
      ...prev,
      isOpen: true,
      horse,
    }));
  };

  const closeModal = () => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
      horse: null,
      lightboxImages: [],
      lightboxIndex: null,
    }));
  };

  const closeLightbox = () => {
    setModalState((prev) => ({
      ...prev,
      lightboxIndex: null,
    }));
  };

  const handlePrevImage = () => {
    setModalState((prev) => ({
      ...prev,
      lightboxIndex:
        prev.lightboxIndex !== null
          ? (prev.lightboxIndex - 1 + prev.lightboxImages.length) %
            prev.lightboxImages.length
          : null,
    }));
  };

  const handleNextImage = () => {
    setModalState((prev) => ({
      ...prev,
      lightboxIndex:
        prev.lightboxIndex !== null
          ? (prev.lightboxIndex + 1) % prev.lightboxImages.length
          : null,
    }));
  };

  const handleLightboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      closeLightbox();
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (modalState.lightboxIndex !== null) {
        if (e.key === "ArrowLeft") {
          handlePrevImage();
        } else if (e.key === "ArrowRight") {
          handleNextImage();
        } else if (e.key === "Escape") {
          closeLightbox();
        }
      }
    },
    [modalState.lightboxIndex]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const renderLightbox = () => {
    if (modalState.lightboxIndex === null) return null;

    return createPortal(
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
        onClick={handleLightboxClick}
        style={{ touchAction: "none" }}
      >
        <div
          className="relative max-w-4xl max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={modalState.lightboxImages[modalState.lightboxIndex]}
            alt={`X-Ray ${modalState.lightboxIndex + 1}`}
            className="max-w-full max-h-[90vh] object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
          >
            <X size={24} />
          </button>
          <button
            className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevImage();
            }}
          >
            <ChevronLeft size={40} />
          </button>
          <button
            className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              handleNextImage();
            }}
          >
            <ChevronRight size={40} />
          </button>
        </div>
      </div>,
      document.body
    );
  };

  const handleViewDetails = (horse: Horse) => {
    openModal(horse);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleViewHorse = (horse: Horse) => {
    navigate(`/horses/${horse.id}`);
  };

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const MIN_CARD_WIDTH = 250;
  const MAX_CARD_WIDTH = 300;
  const CARD_ASPECT_RATIO = 0.95;
  const GRID_GAP = 10;

  const getColumnCount = (width: number) => {
    const maxColumns = Math.floor(
      (width + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP)
    );
    const isDesktop = width >= 1400;
    return Math.max(1, Math.min(maxColumns, isDesktop ? 5 : 4));
  };

  const HorseCardCell = useCallback(
    ({
      columnIndex,
      rowIndex,
      style,
      data,
    }: {
      columnIndex: number;
      rowIndex: number;
      style: React.CSSProperties;
      data: {
        horses: Horse[];
        columnCount: number;
        cardWidth: number;
        isDesktop: boolean;
      };
    }) => {
      const { horses, columnCount, cardWidth } = data;
      const index = rowIndex * columnCount + columnIndex;
      if (index >= horses.length) return null;
      const horse = horses[index];

      const cardHeight = cardWidth * CARD_ASPECT_RATIO;

      return (
        <div
          style={{
            ...style,
            width: cardWidth,
            height: cardHeight,
            padding: GRID_GAP / 2,
            left: columnCount === 1 ? "50%" : style.left,
            transform: columnCount === 1 ? "translateX(-50%)" : "none",
          }}
        >
          <HorseCard
            key={horse.id}
            horse={horse}
            onSelect={() => handleViewDetails(horse)}
            onViewHorse={() => handleViewHorse(horse)}
            onAlertUpdate={handleAlertUpdate}
          />
        </div>
      );
    },
    [handleViewDetails, handleViewHorse, handleAlertUpdate]
  );

  return (
    <div className="container mx-auto px-2 sm:px-4 h-full flex flex-col pt-0 sm:pt-2 max-w-[1600px]">
      <div className="flex items-center gap-2 align-middle mb-4 sm:mb-6">
        <LiaHorseHeadSolid className="text-3xl sm:text-4xl" />
        <h1 className="text-3xl sm:text-4xl font-bold text-black">Horses</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-grow flex flex-col md:flex-row gap-2 md:gap-4">
          <Select
            value={filterBarnTrainer || ""}
            onValueChange={(value) => setFilterBarnTrainer(value || null)}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by Barn/Trainer" />
            </SelectTrigger>
            <SelectContent>
              {uniqueBarnTrainers.map((barnTrainer) => (
                <SelectItem key={barnTrainer} value={barnTrainer}>
                  {barnTrainer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search horses..."
              className="pl-8 pr-8 w-full"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center">
            <Checkbox
              id="alertFilter"
              checked={showAlertsOnly}
              onCheckedChange={(checked) =>
                setShowAlertsOnly(checked as boolean)
              }
            />
            <label htmlFor="alertFilter" className="ml-2 text-sm font-medium">
              Show horses with alerts only
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          {isDesktop && (
            <Button
              onClick={() =>
                setViewMode(viewMode === "card" ? "table" : "card")
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {viewMode === "card" ? "Table View" : "Card View"}
            </Button>
          )}
          <Button onClick={clearFilters} variant="outline">
            Clear Filters
          </Button>
        </div>
      </div>
      <div className="flex-grow relative overflow-hidden">
        {(isLoading || !contentVisible) && (
          <div className="absolute inset-0 z-10">
            <HorsesSkeleton viewMode={isDesktop ? viewMode : "card"} />
          </div>
        )}

        <div
          className={`h-full transition-opacity duration-300 ${
            contentVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : filteredHorses.length === 0 ? (
            <div className="text-center">No horses found.</div>
          ) : (
            <>
              {!isDesktop || viewMode === "card" ? (
                <div className="h-full">
                  <AutoSizer>
                    {({ height, width }) => {
                      const isDesktop = width >= 1024; // Assuming 1024px as the desktop breakpoint
                      const columnCount = getColumnCount(width);
                      const cardWidth = Math.min(
                        MAX_CARD_WIDTH,
                        Math.max(
                          MIN_CARD_WIDTH,
                          (width + GRID_GAP) / columnCount - GRID_GAP
                        )
                      );
                      const cardHeight = cardWidth * CARD_ASPECT_RATIO;
                      const rowCount = Math.ceil(
                        filteredHorses.length / columnCount
                      );

                      return (
                        <Grid
                          height={height}
                          width={width}
                          columnCount={columnCount}
                          columnWidth={cardWidth + GRID_GAP}
                          rowCount={rowCount}
                          rowHeight={cardHeight + GRID_GAP}
                          itemData={{
                            horses: filteredHorses,
                            columnCount,
                            cardWidth,
                            isDesktop,
                          }}
                        >
                          {HorseCardCell}
                        </Grid>
                      );
                    }}
                  </AutoSizer>
                </div>
              ) : (
                <div className="overflow-x-auto h-full">
                  <HorseTable
                    horses={filteredHorses}
                    onSelect={(horse) => handleViewDetails(horse)}
                    onViewHorse={(horse) => handleViewHorse(horse)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {modalState.isOpen && modalState.horse && (
        <HorseDetailsModal
          horse={modalState.horse}
          isOpen={modalState.isOpen}
          onClose={closeModal}
        />
      )}
      {renderLightbox()}
    </div>
  );
}

function HorsesSkeleton({ viewMode }: { viewMode: "card" | "table" }) {
  return (
    <div className="w-full h-full">
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      ) : (
        <Skeleton className="h-[400px] w-full" />
      )}
    </div>
  );
}

interface HorseCardProps {
  horse: Horse;
  onSelect: () => void;
  onViewHorse: () => void;
  onAlertUpdate: (horseId: string, newAlertText: string) => void;
}

const HorseCard = React.memo(
  ({ horse, onSelect, onViewHorse, onAlertUpdate }: HorseCardProps) => {
    console.log("Rendering HorseCard:", horse.Name);
    const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
    const [alertText, setAlertText] = useState(horse.alert || "");

    const handleFlagClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setAlertText(horse.alert || "");
      setIsAlertDialogOpen(true);
    };

    const handleAlertSubmit = async () => {
      try {
        const { data, error } = await supabase
          .from("horses")
          .update({ alert: alertText })
          .eq("id", horse.id)
          .select();

        if (error) throw error;

        console.log("Supabase update response:", data);

        await onAlertUpdate(horse.id, alertText);
        toast.success(
          alertText
            ? "Alert updated successfully"
            : "Alert removed successfully"
        );
        setIsAlertDialogOpen(false);
      } catch (error) {
        console.error("Error updating alert:", error);
        toast.error("Failed to update alert");
      }
    };

    const handleRemoveAlert = async () => {
      setAlertText("");
      await handleAlertSubmit();
    };

    return (
      <>
        <Card
          className={`border-black/20 shadow-lg flex flex-col h-full ${
            horse.alert ? "border-red-500 border-2" : ""
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-black text-base sm:text-lg md:text-xl truncate">
                {horse.Name || "Unnamed Horse"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFlagClick}
                className={`${horse.alert ? "text-red-500" : "text-gray-500"}`}
              >
                {horse.alert ? (
                  <IoFlagSharp size={20} />
                ) : (
                  <IoFlagOutline size={20} />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col justify-between flex-grow pt-0">
            <div className="mb-4">
              {horse["Barn / Trainer"] && (
                <div className="text-sm">
                  <strong className="font-semibold">Barn / Trainer:</strong>
                  <div className="mt-2">
                    <Badge variant="default" className="text-xs">
                      {horse["Barn / Trainer"]}
                    </Badge>
                  </div>
                </div>
              )}
              {horse.alert && (
                <div className="flex items-center bg-red-100 text-red-700 p-2 rounded-md mt-2 text-xs">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate" title={horse.alert}>
                    {horse.alert}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-auto space-y-2">
              <Button
                onClick={onSelect}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm"
              >
                View Details
              </Button>
              <Button
                onClick={onViewHorse}
                variant="outline"
                className="w-full text-xs sm:text-sm"
              >
                View Horse
              </Button>
            </div>
          </CardContent>
        </Card>
        <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Alert for {horse.Name}</DialogTitle>
            </DialogHeader>
            <Textarea
              value={alertText}
              onChange={(e) => setAlertText(e.target.value)}
              placeholder="Enter alert message..."
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button
                onClick={handleRemoveAlert}
                variant="outline"
                className="bg-red-100 text-red-600 hover:bg-red-200"
              >
                Remove Alert
              </Button>
              <Button onClick={handleAlertSubmit}>Save Alert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

function HorseTable({
  horses,
  onSelect,
  onViewHorse,
}: {
  horses: Horse[];
  onSelect: (horse: Horse) => void;
  onViewHorse: (horse: Horse) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary text-primary-foreground">
            <TableHead className="hover:text-primary-foreground">
              Name
            </TableHead>
            <TableHead className="hover:text-primary-foreground">
              Barn / Trainer
            </TableHead>
            <TableHead className="hover:text-primary-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {horses.map((horse) => (
            <TableRow key={horse.id}>
              <TableCell className="font-medium">{horse.Name}</TableCell>
              <TableCell>
                <Badge variant="default" className="text-xs">
                  {horse["Barn / Trainer"]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-x-2">
                  <Button
                    onClick={() => onSelect(horse)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    View Details
                  </Button>
                  <Button onClick={() => onViewHorse(horse)} variant="outline">
                    View Horse
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function HorseDetailsModal({
  horse,
  isOpen,
  onClose,
}: {
  horse: Horse;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [xRayImages, setXRayImages] = useState<string[]>([]);
  const [shoeings, setShoeings] = useState<Shoeing[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [isLoadingXRays, setIsLoadingXRays] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (isOpen && horse) {
      setIsLoadingXRays(true);
      fetchXRayImages();
      setNotes(
        horse["Note w/ Time Stamps (from History)"]
          ?.split(",")
          .filter(Boolean) || []
      );
      fetchShoeings();
    }
  }, [isOpen, horse]);

  async function fetchXRayImages() {
    try {
      const { data, error } = await supabase
        .from("horses")
        .select("x-ray-images")
        .eq("id", horse.id)
        .single<XRayImagesResponse>();

      if (error) throw error;

      if (data && Array.isArray(data["x-ray-images"])) {
        setXRayImages(data["x-ray-images"]);
      } else {
        setXRayImages([]);
      }
    } catch (error) {
      console.error("Error fetching X-ray images:", error);
      setXRayImages([]);
    } finally {
      setIsLoadingXRays(false);
    }
  }

  async function fetchShoeings() {
    const horseIdentifier = `${horse.Name} - [${horse["Barn / Trainer"]}]`;
    const { data, error } = await supabase
      .from("shoeings")
      .select("*")
      .eq("Horses", horseIdentifier)
      .order("Date of Service", { ascending: false });

    if (error) {
      console.error("Error fetching shoeings:", error);
    } else {
      setShoeings(data || []);
    }
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) =>
      prev !== null ? (prev - 1 + xRayImages.length) % xRayImages.length : null
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) =>
      prev !== null ? (prev + 1) % xRayImages.length : null
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`sm:max-w-[${
          selectedImageIndex !== null ? "800px" : "600px"
        }]`}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{horse.Name}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="history" className="w-full flex flex-col">
          <TabsList className="bg-primary text-primary-foreground w-full grid grid-cols-3">
            <TabsTrigger value="history" className="w-full">
              Shoeing History
            </TabsTrigger>
            <TabsTrigger value="xrays" className="w-full">
              X-Rays
            </TabsTrigger>
            <TabsTrigger value="notes" className="w-full">
              Notes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="history">
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              {shoeings.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {shoeings.map((shoeing, index) => (
                    <AccordionItem key={shoeing.id} value={`item-${index}`}>
                      <AccordionTrigger className="font-semibold">
                        {new Date(
                          shoeing["Date of Service"]
                        ).toLocaleDateString()}{" "}
                        - {shoeing["Location of Service"]}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>
                          <strong>Base Service:</strong>{" "}
                          {shoeing["Base Service"]}
                        </p>
                        {shoeing["Front Add-On's"] && (
                          <p>
                            <strong>Front Add-On's:</strong>{" "}
                            {shoeing["Front Add-On's"]}
                          </p>
                        )}
                        {shoeing["Other Custom Services"] && (
                          <p>
                            <strong>Other Custom Services:</strong>{" "}
                            {shoeing["Other Custom Services"]}
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p>No shoeing history available.</p>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="xrays">
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              {selectedImageIndex !== null ? (
                <div className="flex flex-col h-full">
                  <div className="relative flex-grow flex justify-center items-center border rounded-md p-2 mb-2">
                    <img
                      src={xRayImages[selectedImageIndex]}
                      alt={`X-Ray ${selectedImageIndex + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />
                    <button
                      className="absolute top-1/2 left-2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2"
                      onClick={handlePrevImage}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      className="absolute top-1/2 right-2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2"
                      onClick={handleNextImage}
                    >
                      <ChevronRight size={24} />
                    </button>
                    <button
                      className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2"
                      onClick={() => setSelectedImageIndex(null)}
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="h-[100px] overflow-x-auto">
                    <div className="flex space-x-2 pb-2">
                      {xRayImages.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`X-Ray ${index + 1}`}
                          className={`h-[80px] w-auto object-cover cursor-pointer border rounded-md ${
                            index === selectedImageIndex
                              ? "border-2 border-primary"
                              : "border-gray-200"
                          }`}
                          onClick={() => handleImageClick(index)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {isLoadingXRays ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="w-full h-[100px]" />
                      ))}
                    </div>
                  ) : xRayImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {xRayImages.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`X-Ray ${index + 1}`}
                          className="w-full h-[100px] object-cover cursor-pointer"
                          onClick={() => handleImageClick(index)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p>No X-Ray images available.</p>
                  )}
                </>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="notes">
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              {notes.length > 0 ? (
                notes.map((note, index) => (
                  <p key={index} className="mb-2">
                    {note}
                  </p>
                ))
              ) : (
                <p>No notes available.</p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
