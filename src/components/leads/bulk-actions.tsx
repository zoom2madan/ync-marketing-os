"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, RefreshCw, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User, LeadStage } from "@/types";

const STAGES: LeadStage[] = [
  "New",
  "Not Contactable",
  "Contacted",
  "Marketing Qualified",
  "Sales Qualified",
  "Prospecting",
  "Proposal Sent",
  "Negotiating",
  "Converted",
  "Lost",
  "Nurturing",
];

interface BulkActionsProps {
  selectedIds: number[];
  agents: Pick<User, "id" | "firstName" | "lastName">[];
  isAdmin: boolean;
  onActionComplete: () => void;
}

export function BulkActions({
  selectedIds,
  agents,
  isAdmin,
  onActionComplete,
}: BulkActionsProps) {
  const router = useRouter();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAssignLeads = async () => {
    if (!selectedAgent) return;

    setLoading(true);
    try {
      const response = await fetch("/api/leads/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: selectedIds,
          assignedTo: parseInt(selectedAgent),
        }),
      });

      if (response.ok) {
        setAssignDialogOpen(false);
        setSelectedAgent("");
        onActionComplete();
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to assign leads"}`);
      }
    } catch (error) {
      alert("An error occurred while assigning leads");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStage) return;

    setLoading(true);
    try {
      const response = await fetch("/api/leads/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: selectedIds,
          stage: selectedStage,
        }),
      });

      if (response.ok) {
        setStatusDialogOpen(false);
        setSelectedStage("");
        onActionComplete();
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to update status"}`);
      }
    } catch (error) {
      alert("An error occurred while updating status");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/leads/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedIds }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads-export-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to export leads");
      }
    } catch (error) {
      alert("An error occurred while exporting leads");
    }
  };

  const disabled = selectedIds.length === 0;

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={disabled} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Assign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Leads</DialogTitle>
              <DialogDescription>
                Assign {selectedIds.length} selected lead(s) to an agent
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Select Agent
              </label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.firstName} {agent.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAssignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignLeads}
                disabled={!selectedAgent || loading}
              >
                {loading ? "Assigning..." : "Assign Leads"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogTrigger asChild>
          <Button disabled={disabled} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Update Status
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Lead Status</DialogTitle>
            <DialogDescription>
              Update status for {selectedIds.length} selected lead(s)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Select Stage
            </label>
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={!selectedStage || loading}
            >
              {loading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        disabled={disabled}
        size="sm"
        onClick={handleExport}
      >
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
}

