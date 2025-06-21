"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ExportDinasButton } from "@/components/export-dinas-button";
import { ActivityDialog } from "@/components/dialog/activity-dialog";
import { RescheduleDialog } from "@/components/dialog/reschedule-dialog";

import {
  cn,
  getActivityTypeLabel,
  getTransportationTypeLabel,
} from "@/lib/utils";
import {
  Calendar,
  Clock,
  Edit,
  Trash2,
  MapPin,
  User,
  CreditCard,
  Building,
  RotateCcw,
  ArrowRight,
  Ticket,
  GitBranch,
  DoorOpen,
  DoorClosed,
  CalendarDays,
  Hotel,
  ListChecks,
  MapPinCheckInside,
  BookUser,
  ClipboardIcon,
  BookmarkCheck,
  SquareArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { ActivityRes } from "@/types/activity";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ActivityDetailDialogProps {
  userId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ActivityRes;
}

const ACTIVITY_COLORS = {
  PROSPECT_MEETING: "bg-blue-500",
  ESCORT_TEAM: "bg-green-500",
  PERJALANAN_DINAS: "bg-purple-500",
  TAMU_UNDANGAN: "bg-amber-500",
  RETENTION_TEAM: "bg-red-500",
  INTERNAL_MEETING: "bg-gray-500",
  PROPERTY_SURVEY: "bg-teal-500",
};

export function ActivityDetailDialog({
  userId,
  open,
  onOpenChange,
  activity,
}: ActivityDetailDialogProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/activities/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Kegiatan berhasil dihapus!");
      onOpenChange(false);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    },
    onError: () => {
      toast.error("Gagal menghapus kegiatan");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    },
  });

  const handleEdit = () => {
    onOpenChange(false);
    setShowEditDialog(true);
  };

  const handleReschedule = () => {
    onOpenChange(false);
    setShowRescheduleDialog(true);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (activity) {
      setIsDeleting(true);
      deleteMutation.mutate(activity.id);
    }
  };

  if (!activity) return null;

  const isPerjalananDinas = activity.activityType === "PERJALANAN_DINAS";
  const isRescheduled = activity.strikethrough;
  const isRescheduledFrom = !!activity.rescheduledFrom;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#a3a3a3 transparent",
          }}
          className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-5 w-5 text-blue-600" />
              Detail Kegiatan
            </DialogTitle>
            {activity.activityType === "PERJALANAN_DINAS" &&
              !activity.strikethrough && (
                <div className="flex justify-end">
                  {activity.activityType === "PERJALANAN_DINAS" && (
                    <ExportDinasButton activityId={activity.id} />
                  )}
                </div>
              )}
          </DialogHeader>

          <div className="space-y-6">
            {/* Reschedule Information */}
            {(isRescheduled || isRescheduledFrom) && (
              <Card className="border-orange-200 bg-orange-50 shadow-none">
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <RotateCcw className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-800">
                      Informasi Penjadwalan Ulang
                    </span>
                  </div>

                  {isRescheduled &&
                    activity.rescheduledTo &&
                    activity.rescheduledTimeTo && (
                      <div className="flex items-center gap-2 text-sm text-orange-700">
                        <span>Dijadwal ulang ke:</span>
                        <Badge
                          variant="outline"
                          className="border-orange-300 text-orange-700"
                        >
                          {format(
                            new Date(activity.rescheduledTo),
                            "dd MMM yyyy"
                          )}{" "}
                          • {activity.rescheduledTimeTo}
                        </Badge>
                      </div>
                    )}

                  {isRescheduledFrom &&
                    activity.rescheduledFrom &&
                    activity.rescheduledTimeFrom && (
                      <div className="flex items-center gap-2 text-sm text-orange-700">
                        <span>Dijadwal ulang dari:</span>
                        <Badge
                          variant="outline"
                          className="border-orange-300 text-orange-700"
                        >
                          {format(
                            new Date(activity.rescheduledFrom),
                            "dd MMM yyyy"
                          )}{" "}
                          • {activity.rescheduledTimeFrom}
                        </Badge>
                        <ArrowRight className="h-3 w-3" />
                        <Badge
                          variant="outline"
                          className="border-green-300 text-green-700"
                        >
                          {format(new Date(activity.date), "dd MMM yyyy")} •{" "}
                          {activity.time}
                        </Badge>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Basic Information */}
            <Card className="shadow-none">
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Badge
                    className={cn(
                      "text-white",
                      ACTIVITY_COLORS[
                        activity.activityType as keyof typeof ACTIVITY_COLORS
                      ] || "bg-slate-500"
                    )}
                  >
                    {getActivityTypeLabel(activity.activityType)}
                  </Badge>
                  <div>
                    {!isPerjalananDinas ? (
                      <>
                        <h3
                          className={cn(
                            "text-lg font-semibold text-slate-800",
                            isRescheduled && "line-through text-slate-500"
                          )}
                        >
                          {activity.title}
                        </h3>
                        <p
                          className={cn(
                            "text-slate-600",
                            isRescheduled && "line-through text-slate-400"
                          )}
                        >
                          {activity.description}
                        </p>
                      </>
                    ) : (
                      <h3
                        className={cn(
                          "text-lg font-semibold text-slate-800",
                          isRescheduled && "line-through text-slate-500"
                        )}
                      >
                        Dinas Ke {activity.destination}
                      </h3>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">Nama:</span>
                    <span
                      className={
                        isRescheduled ? "line-through text-slate-400" : ""
                      }
                    >
                      {activity.employee.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">Branch:</span>
                    <span
                      className={
                        isRescheduled ? "line-through text-slate-400" : ""
                      }
                    >
                      {activity.branch.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">Tanggal:</span>
                    <span
                      className={
                        isRescheduled ? "line-through text-slate-400" : ""
                      }
                    >
                      {format(new Date(activity.date), "PPP", { locale: id })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">Waktu:</span>
                    <span
                      className={
                        isRescheduled ? "line-through text-slate-400" : ""
                      }
                    >
                      {activity.time}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Perjalanan Dinas Details */}
            {isPerjalananDinas && (
              <Card
                className={cn("shadow-none", isRescheduled ? "opacity-60" : "")}
              >
                <CardContent className="space-y-4">
                  <h4 className="font-semibold text-slate-800">
                    Informasi Perjalanan Dinas
                  </h4>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {activity.birthDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Tanggal Lahir:</span>
                        <span className={isRescheduled ? "line-through" : ""}>
                          {format(new Date(activity.birthDate), "PPP", {
                            locale: id,
                          })}
                        </span>
                      </div>
                    )}

                    {activity.idCard && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">ID Card:</span>
                        <span className={isRescheduled ? "line-through" : ""}>
                          {activity.idCard}
                        </span>
                      </div>
                    )}

                    {activity.transportationFrom && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Kota Keberangkatan:</span>
                        <span className={isRescheduled ? "line-through" : ""}>
                          {activity.transportationFrom}
                        </span>
                      </div>
                    )}

                    {activity.destination && (
                      <div className="flex items-center gap-2">
                        <MapPinCheckInside className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Kota Tujuan:</span>
                        <span className={isRescheduled ? "line-through" : ""}>
                          {activity.destination}
                        </span>
                      </div>
                    )}

                    {activity.departureDate && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">
                          Tanggal Keberangkatan:
                        </span>
                        <span className={isRescheduled ? "line-through" : ""}>
                          {format(new Date(activity.departureDate), "PPP", {
                            locale: id,
                          })}
                        </span>
                      </div>
                    )}

                    {activity.transportationFrom && (
                      <div className="flex items-center gap-2">
                        <ClipboardIcon className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Nama Transportasi:</span>
                        <span className={isRescheduled ? "line-through" : ""}>
                          {activity.transportationName}
                        </span>
                      </div>
                    )}

                    {activity.transportationType && (
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Transportasi:</span>
                        <span className={isRescheduled ? "line-through" : ""}>
                          {getTransportationTypeLabel(
                            activity.transportationType
                          )}
                        </span>
                      </div>
                    )}

                    {activity.bookingFlightNo && (
                      <div className="flex items-center gap-2">
                        <BookUser className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Kode Booking:</span>
                        <span className={isRescheduled ? "line-through" : ""}>
                          {activity.bookingFlightNo}
                        </span>
                      </div>
                    )}

                    {activity.transportationType && (
                      <div className="flex items-center gap-2">
                        <SquareArrowRight className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Keberangkatan:</span>
                        <span className={isRescheduled ? "line-through" : ""}>
                          {activity.departureFrom}
                        </span>
                      </div>
                    )}

                    {activity.bookingFlightNo && (
                      <div className="flex items-center gap-2">
                        <BookmarkCheck className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Tujuan:</span>
                        <span className={isRescheduled ? "line-through" : ""}>
                          {activity.arrivalTo}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Daily Activities */}
                  {activity.dailyActivities &&
                    activity.dailyActivities.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h5 className="font-semibold text-slate-800">
                            Kegiatan Harian
                          </h5>
                          <div className="space-y-4">
                            {activity.dailyActivities.map((daily) => (
                              <div
                                key={daily.id}
                                className="p-3 bg-slate-50 rounded-md"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div
                                    className={cn(
                                      "text-sm font-bold text-slate-700",
                                      isRescheduled &&
                                        "line-through text-slate-500"
                                    )}
                                  >
                                    {format(
                                      new Date(daily.date),
                                      "dd MMMM yyyy",
                                      { locale: id }
                                    )}
                                  </div>
                                </div>

                                {/* Activity Items */}
                                <div className="space-y-2 mb-3">
                                  <div className="flex items-center gap-2">
                                    <ListChecks className="h-4 w-4 text-slate-500" />
                                    <span className="font-medium text-sm">
                                      Daftar Kegiatan:
                                    </span>
                                  </div>
                                  <ul className="list-disc list-inside pl-1 space-y-1">
                                    {daily.activityItems.map((item) => (
                                      <li
                                        key={item.id}
                                        className={cn(
                                          "text-sm text-slate-700",
                                          isRescheduled &&
                                            "line-through text-slate-500"
                                        )}
                                      >
                                        {item.name}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Hotel Information */}
                                {daily.needHotel && (
                                  <div className="mt-3 pt-3 border-t border-slate-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Hotel className="h-4 w-4 text-slate-500" />
                                      <span className="font-medium text-sm">
                                        Informasi Hotel:
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 text-sm pl-6">
                                      {daily.hotelName && (
                                        <div className="flex items-center gap-2">
                                          <Building className="h-4 w-4 text-slate-500" />
                                          <span className="font-medium">
                                            Hotel:
                                          </span>
                                          <span
                                            className={
                                              isRescheduled
                                                ? "line-through"
                                                : ""
                                            }
                                          >
                                            {daily.hotelName}
                                          </span>
                                        </div>
                                      )}

                                      {daily.hotelCheckIn && (
                                        <div className="flex items-center gap-2">
                                          <DoorOpen className="h-4 w-4 text-slate-500" />
                                          <span className="font-medium">
                                            Check-in:
                                          </span>
                                          <span
                                            className={
                                              isRescheduled
                                                ? "line-through"
                                                : ""
                                            }
                                          >
                                            {format(
                                              new Date(daily.hotelCheckIn),
                                              "PP"
                                            )}
                                          </span>
                                        </div>
                                      )}

                                      {daily.hotelCheckOut && (
                                        <div className="flex items-center gap-2">
                                          <DoorClosed className="h-4 w-4 text-slate-500" />
                                          <span className="font-medium">
                                            Check-out:
                                          </span>
                                          <span
                                            className={
                                              isRescheduled
                                                ? "line-through"
                                                : ""
                                            }
                                          >
                                            {format(
                                              new Date(daily.hotelCheckOut),
                                              "PP"
                                            )}
                                          </span>
                                        </div>
                                      )}

                                      {daily.hotelAddress && (
                                        <div className="text-sm">
                                          <span className="font-medium">
                                            Alamat:
                                          </span>
                                          <p
                                            className={cn(
                                              "text-slate-600 mt-1 pl-6",
                                              isRescheduled &&
                                                "line-through text-slate-400"
                                            )}
                                          >
                                            {daily.hotelAddress}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {userId === activity.createdBy && (
              <div className="flex gap-3">
                <Button
                  onClick={handleEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  disabled={isRescheduled}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Kegiatan
                </Button>

                <Button
                  onClick={handleReschedule}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 cursor-pointer"
                  disabled={isRescheduled}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Jadwal Ulang
                </Button>

                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Hapus Kegiatan
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RescheduleDialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        activityId={activity?.id}
        activityTitle={activity?.title}
      />

      <ActivityDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        selectedDate={activity ? new Date(activity.date) : undefined}
        activity={activity}
      />

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            Apakah Anda yakin ingin menghapus kegiatan ini? Tindakan ini tidak
            dapat dibatalkan.
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              Tidak, Batalkan
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              {isDeleting ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : null}
              Ya, Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
