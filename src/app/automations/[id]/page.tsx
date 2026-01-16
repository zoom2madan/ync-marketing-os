import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Play, Pause, Filter, FileText, Clock } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";
import { getAutomationWithRelations, getAutomationLogs } from "@/lib/db/automation-queries";
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

  const logs = await getAutomationLogs(automationId, 1, 5);

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
              <div className="flex items-center gap-2">
                <Badge variant={automation.isActive ? "default" : "secondary"}>
                  {automation.isActive ? "Active" : "Inactive"}
                </Badge>
                <Button variant="outline" asChild>
                  <Link href={`/automations/${automation.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              </div>
            }
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Automation Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Automation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="pt-4 border-t text-sm text-slate-500">
                <p>Created: {format(new Date(automation.createdAt), "PPP")}</p>
                <p>Updated: {format(new Date(automation.updatedAt), "PPP")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {automation.customerSegmentId && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/segments/${automation.customerSegmentId}`}>
                    <Filter className="h-4 w-4 mr-2" />
                    View Segment
                  </Link>
                </Button>
              )}
              {automation.messageTemplateId && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/templates/${automation.messageTemplateId}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Template
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Execution Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Executions</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.data.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No executions yet
              </p>
            ) : (
              <div className="space-y-3">
                {logs.data.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          log.status === "completed"
                            ? "default"
                            : log.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {log.status}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">
                          {log.customersProcessed} customers processed
                        </p>
                        {log.errorMessage && (
                          <p className="text-xs text-red-600">{log.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {format(new Date(log.startedAt), "MMM d, yyyy HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

