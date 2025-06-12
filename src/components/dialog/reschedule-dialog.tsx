"use client";

import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import {
  formatDate,
  getAvailableTimeSlots,
  isPastDateObject,
  cn,
} from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  rescheduleSchema,
  type RescheduleFormData,
} from "@/lib/validations/reschedule";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Clock, RotateCcw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId?: string;
  activityTitle?: string;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  activityId,
  activityTitle,
}: RescheduleDialogProps) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  const form = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      date: "",
      time: "",
    },
  });

  const watchedDate = form.watch("date");

  // Update available time slots when date changes
  useEffect(() => {
    if (watchedDate) {
      const date = new Date(watchedDate);
      const slots = getAvailableTimeSlots(date);
      setAvailableTimeSlots(slots);

      // Reset time if current selection is not available
      const currentTime = form.getValues("time");
      if (currentTime && !slots.includes(currentTime)) {
        form.setValue("time", "");
      }
    }
  }, [watchedDate, form]);

  const rescheduleMutation = useMutation({
    mutationFn: async (data: RescheduleFormData) => {
      if (!activityId) throw new Error("No activity ID provided");

      const response = await fetch(`/api/activities/${activityId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to reschedule activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Kegiatan berhasil dijadwal ulang!");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Reschedule error:", error);
      toast.error("Gagal menjadwal ulang kegiatan");
    },
  });

  const onSubmit = (data: RescheduleFormData) => {
    rescheduleMutation.mutate(data);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      form.setValue("date", formatDate(date));

      const slots = getAvailableTimeSlots(date);
      setAvailableTimeSlots(slots);

      form.setValue("time", "");
    }
  };

  const isLoading = rescheduleMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            Reschedule
          </DialogTitle>
          {activityTitle && (
            <div className="text-sm text-muted-foreground">
              <strong>Kegiatan:</strong> {activityTitle}
            </div>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Date Picker */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Baru</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP", {
                                locale: id,
                              })
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          disabled={(date) => isPastDateObject(date)}
                          locale={id}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Selector */}
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waktu Baru</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!watchedDate || availableTimeSlots.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full text-black pr-10 relative">
                          <SelectValue placeholder="Pilih waktu" />
                          <Clock className="h-4 w-4 opacity-90 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTimeSlots.length === 0 ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            {!watchedDate
                              ? "Pilih tanggal terlebih dahulu"
                              : "Tidak ada waktu tersedia"}
                          </div>
                        ) : (
                          availableTimeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Information Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Informasi Penjadwalan Ulang:</p>
                <ul className="text-xs space-y-1">
                  <li>• Kegiatan lama akan tetap ada dengan tanda coret</li>
                  <li>
                    • Kegiatan baru akan dibuat pada tanggal dan waktu yang
                    dipilih
                  </li>
                  <li>• Semua detail kegiatan akan disalin ke jadwal baru</li>
                  <li>• Tidak dapat memilih tanggal yang sudah lewat</li>
                  <li>
                    • Untuk hari ini, hanya waktu yang belum terlewat yang
                    tersedia
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={isLoading || !form.formState.isValid}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Jadwal Ulang
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
