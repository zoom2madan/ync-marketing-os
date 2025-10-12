import { UserRole } from "./index";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      name?: string | null;
      email: string;
      image?: string | null;
      role: UserRole;
      isActive: boolean;
    };
  }
  
  interface User {
    id: number;
    name?: string | null;
    email: string;
    image?: string | null;
    role?: UserRole;
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: number;
    role: UserRole;
    isActive: boolean;
  }
}

