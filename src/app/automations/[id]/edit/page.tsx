import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { AutomationForm } from "@/components/automations/automation-form";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";
import { getAutomationById } from "@/lib/db/automation-queries";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAutomationPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const automationId = parseInt(id, 10);

  if (isNaN(automationId)) {
    notFound();
  }

  const automation = await getAutomationById(automationId);

  if (!automation) {
    notFound();
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/automations/${automation.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader
            title="Edit Automation"
            description={`Editing: ${automation.name}`}
          />
        </div>

        <AutomationForm automation={automation} isEdit />
      </div>
    </AuthenticatedLayout>
  );
}

