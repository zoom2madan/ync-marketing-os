// Automation types

export type AutomationLogStatus = "started" | "completed" | "failed";

export interface Automation {
  id: number;
  name: string;
  description: string | null;
  customerSegmentId: number;
  messageTemplateId: number;
  cron: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationWithRelations extends Automation {
  segmentName: string;
  templateName: string;
  templateType: string;
}

export interface AutomationLog {
  id: number;
  automationId: number;
  status: AutomationLogStatus;
  customersProcessed: number;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
}

export interface AutomationLogWithDetails extends AutomationLog {
  automationName: string;
}

// API request types
export interface CreateAutomationRequest {
  name: string;
  description?: string;
  customerSegmentId: number;
  messageTemplateId: number;
  cron: string;
  isActive?: boolean;
}

export interface UpdateAutomationRequest {
  name?: string;
  description?: string;
  customerSegmentId?: number;
  messageTemplateId?: number;
  cron?: string;
  isActive?: boolean;
}

export interface AutomationSearchParams {
  search?: string;
  isActive?: boolean;
  segmentId?: number;
  templateId?: number;
  page?: number;
  limit?: number;
}

// CRON builder types
export interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

