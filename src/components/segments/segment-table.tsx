"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { CustomerSegmentWithCount, PaginatedResponse } from "@/types";
import { format } from "date-fns";

interface SegmentTableProps {
  data: PaginatedResponse<CustomerSegmentWithCount>;
  isLoading?: boolean;
}

const typeColors: Record<string, "default" | "secondary" | "outline"> = {
  manual: "default",
  sql: "secondary",
  function: "outline",
};

export function SegmentTable({ data, isLoading }: SegmentTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const columns: Column<CustomerSegmentWithCount>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
    },
    {
      key: "name",
      header: "Name",
      render: (segment) => (
        <div>
          <div className="font-medium">{segment.name}</div>
          {segment.description && (
            <div className="text-sm text-slate-500 truncate max-w-xs">
              {segment.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (segment) => (
        <Badge variant={typeColors[segment.type] || "default"}>
          {segment.type}
        </Badge>
      ),
    },
    {
      key: "customerCount",
      header: "Customers",
      render: (segment) => (
        <span className="font-medium">
          {segment.type === "manual" ? segment.customerCount : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (segment) => (
        <span className="text-sm text-slate-500">
          {format(new Date(segment.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
  ];

  const handleRowClick = (segment: CustomerSegmentWithCount) => {
    router.push(`/segments/${segment.id}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/segments?${params.toString()}`);
  };

  return (
    <DataTable
      columns={columns}
      data={data.data}
      keyExtractor={(segment) => segment.id}
      onRowClick={handleRowClick}
      isLoading={isLoading}
      emptyMessage="No segments found"
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

