"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
  className?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  placeholder?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  disabled = false,
  align = "start",
  placeholder = "Pilih tanggal",
}: DateRangePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange.from && !dateRange.to && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "PPP", { locale: id })} -{" "}
                  {format(dateRange.to, "PPP", { locale: id })}
                </>
              ) : (
                format(dateRange.from, "PPP")
              )
            ) : (
              <span>{placeholder}</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={{
              from: dateRange.from,
              to: dateRange.to,
            }}
            onSelect={(selectedRange) => {
              onDateRangeChange({
                from: selectedRange?.from,
                to: selectedRange?.to,
              });
            }}
            numberOfMonths={2}
            disabled={(date) =>
              date < new Date(new Date().setHours(0, 0, 0, 0))
            }
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
