"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import type { DateRange } from "@/components/ui/date-range-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useFieldArray, UseFormReturn } from "react-hook-form";
import { Trash2, Plus, Hotel } from "lucide-react";
import { type ActivityFormData } from "@/lib/validations/activity";

interface DailyActivityCardProps {
  dailyIndex: number;
  form: UseFormReturn<ActivityFormData>;
  onRemove: () => void;
  canRemove: boolean;
}

export function DailyActivityCard({
  dailyIndex,
  form,
  onRemove,
  canRemove,
}: DailyActivityCardProps) {
  const {
    fields: activityItemsFields,
    append: appendActivityItem,
    remove: removeActivityItem,
  } = useFieldArray({
    control: form.control,
    name: `dailyActivities.${dailyIndex}.activityItems`,
  });

  const watchNeedHotel = form.watch(`dailyActivities.${dailyIndex}.needHotel`);

  // Handle date range selection for hotel
  const handleDateRangeChange = (dateRange: DateRange) => {
    if (dateRange.from) {
      form.setValue(
        `dailyActivities.${dailyIndex}.hotelCheckIn`,
        dateRange.from
      );
    }
    if (dateRange.to) {
      form.setValue(
        `dailyActivities.${dailyIndex}.hotelCheckOut`,
        dateRange.to
      );
    }
  };

  // Get current date range values
  const dateRange: DateRange = {
    from: form.watch(`dailyActivities.${dailyIndex}.hotelCheckIn`) ?? undefined,
    to: form.watch(`dailyActivities.${dailyIndex}.hotelCheckOut`) ?? undefined,
  };

  return (
    <Card className="shadow-none gap-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Hari {dailyIndex + 1}
          </CardTitle>
          {canRemove && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRemove}
              className="cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Selection */}
        <FormField
          control={form.control}
          name={`dailyActivities.${dailyIndex}.date`}
          render={({ field }) => (
            <FormItem className="flex flex-col w-full">
              <FormLabel>Tanggal Kegiatan *</FormLabel>
              <FormControl>
                <DatePicker
                  selected={field.value!}
                  onSelect={(date: Date) => {
                    field.onChange(date);
                  }}
                  disabledDate={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* Activity Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel>Daftar Kegiatan *</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendActivityItem({ name: "" })}
              className="cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah Kegiatan
            </Button>
          </div>

          {activityItemsFields.map((itemField, itemIndex) => (
            <div key={itemField.id} className="flex gap-2 items-center">
              <FormField
                control={form.control}
                name={`dailyActivities.${dailyIndex}.activityItems.${itemIndex}.name`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder={`Kegiatan ${itemIndex + 1}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {activityItemsFields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeActivityItem(itemIndex)}
                  className="cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Hotel Toggle */}
        <FormField
          control={form.control}
          name={`dailyActivities.${dailyIndex}.needHotel`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="cursor-pointer"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="flex items-center gap-2">
                  <Hotel className="h-4 w-4" />
                  Butuh Akomodasi Hotel?
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        {/* Hotel Information */}
        {watchNeedHotel && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h5 className="font-medium">Informasi Hotel</h5>

            <div className="grid grid-cols-1 gap-4">
              <FormItem className="flex flex-col">
                <FormLabel>Check-in & Check-out *</FormLabel>
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  placeholder="Pilih tanggal"
                />
                <FormMessage />
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name={`dailyActivities.${dailyIndex}.hotelName`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Hotel *</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama hotel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`dailyActivities.${dailyIndex}.hotelAddress`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Hotel *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan alamat hotel"
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
