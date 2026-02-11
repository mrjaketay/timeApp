import NextAuth from "next-auth";
import { getAuthOptionsLazy } from "@/lib/auth";

const handler = NextAuth(getAuthOptionsLazy());

export { handler as GET, handler as POST };
