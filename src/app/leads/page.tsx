"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadTable } from "@/components/leads/lead-table";
import { BulkActions } from "@/components/leads/bulk-actions";
import { CreateLeadDialog } from "@/components/leads/create-lead-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LeadListItem, PaginatedResponse, User } from "@/types";

export default function LeadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [agents, setAgents] = useState<Pick<User, "id" | "firstName" | "lastName">[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchLeads();
      if (session.user.role === "admin") {
        fetchAgents();
      }
    }
  }, [status, searchParams]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const response = await fetch(`/api/leads?${params.toString()}`);
      if (response.ok) {
        const data: PaginatedResponse<LeadListItem> = await response.json();
        setLeads(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/users/agents");
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/leads?${params.toString()}`);
  };

  const handleLimitChange = (newLimit: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newLimit);
    params.set("page", "1");
    router.push(`/leads?${params.toString()}`);
  };

  if (status === "loading" || !session) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">Loading...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Leads</h1>
            <p className="text-slate-600 mt-1">
              Manage and track all your leads
            </p>
          </div>
          <CreateLeadDialog />
        </div>

        {/* Filters */}
        <LeadFilters
          agents={agents}
          isAdmin={session.user.role === "admin"}
        />

        {/* Bulk Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {selectedIds.length > 0
              ? `${selectedIds.length} lead(s) selected`
              : `${pagination.total} total lead(s)`}
          </div>
          <BulkActions
            selectedIds={selectedIds}
            agents={agents}
            isAdmin={session.user.role === "admin"}
            onActionComplete={() => {
              setSelectedIds([]);
              fetchLeads();
            }}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4"></div>
              <p className="text-sm text-slate-600">Loading leads...</p>
            </div>
          </div>
        ) : (
          <LeadTable leads={leads} onSelectionChange={setSelectedIds} />
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Show</span>
            <Select value={limit.toString()} onValueChange={handleLimitChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-600">per page</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

