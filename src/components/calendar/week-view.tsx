"use client";

import React from "react";

import { useState, useCallback, useMemo } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityDialog } from "@/components/dialog/activity-dialog";
import { ActivityDetailDialog } from "@/components/dialog/activity-detail-dialog";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Plus,
  CalendarCheck,
  ChevronDown,
  MoreHorizontal,
  Briefcase,
  Users,
  Plane,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ActivityRes } from "@/types/activity";
import { useEmployeeFilter } from "@/hooks/use-employee-filter";
import { cn, getIndonesiaDateInfo, isPastDateObject } from "@/lib/utils";

interface WeekViewProps {
  currentYear: number;
  currentMonth: number;
  currentWeek: number;
  onWeekChange: (week: number) => void;
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

// Extended time slots to 22:00
const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

const ACTIVITY_COLORS = {
  PROSPECT_MEETING: "bg-blue-500",
  ESCORT_TEAM: "bg-green-500",
  PERJALANAN_DINAS: "bg-purple-500",
  TAMU_UNDANGAN: "bg-amber-500",
  RETENTION_TEAM: "bg-red-500",
  INTERNAL_MEETING: "bg-gray-500",
  PROPERTY_SURVEY: "bg-teal-500",
};

const ACTIVITY_ICONS = {
  PROSPECT_MEETING: Briefcase,
  ESCORT_TEAM: Users,
  PERJALANAN_DINAS: Plane,
  TAMU_UNDANGAN: Users,
  RETENTION_TEAM: Users,
  INTERNAL_MEETING: Calendar,
  PROPERTY_SURVEY: Briefcase,
};

export function WeekView({
  currentYear,
  currentMonth,
  currentWeek,
  onWeekChange,
  onMonthChange,
  viewMode,
  onViewModeChange,
}: WeekViewProps) {
  const { selectedEmployee } = useEmployeeFilter();
  const [selectedActivity, setSelectedActivity] = useState<ActivityRes | null>(
    null
  );
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

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

  // Calculate the dates for each week in the month
  const monthWeeks = useMemo(() => {
    // Get the first day of the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    // Get the last day of the month
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();

    // Calculate the date for the first day of the first week
    // This might be in the previous month if the month doesn't start on Sunday
    const firstDateOfCalendar = new Date(
      currentYear,
      currentMonth,
      1 - firstDayOfWeek
    );

    // Calculate how many weeks we need to display
    const totalDays = lastDay.getDate();
    const totalWeeks = Math.ceil((totalDays + firstDayOfWeek) / 7);

    // Generate an array of weeks, each containing 7 days
    const weeks = [];
    const currentDate = new Date(firstDateOfCalendar);

    for (let week = 0; week < totalWeeks; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        weekDays.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(weekDays);
    }

    return weeks;
  }, [currentYear, currentMonth]);

  // Calculate week dates for the current week
  const weekDates = useMemo(() => {
    // Ensure currentWeek is within bounds
    const safeWeek = Math.max(1, Math.min(currentWeek, monthWeeks.length));
    return monthWeeks[safeWeek - 1] || [];
  }, [currentWeek, monthWeeks]);

  // Calculate total weeks in month
  const totalWeeks = useMemo(() => monthWeeks.length, [monthWeeks]);

  // Find which week contains a specific date
  const findWeekContainingDate = useCallback(
    (date: Date) => {
      const targetDate = date.getDate();
      const targetMonth = date.getMonth();
      const targetYear = date.getFullYear();

      // Only search in the current month's weeks
      if (targetMonth === currentMonth && targetYear === currentYear) {
        for (let weekIndex = 0; weekIndex < monthWeeks.length; weekIndex++) {
          const week = monthWeeks[weekIndex];
          for (const day of week) {
            if (
              day.getDate() === targetDate &&
              day.getMonth() === targetMonth &&
              day.getFullYear() === targetYear
            ) {
              return weekIndex + 1; // Weeks are 1-indexed
            }
          }
        }
      }

      // If not found or not in current month, return 1
      return 1;
    },
    [monthWeeks, currentMonth, currentYear]
  );

  // Format date to YYYY-MM-DD
  const formatDate = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Get activities for a specific date and time
  const getActivities = useCallback(
    (date: Date, time: string) => {
      const formattedDate = formatDate(date);
      return activities.filter((activity: ActivityRes) => {
        const activityDate = new Date(activity.date);
        const activityFormattedDate = formatDate(activityDate);
        return (
          activityFormattedDate === formattedDate && activity.time === time
        );
      });
    },
    [activities, formatDate]
  );

  // Function to get activity display text based on type
  const getActivityDisplayText = useCallback((activity: ActivityRes) => {
    if (activity.activityType === "PERJALANAN_DINAS") {
      return activity.destination
        ? `Dinas Ke ${activity.destination}`
        : "Perjalanan Dinas";
    }
    return activity.title || activity.activityType;
  }, []);

  // Handle time slot click - Always open form dialog when clicking on the time slot itself
  const handleTimeClick = useCallback((date: Date, time: string) => {
    if (isPastDateObject(date)) {
      return; // Don't allow interactions with past dates
    }

    // Always open the form dialog when clicking on the time slot itself
    setSelectedDate(date);
    setSelectedTime(time);
    setShowActivityDialog(true);
  }, []);

  // Handle activity click
  const handleActivityClick = useCallback(
    (activity: ActivityRes, event: React.MouseEvent) => {
      event.stopPropagation();
      setSelectedActivity(activity);
      setShowDetailDialog(true);
    },
    []
  );

  // Navigation handlers
  const handlePrevWeek = useCallback(() => {
    if (currentWeek > 1) {
      onWeekChange(currentWeek - 1);
    } else {
      // Go to previous month's last week
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Calculate total weeks in previous month
      const firstDay = new Date(prevYear, prevMonth, 1);
      const lastDay = new Date(prevYear, prevMonth + 1, 0);
      const firstDayOfWeek = firstDay.getDay();
      const totalDays = lastDay.getDate();
      const prevTotalWeeks = Math.ceil((totalDays + firstDayOfWeek) / 7);

      onMonthChange(prevMonth, prevYear);
      onWeekChange(prevTotalWeeks);
    }
  }, [currentWeek, currentMonth, currentYear, onWeekChange, onMonthChange]);

  const handleNextWeek = useCallback(() => {
    if (currentWeek < totalWeeks) {
      onWeekChange(currentWeek + 1);
    } else {
      // Go to next month's first week
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

      onMonthChange(nextMonth, nextYear);
      onWeekChange(1);
    }
  }, [
    currentWeek,
    totalWeeks,
    currentMonth,
    currentYear,
    onWeekChange,
    onMonthChange,
  ]);

  const handleTodayClick = useCallback(() => {
    // Get current date in Indonesia timezone
    const indonesiaDateInfo = getIndonesiaDateInfo();
    const today = new Date(
      indonesiaDateInfo.year,
      indonesiaDateInfo.month,
      indonesiaDateInfo.date
    );

    // First, ensure we're in the correct month/year
    onMonthChange(indonesiaDateInfo.month, indonesiaDateInfo.year);

    // Then find which week contains today
    const weekNumber = findWeekContainingDate(today);
    onWeekChange(weekNumber);
  }, [onMonthChange, onWeekChange, findWeekContainingDate]);

  const handleMonthChange = useCallback(
    (month: string) => {
      const newMonth = Number.parseInt(month);
      const today = new Date();

      // First change the month
      onMonthChange(newMonth, currentYear);

      // If we're switching to the current month, find which week contains today
      if (
        newMonth === today.getMonth() &&
        currentYear === today.getFullYear()
      ) {
        // We need to wait for monthWeeks to update before finding the week
        setTimeout(() => {
          const weekNumber = findWeekContainingDate(today);
          onWeekChange(weekNumber);
        }, 0);
      } else {
        // Default to first week for other months
        onWeekChange(1);
      }
    },
    [onMonthChange, currentYear, onWeekChange, findWeekContainingDate]
  );

  const handleYearChange = useCallback(
    (year: string) => {
      const newYear = Number.parseInt(year);
      const today = new Date();

      onMonthChange(currentMonth, newYear);

      if (
        currentMonth === today.getMonth() &&
        newYear === today.getFullYear()
      ) {
        setTimeout(() => {
          const weekNumber = findWeekContainingDate(today);
          onWeekChange(weekNumber);
        }, 0);
      } else {
        onWeekChange(1);
      }
    },
    [onMonthChange, currentMonth, onWeekChange, findWeekContainingDate]
  );

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

  // Check if date is today
  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  return (
    <div className="w-full space-y-4 md:space-y-2">
      {/* Modern Week View Header - Mobile Optimized */}
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

          {/* Week Navigation */}
          <div className="flex items-center gap-1">
            <Button
              onClick={handlePrevWeek}
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 w-8 sm:w-9 p-0 cursor-pointer"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <div className="text-xs sm:text-sm font-medium px-2 text-white">
              Week {currentWeek} of {totalWeeks}
            </div>
            <Button
              onClick={handleNextWeek}
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 w-8 sm:w-9 p-0 cursor-pointer"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>

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

      {/* Week View Grid */}
      <Card className="border-0 shadow-lg overflow-hidden py-0 rounded-lg">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-220px)] min-h-[500px]">
            <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-white">
              {/* Header Row */}
              <div className="bg-slate-50 border-b border-r border-slate-200 p-2 flex items-center justify-center sticky top-0 z-10">
                <span className="text-xs font-medium text-slate-500">Time</span>
              </div>

              {/* Day Headers */}
              {weekDates.map((date) => {
                const isCurrentMonth = date.getMonth() === currentMonth;
                const isTodayDate = isToday(date);
                const isSunday = date.getDay() === 0;

                return (
                  <div
                    key={date.toISOString()}
                    className={cn(
                      "p-2 border-b border-r border-slate-200 text-center sticky top-0 z-10",
                      isCurrentMonth ? "bg-slate-50" : "bg-slate-100/50"
                    )}
                  >
                    <div className="text-xs font-medium text-slate-500">
                      {DAYS[date.getDay()]}
                    </div>
                    <div
                      className={cn(
                        "text-sm font-semibold mt-0.5 w-6 h-6 mx-auto flex items-center justify-center",
                        isTodayDate
                          ? "bg-blue-600 !text-white rounded-full"
                          : "",
                        isSunday && !isTodayDate
                          ? "text-red-600"
                          : "text-slate-700",
                        !isCurrentMonth ? "text-slate-400" : ""
                      )}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}

              {/* Time Slots */}
              {TIME_SLOTS.map((timeSlot) => (
                <React.Fragment key={`time-${timeSlot}`}>
                  {/* Time Column */}
                  <div className="bg-slate-50 border-b border-r border-slate-200 p-2 flex items-center justify-center">
                    <span className="text-xs font-medium text-slate-500">
                      {timeSlot}
                    </span>
                  </div>

                  {/* Day Cells */}
                  {weekDates.map((date) => {
                    const isCurrentMonth = date.getMonth() === currentMonth;
                    const isPastDate = isPastDateObject(date);
                    const isSunday = date.getDay() === 0;
                    const activitiesForSlot = getActivities(date, timeSlot);
                    const isClickable = !isPastDate;
                    const hasMoreActivities = activitiesForSlot.length > 1;

                    return (
                      <div
                        key={`${date.toISOString()}-${timeSlot}`}
                        className={cn(
                          "border-b border-r border-slate-200 p-1 min-h-[70px]",
                          !isCurrentMonth ? "bg-slate-100/50" : "bg-white",
                          isSunday && isCurrentMonth ? "bg-red-50/30" : "",
                          isPastDate ? "opacity-50" : "",
                          isClickable
                            ? "cursor-pointer hover:bg-slate-50"
                            : "cursor-default"
                        )}
                        onClick={() =>
                          isClickable
                            ? handleTimeClick(date, timeSlot)
                            : undefined
                        }
                      >
                        {/* Show first activity if there are any */}
                        {activitiesForSlot.length > 0 && (
                          <div
                            onClick={(e) =>
                              handleActivityClick(activitiesForSlot[0], e)
                            }
                            className={cn(
                              "text-[8px] sm:text-[10px] p-0.5 sm:py-1 sm:px-2 rounded-sm text-white cursor-pointer hover:opacity-90 transition-all duration-200 mb-1",
                              ACTIVITY_COLORS[
                                activitiesForSlot[0]
                                  .activityType as keyof typeof ACTIVITY_COLORS
                              ] || "bg-slate-500",
                              activitiesForSlot[0].strikethrough && "opacity-60"
                            )}
                          >
                            <div className="flex items-center gap-1">
                              <span
                                className={cn(
                                  "truncate",
                                  activitiesForSlot[0].strikethrough &&
                                    "line-through"
                                )}
                              >
                                {getActivityDisplayText(activitiesForSlot[0])}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "text-[8px] opacity-75 truncate font-medium",
                                activitiesForSlot[0].strikethrough &&
                                  "line-through"
                              )}
                            >
                              {activitiesForSlot[0].employee?.name}
                            </div>
                          </div>
                        )}

                        {/* Show "more" indicator if there are additional activities */}
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
                                <span className="hidden sm:block font-medium">
                                  + {activitiesForSlot.length - 1} lainnya
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
                                  {MONTHS[date.getMonth()]} - {timeSlot}
                                </h4>
                              </div>
                              <ScrollArea className="h-40 sm:h-48 p-2 pr-4 pt-0">
                                {activitiesForSlot.map(
                                  (activity: ActivityRes) => {
                                    const ActivityIcon =
                                      ACTIVITY_ICONS[
                                        activity.activityType as keyof typeof ACTIVITY_ICONS
                                      ] || Calendar;
                                    const isPerjalananDinas =
                                      activity.activityType ===
                                      "PERJALANAN_DINAS";

                                    return (
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
                                          <div className="flex items-center gap-1.5">
                                            <ActivityIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                            <span
                                              className={cn(
                                                "font-medium text-xs sm:text-sm",
                                                activity.strikethrough &&
                                                  "line-through"
                                              )}
                                            >
                                              {activity.time}
                                            </span>
                                          </div>
                                          <Badge
                                            variant="secondary"
                                            className="text-[10px] sm:text-[11px] bg-white/20 text-white border-0"
                                          >
                                            {activity.activityType.replace(
                                              "_",
                                              " "
                                            )}
                                          </Badge>
                                        </div>

                                        {/* Display appropriate content based on activity type */}
                                        {!isPerjalananDinas &&
                                          activity.title && (
                                            <div
                                              className={cn(
                                                "text-xs sm:text-sm opacity-90",
                                                activity.strikethrough &&
                                                  "line-through"
                                              )}
                                            >
                                              {activity.title}
                                            </div>
                                          )}

                                        {isPerjalananDinas &&
                                          activity.destination && (
                                            <div
                                              className={cn(
                                                "text-xs sm:text-sm opacity-90",
                                                activity.strikethrough &&
                                                  "line-through"
                                              )}
                                            >
                                              Dinas Ke {activity.destination}
                                            </div>
                                          )}

                                        <div
                                          className={cn(
                                            "text-[10px] sm:text-xs opacity-75 mt-1",
                                            activity.strikethrough &&
                                              "line-through"
                                          )}
                                        >
                                          {activity.employee?.name} •{" "}
                                          {activity.branch?.name}
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                        )}

                        {/* Show empty state if no activities */}
                        {activitiesForSlot.length === 0 && isClickable && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                              <Plus className="w-2 h-2 text-slate-400" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedDate && (
        <ActivityDialog
          open={showActivityDialog}
          onOpenChange={setShowActivityDialog}
          selectedDate={selectedDate}
          selectedTime={selectedTime || undefined}
        />
      )}

      {selectedActivity && (
        <ActivityDetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          activity={selectedActivity}
        />
      )}
    </div>
  );
}
