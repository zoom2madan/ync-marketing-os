import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, AlertCircle, Cog } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";
import { getAutomationLogById } from "@/lib/db/automation-queries";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AutomationLogDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const logId = parseInt(id, 10);

  if (isNaN(logId)) {
    notFound();
  }

  const log = await getAutomationLogById(logId);

  if (!log) {
    notFound();
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/automation-logs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader
            title={`Execution Log #${log.id}`}
            description={`Execution for ${log.automationName}`}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Execution Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <Cog className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Automation</p>
                  <p className="font-medium">{log.automationName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm text-slate-500">Status</p>
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
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Customers Processed</p>
                  <p className="font-medium">{log.customersProcessed}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Started At</p>
                  <p className="font-medium">
                    {format(new Date(log.startedAt), "PPP 'at' HH:mm:ss")}
                  </p>
                </div>
              </div>
            </div>

            {log.completedAt && (
              <div className="pt-4 border-t flex items-center gap-3">
                <Clock className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Completed At</p>
                  <p className="font-medium">
                    {format(new Date(log.completedAt), "PPP 'at' HH:mm:ss")}
                  </p>
                </div>
              </div>
            )}

            {log.errorMessage && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-slate-500">Error Message</p>
                </div>
                <pre className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm font-mono text-red-700 overflow-x-auto">
                  {log.errorMessage}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Button variant="outline" asChild>
          <Link href={`/automations/${log.automationId}`}>
            <Cog className="h-4 w-4 mr-2" />
            View Automation
          </Link>
        </Button>
      </div>
    </AuthenticatedLayout>
  );
}

