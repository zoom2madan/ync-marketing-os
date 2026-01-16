import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { TemplateSearch } from "@/components/templates/template-search";
import { TemplateTable } from "@/components/templates/template-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";
import { getTemplates } from "@/lib/db/template-queries";
import type { TemplateSearchParams, MessageType } from "@/types";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function TemplateData({ searchParams }: { searchParams: TemplateSearchParams }) {
  const data = await getTemplates(searchParams);
  return <TemplateTable data={data} />;
}

export default async function TemplatesPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const templateSearchParams: TemplateSearchParams = {
    search: typeof params.search === "string" ? params.search : undefined,
    type: typeof params.type === "string" ? (params.type as MessageType) : undefined,
    page: typeof params.page === "string" ? parseInt(params.page, 10) : 1,
    limit: typeof params.limit === "string" ? parseInt(params.limit, 10) : 20,
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Message Templates"
          description="Create and manage email and message templates"
          actions={
            <Button asChild>
              <Link href="/templates/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Link>
            </Button>
          }
        />

        <Suspense fallback={<div>Loading search...</div>}>
          <TemplateSearch />
        </Suspense>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4"></div>
                <p className="text-sm text-slate-600">Loading templates...</p>
              </div>
            </div>
          }
        >
          <TemplateData searchParams={templateSearchParams} />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}

