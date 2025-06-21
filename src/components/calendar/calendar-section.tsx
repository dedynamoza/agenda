"use client";

import { useCallback, useEffect, useState } from "react";

import { WeekView } from "./week-view";
import { CalendarView } from "./calendar-view";

import { getIndonesiaDateInfo } from "@/lib/utils";

interface CalendarSectionProps {
  userId?: string;
}

export function CalendarSection({ userId }: CalendarSectionProps) {
  const [viewMode, setViewMode] = useState<"calendar" | "week">("calendar");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentWeek, setCurrentWeek] = useState(1);

  // To find which week contains a specific date
  const findWeekContainingDate = useCallback(
    (year: number, month: number, date: number) => {
      const firstDay = new Date(year, month, 1);
      const firstDayOfWeek = firstDay.getDay();

      const firstDateOfCalendar = new Date(year, month, 1 - firstDayOfWeek);

      const lastDay = new Date(year, month + 1, 0);
      const totalDays = lastDay.getDate();
      const totalWeeks = Math.ceil((totalDays + firstDayOfWeek) / 7);

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

      // To find which week contains the target date
      const targetDate = new Date(year, month, date);
      for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
        const week = weeks[weekIndex];
        for (const day of week) {
          if (
            day.getDate() === targetDate.getDate() &&
            day.getMonth() === targetDate.getMonth() &&
            day.getFullYear() === targetDate.getFullYear()
          ) {
            return weekIndex + 1;
          }
        }
      }

      return 1;
    },
    []
  );

  useEffect(() => {
    const indonesiaDateInfo = getIndonesiaDateInfo();
    setCurrentYear(indonesiaDateInfo.year);
    setCurrentMonth(indonesiaDateInfo.month);

    // Calculate which week contains today
    const weekNumber = findWeekContainingDate(
      indonesiaDateInfo.year,
      indonesiaDateInfo.month,
      indonesiaDateInfo.date
    );
    setCurrentWeek(weekNumber);
  }, [findWeekContainingDate]);

  // Handle view mode change
  const handleViewModeChange = useCallback(
    (mode: "calendar" | "week") => {
      if (mode === "week" && viewMode === "calendar") {
        const today = new Date();
        if (
          today.getFullYear() === currentYear &&
          today.getMonth() === currentMonth
        ) {
          const weekNumber = findWeekContainingDate(
            currentYear,
            currentMonth,
            today.getDate()
          );
          setCurrentWeek(weekNumber);
        }
      }
      setViewMode(mode);
    },
    [viewMode, currentYear, currentMonth, findWeekContainingDate]
  );

  // Handle month change
  const handleMonthChange = useCallback(
    (month: number, year?: number) => {
      setCurrentMonth(month);
      if (year !== undefined) {
        setCurrentYear(year);
      }

      if (viewMode === "week") {
        const today = new Date();
        if (
          today.getFullYear() === (year || currentYear) &&
          today.getMonth() === month
        ) {
          const weekNumber = findWeekContainingDate(
            year || currentYear,
            month,
            today.getDate()
          );
          setCurrentWeek(weekNumber);
        } else {
          setCurrentWeek(1);
        }
      }
    },
    [viewMode, currentYear, findWeekContainingDate]
  );

  return (
    <div>
      <div className="space-y-8">
        <div className="p-4 md:p-6 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20">
          {viewMode === "calendar" ? (
            <CalendarView
              userId={userId}
              currentYear={currentYear}
              currentMonth={currentMonth}
              onMonthChange={handleMonthChange}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
          ) : (
            <WeekView
              userId={userId}
              viewMode="week"
              currentYear={currentYear}
              currentMonth={currentMonth}
              currentWeek={currentWeek}
              onWeekChange={setCurrentWeek}
              onMonthChange={handleMonthChange}
              onViewModeChange={handleViewModeChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
