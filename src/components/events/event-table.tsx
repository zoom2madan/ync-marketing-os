"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { FunnelEventWithCustomer, PaginatedResponse } from "@/types";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

interface EventTableProps {
  data: PaginatedResponse<FunnelEventWithCustomer>;
  isLoading?: boolean;
}

export function EventTable({ data, isLoading }: EventTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const columns: Column<FunnelEventWithCustomer>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
    },
    {
      key: "customer",
      header: "Customer",
      render: (event) => (
        <div>
          <div className="font-medium">
            {event.customerFirstName || event.customerLastName
              ? `${event.customerFirstName || ""} ${event.customerLastName || ""}`.trim()
              : "—"}
          </div>
          <div className="text-sm text-slate-500">{event.customerEmail}</div>
        </div>
      ),
    },
    {
      key: "funnelType",
      header: "Funnel",
      render: (event) => (
        <Badge variant={event.funnelType === "sales" ? "default" : "secondary"}>
          {event.funnelType}
        </Badge>
      ),
    },
    {
      key: "transition",
      header: "Stage Transition",
      render: (event) => (
        <div className="flex items-center gap-2">
          <span className="text-slate-600">{event.fromStage || "—"}</span>
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <span className="font-medium">{event.toStage}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (event) => (
        <span className="text-sm text-slate-500">
          {format(new Date(event.createdAt), "MMM d, yyyy HH:mm")}
        </span>
      ),
    },
  ];

  const handleRowClick = (event: FunnelEventWithCustomer) => {
    router.push(`/events/${event.id}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/events?${params.toString()}`);
  };

  return (
    <DataTable
      columns={columns}
      data={data.data}
      keyExtractor={(event) => event.id}
      onRowClick={handleRowClick}
      isLoading={isLoading}
      emptyMessage="No funnel events found"
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

