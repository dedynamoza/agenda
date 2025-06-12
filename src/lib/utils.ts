import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Indonesia timezone offset (UTC+7)
const INDONESIA_TIMEZONE_OFFSET = 7 * 60 * 60 * 1000; // 7 hours in milliseconds

/**
 * Get current date and time in Indonesia timezone
 */
export function getIndonesiaTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + INDONESIA_TIMEZONE_OFFSET);
}

/**
 * Get current date in Indonesia timezone as Date object (time set to 00:00:00)
 */
export function getIndonesiaDate(): Date {
  const indonesiaTime = getIndonesiaTime();
  return new Date(
    indonesiaTime.getUTCFullYear(),
    indonesiaTime.getUTCMonth(),
    indonesiaTime.getUTCDate()
  );
}

/**
 * Format date as YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date as DD-MM-YYYY string for display
 */
export function formatDateDisplay(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}-${month}-${year}`;
}

/**
 * Check if a date string (YYYY-MM-DD) is today in Indonesia timezone
 */
export function isToday(dateString: string): boolean {
  const todayInIndonesia = formatDate(getIndonesiaDate());
  return dateString === todayInIndonesia;
}

/**
 * Check if a Date object represents today in Indonesia timezone
 */
export function isTodayDate(date: Date): boolean {
  const todayInIndonesia = getIndonesiaDate();
  return (
    date.getFullYear() === todayInIndonesia.getFullYear() &&
    date.getMonth() === todayInIndonesia.getMonth() &&
    date.getDate() === todayInIndonesia.getDate()
  );
}

/**
 * Check if a date string (YYYY-MM-DD) is in the past (before today) in Indonesia timezone
 */
export function isPastDate(dateString: string): boolean {
  const checkDate = new Date(dateString + "T00:00:00"); // Ensure local timezone interpretation
  const todayInIndonesia = getIndonesiaDate();

  // Compare dates: past if checkDate < today
  return checkDate < todayInIndonesia;
}

/**
 * Check if a Date object represents a past date in Indonesia timezone
 */
export function isPastDateObject(date: Date): boolean {
  const todayInIndonesia = getIndonesiaDate();

  // Create date objects for comparison (both at 00:00:00)
  const checkDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  return checkDate < todayInIndonesia;
}

/**
 * Check if a Date object represents a future date in Indonesia timezone
 */
export function isFutureDate(date: Date): boolean {
  const todayInIndonesia = getIndonesiaDate();

  // Create date objects for comparison (both at 00:00:00)
  const checkDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  return checkDate > todayInIndonesia;
}

/**
 * Get current time in Indonesia timezone as HH:MM string
 */
export function getCurrentTimeInIndonesia(): string {
  const indonesiaTime = getIndonesiaTime();
  const hours = String(indonesiaTime.getUTCHours()).padStart(2, "0");
  const minutes = String(indonesiaTime.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Get current hour in Indonesia timezone
 */
export function getCurrentHourInIndonesia(): number {
  const indonesiaTime = getIndonesiaTime();
  return indonesiaTime.getUTCHours();
}

/**
 * Get current date info in Indonesia timezone
 */
export function getIndonesiaDateInfo() {
  const indonesiaTime = getIndonesiaTime();
  return {
    year: indonesiaTime.getUTCFullYear(),
    month: indonesiaTime.getUTCMonth(),
    date: indonesiaTime.getUTCDate(),
    day: indonesiaTime.getUTCDay(),
    hours: indonesiaTime.getUTCHours(),
    minutes: indonesiaTime.getUTCMinutes(),
    seconds: indonesiaTime.getUTCSeconds(),
  };
}

/**
 * Check if a date is the same as today in Indonesia timezone
 */
export function isSameDateAsToday(date: Date): boolean {
  const today = getIndonesiaDate();
  const checkDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  return checkDate.getTime() === today.getTime();
}

/**
 * Check if a time string (HH:MM) is in the past for today
 */
export function isPastTimeToday(timeString: string): boolean {
  const currentHour = getCurrentHourInIndonesia();
  const [hours] = timeString.split(":").map(Number);
  return hours < currentHour;
}

export function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
  const dayOfMonth = date.getDate();
  return Math.ceil((dayOfMonth + firstDayOfWeek - 1) / 7);
}

export function getTotalWeeksInMonth(year: number, month: number): number {
  const lastDate = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const firstDayOfWeek = firstDay === 0 ? 7 : firstDay;
  return Math.ceil((lastDate + firstDayOfWeek - 1) / 7);
}

// Time slots for activities (08:00 to 22:00 with 1-hour intervals)
export const TIME_SLOTS = Array.from(
  { length: 15 },
  (_, i) => `${String(i + 8).padStart(2, "0")}:00`
);

// Time slots for reschedule (08:00 to 22:00 with 1-hour intervals)
export const RESCHEDULE_TIME_SLOTS = Array.from(
  { length: 15 },
  (_, i) => `${String(i + 8).padStart(2, "0")}:00`
);

/**
 * Get available time slots for reschedule based on selected date
 */
export function getAvailableTimeSlots(selectedDate: Date): string[] {
  const isToday = isSameDateAsToday(selectedDate);

  if (!isToday) {
    // If not today, all time slots are available
    return RESCHEDULE_TIME_SLOTS;
  }

  // If today, filter out past hours
  const currentHour = getCurrentHourInIndonesia();
  return RESCHEDULE_TIME_SLOTS.filter((timeSlot) => {
    const [hours] = timeSlot.split(":").map(Number);
    return hours > currentHour; // Only future hours
  });
}

export const ACTIVITY_TYPES = [
  { value: "PROSPECT_MEETING", label: "Prospect Meeting" },
  { value: "ESCORT_TEAM", label: "Escort Team" },
  { value: "PERJALANAN_DINAS", label: "Perjalanan Dinas" },
  { value: "TAMU_UNDANGAN", label: "Tamu Undangan" },
  { value: "RETENTION_TEAM", label: "Retention Team" },
];

export const TRANSPORTATION_TYPES = [
  { value: "FLIGHT", label: "Flight" },
  { value: "FERRY", label: "Ferry" },
  { value: "TRAIN", label: "Train" },
];

export function getActivityTypeLabel(type: string) {
  return ACTIVITY_TYPES.find((t) => t.value === type)?.label || type;
}

export function getTransportationTypeLabel(type: string) {
  return TRANSPORTATION_TYPES.find((t) => t.value === type)?.label || type;
}
