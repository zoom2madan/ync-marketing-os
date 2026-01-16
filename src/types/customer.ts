// Customer types

export type FieldType = "numeric" | "string" | "date" | "timestamp" | "boolean" | "array";

export interface Customer {
  id: number;
  lmsLeadId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  mobile: string | null;
  createdAt: Date;
  updatedAt: Date;
  sourceCreatedAt: Date | null;
  sourceUpdatedAt: Date | null;
}

export interface CustomerAttribute {
  id: number;
  customerId: number;
  fieldType: FieldType;
  fieldName: string;
  fieldValue: unknown;
  createdAt: Date;
  updatedAt: Date;
  sourceCreatedAt: Date | null;
  sourceUpdatedAt: Date | null;
}

export interface CustomerWithAttributes extends Customer {
  attributes: CustomerAttribute[];
}

// API request/response types
export interface CreateCustomerRequest {
  lmsLeadId?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  mobile?: string;
  sourceCreatedAt?: string;
  sourceUpdatedAt?: string;
  attributes?: CreateCustomerAttributeRequest[];
}

export interface CreateCustomerAttributeRequest {
  fieldType: FieldType;
  fieldName: string;
  fieldValue: unknown;
  sourceCreatedAt?: string;
  sourceUpdatedAt?: string;
}

export interface UpdateCustomerRequest {
  lmsLeadId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
}

export interface CustomerSearchParams {
  search?: string;
  email?: string;
  lmsLeadId?: string;
  page?: number;
  limit?: number;
}

