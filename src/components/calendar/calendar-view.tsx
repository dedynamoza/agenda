"use client";

import type React from "react";

import { useState, useCallback, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityFormDialog } from "@/components/dialog/add-activity-dialog";
import { ActivityDetailDialog } from "@/components/dialog/activity-detail-dialog";

import {
  isTodayDate,
  isPastDateObject,
  getIndonesiaDateInfo,
  cn,
} from "@/lib/utils";
import type { ActivityRes } from "@/types/activity";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Grid3X3,
  ChevronDown,
  MoreHorizontal,
  CalendarCheck,
} from "lucide-react";
import { useEmployeeFilter } from "@/hooks/use-employee-filter";

interface ModernCalendarViewProps {
  currentYear: number;
  currentMonth: number;
  onMonthChange: (month: number, year?: number) => void;
  viewMode: "calendar" | "week";
  onViewModeChange: (mode: "calendar" | "week") => void;
}

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const ACTIVITY_COLORS = {
  PROSPECT_MEETING: "bg-blue-500",
  ESCORT_TEAM: "bg-green-500",
  PERJALANAN_DINAS: "bg-purple-500",
  TAMU_UNDANGAN: "bg-amber-500",
  RETENTION_TEAM: "bg-red-500",
};

export function ModernCalendarView({
  currentYear,
  currentMonth,
  onMonthChange,
  viewMode,
  onViewModeChange,
}: ModernCalendarViewProps) {
  const { selectedEmployee } = useEmployeeFilter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityRes | null>(
    null
  );
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);

  // Fetch activities with proper query key
  const { data: activities = [] } = useQuery({
    queryKey: ["activities", currentYear, currentMonth, selectedEmployee?.id],
    queryFn: async () => {
      const params = new URLSearchParams({
        year: currentYear.toString(),
        month: currentMonth.toString(),
      });

      if (selectedEmployee?.id) {
        params.append("employeeId", selectedEmployee.id);
      }

      const response = await fetch(`/api/activities?${params}`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Memoize calendar days generation to prevent unnecessary recalculations
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentYear, currentMonth]);

  // Memoize activities lookup function with proper timezone handling
  const getActivitiesForDate = useCallback(
    (date: Date) => {
      // Create date string in local timezone to avoid UTC conversion issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const localDateStr = `${year}-${month}-${day}`;

      return activities.filter((activity: ActivityRes) => {
        // Convert activity date to local date string for comparison
        const activityDate = new Date(activity.date);
        const actYear = activityDate.getFullYear();
        const actMonth = String(activityDate.getMonth() + 1).padStart(2, "0");
        const actDay = String(activityDate.getDate()).padStart(2, "0");
        const activityDateStr = `${actYear}-${actMonth}-${actDay}`;

        return activityDateStr === localDateStr;
      });
    },
    [activities]
  );

  // Memoize event handlers to prevent unnecessary re-renders
  const handleDateClick = useCallback(
    (date: Date, event: React.MouseEvent) => {
      event.stopPropagation();

      // Don't allow adding activities to past dates or dates outside current month
      if (date.getMonth() !== currentMonth || isPastDateObject(date)) {
        return;
      }

      setSelectedDate(date);
      setShowActivityDialog(true);
    },
    [currentMonth]
  );

  const handleActivityClick = useCallback(
    (activity: ActivityRes, event: React.MouseEvent) => {
      event.stopPropagation();
      setSelectedActivity(activity);
      setShowDetailDialog(true);
    },
    []
  );

  const handleTodayClick = useCallback(() => {
    // Get current date in Indonesia timezone
    const indonesiaDateInfo = getIndonesiaDateInfo();
    onMonthChange(indonesiaDateInfo.month, indonesiaDateInfo.year);
  }, [onMonthChange]);

  const handleMonthChange = useCallback(
    (month: string) => {
      onMonthChange(Number.parseInt(month), currentYear);
    },
    [onMonthChange, currentYear]
  );

  const handleYearChange = useCallback(
    (year: string) => {
      onMonthChange(currentMonth, Number.parseInt(year));
    },
    [onMonthChange, currentMonth]
  );

  // Memoized helper functions for date checks
  const isCurrentMonth = useCallback(
    (date: Date) => date.getMonth() === currentMonth,
    [currentMonth]
  );
  const isSunday = useCallback((date: Date) => date.getDay() === 0, []);

  // Generate year options
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    const endYear = currentYear + 5;
    const years = [];

    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }

    return years;
  }, []);

  return (
    <div className="w-full space-y-4 md:space-y-2">
      {/* Modern Calendar Header - Mobile Optimized */}
      <div className="flex items-center justify-between">
        {/* Left Section - Navigation Controls */}
        <div className="flex items-center gap-2">
          {/* Today Button - Icon only on mobile */}
          <Button
            onClick={handleTodayClick}
            variant="outline"
            size="sm"
            className="font-medium border-slate-300 hover:bg-slate-50 h-8 sm:h-9 px-2 sm:px-3 cursor-pointer"
          >
            <CalendarCheck className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1 md:hidden" />
            <span className="hidden md:inline text-xs sm:text-sm">Today</span>
          </Button>

          {/* Month Selector */}
          <Select
            value={currentMonth.toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-[80px] sm:w-[130px] bg-white/20 backdrop-blur-sm border border-white/20 text-white cursor-pointer hover:bg-white/30 hover:text-white h-8 sm:h-9 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem
                  key={index}
                  className="cursor-pointer"
                  value={index.toString()}
                >
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year Selector */}
          <Select
            value={currentYear.toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[90px] bg-white/20 backdrop-blur-sm border border-white/20 text-white cursor-pointer hover:bg-white/30 hover:text-white h-8 sm:h-9 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem
                  className="cursor-pointer"
                  key={year}
                  value={year.toString()}
                >
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right Section - View Mode */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="font-medium border-slate-300 hover:bg-slate-50 h-8 sm:h-9 px-2 sm:px-3 cursor-pointer"
            >
              {/* Show icon only on mobile, text + icon on desktop */}
              {viewMode === "calendar" ? (
                <>
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-1 text-xs sm:text-sm">
                    Calendar
                  </span>
                </>
              ) : (
                <>
                  <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-1 text-xs sm:text-sm">
                    Week
                  </span>
                </>
              )}
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onViewModeChange("calendar")}
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Calendar View
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onViewModeChange("week")}
            >
              <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Week View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Calendar Grid - Mobile Optimized */}
      <Card className="border-0 shadow-lg overflow-hidden py-0 rounded-lg">
        <CardContent className="p-0">
          <div className="bg-white">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-200">
              {DAYS.map((day, index) => (
                <div
                  key={day}
                  className={`p-1.5 sm:p-2 text-center text-xs sm:text-sm font-semibold ${
                    index === 0 ? "text-red-600" : "text-slate-600"
                  } bg-slate-50`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date) => {
                const dayActivities = getActivitiesForDate(date);
                const isCurrentMonthDate = isCurrentMonth(date);
                const isTodayDateValue = isTodayDate(date);
                const isPastDateValue = isPastDateObject(date);
                const isSundayDate = isSunday(date);
                const hasMoreActivities = dayActivities.length > 1;

                // Determine if date should be clickable (not past and in current month)
                const isClickable = isCurrentMonthDate && !isPastDateValue;

                return (
                  <div
                    key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                    className={`
                      min-h-[60px] sm:min-h-[70px] lg:min-h-[75px] border-r border-b border-slate-200 p-1 sm:p-1.5 transition-all duration-200
                      ${!isCurrentMonthDate ? "bg-slate-100/50" : "bg-white"}
                      ${
                        isSundayDate && isCurrentMonthDate ? "bg-red-50/30" : ""
                      }
                      ${
                        isPastDateValue && isCurrentMonthDate
                          ? "opacity-50"
                          : ""
                      }
                      ${
                        isClickable
                          ? "cursor-pointer hover:bg-slate-50"
                          : "cursor-default"
                      }
                    `}
                    onClick={(e) =>
                      isClickable ? handleDateClick(date, e) : undefined
                    }
                  >
                    {/* Date Number */}
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`
                          text-xs font-medium transition-all duration-200 w-4 h-4 sm:w-5 sm:h-5
                          ${
                            !isCurrentMonthDate
                              ? "text-slate-400"
                              : "text-slate-700"
                          }
                          ${
                            isTodayDateValue
                              ? "bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold"
                              : ""
                          }
                          ${
                            isSundayDate &&
                            isCurrentMonthDate &&
                            !isTodayDateValue
                              ? "text-red-600 font-bold"
                              : ""
                          }
                          ${
                            isPastDateValue &&
                            isCurrentMonthDate &&
                            !isTodayDateValue
                              ? "text-slate-400"
                              : ""
                          }
                        `}
                      >
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Activities */}
                    <div className="space-y-0.5">
                      {dayActivities.length > 0 && (
                        <div
                          onClick={(e) =>
                            handleActivityClick(dayActivities[0], e)
                          }
                          className={cn(
                            "text-[8px] sm:text-[10px] p-0.5 sm:p-1 rounded-sm text-white cursor-pointer hover:opacity-90 transition-all duration-200",
                            ACTIVITY_COLORS[
                              dayActivities[0]
                                .activityType as keyof typeof ACTIVITY_COLORS
                            ] || "bg-slate-500",
                            dayActivities[0].strikethrough && "opacity-60"
                          )}
                        >
                          {/* Mobile: Show only time, Desktop: Show time + title */}
                          <div className="block sm:hidden">
                            <div
                              className={cn(
                                "font-medium text-center",
                                dayActivities[0].strikethrough && "line-through"
                              )}
                            >
                              {dayActivities[0].time}
                            </div>
                          </div>

                          <div className="hidden sm:flex items-center gap-2">
                            <div
                              className={cn(
                                "font-medium truncate",
                                dayActivities[0].strikethrough && "line-through"
                              )}
                            >
                              {dayActivities[0].time}
                            </div>
                            <div
                              className={cn(
                                "truncate opacity-90",
                                dayActivities[0].strikethrough && "line-through"
                              )}
                            >
                              {dayActivities[0].title}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Show "more" indicator */}
                      {hasMoreActivities && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <div
                              className="text-[8px] sm:text-[10px] p-0.5 sm:p-1 bg-slate-200 text-slate-700 rounded-sm cursor-pointer hover:bg-slate-300 transition-all duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Mobile: Show dots, Desktop: Show text */}
                              <span className="block sm:hidden">
                                <MoreHorizontal className="h-2 w-2 mx-auto" />
                              </span>
                              <span className="hidden sm:block">
                                + {dayActivities.length - 1} lainnya
                              </span>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-64 sm:w-80 p-0 overflow-hidden"
                            align="start"
                          >
                            <div className="p-2 sm:p-3 border-b border-slate-200 bg-slate-50">
                              <h4 className="font-semibold text-xs sm:text-sm text-slate-800">
                                Daftar Kegiatan pada {date.getDate()}{" "}
                                {MONTHS[date.getMonth()]}
                              </h4>
                            </div>
                            <ScrollArea className="h-40 sm:h-48 p-2 pr-4 pt-0">
                              {dayActivities.map((activity: ActivityRes) => (
                                <div
                                  key={activity.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleActivityClick(activity, e);
                                  }}
                                  className={cn(
                                    "p-2 sm:p-3 rounded-md cursor-pointer hover:opacity-90 transition-all duration-200 mt-2 text-white",
                                    ACTIVITY_COLORS[
                                      activity.activityType as keyof typeof ACTIVITY_COLORS
                                    ] || "bg-slate-500",
                                    activity.strikethrough && "opacity-60"
                                  )}
                                >
                                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                                    <span
                                      className={cn(
                                        "font-medium text-xs sm:text-sm",
                                        activity.strikethrough && "line-through"
                                      )}
                                    >
                                      {activity.time}
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] sm:text-xs bg-white/20 text-white border-0"
                                    >
                                      {activity.activityType.replace("_", " ")}
                                    </Badge>
                                  </div>
                                  <div
                                    className={cn(
                                      "text-xs sm:text-sm opacity-90",
                                      activity.strikethrough && "line-through"
                                    )}
                                  >
                                    {activity.title}
                                  </div>
                                  <div
                                    className={cn(
                                      "text-[10px] sm:text-xs opacity-75 mt-1",
                                      activity.strikethrough && "line-through"
                                    )}
                                  >
                                    {activity.employee.name} •{" "}
                                    {activity.branch.name}
                                  </div>
                                </div>
                              ))}
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ActivityFormDialog
        open={showActivityDialog}
        onOpenChange={setShowActivityDialog}
        selectedDate={selectedDate!}
      />

      <ActivityDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        activity={selectedActivity!}
      />
    </div>
  );
}
