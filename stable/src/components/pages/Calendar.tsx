import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as _CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

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
  "Date of Service": string;
  Horses: string;
  "Location of Service": string;
  "Base Service": string;
}

const TODAY = new Date();

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [shoeings, setShoeings] = useState<Shoeing[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    fetchShoeings();
    fetchLocations();
  }, [viewMode]);

  const fetchShoeings = async () => {
    console.log("Fetching all shoeings");

    const { data, error } = await supabase
      .from("shoeings")
      .select(
        'id, "Date of Service", Horses, "Location of Service", "Base Service"'
      );

    console.log("Supabase response:", { data, error });

    if (error) {
      console.error("Error fetching shoeings:", error);
    } else {
      setShoeings(data || []);
    }
  };

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from("locations")
      .select("service_location, location_color");
    console.log("Supabase response:", { data, error });
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
    const dateString = date.toISOString().split("T")[0];
    return shoeings.filter((shoeing) => {
      const shoeingDate = new Date(shoeing["Date of Service"]);
      return shoeingDate.toISOString().split("T")[0] === dateString;
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
        <span className="font-semibold block">{shoeing.Horses}</span>
        <span className="text-[8px] sm:text-xs">
          {shoeing["Location of Service"]}
        </span>
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

  const renderDayView = (date: Date) => {
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
            {getShoeingsForDate(date).map(renderShoeing)}
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

  return (
    <Card className="w-full h-full shadow-lg flex flex-col">
      <CardContent className="p-6 flex flex-col flex-grow">
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
          <div
            className={`flex-grow grid ${
              viewMode === "day" ? "grid-cols-1" : "grid-cols-7"
            } gap-px bg-gray-200 overflow-hidden`}
            key={currentDate.toISOString()}
          >
            {renderCalendarContent()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
