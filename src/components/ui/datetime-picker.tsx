import * as React from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DateTimePicker({
  date,
  setDate,
  placeholder = "选择日期和时间",
}: DateTimePickerProps) {
  const [selectedDateTime, setSelectedDateTime] = React.useState<Date | undefined>(date);
  const [timeValue, setTimeValue] = React.useState<string>(
    date ? format(date, "HH:mm") : "12:00"
  );

  React.useEffect(() => {
    if (date) {
      setSelectedDateTime(date);
      setTimeValue(format(date, "HH:mm"));
    }
  }, [date]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // 保留当前时间
      const [hours, minutes] = timeValue.split(":");
      selectedDate.setHours(parseInt(hours), parseInt(minutes));
      setSelectedDateTime(selectedDate);
      setDate(selectedDate);
    } else {
      setSelectedDateTime(undefined);
      setDate(undefined);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setTimeValue(time);

    if (selectedDateTime) {
      const [hours, minutes] = time.split(":");
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setHours(parseInt(hours), parseInt(minutes));
      setSelectedDateTime(newDateTime);
      setDate(newDateTime);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDateTime && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDateTime ? (
            format(selectedDateTime, "yyyy年MM月dd日 HH:mm", { locale: zhCN })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDateTime}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="flex-1"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
