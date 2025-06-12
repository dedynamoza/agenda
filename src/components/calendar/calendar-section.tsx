"use client";

import { useState } from "react";

// import { WeekView } from "@/components/calendar/week-view";
import { ModernCalendarView } from "./calendar-view";

import { getWeekOfMonth } from "@/lib/utils";
import { useEmployeeFilter } from "@/hooks/use-employee-filter";

export function CalendarSection() {
  const { selectedEmployee } = useEmployeeFilter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "week">("calendar");
  const [currentWeek, setCurrentWeek] = useState(getWeekOfMonth(new Date()));

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handleMonthChange = (month: number, year?: number) => {
    setCurrentDate(new Date(year || currentYear, month, 1));
    setCurrentWeek(1);
  };

  const handleViewModeChange = (mode: "calendar" | "week") => {
    setViewMode(mode);
    if (mode === "week") {
      setCurrentWeek(getWeekOfMonth(new Date()));
    }
  };

  return (
    <div>
      <div className="space-y-8">
        {/* Calendar Container */}
        <div className="p-4 md:p-6 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20">
          {viewMode === "calendar" ? (
            <ModernCalendarView
              currentYear={currentYear}
              currentMonth={currentMonth}
              onMonthChange={handleMonthChange}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
          ) : (
            // <WeekView
            //   currentYear={currentYear}
            //   currentMonth={currentMonth}
            //   currentWeek={currentWeek}
            //   onWeekChange={setCurrentWeek}
            //   onMonthChange={handleMonthChange}
            // />
            <div>week</div>
          )}
        </div>
      </div>
    </div>
  );
}
