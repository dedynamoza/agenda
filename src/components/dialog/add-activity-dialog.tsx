"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import {
  formatDate,
  TIME_SLOTS,
  ACTIVITY_TYPES,
  TRANSPORTATION_TYPES,
  cn,
} from "@/lib/utils";
import {
  CalendarIcon,
  Check,
  ChevronDown,
  Loader2,
  User,
  Plus,
} from "lucide-react";
import {
  activitySchema,
  type ActivityFormData,
} from "@/lib/validations/activity";
import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { ActivityRes } from "@/types/activity";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInView } from "react-intersection-observer";
import { useFieldArray, useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { DailyActivityCard } from "./daily-activity-card";
import { DatePicker } from "../ui/date-picker";

interface ActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  activity?: ActivityRes;
}

export function ActivityFormDialog({
  open,
  onOpenChange,
  selectedDate,
  activity,
}: ActivityFormDialogProps) {
  const isEditing = !!activity;
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();

  // State for employee selection
  const [employeeName, setEmployeeName] = useState("");
  const [searchNameQuery, setSearchNameQuery] = useState("");
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false);

  // State for branch selection
  const [branchName, setBranchName] = useState("");
  const [searchBranchQuery, setSearchBranchQuery] = useState("");
  const [branchPopoverOpen, setBranchPopoverOpen] = useState(false);

  const [showPerjalananDinasFields, setShowPerjalananDinasFields] =
    useState(false);

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: "",
      description: "",
      date: selectedDate ? formatDate(selectedDate) : "",
      time: "",
      activityType: "PROSPECT_MEETING",
      branchId: "",
      employeeId: "",
      birthDate: null,
      idCard: "",
      departureDate: null,
      transportationType: undefined,
      transportationFrom: "",
      destination: "",
      bookingFlightNo: "",
      dailyActivities: [],
    },
  });

  // Field array for daily activities (PERJALANAN_DINAS)
  const {
    fields: dailyActivitiesFields,
    append: appendDailyActivity,
    remove: removeDailyActivity,
  } = useFieldArray({
    control: form.control,
    name: "dailyActivities",
  });

  const watchActivityType = form.watch("activityType");

  // Get branches data
  const {
    data: branchesData,
    fetchNextPage: fetchBranchesNextPage,
    hasNextPage: hasBranchesNextPage,
    isFetchingNextPage: isFetchingBranchesNextPage,
    isLoading: isBranchesLoading,
    isError: isBranchesError,
  } = useInfiniteQuery({
    queryKey: ["branches-infinite-form", searchBranchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: "20",
        search: searchBranchQuery,
      });
      const response = await fetch(`/api/branches/search?${params}`);
      if (!response.ok) throw new Error("Failed to fetch branches");
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    initialPageParam: 1,
  });

  // Get employees data
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isEmployeesLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["employees-infinite-form", searchNameQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: "20",
        search: searchNameQuery,
      });
      const response = await fetch(`/api/employees/search?${params}`);
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    initialPageParam: 1,
  });

  // Memoize the list of employees for performance
  const employees = useMemo(() => {
    return data?.pages.flatMap((page) => page.employees) || [];
  }, [data]);

  // Memoize the list of branches for performance
  const branches = useMemo(() => {
    return branchesData?.pages.flatMap((page) => page.branches) || [];
  }, [branchesData]);

  // For infinite scrolling of employees
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // For infinite scrolling of branches
  useEffect(() => {
    if (
      inView &&
      hasBranchesNextPage &&
      !isFetchingBranchesNextPage &&
      searchBranchQuery
    ) {
      fetchBranchesNextPage();
    }
  }, [
    inView,
    hasBranchesNextPage,
    isFetchingBranchesNextPage,
    fetchBranchesNextPage,
    searchBranchQuery,
  ]);

  // Show/hide Perjalanan Dinas fields based on activity type
  useEffect(() => {
    const isPerjalananDinas = watchActivityType === "PERJALANAN_DINAS";
    setShowPerjalananDinasFields(isPerjalananDinas);

    // Reset Perjalanan Dinas fields when switching from PERJALANAN_DINAS to other types
    if (!isPerjalananDinas) {
      form.setValue("birthDate", null);
      form.setValue("idCard", "");
      form.setValue("departureDate", null);
      form.setValue("transportationType", undefined);
      form.setValue("transportationFrom", "");
      form.setValue("destination", "");
      form.setValue("bookingFlightNo", "");
      form.setValue("dailyActivities", []);
    } else if (isPerjalananDinas && dailyActivitiesFields.length === 0) {
      appendDailyActivity({
        date: undefined,
        needHotel: false,
        activityItems: [{ name: "" }],
      });
    }
  }, [
    watchActivityType,
    dailyActivitiesFields.length,
    appendDailyActivity,
    form,
  ]);

  // Reset form when dialog opens/closes or activity changes
  useEffect(() => {
    if (open) {
      if (activity) {
        // Handle editing existing activity
        const formData: Partial<ActivityFormData> = {
          title: activity.title || "",
          description: activity.description || "",
          date: formatDate(new Date(activity.date)),
          time: activity.time,
          activityType:
            activity.activityType as ActivityFormData["activityType"],
          branchId: activity.branchId,
          employeeId: activity.employeeId,
          birthDate: activity.birthDate ? new Date(activity.birthDate) : null,
          idCard: activity.idCard || "",
          departureDate: activity.departureDate
            ? new Date(activity.departureDate)
            : null,
          transportationType:
            activity.transportationType as ActivityFormData["transportationType"],
          transportationFrom: activity.transportationFrom || "",
          destination: activity.destination || "",
          bookingFlightNo: activity.bookingFlightNo || "",
        };

        if (
          activity.activityType === "PERJALANAN_DINAS" &&
          activity.dailyActivities
        ) {
          formData.dailyActivities = activity.dailyActivities.map((daily) => ({
            date: new Date(daily.date),
            needHotel: daily.needHotel,
            hotelCheckIn: daily.hotelCheckIn
              ? new Date(daily.hotelCheckIn)
              : undefined,
            hotelCheckOut: daily.hotelCheckOut
              ? new Date(daily.hotelCheckOut)
              : undefined,
            hotelName: daily.hotelName || "",
            hotelAddress: daily.hotelAddress || "",
            activityItems: daily.activityItems.map((item) => ({
              name: item.name,
            })),
          }));
        }

        form.reset(formData);
        setEmployeeName(activity.employee?.name || "");
        setBranchName(activity.branch?.name || "");
      } else if (selectedDate) {
        form.reset({
          title: "",
          description: "",
          date: formatDate(selectedDate),
          time: "",
          activityType: "PROSPECT_MEETING",
          branchId: "",
          employeeId: "",
          birthDate: null,
          idCard: "",
          departureDate: null,
          transportationType: undefined,
          transportationFrom: "",
          destination: "",
          bookingFlightNo: "",
          dailyActivities: [],
        });
      }
    }
  }, [open, activity, selectedDate, form]);

  const handleSearchNameChange = useCallback((value: string) => {
    setSearchNameQuery(value);
  }, []);

  const handleSearchBranchChange = useCallback((value: string) => {
    setSearchBranchQuery(value);
  }, []);

  const createMutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Kegiatan berhasil dibuat!");
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast.error("Gagal membuat kegiatan");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const response = await fetch(`/api/activities/${activity?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Kegiatan berhasil diperbarui!");
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast.error("Gagal memperbarui kegiatan");
    },
  });

  const onSubmit = (data: ActivityFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto pr-2.5"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#a3a3a3 transparent",
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isEditing ? <>Edit Kegiatan</> : <>Tambah Kegiatan Baru</>}
          </DialogTitle>
          {selectedDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
              <CalendarIcon className="h-4 w-4" />
              {selectedDate &&
                selectedDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
            </div>
          )}
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 px-1"
          >
            {/* Basic Information */}
            <div className="space-y-4 px-1">
              <h3 className="text-lg font-semibold">Informasi Dasar</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Nama</FormLabel>
                      <Popover
                        open={employeePopoverOpen}
                        onOpenChange={setEmployeePopoverOpen}
                        modal={true}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={employeePopoverOpen}
                            className="w-full relative cursor-pointer"
                          >
                            <ChevronDown className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {field.value ? (
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="truncate font-normal">
                                    {employeeName}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground font-normal">
                                  Pilih Nama
                                </span>
                              )}
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Cari nama..."
                              value={searchNameQuery}
                              onValueChange={handleSearchNameChange}
                              className="h-9"
                            />
                            <CommandList className="max-h-[300px] overflow-y-auto">
                              {isEmployeesLoading && (
                                <div className="p-4 text-center">
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                </div>
                              )}

                              {isError && (
                                <CommandEmpty>
                                  <div className="text-center py-4">
                                    <p className="text-sm text-destructive">
                                      Gagal memuat nama
                                    </p>
                                  </div>
                                </CommandEmpty>
                              )}

                              {!isEmployeesLoading &&
                                !isError &&
                                employees.length === 0 && (
                                  <CommandEmpty>
                                    <div className="text-center py-4">
                                      <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                      <p className="text-sm text-muted-foreground">
                                        Nama tidak ditemukan
                                      </p>
                                    </div>
                                  </CommandEmpty>
                                )}

                              {employees.length > 0 && (
                                <CommandGroup>
                                  {employees.map((employee) => (
                                    <CommandItem
                                      key={employee.id}
                                      value={employee.id}
                                      onSelect={() => {
                                        field.onChange(employee.id);
                                        setEmployeeName(employee.name);
                                        setEmployeePopoverOpen(false);
                                        setSearchNameQuery("");
                                      }}
                                      className="flex items-center justify-between p-3 cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate">
                                            {employee.name}
                                          </p>
                                          {employee.email && (
                                            <p className="text-xs text-muted-foreground truncate">
                                              {employee.email}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <Check
                                        className={cn(
                                          "h-4 w-4 flex-shrink-0",
                                          field.value === employee.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}

                                  {/* Infinite scroll trigger */}
                                  {hasNextPage && (
                                    <div ref={ref} className="p-4 text-center">
                                      {isFetchingNextPage ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                                      ) : (
                                        <p className="text-xs text-muted-foreground">
                                          Scroll untuk lihat lebih...
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Branch</FormLabel>
                      <Popover
                        open={branchPopoverOpen}
                        onOpenChange={setBranchPopoverOpen}
                        modal={true}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={branchPopoverOpen}
                            className="w-full relative cursor-pointer"
                          >
                            <ChevronDown className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {field.value ? (
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="truncate font-normal">
                                    {branchName}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground font-normal">
                                  Pilih Branch
                                </span>
                              )}
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Cari branch..."
                              value={searchBranchQuery}
                              onValueChange={handleSearchBranchChange}
                              className="h-9"
                            />
                            <CommandList className="max-h-[300px] overflow-y-auto">
                              {isBranchesLoading && (
                                <div className="p-4 text-center">
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                </div>
                              )}

                              {isBranchesError && (
                                <CommandEmpty>
                                  <div className="text-center py-4">
                                    <p className="text-sm text-destructive">
                                      Gagal memuat branch
                                    </p>
                                  </div>
                                </CommandEmpty>
                              )}

                              {!isBranchesLoading &&
                                !isBranchesError &&
                                branches.length === 0 && (
                                  <CommandEmpty>
                                    <div className="text-center py-4">
                                      <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                      <p className="text-sm text-muted-foreground">
                                        Branch tidak ditemukan
                                      </p>
                                    </div>
                                  </CommandEmpty>
                                )}

                              {branches.length > 0 && (
                                <CommandGroup>
                                  {branches.map((branch) => (
                                    <CommandItem
                                      key={branch.id}
                                      value={branch.id}
                                      onSelect={() => {
                                        field.onChange(branch.id);
                                        setBranchName(branch.name);
                                        setBranchPopoverOpen(false);
                                        setSearchBranchQuery("");
                                      }}
                                      className="flex items-center justify-between px-3 py-2 cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                          {branch.name}
                                        </p>
                                      </div>
                                      <Check
                                        className={cn(
                                          "h-4 w-4 flex-shrink-0",
                                          field.value === branch.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}

                                  {/* Infinite scroll trigger */}
                                  {hasBranchesNextPage && (
                                    <div ref={ref} className="p-4 text-center">
                                      {isFetchingBranchesNextPage ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                                      ) : (
                                        <p className="text-xs text-muted-foreground">
                                          Scroll untuk lihat lebih...
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-4">
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Waktu</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full relative cursor-pointer">
                            <SelectValue placeholder="Pilih Waktu" />
                            <ChevronDown className="h-4 w-4 opacity-90 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activityType"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Tipe Kegiatan</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full relative cursor-pointer">
                            <SelectValue placeholder="Select type" />
                            <ChevronDown className="h-4 w-4 opacity-90 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ACTIVITY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Title and Description - Hidden for PERJALANAN_DINAS */}
              {!showPerjalananDinasFields && (
                <>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Judul</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan judul kegiatan"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Masukkan deskripsi kegiatan"
                            className="min-h-[100px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
            <AnimatePresence initial={false}>
              {showPerjalananDinasFields && (
                <motion.div
                  key="perjalanan-dinas-fields"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
                  className="overflow-hidden space-y-4 px-1"
                  layout
                >
                  <Separator />
                  <h3 className="text-lg font-semibold">
                    Informasi Perjalanan Dinas
                  </h3>

                  <div className="flex items-center gap-4">
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col w-full">
                          <FormLabel>Tanggal Lahir *</FormLabel>
                          <FormControl>
                            <DatePicker
                              selected={field.value!}
                              onSelect={(date: Date) => {
                                field.onChange(date);
                              }}
                              disabledDate={(date) =>
                                date > new Date() || date < new Date(1900, 0, 1)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="idCard"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>ID Card *</FormLabel>
                          <FormControl>
                            <Input placeholder="Masukkan ID card" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="departureDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col w-full">
                        <FormLabel>Tanggal Keberangkatan *</FormLabel>
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

                  <div className="flex items-center gap-4 w-full">
                    <FormField
                      control={form.control}
                      name="transportationFrom"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Keberangkatan *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan lokasi keberangkatan"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="destination"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Tujuan *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan lokasi tujuan"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-4 w-full">
                    <FormField
                      control={form.control}
                      name="transportationType"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Transportasi *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full relative cursor-pointer">
                                <SelectValue placeholder="Pilih transportasi" />
                                <ChevronDown className="h-4 w-4 opacity-90 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TRANSPORTATION_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bookingFlightNo"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>No. Booking/Flight *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan nomor booking atau flight"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Daily Activities Section */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-medium">
                        Kegiatan Harian Perjalanan Dinas
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          appendDailyActivity({
                            date: undefined,
                            needHotel: false,
                            activityItems: [{ name: "" }],
                          })
                        }
                        className="cursor-pointer"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Tambah Hari
                      </Button>
                    </div>

                    {dailyActivitiesFields.map((dailyField, dailyIndex) => (
                      <DailyActivityCard
                        key={dailyField.id}
                        dailyIndex={dailyIndex}
                        form={form}
                        onRemove={() => removeDailyActivity(dailyIndex)}
                        canRemove={dailyActivitiesFields.length > 1}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 cursor-pointer"
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading
                  ? "Menyimpan..."
                  : isEditing
                  ? "Perbarui Kegiatan"
                  : "Buat Kegiatan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
