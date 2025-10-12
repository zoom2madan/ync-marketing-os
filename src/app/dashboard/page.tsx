import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/middleware";
import { getDashboardMetrics } from "@/lib/db/queries";
import { Users, TrendingUp, Calendar, Activity } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const metrics = await getDashboardMetrics(
    session.user.id,
    session.user.role
  );

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Overview of your lead management activities
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Today
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.newLeadsToday}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leads created today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                This Week
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.newLeadsThisWeek}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leads in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Stages
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.leadsByStage.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Different stages
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Leads by Stage */}
          <Card>
            <CardHeader>
              <CardTitle>Leads by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.leadsByStage.slice(0, 5).map((item) => (
                  <div key={item.stage} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-900" />
                      <span className="text-sm font-medium">{item.stage}</span>
                    </div>
                    <span className="text-sm font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Leads by Platform */}
          <Card>
            <CardHeader>
              <CardTitle>Leads by Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.leadsByPlatform.slice(0, 5).map((item) => (
                  <div key={item.platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <span className="text-sm font-medium">{item.platform}</span>
                    </div>
                    <span className="text-sm font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Performance (Admin only) */}
        {session.user.role === "admin" && metrics.agentPerformance && (
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.agentPerformance.map((agent) => (
                  <div key={agent.agentId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600" />
                      <span className="text-sm font-medium">{agent.agentName}</span>
                    </div>
                    <span className="text-sm font-bold">{agent.leadCount} leads</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

