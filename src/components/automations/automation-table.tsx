"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { AutomationWithRelations, PaginatedResponse } from "@/types";
import { format } from "date-fns";
import { Play, Pause } from "lucide-react";

interface AutomationTableProps {
  data: PaginatedResponse<AutomationWithRelations>;
  isLoading?: boolean;
}

export function AutomationTable({ data, isLoading }: AutomationTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const columns: Column<AutomationWithRelations>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
    },
    {
      key: "name",
      header: "Name",
      render: (automation) => (
        <div className="flex items-center gap-2">
          {automation.isActive ? (
            <Play className="h-4 w-4 text-green-500" />
          ) : (
            <Pause className="h-4 w-4 text-slate-400" />
          )}
          <div>
            <div className="font-medium">{automation.name}</div>
            {automation.description && (
              <div className="text-sm text-slate-500 truncate max-w-xs">
                {automation.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "segment",
      header: "Segment",
      render: (automation) => (
        <span className="text-sm">{automation.segmentName || "—"}</span>
      ),
    },
    {
      key: "template",
      header: "Template",
      render: (automation) => (
        <div className="text-sm">
          <div>{automation.templateName || "—"}</div>
          {automation.templateType && (
            <Badge variant="outline" className="text-xs mt-1">
              {automation.templateType}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "cron",
      header: "Schedule",
      render: (automation) => (
        <code className="text-xs bg-slate-100 px-2 py-1 rounded">
          {automation.cron}
        </code>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (automation) => (
        <Badge variant={automation.isActive ? "default" : "secondary"}>
          {automation.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (automation) => (
        <span className="text-sm text-slate-500">
          {format(new Date(automation.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
  ];

  const handleRowClick = (automation: AutomationWithRelations) => {
    router.push(`/automations/${automation.id}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/automations?${params.toString()}`);
  };

  return (
    <DataTable
      columns={columns}
      data={data.data}
      keyExtractor={(automation) => automation.id}
      onRowClick={handleRowClick}
      isLoading={isLoading}
      emptyMessage="No automations found"
      pagination={{
        currentPage: data.pagination.page,
        totalPages: data.pagination.totalPages,
        totalItems: data.pagination.total,
        itemsPerPage: data.pagination.limit,
        onPageChange: handlePageChange,
      }}
    />
  );
}

