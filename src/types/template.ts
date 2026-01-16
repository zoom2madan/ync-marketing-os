// Message Template types

export type MessageType = "email" | "whatsapp";
export type TemplatingType = "mjml";

export interface MessageTemplate {
  id: number;
  name: string;
  type: MessageType;
  templatingType: TemplatingType;
  subject: string | null;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

// API request types
export interface CreateTemplateRequest {
  name: string;
  type: MessageType;
  templatingType?: TemplatingType;
  subject?: string;
  message: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  type?: MessageType;
  templatingType?: TemplatingType;
  subject?: string;
  message?: string;
}

export interface TemplateSearchParams {
  search?: string;
  type?: MessageType;
  page?: number;
  limit?: number;
}

// Template variables that can be used in messages
export interface TemplateVariables {
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: unknown;
}

