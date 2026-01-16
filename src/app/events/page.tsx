import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { EventSearch } from "@/components/events/event-search";
import { EventTable } from "@/components/events/event-table";
import { EventUpload } from "@/components/events/event-upload";
import { getSession } from "@/lib/auth/middleware";
import { getFunnelEvents } from "@/lib/db/funnel-event-queries";
import type { FunnelEventSearchParams, FunnelType } from "@/types";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function EventData({ searchParams }: { searchParams: FunnelEventSearchParams }) {
  const data = await getFunnelEvents(searchParams);
  return <EventTable data={data} />;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const eventSearchParams: FunnelEventSearchParams = {
    customerId: typeof params.customerId === "string" ? parseInt(params.customerId, 10) : undefined,
    customerEmail: typeof params.customerEmail === "string" ? params.customerEmail : undefined,
    funnelType: typeof params.funnelType === "string" ? (params.funnelType as FunnelType) : undefined,
    fromStage: typeof params.fromStage === "string" ? params.fromStage : undefined,
    toStage: typeof params.toStage === "string" ? params.toStage : undefined,
    dateFrom: typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === "string" ? params.dateTo : undefined,
    page: typeof params.page === "string" ? parseInt(params.page, 10) : 1,
    limit: typeof params.limit === "string" ? parseInt(params.limit, 10) : 20,
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Funnel Events"
          description="Track customer journey through the funnel"
          actions={<EventUpload />}
        />

        <Suspense fallback={<div>Loading search...</div>}>
          <EventSearch />
        </Suspense>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4"></div>
                <p className="text-sm text-slate-600">Loading events...</p>
              </div>
            </div>
          }
        >
          <EventData searchParams={eventSearchParams} />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}

