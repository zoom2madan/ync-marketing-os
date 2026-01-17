import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Play, Pause, Filter, FileText, Clock, History } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";
import { getAutomationWithRelations } from "@/lib/db/automation-queries";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AutomationDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const automationId = parseInt(id, 10);

  if (isNaN(automationId)) {
    notFound();
  }

  const automation = await getAutomationWithRelations(automationId);

  if (!automation) {
    notFound();
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/automations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader
            title={automation.name}
            description={automation.description || "No description"}
            actions={
              <Badge variant={automation.isActive ? "default" : "secondary"}>
                {automation.isActive ? "Active" : "Inactive"}
              </Badge>
            }
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Automation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                {automation.isActive ? (
                  <Play className="h-4 w-4 text-green-500" />
                ) : (
                  <Pause className="h-4 w-4 text-slate-400" />
                )}
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="font-medium">
                    {automation.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Schedule</p>
                  <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                    {automation.cron}
                  </code>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Target Segment</p>
                  <p className="font-medium">{automation.segmentName || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Message Template</p>
                  <div>
                    <p className="font-medium">{automation.templateName || "—"}</p>
                    {automation.templateType && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {automation.templateType}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Created</p>
                <p className="font-medium">{format(new Date(automation.createdAt), "PPP")}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Updated</p>
                <p className="font-medium">{format(new Date(automation.updatedAt), "PPP")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/automations/${automation.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          {automation.customerSegmentId && (
            <Button variant="outline" asChild>
              <Link href={`/segments/${automation.customerSegmentId}`}>
                <Filter className="h-4 w-4 mr-2" />
                View Segment
              </Link>
            </Button>
          )}
          {automation.messageTemplateId && (
            <Button variant="outline" asChild>
              <Link href={`/templates/${automation.messageTemplateId}`}>
                <FileText className="h-4 w-4 mr-2" />
                View Template
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/automation-logs?automationId=${automation.id}`}>
              <History className="h-4 w-4 mr-2" />
              Recent Executions
            </Link>
          </Button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

