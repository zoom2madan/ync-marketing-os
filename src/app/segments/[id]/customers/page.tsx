import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CustomerTable } from "@/components/customers/customer-table";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";
import { getSegmentById, getCustomersInSegment } from "@/lib/db/segment-queries";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function SegmentCustomerData({
  segmentId,
  page,
  limit,
}: {
  segmentId: number;
  page: number;
  limit: number;
}) {
  const segment = await getSegmentById(segmentId);
  if (!segment) {
    return <div>Segment not found</div>;
  }

  const data = await getCustomersInSegment(segment, page, limit);
  return <CustomerTable data={data} />;
}

export default async function SegmentCustomersPage({
  params,
  searchParams,
}: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const segmentId = parseInt(id, 10);

  if (isNaN(segmentId)) {
    notFound();
  }

  const segment = await getSegmentById(segmentId);
  if (!segment) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const page =
    typeof resolvedSearchParams.page === "string"
      ? parseInt(resolvedSearchParams.page, 10)
      : 1;
  const limit =
    typeof resolvedSearchParams.limit === "string"
      ? parseInt(resolvedSearchParams.limit, 10)
      : 20;

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/segments/${segmentId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader
            title={`Customers in "${segment.name}"`}
            description={`Segment type: ${segment.type}`}
          />
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4"></div>
                <p className="text-sm text-slate-600">Loading customers...</p>
              </div>
            </div>
          }
        >
          <SegmentCustomerData segmentId={segmentId} page={page} limit={limit} />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}

