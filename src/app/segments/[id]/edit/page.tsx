import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SegmentForm } from "@/components/segments/segment-form";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";
import { getSegmentById } from "@/lib/db/segment-queries";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSegmentPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const segmentId = parseInt(id, 10);

  if (isNaN(segmentId)) {
    notFound();
  }

  const segment = await getSegmentById(segmentId);

  if (!segment) {
    notFound();
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/segments/${segment.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader
            title="Edit Segment"
            description={`Editing: ${segment.name}`}
          />
        </div>

        <div className="max-w-2xl">
          <SegmentForm segment={segment} isEdit />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

