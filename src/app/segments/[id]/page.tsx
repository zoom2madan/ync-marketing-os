import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SegmentCustomersUpload } from "@/components/segments/segment-customers-upload";
import { ArrowLeft, Edit, Users, Code, Cog } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";
import { getSegmentWithCount } from "@/lib/db/segment-queries";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

const typeIcons = {
  manual: Users,
  sql: Code,
  function: Cog,
};

const typeColors: Record<string, "default" | "secondary" | "outline"> = {
  manual: "default",
  sql: "secondary",
  function: "outline",
};

export default async function SegmentDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const segmentId = parseInt(id, 10);

  if (isNaN(segmentId)) {
    notFound();
  }

  const segment = await getSegmentWithCount(segmentId);

  if (!segment) {
    notFound();
  }

  const TypeIcon = typeIcons[segment.type];

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/segments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader
            title={segment.name}
            description={segment.description || "No description"}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Segment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <TypeIcon className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <Badge variant={typeColors[segment.type]}>
                    {segment.type}
                  </Badge>
                </div>
              </div>

              {segment.type === "manual" && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Customers</p>
                    <p className="font-medium">{segment.customerCount}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="font-medium">{format(new Date(segment.createdAt), "PPP")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm text-slate-500">Updated</p>
                  <p className="font-medium">{format(new Date(segment.updatedAt), "PPP")}</p>
                </div>
              </div>
            </div>

            {segment.type === "sql" && segment.selectionSql && (
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500 mb-2">Selection SQL</p>
                <pre className="p-3 bg-slate-100 rounded-lg text-xs font-mono overflow-x-auto">
                  {segment.selectionSql}
                </pre>
              </div>
            )}

            {segment.type === "function" && segment.handlerFunction && (
              <div className="pt-4 border-t flex items-center gap-3">
                <Cog className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Handler Function</p>
                  <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                    {segment.handlerFunction}
                  </code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/segments/${segment.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/segments/${segment.id}/customers`}>
              <Users className="h-4 w-4 mr-2" />
              View Customers in Segment
            </Link>
          </Button>
        </div>

        {segment.type === "manual" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <SegmentCustomersUpload segmentId={segment.id} />
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

