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
import { RescheduleDialog } from "@/components/dialog/reschedule-dialog";
import { ActivityFormDialog } from "@/components/dialog/add-activity-dialog";

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
  MapPinCheck,
  TicketCheck,
  DoorOpen,
  DoorClosed,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ActivityRes } from "@/types/activity";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ActivityDetailDialogProps {
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
};

export function ActivityDetailDialog({
  open,
  onOpenChange,
  activity,
}: ActivityDetailDialogProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
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
    },
    onError: () => {
      toast.error("Gagal menghapus kegiatan");
      setIsDeleting(false);
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
    if (
      activity &&
      window.confirm("Apakah Anda yakin ingin menghapus kegiatan ini?")
    ) {
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-5 w-5 text-blue-600" />
              Detail Kegiatan
            </DialogTitle>
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
                      {format(new Date(activity.date), "PPP")}
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
                          {format(new Date(activity.birthDate), "PP")}
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
                        <TicketCheck className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">No. Book</span>
                        <span className={isRescheduled ? "line-through" : ""}>
                          {activity.bookingFlightNo}
                        </span>
                      </div>
                    )}

                    {activity.transportationFrom && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Keberangkatan:</span>
                        <span className={isRescheduled ? "line-through" : ""}>
                          {activity.transportationFrom}
                        </span>
                      </div>
                    )}

                    {activity.destination && (
                      <div className="flex items-center gap-2">
                        <MapPinCheck className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Tujuan:</span>
                        <span className={isRescheduled ? "line-through" : ""}>
                          {activity.destination}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Hotel Information */}
                  {activity.needHotel && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h5 className="font-semibold text-slate-800">
                          Informasi Hotel
                        </h5>

                        <div className="grid grid-cols-1 gap-2 text-sm">
                          {activity.hotelName && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-slate-500" />
                              <span className="font-medium">Hotel:</span>
                              <span
                                className={isRescheduled ? "line-through" : ""}
                              >
                                {activity.hotelName}
                              </span>
                            </div>
                          )}

                          {activity.hotelCheckIn && (
                            <div className="flex items-center gap-2">
                              <DoorOpen className="h-4 w-4 text-slate-500" />
                              <span className="font-medium">Check-in:</span>
                              <span
                                className={isRescheduled ? "line-through" : ""}
                              >
                                {format(new Date(activity.hotelCheckIn), "PP")}
                              </span>
                            </div>
                          )}

                          {activity.hotelCheckOut && (
                            <div className="flex items-center gap-2">
                              <DoorClosed className="h-4 w-4 text-slate-500" />
                              <span className="font-medium">Check-out:</span>
                              <span
                                className={isRescheduled ? "line-through" : ""}
                              >
                                {format(new Date(activity.hotelCheckOut), "PP")}
                              </span>
                            </div>
                          )}
                        </div>

                        {activity.hotelAddress && (
                          <div className="text-sm">
                            <span className="font-medium">Alamat:</span>
                            <p
                              className={cn(
                                "text-slate-600 mt-1",
                                isRescheduled && "line-through text-slate-400"
                              )}
                            >
                              {activity.hotelAddress}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Sub Activities */}
                  {activity.subActivities &&
                    activity.subActivities.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h5 className="font-semibold text-slate-800">
                            Kegiatan Dinas
                          </h5>
                          <div className="space-y-2">
                            {activity.subActivities.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex flex-col gap-1 p-2 bg-slate-100/80 rounded"
                              >
                                <div
                                  className={cn(
                                    "text-sm font-bold text-slate-600 min-w-[80px]",
                                    isRescheduled && "line-through"
                                  )}
                                >
                                  {format(new Date(sub.date), "dd MMMM yyyy", {
                                    locale: id,
                                  })}
                                </div>
                                <div
                                  className={cn(
                                    "text-sm text-slate-700",
                                    isRescheduled && "line-through"
                                  )}
                                >
                                  {sub.description}
                                </div>
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
          </div>
        </DialogContent>
      </Dialog>

      <RescheduleDialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        activityId={activity?.id}
        activityTitle={activity?.title}
      />

      <ActivityFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        selectedDate={activity ? new Date(activity.date) : undefined}
        activity={activity}
      />
    </>
  );
}
