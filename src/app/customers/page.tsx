import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerSearch } from "@/components/customers/customer-search";
import { CustomerTable } from "@/components/customers/customer-table";
import { CustomerUpload } from "@/components/customers/customer-upload";
import { getSession } from "@/lib/auth/middleware";
import { getCustomers } from "@/lib/db/customer-queries";
import type { CustomerSearchParams } from "@/types";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function CustomerData({ searchParams }: { searchParams: CustomerSearchParams }) {
  const data = await getCustomers(searchParams);
  return <CustomerTable data={data} />;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const customerSearchParams: CustomerSearchParams = {
    search: typeof params.search === "string" ? params.search : undefined,
    email: typeof params.email === "string" ? params.email : undefined,
    lmsLeadId: typeof params.lmsLeadId === "string" ? params.lmsLeadId : undefined,
    page: typeof params.page === "string" ? parseInt(params.page, 10) : 1,
    limit: typeof params.limit === "string" ? parseInt(params.limit, 10) : 20,
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Customers"
          description="Search and view customer information"
          actions={<CustomerUpload />}
        />

        <Suspense fallback={<div>Loading search...</div>}>
          <CustomerSearch />
        </Suspense>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto mb-4"></div>
                <p className="text-sm text-slate-600">Loading customers...</p>
              </div>
            </div>
          }
        >
          <CustomerData searchParams={customerSearchParams} />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}

