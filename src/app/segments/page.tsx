import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { SegmentSearch } from "@/components/segments/segment-search";
import { SegmentTable } from "@/components/segments/segment-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";
import { getSegments } from "@/lib/db/segment-queries";
import type { SegmentSearchParams, SegmentType } from "@/types";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function SegmentData({ searchParams }: { searchParams: SegmentSearchParams }) {
  const data = await getSegments(searchParams);
  return <SegmentTable data={data} />;
}

export default async function SegmentsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const segmentSearchParams: SegmentSearchParams = {
    search: typeof params.search === "string" ? params.search : undefined,
    type: typeof params.type === "string" ? (params.type as SegmentType) : undefined,
    page: typeof params.page === "string" ? parseInt(params.page, 10) : 1,
    limit: typeof params.limit === "string" ? parseInt(params.limit, 10) : 20,
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Customer Segments"
          description="Create and manage customer segments for targeting"
          actions={
            <Button asChild>
              <Link href="/segments/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Segment
              </Link>
            </Button>
          }
        />

        <Suspense fallback={<div>Loading search...</div>}>
          <SegmentSearch />
        </Suspense>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4"></div>
                <p className="text-sm text-slate-600">Loading segments...</p>
              </div>
            </div>
          }
        >
          <SegmentData searchParams={segmentSearchParams} />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}

