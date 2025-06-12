import { useState } from "react";

import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { SelectSingleEventHandler } from "react-day-picker";

interface DatePickerProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  disabledDate?: (date: Date) => boolean;
}

export function DatePicker({
  selected,
  onSelect,
  disabledDate,
}: DatePickerProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleOnSelect: SelectSingleEventHandler = (date) => {
    if (date) {
      onSelect?.(date);
      setIsPopoverOpen(false);
    }
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal cursor-pointer",
            !selected && "text-muted-foreground"
          )}
        >
          {selected ? (
            format(selected, "PPP", { locale: id })
          ) : (
            <span>Pilih Tanggal</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleOnSelect}
          captionLayout="dropdown"
          disabled={disabledDate}
        />
      </PopoverContent>
    </Popover>
  );
}
