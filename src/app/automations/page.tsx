import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { AutomationSearch } from "@/components/automations/automation-search";
import { AutomationTable } from "@/components/automations/automation-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";
import { getAutomations } from "@/lib/db/automation-queries";
import type { AutomationSearchParams } from "@/types";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function AutomationData({ searchParams }: { searchParams: AutomationSearchParams }) {
  const data = await getAutomations(searchParams);
  return <AutomationTable data={data} />;
}

export default async function AutomationsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const automationSearchParams: AutomationSearchParams = {
    search: typeof params.search === "string" ? params.search : undefined,
    isActive:
      typeof params.isActive === "string"
        ? params.isActive === "true"
        : undefined,
    segmentId:
      typeof params.segmentId === "string"
        ? parseInt(params.segmentId, 10)
        : undefined,
    templateId:
      typeof params.templateId === "string"
        ? parseInt(params.templateId, 10)
        : undefined,
    page: typeof params.page === "string" ? parseInt(params.page, 10) : 1,
    limit: typeof params.limit === "string" ? parseInt(params.limit, 10) : 20,
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Automations"
          description="Create and manage automated marketing campaigns"
          actions={
            <Button asChild>
              <Link href="/automations/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Automation
              </Link>
            </Button>
          }
        />

        <Suspense fallback={<div>Loading search...</div>}>
          <AutomationSearch />
        </Suspense>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4"></div>
                <p className="text-sm text-slate-600">Loading automations...</p>
              </div>
            </div>
          }
        >
          <AutomationData searchParams={automationSearchParams} />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}

