import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { AutomationLogSearch } from "@/components/automation-logs/automation-log-search";
import { AutomationLogTable } from "@/components/automation-logs/automation-log-table";
import { getSession } from "@/lib/auth/middleware";
import { getAllAutomationLogs } from "@/lib/db/automation-queries";
import type { AutomationLogSearchParams, AutomationLogStatus } from "@/types";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function AutomationLogData({ searchParams }: { searchParams: AutomationLogSearchParams }) {
  const data = await getAllAutomationLogs(searchParams);
  return <AutomationLogTable data={data} />;
}

export default async function AutomationLogsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const logSearchParams: AutomationLogSearchParams = {
    automationId:
      typeof params.automationId === "string"
        ? parseInt(params.automationId, 10)
        : undefined,
    status:
      typeof params.status === "string"
        ? (params.status as AutomationLogStatus)
        : undefined,
    page: typeof params.page === "string" ? parseInt(params.page, 10) : 1,
    limit: typeof params.limit === "string" ? parseInt(params.limit, 10) : 20,
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Automation Logs"
          description="View execution history for all automations"
        />

        <Suspense fallback={<div>Loading search...</div>}>
          <AutomationLogSearch />
        </Suspense>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4"></div>
                <p className="text-sm text-slate-600">Loading automation logs...</p>
              </div>
            </div>
          }
        >
          <AutomationLogData searchParams={logSearchParams} />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}

