import React from "react";
import {
  format,
  subDays,
  startOfYear,
  startOfDay,
  endOfDay,
  parseISO,
} from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "@radix-ui/react-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Calendar } from "./calendar";
import { DateRange } from "react-day-picker";

export function DatePickerWithPresets({
  dateRange,
  setDateRange,
}: {
  dateRange: { from: string | null; to: string | null } | undefined;
  setDateRange: (
    dateRange: { from: string | null; to: string | null } | undefined
  ) => void;
}) {
  const setFullDayRange = (range: any | undefined) => {
    if (range?.from) {
      const fromDate = startOfDay(range.from);
      range.from = format(fromDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
    }
    if (range?.to) {
      const toDate = endOfDay(range.to);
      range.to = format(toDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
    }
    setDateRange(range as { from: string | null; to: string | null });
  };

  // Convert string dates to Date objects for the Calendar component
  const calendarDateRange: DateRange | undefined = dateRange
    ? {
        from: dateRange.from ? parseISO(dateRange.from) : undefined,
        to: dateRange.to ? parseISO(dateRange.to) : undefined,
      }
    : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !dateRange && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(parseISO(dateRange.from), "LLL dd, y")} -{" "}
                {format(parseISO(dateRange.to), "LLL dd, y")}
              </>
            ) : (
              format(parseISO(dateRange.from), "LLL dd, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-auto flex-col space-y-2 p-2">
        <Select
          onValueChange={(value) => {
            const today = new Date();
            switch (value) {
              case "today":
                setFullDayRange({ from: today, to: today });
                break;
              case "yesterday":
                const yesterday = subDays(today, 1);
                setFullDayRange({ from: yesterday, to: yesterday });
                break;
              case "lastWeek":
                setFullDayRange({ from: subDays(today, 7), to: today });
                break;
              case "lastMonth":
                setFullDayRange({ from: subDays(today, 30), to: today });
                break;
              case "yearToDate":
                setFullDayRange({ from: startOfYear(today), to: today });
                break;
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="lastWeek">Last Week</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="yearToDate">Year-to-Date</SelectItem>
          </SelectContent>
        </Select>
        <div className="rounded-md border">
          <Calendar
            mode="range"
            selected={calendarDateRange}
            onSelect={setFullDayRange}
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
