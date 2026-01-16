// Customer Segment types

export type SegmentType = "manual" | "sql" | "function";

export interface CustomerSegment {
  id: number;
  name: string;
  description: string | null;
  type: SegmentType;
  selectionSql: string | null;
  handlerFunction: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerSegmentWithCount extends CustomerSegment {
  customerCount: number;
}

export interface SegmentCustomerListEntry {
  id: number;
  customerSegmentId: number;
  customerId: number;
  createdAt: Date;
}

// API request types
export interface CreateSegmentRequest {
  name: string;
  description?: string;
  type: SegmentType;
  selectionSql?: string;
  handlerFunction?: string;
}

export interface UpdateSegmentRequest {
  name?: string;
  description?: string;
  type?: SegmentType;
  selectionSql?: string;
  handlerFunction?: string;
}

export interface SegmentSearchParams {
  search?: string;
  type?: SegmentType;
  page?: number;
  limit?: number;
}

// Segment handler function type
export type SegmentHandler = () => Promise<number[]>;

