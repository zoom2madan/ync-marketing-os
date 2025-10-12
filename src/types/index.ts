// TypeScript types for all database entities
// All properties in camelCase

export type UserRole = "admin" | "agent";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  mobile: string | null;
  request: string | null;
  assignedTo: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadAcquisition {
  id: number;
  leadId: number;
  platform: string | null;
  campaign: string | null;
  adSet: string | null;
  ad: string | null;
  landingPageUrl: string | null;
  ipv4: string | null;
  ipv6: string | null;
  createdAt: Date;
}

export type EducationLevel =
  | "Diploma"
  | "Undergraduate"
  | "Postgraduate"
  | "PhD";

export type StudyStream =
  | "Arts & Humanities"
  | "Engineering & Technology"
  | "Life Sciences & Medicine"
  | "Natural Sciences"
  | "Social Sciences & Management";

export type TargetIntake =
  | "Spring-2026"
  | "Summer-2026"
  | "Fall-2026"
  | "Winter-2026"
  | "Spring-2027"
  | "Summer-2027"
  | "Fall-2027"
  | "Winter-2027";

export type CurrentPursuit = "Studying" | "Working" | "Preparing For Admission";

export interface LeadEnrichedDetails {
  id: number;
  leadId: number;
  country: string | null;
  university: string | null;
  level: string | null;
  stream: string | null;
  subject: string | null;
  targetIntake: string | null;
  currentPursuit: string | null;
}

export type LeadStage =
  | "New"
  | "Not Contactable"
  | "Contacted"
  | "Marketing Qualified"
  | "Sales Qualified"
  | "Prospecting"
  | "Proposal Sent"
  | "Negotiating"
  | "Converted"
  | "Lost"
  | "Nurturing";

export interface LeadProcess {
  id: number;
  leadId: number;
  stage: LeadStage;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DemographicProfile {
  id: number;
  leadId: number;
  cityTier: string | null;
  familyIncomeRange: string | null;
  sourceOfIncome: string | null;
  willTakeEduLoan: boolean | null;
}

export type StudyGrade =
  | "X"
  | "XI"
  | "XII"
  | "Graduation"
  | "Post Graduation"
  | "PhD";

export interface AcademicProfile {
  id: number;
  leadId: number;
  studyGrade: string | null;
  school: string | null;
  schoolBoard: string | null;
  college: string | null;
  university: string | null;
  studyStream: string | null;
  gpa: string | null;
  notes: string | null;
}

export interface WorkProfile {
  id: number;
  leadId: number;
  workingAt: string | null;
  industry: string | null;
  workDesignation: string | null;
  yearsOfExperience: number | null;
  notes: string | null;
}

export interface StandardizedTestScores {
  id: number;
  leadId: number;
  ieltsScore: number | null;
  pteScore: number | null;
  toeflScore: number | null;
  satScore: number | null;
  greScore: number | null;
  gmatScore: number | null;
}

// Complete lead with all related data
export interface LeadWithDetails extends Lead {
  acquisition?: LeadAcquisition;
  enrichedDetails?: LeadEnrichedDetails;
  process?: LeadProcess;
  demographicProfile?: DemographicProfile;
  academicProfile?: AcademicProfile;
  workProfile?: WorkProfile;
  testScores?: StandardizedTestScores;
  assignedUser?: Pick<User, "id" | "firstName" | "lastName" | "email">;
}

// Lead list item for table display
export interface LeadListItem {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  mobile: string | null;
  createdAt: Date;
  stage: LeadStage;
  assignedTo: number | null;
  assignedUserName: string | null;
  platform: string | null;
}

// Pagination and filtering types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface LeadFilters {
  stage?: LeadStage;
  platform?: string;
  assignedTo?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard metrics types
export interface DashboardMetrics {
  totalLeads: number;
  newLeadsToday: number;
  newLeadsThisWeek: number;
  leadsByStage: { stage: LeadStage; count: number }[];
  leadsByPlatform: { platform: string; count: number }[];
  agentPerformance?: { agentId: number; agentName: string; leadCount: number }[];
}

