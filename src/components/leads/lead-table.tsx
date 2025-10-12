"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { LeadListItem } from "@/types";
import Link from "next/link";

interface LeadTableProps {
  leads: LeadListItem[];
  onSelectionChange: (selectedIds: number[]) => void;
}

export function LeadTable({ leads, onSelectionChange }: LeadTableProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
      onSelectionChange([]);
    } else {
      const allIds = leads.map((lead) => lead.id);
      setSelectedIds(allIds);
      onSelectionChange(allIds);
    }
  };

  const toggleLead = (id: number) => {
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter((leadId) => leadId !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelection);
    onSelectionChange(newSelection);
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      New: "bg-blue-100 text-blue-800",
      "Not Contactable": "bg-gray-100 text-gray-800",
      Contacted: "bg-yellow-100 text-yellow-800",
      "Marketing Qualified": "bg-purple-100 text-purple-800",
      "Sales Qualified": "bg-indigo-100 text-indigo-800",
      Prospecting: "bg-cyan-100 text-cyan-800",
      "Proposal Sent": "bg-pink-100 text-pink-800",
      Negotiating: "bg-orange-100 text-orange-800",
      Converted: "bg-green-100 text-green-800",
      Lost: "bg-red-100 text-red-800",
      Nurturing: "bg-teal-100 text-teal-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === leads.length && leads.length > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Assigned To</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No leads found
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer hover:bg-slate-50"
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.includes(lead.id)}
                    onCheckedChange={() => toggleLead(lead.id)}
                  />
                </TableCell>
                <TableCell>
                  <Link href={`/leads/${lead.id}`} className="hover:underline">
                    {lead.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                    {lead.firstName} {lead.lastName}
                  </Link>
                </TableCell>
                <TableCell>{lead.email || "-"}</TableCell>
                <TableCell>{lead.mobile || "-"}</TableCell>
                <TableCell>
                  {(() => {
                    try {
                      if (!lead.createdAt) return "-";
                      const date = new Date(lead.createdAt);
                      if (isNaN(date.getTime())) return "-";
                      return format(date, "dd-MMM-yyyy");
                    } catch {
                      return "-";
                    }
                  })()}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getStageColor(lead.stage)}>
                    {lead.stage}
                  </Badge>
                </TableCell>
                <TableCell>{lead.assignedUserName || "Unassigned"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

