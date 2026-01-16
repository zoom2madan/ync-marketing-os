// Funnel Event types

export type FunnelType = "sales" | "service-delivery";

export interface FunnelEvent {
  id: number;
  customerId: number;
  funnelType: FunnelType;
  fromStage: string | null;
  toStage: string;
  createdAt: Date;
  sourceUpdatedAt: Date | null;
}

export interface FunnelEventWithCustomer extends FunnelEvent {
  customerEmail: string;
  customerFirstName: string | null;
  customerLastName: string | null;
}

// API request types
export interface CreateFunnelEventRequest {
  customerId: number;
  funnelType: FunnelType;
  fromStage?: string;
  toStage: string;
  sourceUpdatedAt?: string;
}

export interface CreateFunnelEventByEmailRequest {
  customerEmail: string;
  funnelType: FunnelType;
  fromStage?: string;
  toStage: string;
  sourceUpdatedAt?: string;
}

export interface FunnelEventSearchParams {
  customerId?: number;
  customerEmail?: string;
  funnelType?: FunnelType;
  fromStage?: string;
  toStage?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

