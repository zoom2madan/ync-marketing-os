"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { MessageTemplate, PaginatedResponse } from "@/types";
import { format } from "date-fns";
import { Mail, MessageCircle } from "lucide-react";

interface TemplateTableProps {
  data: PaginatedResponse<MessageTemplate>;
  isLoading?: boolean;
}

export function TemplateTable({ data, isLoading }: TemplateTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const columns: Column<MessageTemplate>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
    },
    {
      key: "name",
      header: "Name",
      render: (template) => (
        <div className="flex items-center gap-2">
          {template.type === "email" ? (
            <Mail className="h-4 w-4 text-slate-400" />
          ) : (
            <MessageCircle className="h-4 w-4 text-green-500" />
          )}
          <div>
            <div className="font-medium">{template.name}</div>
            {template.subject && (
              <div className="text-sm text-slate-500 truncate max-w-xs">
                {template.subject}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (template) => (
        <Badge variant={template.type === "email" ? "default" : "secondary"}>
          {template.type}
        </Badge>
      ),
    },
    {
      key: "templatingType",
      header: "Format",
      render: (template) => (
        <span className="text-sm text-slate-500">{template.templatingType}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (template) => (
        <span className="text-sm text-slate-500">
          {format(new Date(template.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
  ];

  const handleRowClick = (template: MessageTemplate) => {
    router.push(`/templates/${template.id}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/templates?${params.toString()}`);
  };

  return (
    <DataTable
      columns={columns}
      data={data.data}
      keyExtractor={(template) => template.id}
      onRowClick={handleRowClick}
      isLoading={isLoading}
      emptyMessage="No templates found"
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

