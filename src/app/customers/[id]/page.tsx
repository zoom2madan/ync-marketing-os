import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Mail, Phone, User, Hash } from "lucide-react";
import { getSession } from "@/lib/auth/middleware";
import { getCustomerWithAttributes } from "@/lib/db/customer-queries";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const customerId = parseInt(id, 10);

  if (isNaN(customerId)) {
    notFound();
  }

  const customer = await getCustomerWithAttributes(customerId);

  if (!customer) {
    notFound();
  }

  const fullName =
    customer.firstName || customer.lastName
      ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
      : "Unnamed Customer";

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader
            title={fullName}
            description={`Customer ID: ${customer.id}`}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Name</p>
                  <p className="font-medium">{fullName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
              {customer.mobile && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Mobile</p>
                    <p className="font-medium">{customer.mobile}</p>
                  </div>
                </div>
              )}
              {customer.lmsLeadId && (
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">LMS Lead ID</p>
                    <Badge variant="outline">{customer.lmsLeadId}</Badge>
                  </div>
                </div>
              )}
              <div className="pt-4 border-t text-sm text-slate-500">
                <p>Created: {format(new Date(customer.createdAt), "PPP")}</p>
                <p>Updated: {format(new Date(customer.updatedAt), "PPP")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/events?customerId=${customer.id}`}>
                  View Funnel Events
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Customer Attributes Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.attributes.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No attributes found for this customer
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.attributes.map((attr) => (
                    <TableRow key={attr.id}>
                      <TableCell className="font-medium">
                        {attr.fieldName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{attr.fieldType}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {typeof attr.fieldValue === "object"
                          ? JSON.stringify(attr.fieldValue)
                          : String(attr.fieldValue)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {format(new Date(attr.updatedAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

