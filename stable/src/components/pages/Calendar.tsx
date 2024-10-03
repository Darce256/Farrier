import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

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

type Appointment = {
  id: string;
  title: string;
  color: string;
};

const MOCK_APPOINTMENTS: Record<string, Appointment[]> = {
  "2024-10-01": [
    { id: "1", title: "21993-Marty - [PJP]", color: "bg-blue-200" },
  ],
  "2024-10-02": [
    {
      id: "2",
      title: "21995-Lovey - [True Companions]",
      color: "bg-orange-200",
    },
  ],
  "2024-10-03": [
    { id: "3", title: "22003-Cavallier - [Pine Hollow]", color: "bg-blue-200" },
  ],
  "2024-10-04": [
    { id: "4", title: "22010-Jasper - [Pine Hollow]", color: "bg-blue-200" },
  ],
  "2024-10-05": [
    { id: "5", title: "22023-Atlanta - [Madrona]", color: "bg-orange-200" },
  ],
  "2024-10-06": [
    { id: "6", title: "22030-McKenna - [Erikson]", color: "bg-blue-200" },
  ],
};

const TODAY = new Date();

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

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

  const getAppointmentsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return MOCK_APPOINTMENTS[dateString] || [];
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

  const renderMonthView = (date: Date) => {
    console.log("Rendering month view for:", date);
    const calendarDays = generateCalendarDays(date);
    return (
      <>
        {DAYS.map((day) => (
          <div
            key={day}
            className="bg-white p-2 text-center font-semibold hidden sm:block"
          >
            {day}
          </div>
        ))}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`bg-white p-2 h-full sm:h-full overflow-y-auto ${
              day && isToday(day) ? "border-2 border-primary/70" : ""
            }`}
          >
            {day && (
              <>
                <div
                  className={`text-right ${
                    isToday(day) ? "font-bold text-primary" : "text-gray-500"
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {getAppointmentsForDate(day).map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`${appointment.color} p-1 rounded text-xs truncate`}
                    >
                      {appointment.title}
                    </div>
                  ))}
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
            className={`bg-white p-2 flex flex-col h-full ${
              isToday(day) ? "border-2 border-primary/70" : ""
            }`}
          >
            <div
              className={`text-center mb-2 ${
                isToday(day) ? "font-bold text-primary" : ""
              }`}
            >
              <div className="font-semibold">{DAYS[day.getDay()]}</div>
              <div className="text-sm ">{day.getDate()}</div>
            </div>
            <div className="flex-grow overflow-y-auto">
              {getAppointmentsForDate(day).map((appointment) => (
                <div
                  key={appointment.id}
                  className={`${appointment.color} p-1 rounded text-xs truncate mb-1`}
                >
                  {appointment.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </>
    );
  };

  const renderDayView = (date: Date) => {
    return (
      <div className="col-span-7 bg-white p-4 border border-gray-200 rounded-md h-full">
        <h3
          className={`text-lg font-semibold mb-4 ${
            isToday(date) ? "text-black" : ""
          }`}
        >
          {date.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h3>
        <div className="space-y-2 overflow-y-auto h-[calc(100%-2rem)]">
          {getAppointmentsForDate(date).map((appointment) => (
            <div
              key={appointment.id}
              className={`${appointment.color} p-2 rounded`}
            >
              {appointment.title}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setViewMode("month");
  };

  useEffect(() => {}, [currentDate]);

  return (
    <Card className="w-full h-[calc(100vh-2rem)] shadow-lg flex flex-col">
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
