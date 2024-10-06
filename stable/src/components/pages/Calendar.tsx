import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as _CalendarIcon,
  House,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, parse, isValid, startOfMonth, endOfMonth } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import toast from "react-hot-toast";
import { useAuth } from "@/components/Contexts/AuthProvider"; // Adjust the import path as necessary

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface Location {
  service_location: string;
  location_color: string;
}

interface Shoeing {
  id: string;
  Horses: string;
  "QB Customers": any;
  "Horse Name": string;
  "Owner Email": string;
  "Location of Service": string;
  "Date of Service": string;
  "Base Service": string;
  "Front Add-On's": string;
  "Other Custom Services": string;
  Description: string;
  "Cost of Service": string;
  "Cost of Front Add-Ons": string;
  "Total Cost": string;
  "Shoe Notes": string;
  "Hind Add-On's": string;
  "Cost of Hind Add-Ons": string;
  status: string;
}

const TODAY = new Date();

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [shoeings, setShoeings] = useState<Shoeing[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedShoeings, setSelectedShoeings] = useState<string[]>([]);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateDate, setDuplicateDate] = useState<Date | undefined>(
    undefined
  );
  const [locationColors, setLocationColors] = useState<Record<number, string>>(
    {}
  );
  const { user } = useAuth();

  const fetchShoeings = async (startDate: Date, endDate: Date) => {
    console.log("Fetching shoeings for date range:", startDate, endDate);
    let allShoeings: Shoeing[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    const formattedStartDate = format(startDate, "M/d/yyyy");
    const formattedEndDate = format(endDate, "M/d/yyyy");

    while (hasMore) {
      const { data, error } = await supabase
        .from("shoeings")
        .select("*")
        .gte("Date of Service", formattedStartDate)
        .lte("Date of Service", formattedEndDate)
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order("Date of Service", { ascending: true });

      if (error) {
        console.error("Error fetching shoeings:", error);
        toast.error("Failed to fetch shoeings");
        break;
      }

      if (data) {
        allShoeings = [...allShoeings, ...data];
        console.log(`Fetched ${data.length} shoeings for page ${page + 1}`);
        hasMore = data.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    console.log(`Total shoeings fetched: ${allShoeings.length}`);
    setShoeings(allShoeings);
  };

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from("locations")
      .select("service_location, location_color");
    if (error) {
      console.error("Error fetching locations:", error);
    } else {
      setLocations(data || []);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };
  const isToday = (date: Date) => {
    return (
      date.getDate() === TODAY.getDate() &&
      date.getMonth() === TODAY.getMonth() &&
      date.getFullYear() === TODAY.getFullYear()
    );
  };
  const generateCalendarDays = (date: Date) => {
    const daysInMonth = getDaysInMonth(date);
    const firstDayOfMonth = new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    ).getDay();
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }

    return days;
  };

  const getShoeingsForDate = (date: Date) => {
    const dateString = format(date, "M/d/yyyy");

    const filteredShoeings = shoeings.filter((shoeing) => {
      if (!shoeing["Date of Service"]) return false;

      try {
        const shoeingDate = parse(
          shoeing["Date of Service"],
          "M/d/yyyy",
          new Date()
        );
        if (!isValid(shoeingDate)) return false;

        return format(shoeingDate, "M/d/yyyy") === dateString;
      } catch (error) {
        console.error("Error parsing date:", shoeing["Date of Service"], error);
        return false;
      }
    });

    return filteredShoeings;
  };

  const generateWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(
        new Date(
          startOfWeek.getFullYear(),
          startOfWeek.getMonth(),
          startOfWeek.getDate() + i
        )
      );
    }
    return days;
  };

  const navigatePeriod = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case "month":
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
      case "week":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "day":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const renderCalendarContent = () => {
    switch (viewMode) {
      case "month":
        return renderMonthView(currentDate);
      case "week":
        return renderWeekView(currentDate);
      case "day":
        return renderDayView(currentDate);
    }
  };

  const getLocationColor = (locationName: string): string => {
    const location = locations.find(
      (loc) => loc.service_location === locationName
    );
    return location ? location.location_color : "#CCCCCC"; // Default color if not found
  };

  const renderShoeing = (shoeing: Shoeing) => {
    const bgColor = getLocationColor(shoeing["Location of Service"]);
    const [horseName, barnTrainer] = shoeing.Horses.split(" - ");

    return (
      <div
        key={shoeing.id}
        style={{
          backgroundColor: bgColor,
          color: "#000",
          padding: "0.25rem",
          borderRadius: "0.25rem",
          marginBottom: "0.25rem",
        }}
        className="text-[10px] sm:text-xs overflow-hidden"
      >
        <span className="font-semibold block">{horseName}</span>
        <span className="text-[8px] sm:text-xs">
          {shoeing["Location of Service"]}
        </span>
        <div className="flex items-center mt-1">
          <House className="w-3 h-3 mr-1" />
          <span className="text-[8px] sm:text-xs">
            {barnTrainer?.replace(/[\[\]]/g, "").trim() || ""}
          </span>
        </div>
      </div>
    );
  };

  const renderMonthView = (date: Date) => {
    const calendarDays = generateCalendarDays(date);
    return (
      <>
        {DAYS.map((day) => (
          <div
            key={day}
            className="bg-white p-1 sm:p-2 text-center font-semibold text-xs sm:text-sm"
          >
            {day}
          </div>
        ))}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`bg-white p-1 sm:p-2 h-24 sm:h-32 md:h-40 flex flex-col ${
              day && isToday(day) ? "border-2 border-primary/70" : ""
            }`}
            onClick={() => {
              if (day) {
                setCurrentDate(day);
                setViewMode("day");
              }
            }}
          >
            {day && (
              <>
                <div
                  className={`text-right mb-1 text-xs sm:text-sm ${
                    isToday(day) ? "font-bold text-primary" : "text-gray-500"
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="flex-grow overflow-y-auto no-scrollbar">
                  <div className="space-y-1">
                    {getShoeingsForDate(day).map(renderShoeing)}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </>
    );
  };

  const renderWeekView = (date: Date) => {
    const weekDays = generateWeekDays(date);
    return (
      <>
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`bg-white p-1 sm:p-2 flex flex-col h-full ${
              isToday(day) ? "border-2 border-primary/70" : ""
            }`}
            onClick={() => {
              setCurrentDate(day);
              setViewMode("day");
            }}
          >
            <div
              className={`text-center mb-1 sm:mb-2 ${
                isToday(day) ? "font-bold text-primary" : ""
              }`}
            >
              <div className="font-semibold text-xs sm:text-sm">
                {DAYS[day.getDay()]}
              </div>
              <div className="text-xs sm:text-sm">{day.getDate()}</div>
            </div>
            <div className="flex-grow overflow-y-auto no-scrollbar">
              {getShoeingsForDate(day).map(renderShoeing)}
            </div>
          </div>
        ))}
      </>
    );
  };

  const handleShoeingSelection = (shoeingId: string) => {
    setSelectedShoeings((prev) =>
      prev.includes(shoeingId)
        ? prev.filter((id) => id !== shoeingId)
        : [...prev, shoeingId]
    );
  };

  const handleDuplicateShoeings = async () => {
    if (!duplicateDate || selectedShoeings.length === 0 || !user) return;

    console.log("Starting duplication process");
    console.log("Selected shoeings:", selectedShoeings);
    console.log("Duplicate date:", duplicateDate);
    console.log("Current user ID:", user.id);

    let successCount = 0;
    let errorCount = 0;

    const shoeingsToDuplicate = shoeings.filter((shoeing) =>
      selectedShoeings.includes(shoeing.id)
    );

    console.log("Shoeings to duplicate:", shoeingsToDuplicate);

    for (const shoeing of shoeingsToDuplicate) {
      const newShoeingDate = format(duplicateDate, "M/d/yyyy");
      console.log("New shoeing date:", newShoeingDate);

      const {
        id,
        Invoice,
        "1. Invoice": firstInvoice,
        user_id,
        ...newShoeingWithoutId
      } = shoeing as any;

      const newShoeing = {
        ...newShoeingWithoutId,
        "Date of Service": newShoeingDate,
        status: "pending",
        Invoice: null,
        "1. Invoice": null,
        "Date Sent": null,
        user_id: user.id, // Set the user_id to the current user's ID
      };

      console.log("Attempting to insert new shoeing:", newShoeing);

      const { data, error } = await supabase
        .from("shoeings")
        .insert([newShoeing])
        .select();

      if (error) {
        console.error("Error duplicating shoeing:", error);
        errorCount++;
        toast.error(`Failed to duplicate shoeing: ${error.message}`);
      } else {
        console.log("Shoeing duplicated successfully:", data);
        successCount++;
        toast.success(`Shoeing duplicated successfully: ${data[0].id}`);
      }
    }

    console.log(
      `Duplication complete. Successes: ${successCount}, Errors: ${errorCount}`
    );

    if (successCount > 0) {
      toast.success(`Successfully duplicated ${successCount} shoeing(s).`);
    }

    if (errorCount > 0) {
      toast.error(`Failed to duplicate ${errorCount} shoeing(s).`);
    }

    setSelectedShoeings([]);
    setIsDuplicateDialogOpen(false);
    setDuplicateDate(undefined);

    console.log("Refreshing shoeings list...");
    await fetchShoeings(startOfMonth(currentDate), endOfMonth(currentDate));
    console.log("Shoeings refreshed");
  };

  const renderDayView = (date: Date) => {
    const shoeingsForDate = getShoeingsForDate(date);

    return (
      <div className="col-span-7 bg-white border border-gray-200 rounded-md h-full flex flex-col">
        <h3
          className={`text-base sm:text-lg font-semibold p-2 sm:p-4 ${
            isToday(date) ? "text-primary" : ""
          }`}
        >
          {date.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h3>
        <div className="flex-grow overflow-y-auto no-scrollbar p-2 sm:p-4">
          <div className="space-y-2 h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar">
            {shoeingsForDate.length > 0 ? (
              <>
                <Accordion type="single" collapsible className="w-full">
                  {shoeingsForDate.map((shoeing, index) => {
                    const bgColor = getLocationColor(
                      shoeing["Location of Service"]
                    );
                    const [horseName, barnTrainer] =
                      shoeing.Horses.split(" - ");
                    return (
                      <AccordionItem
                        key={shoeing.id}
                        value={`item-${index}`}
                        style={{ backgroundColor: bgColor }}
                        className="rounded-md mb-2"
                      >
                        <div className="flex items-center">
                          <Checkbox
                            checked={selectedShoeings.includes(shoeing.id)}
                            onCheckedChange={() =>
                              handleShoeingSelection(shoeing.id)
                            }
                            className="ml-2 mr-2"
                          />
                          <AccordionTrigger className="font-semibold text-lg flex-grow">
                            <div className="flex flex-col items-start w-full text-left">
                              <span className="text-lg">{horseName}</span>
                              <div className="flex items-center text-sm font-normal">
                                <House className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">
                                  {barnTrainer?.replace(/[\[\]]/g, "").trim() ||
                                    ""}
                                </span>
                              </div>
                              <span className="text-xs mt-1">
                                {shoeing["Location of Service"]}
                              </span>
                            </div>
                          </AccordionTrigger>
                        </div>
                        <AccordionContent className="px-4 py-2">
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
                    );
                  })}
                </Accordion>
                {selectedShoeings.length > 0 && (
                  <Dialog
                    open={isDuplicateDialogOpen}
                    onOpenChange={setIsDuplicateDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="mt-4">
                        Duplicate Selected ({selectedShoeings.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Duplicate Shoeings</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <CalendarPicker
                          mode="single"
                          selected={duplicateDate}
                          onSelect={setDuplicateDate}
                          disabled={(date) => date <= new Date()}
                          initialFocus
                        />
                      </div>
                      <Button
                        onClick={handleDuplicateShoeings}
                        disabled={!duplicateDate}
                      >
                        Duplicate
                      </Button>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            ) : (
              <p>No shoeings for this day.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setViewMode("month");
  };

  useEffect(() => {
    const fetchLocationColors = async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, location_color");
      if (error) {
        console.error("Error fetching location colors:", error);
        return;
      }
      if (data) {
        const colors = data.reduce(
          (acc, loc) => ({ ...acc, [loc.id]: loc.location_color }),
          {}
        );
        console.log("Fetched location colors:", colors);
        setLocationColors(colors);
      }
    };

    fetchLocationColors();
  }, []);

  useEffect(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    fetchShoeings(start, end);
    fetchLocations();
  }, [currentDate]);

  useEffect(() => {
    console.log("Shoeings updated:", shoeings);
    console.log("Location colors:", locationColors);
  }, [shoeings, locationColors]);

  return (
    <Card className="w-full min-h-[calc(100vh-4rem)] shadow-lg flex flex-col">
      <CardContent className="p-4 sm:p-6 flex flex-col flex-grow">
        <div className="flex flex-col h-full">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-2xl font-bold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigatePeriod("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigatePeriod("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden sm:inline-flex"
                onClick={goToToday}
              >
                Today
              </Button>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="sm:hidden"
                  onClick={goToToday}
                >
                  Today
                </Button>
                <Select
                  value={viewMode}
                  onValueChange={(value: "month" | "week" | "day") =>
                    setViewMode(value)
                  }
                >
                  <SelectTrigger className="w-[100px] sm:w-[180px]">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div
            className={`flex-grow grid ${
              viewMode === "day" ? "grid-cols-1" : "grid-cols-7"
            } gap-px bg-gray-200 overflow-y-auto h-[calc(100vh-12rem)]`}
            style={{ maxHeight: "calc(100vh - 12rem)" }} // Set max height
            key={currentDate.toISOString()}
          >
            {renderCalendarContent()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
