import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { TemplateForm } from "@/components/templates/template-form";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";
import { getTemplateById } from "@/lib/db/template-queries";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: PageProps) {
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
            <Link href={`/templates/${template.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader
            title="Edit Template"
            description={`Editing: ${template.name}`}
          />
        </div>

        <TemplateForm template={template} isEdit />
      </div>
    </AuthenticatedLayout>
  );
}

