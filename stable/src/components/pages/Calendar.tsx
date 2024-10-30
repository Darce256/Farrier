import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as _CalendarIcon,
  House,
  AlertCircle,
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
} from "@/components/ui/dialog";
import {
  format,
  parse,
  isValid,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
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

interface Horse {
  id: string;
  Name: string | null;
  "Barn / Trainer": string | null;
  alert: string | null;
  // Add other fields as needed
}

const TODAY = new Date();

const Spinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

export default function Calendar() {
  const [allShoeings, setAllShoeings] = useState<Shoeing[]>([]);
  const [currentMonthShoeings, setCurrentMonthShoeings] = useState<Shoeing[]>(
    []
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedShoeings, setSelectedShoeings] = useState<string[]>([]);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateDate, setDuplicateDate] = useState<Date | undefined>(
    undefined
  );
  const [locationColors, setLocationColors] = useState<Record<number, string>>(
    {}
  );
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(
    undefined
  );
  const [horses, setHorses] = useState<Horse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllShoeings = async () => {
    console.log("Fetching all shoeings");
    let allShoeings: Shoeing[] = [];
    let lastId: string | null = null;
    const pageSize = 1000;

    while (true) {
      let query = supabase
        .from("shoeings")
        .select("*")
        .not("status", "eq", "cancelled")
        .order("id", { ascending: true })
        .limit(pageSize);

      if (lastId) {
        query = query.gt("id", lastId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching shoeings:", error);
        toast.error("Failed to fetch shoeings");
        break;
      }

      if (data && data.length > 0) {
        allShoeings = [...allShoeings, ...data];
        lastId = data[data.length - 1].id;
        console.log(
          `Fetched ${data.length} shoeings. Total: ${allShoeings.length}`
        );
      } else {
        break;
      }
    }

    console.log(`Total shoeings fetched: ${allShoeings.length}`);
    return allShoeings;
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

  const fetchHorses = async () => {
    let allHorses: Horse[] = [];
    let lastId: string | null = null;
    const pageSize = 1000;

    while (true) {
      let query = supabase
        .from("horses")
        .select('id, Name, "Barn / Trainer", alert')
        .order("id", { ascending: true })
        .limit(pageSize);

      if (lastId) {
        query = query.gt("id", lastId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching horses:", error);
        toast.error("Failed to fetch horses");
        break;
      }

      if (data && data.length > 0) {
        allHorses = [...allHorses, ...data];
        lastId = data[data.length - 1].id;
        console.log(
          `Fetched ${data.length} horses. Total: ${allHorses.length}`
        );
      } else {
        break;
      }
    }

    console.log(`Total horses fetched: ${allHorses.length}`);
    setHorses(allHorses);
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
    return currentMonthShoeings.filter((shoeing) => {
      if (!shoeing["Date of Service"]) return false;
      return shoeing["Date of Service"] === dateString;
    });
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

    // Check if the horse has an alert
    const horse = horses.find((h) => h.Name === horseName);
    const hasAlert = horse && horse.alert;

    return (
      <div
        key={shoeing.id}
        style={{
          backgroundColor: bgColor,
          color: "#000",
          padding: "0.25rem",
          borderRadius: "0.25rem",
          marginBottom: "0.25rem",
          border: hasAlert ? "2px solid red" : "none", // Add red border if there's an alert
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
        {calendarDays.map((day, index) => {
          const shoeingsForDay = day ? getShoeingsForDate(day) : [];
          const hasAlert = shoeingsForDay.some((shoeing) => {
            const [horseName] = shoeing.Horses.split(" - ");
            const horse = horses.find((h) => h.Name === horseName);
            return horse && horse.alert;
          });

          return (
            <div
              key={index}
              className={`bg-white p-1 sm:p-2 h-24 sm:h-32 md:h-40 flex flex-col ${
                day && isToday(day) ? "border-2 border-primary" : ""
              } ${hasAlert ? "border-2 border-red-500" : ""}`}
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
                      {shoeingsForDay.map(renderShoeing)}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </>
    );
  };

  const renderWeekView = (date: Date) => {
    const weekDays = generateWeekDays(date);
    return (
      <>
        {weekDays.map((day, index) => {
          const shoeingsForDay = getShoeingsForDate(day);
          const hasAlert = shoeingsForDay.some((shoeing) => {
            const [horseName] = shoeing.Horses.split(" - ");
            const horse = horses.find((h) => h.Name === horseName);
            return horse && horse.alert;
          });

          return (
            <div
              key={index}
              className={`bg-white p-1 sm:p-2 flex flex-col h-full ${
                isToday(day) ? "border-2 border-primary" : ""
              } ${hasAlert ? "border-2 border-red-500" : ""}`}
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
                {shoeingsForDay.map(renderShoeing)}
              </div>
            </div>
          );
        })}
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

  const toggleDuplication = () => {
    if (showCheckboxes) {
      // If checkboxes are shown, open the duplicate dialog
      if (selectedShoeings.length > 0) {
        setIsDuplicateDialogOpen(true);
      } else {
        toast.error("Please select at least one shoeing to duplicate.");
      }
    } else {
      // If checkboxes are not shown, show them
      setShowCheckboxes(true);
    }
  };

  const cancelDuplication = () => {
    resetDuplicationState();
  };

  const resetDuplicationState = () => {
    setShowCheckboxes(false);
    setSelectedShoeings([]);
    setSelectedLocation(undefined);
  };

  const handleDuplicateShoeings = async () => {
    if (
      !duplicateDate ||
      !selectedLocation ||
      selectedShoeings.length === 0 ||
      !user
    )
      return;

    console.log("Starting duplication process");
    console.log("Selected shoeings:", selectedShoeings);
    console.log("Duplicate date:", duplicateDate);
    console.log("Selected location:", selectedLocation);
    console.log("Current user ID:", user.id);

    let successCount = 0;
    let errorCount = 0;

    const shoeingsToDuplicate = allShoeings.filter((shoeing) =>
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
        "Location of Service": selectedLocation, // Use the selected location
        status: "pending",
        Invoice: null,
        "1. Invoice": null,
        "Date Sent": null,
        user_id: user.id,
      };

      console.log("Attempting to insert new shoeing:", newShoeing);

      const { data, error } = await supabase
        .from("shoeings")
        .insert([newShoeing])
        .select();

      if (error) {
        console.error("Error duplicating shoeing:", error);
        errorCount++;
      } else {
        console.log("Shoeing duplicated successfully:", data);
        successCount++;
      }
    }

    console.log(
      `Duplication complete. Successes: ${successCount}, Errors: ${errorCount}`
    );

    if (successCount > 0) {
      toast.success(`Shoeing Duplication(s) Successful!`);
    }

    if (errorCount > 0) {
      toast.error(`Failed to duplicate ${errorCount} shoeing(s).`);
    }

    resetDuplicationState();
    setIsDuplicateDialogOpen(false);
    setDuplicateDate(undefined);
    setSelectedLocation(undefined); // Reset the selected location

    console.log("Refreshing shoeings list...");
    await fetchAllShoeings();
    console.log("Shoeings refreshed");
  };

  const renderDayView = (date: Date) => {
    const shoeingsForDate = getShoeingsForDate(date);

    return (
      <div className="col-span-7 bg-white border border-gray-200 rounded-md h-full flex flex-col">
        <div className="flex justify-between items-center p-2 sm:p-4">
          <h3
            className={`text-base sm:text-lg font-semibold ${
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
          <div className="flex space-x-2">
            {showCheckboxes && (
              <Button onClick={cancelDuplication} variant="outline">
                Cancel
              </Button>
            )}
            <Button
              onClick={toggleDuplication}
              className="hover:bg-black hover:text-white"
            >
              {showCheckboxes ? "Confirm Duplication" : "Duplicate Shoeings"}
            </Button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto no-scrollbar p-2 sm:p-4">
          <div className="space-y-2 h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar">
            {shoeingsForDate.length > 0 ? (
              shoeingsForDate.map((shoeing) => {
                const bgColor = getLocationColor(
                  shoeing["Location of Service"]
                );
                const [horseName, barnTrainer] = shoeing.Horses.split(" - ");
                const horse = horses.find((h) => h.Name === horseName);
                const hasAlert = horse && horse.alert;
                return (
                  <div
                    key={shoeing.id}
                    className={`rounded-md mb-2 p-4 ${
                      hasAlert ? "border-2 border-red-500" : ""
                    }`}
                    style={{ backgroundColor: bgColor }}
                  >
                    <div className="flex items-center w-full mb-2">
                      {showCheckboxes && (
                        <Checkbox
                          checked={selectedShoeings.includes(shoeing.id)}
                          onCheckedChange={() =>
                            handleShoeingSelection(shoeing.id)
                          }
                          className="mr-2 flex-shrink-0 text-white border-black bg-transparent"
                        />
                      )}
                      <div className="flex-grow">
                        <span className="text-lg font-semibold">
                          {horseName}
                        </span>
                        <div className="flex items-center text-sm">
                          <House className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">
                            {barnTrainer?.replace(/[\[\]]/g, "").trim() || ""}
                          </span>
                        </div>
                        <span className="text-xs mt-1 block">
                          {shoeing["Location of Service"]}
                        </span>
                      </div>
                    </div>
                    {hasAlert && (
                      <div className="flex items-start bg-red-100 text-red-700 p-2 rounded-md mb-2 text-xs">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                        <span
                          className="line-clamp-2"
                          title={horse.alert || ""}
                        >
                          {horse.alert}
                        </span>
                      </div>
                    )}
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Base Service:</strong> {shoeing["Base Service"]}
                      </p>
                      {shoeing["Front Add-On's"] && (
                        <p>
                          <strong>Front Add-On's:</strong>{" "}
                          {shoeing["Front Add-On's"]}
                        </p>
                      )}
                      {shoeing["Hind Add-On's"] && (
                        <p>
                          <strong>Hind Add-On's:</strong>{" "}
                          {shoeing["Hind Add-On's"]}
                        </p>
                      )}
                      {shoeing["Other Custom Services"] && (
                        <p>
                          <strong>Other Custom Services:</strong>{" "}
                          {shoeing["Other Custom Services"]}
                        </p>
                      )}
                      {shoeing["Shoe Notes"] && (
                        <p>
                          <strong>Notes:</strong> {shoeing["Shoe Notes"]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
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
    setViewMode("day");
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
    const loadData = async () => {
      setIsLoading(true);
      try {
        const shoeings = await fetchAllShoeings();
        setAllShoeings(shoeings);
        await fetchLocations();
        await fetchHorses();
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load calendar data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const shoeingsForMonth = filterShoeingsForMonth(allShoeings, currentDate);
    setCurrentMonthShoeings(shoeingsForMonth);
  }, [allShoeings, currentDate]);

  useEffect(() => {
    console.log("Shoeings updated:", allShoeings);
    console.log("Location colors:", locationColors);
  }, [allShoeings, locationColors]);

  return (
    <Card className="w-full min-h-[calc(100vh-4rem)] shadow-lg flex flex-col">
      <CardContent className="p-4 sm:p-6 flex flex-col flex-grow">
        {isLoading ? (
          <Spinner />
        ) : (
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
              style={{ maxHeight: "calc(100vh - 12rem)" }}
              key={currentDate.toISOString()}
            >
              {renderCalendarContent()}
            </div>
          </div>
        )}
      </CardContent>
      <Dialog
        open={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px] w-[calc(100%-3rem)] mr-12 rounded-lg overflow-hidden max-h-[90vh] flex flex-col bg-white">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>Duplicate Shoeings</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4 space-y-4 flex-grow overflow-y-auto">
            <div>
              <label
                htmlFor="location-select"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Location of Service
              </label>
              <Select
                onValueChange={setSelectedLocation}
                value={selectedLocation}
              >
                <SelectTrigger id="location-select">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem
                      key={location.service_location}
                      value={location.service_location}
                    >
                      {location.service_location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CalendarPicker
              mode="single"
              selected={duplicateDate}
              onSelect={setDuplicateDate}
              disabled={(date) => date <= new Date()}
              initialFocus
              className="w-full"
              classNames={{
                months:
                  "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full",
                head_cell:
                  "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 w-full",
                day: "h-9 w-full p-0 font-normal aria-selected:opacity-100",
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              components={{
                IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                IconRight: () => <ChevronRight className="h-4 w-4" />,
              }}
            />
          </div>
          <div className="px-4 py-3 bg-gray-50 sm:px-6">
            <Button
              onClick={handleDuplicateShoeings}
              disabled={!duplicateDate || !selectedLocation}
              className="w-full hover:bg-black hover:text-white"
            >
              Duplicate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

const filterShoeingsForMonth = (shoeings: Shoeing[], date: Date) => {
  const startOfMonthDate = startOfMonth(date);
  const endOfMonthDate = endOfMonth(date);

  return shoeings.filter((shoeing) => {
    if (!shoeing["Date of Service"]) {
      return false;
    }

    try {
      const shoeingDate = parse(
        shoeing["Date of Service"],
        "M/d/yyyy",
        new Date()
      );
      if (!isValid(shoeingDate)) {
        console.warn(
          `Invalid date for shoeing with id ${shoeing.id}: ${shoeing["Date of Service"]}`
        );
        return false;
      }
      return isWithinInterval(shoeingDate, {
        start: startOfMonthDate,
        end: endOfMonthDate,
      });
    } catch (error) {
      console.error(
        `Error parsing date for shoeing with id ${shoeing.id}:`,
        error
      );
      return false;
    }
  });
};
