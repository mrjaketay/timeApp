import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string; // "ADMIN" | "EMPLOYER" | "EMPLOYEE"
      companyMemberships?: Array<{
        id: string;
        companyId: string;
        role: string;
        company: {
          id: string;
          name: string;
          slug: string;
        };
      }>;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    companyMemberships?: Array<{
      id: string;
      companyId: string;
      role: Role;
      company: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    companyMemberships?: Array<{
      id: string;
      companyId: string;
      role: Role;
      company: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
  }
}
