import { useState } from "react";
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
  "2024-09-01": [
    { id: "1", title: "21993-Marty - [PJP]", color: "bg-blue-200" },
  ],
  "2024-09-02": [
    {
      id: "2",
      title: "21995-Lovey - [True Companions]",
      color: "bg-orange-200",
    },
  ],
  "2024-09-03": [
    { id: "3", title: "22003-Cavallier - [Pine Hollow]", color: "bg-blue-200" },
  ],
  "2024-09-04": [
    { id: "4", title: "22010-Jasper - [Pine Hollow]", color: "bg-blue-200" },
  ],
  "2024-09-05": [
    { id: "5", title: "22023-Atlanta - [Madrona]", color: "bg-orange-200" },
  ],
  "2024-09-06": [
    { id: "6", title: "22030-McKenna - [Erikson]", color: "bg-blue-200" },
  ],
};

const TODAY = new Date();

export default function Component() {
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
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    ).getDay();
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return MOCK_APPOINTMENTS[dateString] || [];
  };

  const generateWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
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
        return renderMonthView();
      case "week":
        return renderWeekView();
      case "day":
        return renderDayView();
    }
  };

  const renderMonthView = () => {
    const calendarDays = generateCalendarDays();
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
              day && isToday(day) ? "border-2 border-primary" : ""
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

  const renderWeekView = () => {
    const weekDays = generateWeekDays();
    return (
      <>
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`bg-white p-2 flex flex-col h-full ${
              isToday(day) ? "bg-primary-100" : ""
            }`}
          >
            <div
              className={`text-center mb-2 ${
                isToday(day) ? "font-bold text-primary-600" : ""
              }`}
            >
              <div className="font-semibold">{DAYS[day.getDay()]}</div>
              <div className="text-sm text-gray-500">{day.getDate()}</div>
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

  const renderDayView = () => {
    return (
      <div className="col-span-7 bg-white p-4">
        <h3
          className={`text-lg font-semibold mb-4 ${
            isToday(currentDate) ? "text-primary-600" : ""
          }`}
        >
          {currentDate.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h3>
        <div className="space-y-2">
          {getAppointmentsForDate(currentDate).map((appointment) => (
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

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
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
          <Button variant="outline" className="hidden sm:inline-flex">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="hidden sm:inline-flex">
                See records
                <MoreHorizontal className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>View all records</DropdownMenuItem>
              <DropdownMenuItem>Export records</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="sm:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Today</DropdownMenuItem>
              <DropdownMenuItem>See records</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div
        className={`flex-grow grid ${
          viewMode === "day" ? "grid-cols-1" : "grid-cols-7"
        } gap-px bg-gray-200 overflow-hidden`}
      >
        {renderCalendarContent()}
      </div>
    </div>
  );
}
