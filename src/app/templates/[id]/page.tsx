import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TemplatePreview } from "@/components/templates/template-preview";
import { ArrowLeft, Edit, Mail, MessageCircle } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";
import { getTemplateById } from "@/lib/db/template-queries";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const templateId = parseInt(id, 10);

  if (isNaN(templateId)) {
    notFound();
  }

  const template = await getTemplateById(templateId);

  if (!template) {
    notFound();
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader
            title={template.name}
            description={template.subject || "No subject"}
            actions={
              <Button variant="outline" asChild>
                <Link href={`/templates/${template.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            }
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Template Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {template.type === "email" ? (
                  <Mail className="h-4 w-4 text-slate-400" />
                ) : (
                  <MessageCircle className="h-4 w-4 text-green-500" />
                )}
                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <Badge variant={template.type === "email" ? "default" : "secondary"}>
                    {template.type}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500">Templating Engine</p>
                <p className="font-medium">{template.templatingType}</p>
              </div>

              {template.subject && (
                <div>
                  <p className="text-sm text-slate-500">Subject</p>
                  <p className="font-medium">{template.subject}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-slate-500 mb-2">Message Content</p>
                <pre className="p-3 bg-slate-100 rounded-lg text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                  {template.message}
                </pre>
              </div>

              <div className="pt-4 border-t text-sm text-slate-500">
                <p>Created: {format(new Date(template.createdAt), "PPP")}</p>
                <p>Updated: {format(new Date(template.updatedAt), "PPP")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <TemplatePreview templateId={template.id} />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

