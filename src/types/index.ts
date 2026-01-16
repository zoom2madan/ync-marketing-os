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

// Pagination and filtering types
export interface PaginationParams {
  page: number;
  limit: number;
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

// Re-export all module types
export * from "./customer";
export * from "./funnel-event";
export * from "./segment";
export * from "./template";
export * from "./automation";
