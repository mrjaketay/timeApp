import { getServerSession } from "next-auth";
import { cache } from "react";

// Cache session retrieval per request to avoid multiple calls
export const getSession = cache(async () => {
  try {
    // Dynamically import to avoid errors if NEXTAUTH_SECRET is missing
    const { getAuthOptionsLazy } = await import("./auth");
    const authOptions = getAuthOptionsLazy();
    const session = await getServerSession(authOptions);
    
    return session;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error getting session:", error);
    }
    return null;
  }
});
