import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/middleware";
import { getLeadById } from "@/lib/db/queries";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { LeadDetailActions } from "@/components/leads/lead-detail-actions";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const { tab } = await searchParams;
  const leadId = parseInt(id);

  const lead = await getLeadById(leadId, session.user.id, session.user.role);

  if (!lead) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Lead Not Found</h2>
            <p className="text-slate-600 mb-4">
              The lead you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link href="/leads">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Leads
              </Button>
            </Link>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      New: "bg-blue-100 text-blue-800",
      "Not Contactable": "bg-gray-100 text-gray-800",
      Contacted: "bg-yellow-100 text-yellow-800",
      "Marketing Qualified": "bg-purple-100 text-purple-800",
      "Sales Qualified": "bg-indigo-100 text-indigo-800",
      Prospecting: "bg-cyan-100 text-cyan-800",
      "Proposal Sent": "bg-pink-100 text-pink-800",
      Negotiating: "bg-orange-100 text-orange-800",
      Converted: "bg-green-100 text-green-800",
      Lost: "bg-red-100 text-red-800",
      Nurturing: "bg-teal-100 text-teal-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  const DataRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div className="py-2 border-b last:border-0">
      <div className="text-sm font-medium text-slate-500 mb-1">{label}</div>
      <div className="text-sm text-slate-900">{value || "-"}</div>
    </div>
  );

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">
              {lead.firstName} {lead.lastName}
            </h1>
            <p className="text-slate-600 mt-1">Lead ID: {lead.id}</p>
          </div>
        </div>

        {/* Top Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lead Information</CardTitle>
            <LeadDetailActions leadId={leadId} lead={lead} />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <DataRow label="Email" value={lead.email} />
              <DataRow label="Mobile" value={lead.mobile} />
              <DataRow
                label="Stage"
                value={
                  lead.process ? (
                    <Badge variant="secondary" className={getStageColor(lead.process.stage)}>
                      {lead.process.stage}
                    </Badge>
                  ) : (
                    <Badge>New</Badge>
                  )
                }
              />
              <DataRow
                label="Assigned To"
                value={
                  lead.assignedUser
                    ? `${lead.assignedUser.firstName} ${lead.assignedUser.lastName}`
                    : "Unassigned"
                }
              />
              <DataRow label="Request" value={lead.request} />
              <DataRow
                label="Created At"
                value={(() => {
                  try {
                    if (!lead.createdAt) return "-";
                    const date = new Date(lead.createdAt);
                    if (isNaN(date.getTime())) return "-";
                    return format(date, "dd-MMM-yyyy HH:mm");
                  } catch {
                    return "-";
                  }
                })()}
              />
            </div>
            {lead.process?.notes && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium text-slate-500 mb-1">Process Notes</div>
                <div className="text-sm text-slate-900">{lead.process.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue={tab || "acquisition"} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
            <TabsTrigger value="enriched">Enriched Details</TabsTrigger>
            <TabsTrigger value="demographic">Demographic</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="work">Work</TabsTrigger>
            <TabsTrigger value="tests">Test Scores</TabsTrigger>
          </TabsList>

          <TabsContent value="acquisition">
            <Card>
              <CardHeader>
                <CardTitle>Lead Acquisition</CardTitle>
              </CardHeader>
              <CardContent>
                {lead.acquisition ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <DataRow label="Platform" value={lead.acquisition.platform} />
                    <DataRow label="Campaign" value={lead.acquisition.campaign} />
                    <DataRow label="Ad Set" value={lead.acquisition.adSet} />
                    <DataRow label="Ad" value={lead.acquisition.ad} />
                    <DataRow label="Landing Page URL" value={lead.acquisition.landingPageUrl} />
                    <DataRow label="IPv4" value={lead.acquisition.ipv4} />
                    <DataRow label="IPv6" value={lead.acquisition.ipv6} />
                    <DataRow
                      label="Acquired At"
                      value={(() => {
                        try {
                          if (!lead.acquisition.createdAt) return "-";
                          const date = new Date(lead.acquisition.createdAt);
                          if (isNaN(date.getTime())) return "-";
                          return format(date, "dd-MMM-yyyy HH:mm");
                        } catch {
                          return "-";
                        }
                      })()}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No acquisition data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enriched">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Enriched Details</CardTitle>
                <LeadDetailActions leadId={leadId} lead={lead} tab="enriched" />
              </CardHeader>
              <CardContent>
                {lead.enrichedDetails ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <DataRow label="Country" value={lead.enrichedDetails.country} />
                    <DataRow label="University" value={lead.enrichedDetails.university} />
                    <DataRow label="Level" value={lead.enrichedDetails.level} />
                    <DataRow label="Stream" value={lead.enrichedDetails.stream} />
                    <DataRow label="Subject" value={lead.enrichedDetails.subject} />
                    <DataRow label="Target Intake" value={lead.enrichedDetails.targetIntake} />
                    <DataRow label="Current Pursuit" value={lead.enrichedDetails.currentPursuit} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No enriched details available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demographic">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Demographic Profile</CardTitle>
                <LeadDetailActions leadId={leadId} lead={lead} tab="demographic" />
              </CardHeader>
              <CardContent>
                {lead.demographicProfile ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <DataRow label="City Tier" value={lead.demographicProfile.cityTier} />
                    <DataRow label="Family Income Range" value={lead.demographicProfile.familyIncomeRange} />
                    <DataRow label="Source of Income" value={lead.demographicProfile.sourceOfIncome} />
                    <DataRow
                      label="Will Take Education Loan"
                      value={
                        lead.demographicProfile.willTakeEduLoan === null
                          ? "-"
                          : lead.demographicProfile.willTakeEduLoan
                          ? "Yes"
                          : "No"
                      }
                    />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No demographic profile available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Academic Profile</CardTitle>
                <LeadDetailActions leadId={leadId} lead={lead} tab="academic" />
              </CardHeader>
              <CardContent>
                {lead.academicProfile ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <DataRow label="Study Grade" value={lead.academicProfile.studyGrade} />
                    <DataRow label="School" value={lead.academicProfile.school} />
                    <DataRow label="School Board" value={lead.academicProfile.schoolBoard} />
                    <DataRow label="College" value={lead.academicProfile.college} />
                    <DataRow label="University" value={lead.academicProfile.university} />
                    <DataRow label="Study Stream" value={lead.academicProfile.studyStream} />
                    <DataRow label="GPA" value={lead.academicProfile.gpa} />
                    <DataRow label="Notes" value={lead.academicProfile.notes} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No academic profile available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Work Profile</CardTitle>
                <LeadDetailActions leadId={leadId} lead={lead} tab="work" />
              </CardHeader>
              <CardContent>
                {lead.workProfile ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <DataRow label="Working At" value={lead.workProfile.workingAt} />
                    <DataRow label="Industry" value={lead.workProfile.industry} />
                    <DataRow label="Designation" value={lead.workProfile.workDesignation} />
                    <DataRow label="Years of Experience" value={lead.workProfile.yearsOfExperience} />
                    <DataRow label="Notes" value={lead.workProfile.notes} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No work profile available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Standardized Test Scores</CardTitle>
                <LeadDetailActions leadId={leadId} lead={lead} tab="tests" />
              </CardHeader>
              <CardContent>
                {lead.testScores ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <DataRow label="IELTS Score" value={lead.testScores.ieltsScore} />
                    <DataRow label="PTE Score" value={lead.testScores.pteScore} />
                    <DataRow label="TOEFL Score" value={lead.testScores.toeflScore} />
                    <DataRow label="SAT Score" value={lead.testScores.satScore} />
                    <DataRow label="GRE Score" value={lead.testScores.greScore} />
                    <DataRow label="GMAT Score" value={lead.testScores.gmatScore} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No test scores available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}

