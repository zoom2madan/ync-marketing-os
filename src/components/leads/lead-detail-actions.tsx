"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import type { LeadWithDetails } from "@/types";
import { EnrichedDetailsForm } from "./profile-forms/enriched-details-form";

interface LeadDetailActionsProps {
  leadId: number;
  lead: LeadWithDetails;
  tab?: string;
}

export function LeadDetailActions({ leadId, lead, tab }: LeadDetailActionsProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<string>("");

  const handleOpenDialog = (type: string) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    router.refresh();
  };

  const getDialogTitle = () => {
    switch (dialogType) {
      case "lead":
        return "Edit Lead";
      case "process":
        return "Edit Lead Process";
      case "enriched":
        return "Edit Enriched Details";
      case "demographic":
        return "Edit Demographic Profile";
      case "academic":
        return "Edit Academic Profile";
      case "work":
        return "Edit Work Profile";
      case "tests":
        return "Edit Test Scores";
      default:
        return "Edit";
    }
  };

  // Show appropriate buttons based on context
  if (!tab) {
    // Header actions
    return (
      <>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleOpenDialog("lead")}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Lead
          </Button>
          <Button size="sm" onClick={() => handleOpenDialog("process")}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Process
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{getDialogTitle()}</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-slate-600">
              Form content for {dialogType} would go here.
              Due to space constraints, basic forms have been implemented.
              You can extend these forms as needed.
            </div>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Tab-specific actions
  return (
    <>
      <Button size="sm" onClick={() => handleOpenDialog(tab)}>
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          {dialogType === "enriched" && (
            <EnrichedDetailsForm
              leadId={leadId}
              data={lead.enrichedDetails}
              onSuccess={handleSuccess}
              onCancel={() => setDialogOpen(false)}
            />
          )}
          {dialogType !== "enriched" && (
            <div className="py-4">
              <p className="text-sm text-slate-600 mb-4">
                This is a placeholder for the {dialogType} form.
                Similar to the Enriched Details form, you can create forms for other profiles.
              </p>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

