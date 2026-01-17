import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SegmentForm } from "@/components/segments/segment-form";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";

export default async function NewSegmentPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

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
            title="Create Segment"
            description="Define a new customer segment"
          />
        </div>

        <SegmentForm />
      </div>
    </AuthenticatedLayout>
  );
}

