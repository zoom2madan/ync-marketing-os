"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { Customer, PaginatedResponse } from "@/types";
import { format } from "date-fns";

interface CustomerTableProps {
  data: PaginatedResponse<Customer>;
  isLoading?: boolean;
}

export function CustomerTable({ data, isLoading }: CustomerTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const columns: Column<Customer>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
    },
    {
      key: "name",
      header: "Name",
      render: (customer) => (
        <div>
          <div className="font-medium">
            {customer.firstName || customer.lastName
              ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
              : "—"}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (customer) => (
        <span className="text-slate-600">{customer.email}</span>
      ),
    },
    {
      key: "lmsLeadId",
      header: "LMS Lead ID",
      render: (customer) =>
        customer.lmsLeadId ? (
          <Badge variant="outline">{customer.lmsLeadId}</Badge>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "mobile",
      header: "Mobile",
      render: (customer) => customer.mobile || <span className="text-slate-400">—</span>,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (customer) => (
        <span className="text-sm text-slate-500">
          {format(new Date(customer.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
  ];

  const handleRowClick = (customer: Customer) => {
    router.push(`/customers/${customer.id}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/customers?${params.toString()}`);
  };

  return (
    <DataTable
      columns={columns}
      data={data.data}
      keyExtractor={(customer) => customer.id}
      onRowClick={handleRowClick}
      isLoading={isLoading}
      emptyMessage="No customers found"
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

