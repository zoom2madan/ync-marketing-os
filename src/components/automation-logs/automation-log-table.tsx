"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { AutomationLogWithDetails, PaginatedResponse } from "@/types";
import { format } from "date-fns";

interface AutomationLogTableProps {
  data: PaginatedResponse<AutomationLogWithDetails>;
  isLoading?: boolean;
}

export function AutomationLogTable({ data, isLoading }: AutomationLogTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const columns: Column<AutomationLogWithDetails>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
    },
    {
      key: "automationName",
      header: "Automation",
      render: (log) => (
        <span className="font-medium">{log.automationName}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (log) => (
        <Badge
          variant={
            log.status === "completed"
              ? "default"
              : log.status === "failed"
              ? "destructive"
              : "secondary"
          }
        >
          {log.status}
        </Badge>
      ),
    },
    {
      key: "customersProcessed",
      header: "Customers Processed",
      render: (log) => (
        <span className="text-sm">{log.customersProcessed}</span>
      ),
    },
    {
      key: "startedAt",
      header: "Started At",
      render: (log) => (
        <span className="text-sm text-slate-500">
          {format(new Date(log.startedAt), "MMM d, yyyy HH:mm:ss")}
        </span>
      ),
    },
    {
      key: "completedAt",
      header: "Completed At",
      render: (log) => (
        <span className="text-sm text-slate-500">
          {log.completedAt
            ? format(new Date(log.completedAt), "MMM d, yyyy HH:mm:ss")
            : "—"}
        </span>
      ),
    },
  ];

  const handleRowClick = (log: AutomationLogWithDetails) => {
    router.push(`/automation-logs/${log.id}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/automation-logs?${params.toString()}`);
  };

  return (
    <DataTable
      columns={columns}
      data={data.data}
      keyExtractor={(log) => log.id}
      onRowClick={handleRowClick}
      isLoading={isLoading}
      emptyMessage="No automation logs found"
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

