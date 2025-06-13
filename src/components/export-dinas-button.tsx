"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

interface ExportDinasButtonProps {
  activityId: string;
}

export function ExportDinasButton({ activityId }: ExportDinasButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Create URL for the PDF export endpoint
      const exportUrl = `/api/activities/export/pdf?id=${activityId}`;

      // Open the PDF in a new tab
      window.open(exportUrl, "_blank");

      toast.success("Exporting trip itinerary");
    } catch (error) {
      console.error("Error exporting trip:", error);
      toast.error("Failed to export trip itinerary");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      className="gap-1 cursor-pointer"
    >
      <FileDown className="h-4 w-4" />
      {isExporting ? "Exporting..." : "Download PDF"}
    </Button>
  );
}
