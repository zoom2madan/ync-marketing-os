import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Activity, User, ArrowRightCircle, Circle } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";
import { getFunnelEventById } from "@/lib/db/funnel-event-queries";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const eventId = parseInt(id, 10);

  if (isNaN(eventId)) {
    notFound();
  }

  const event = await getFunnelEventById(eventId);

  if (!event) {
    notFound();
  }

  const customerName =
    event.customerFirstName || event.customerLastName
      ? `${event.customerFirstName || ""} ${event.customerLastName || ""}`.trim()
      : "Unknown Customer";

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader
            title={`Event #${event.id}`}
            description={`Funnel transition for ${customerName}`}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Funnel Type</p>
                  <Badge variant={event.funnelType === "sales" ? "default" : "secondary"}>
                    {event.funnelType}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Circle className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">From Stage</p>
                  <p className="font-medium">{event.fromStage || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ArrowRightCircle className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">To Stage</p>
                  <p className="font-medium">{event.toStage}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Event Date</p>
                  <p className="font-medium">
                    {format(new Date(event.createdAt), "PPP 'at' HH:mm:ss")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" asChild>
          <Link href={`/customers/${event.customerId}`}>
            <User className="h-4 w-4 mr-2" />
            View Customer Profile
          </Link>
        </Button>
      </div>
    </AuthenticatedLayout>
  );
}

