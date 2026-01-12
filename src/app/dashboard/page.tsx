import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { getSession } from "@/lib/auth/middleware";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Overview of your marketing activities
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

