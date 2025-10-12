import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUserByEmail, createUser } from "@/lib/db/queries";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Restrict to @yournextcampus.com domain only
      if (!user.email?.endsWith("@yournextcampus.com")) {
        return false;
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Fetch user from database to get role and other info
        const dbUser = await getUserByEmail(session.user.email!);
        
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.role = dbUser.role;
          session.user.isActive = dbUser.isActive;
        }
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      if (user && account) {
        // On first sign in, sync user to database
        const email = user.email!;
        let dbUser = await getUserByEmail(email);

        if (!dbUser) {
          // Create new user with default role as agent
          const [firstName = "", lastName = ""] = (user.name || "").split(" ", 2);
          dbUser = await createUser({
            firstName,
            lastName: lastName || firstName,
            email,
            role: "agent", // Default role, admins can be set manually in DB
          });
        }

        token.userId = dbUser.id;
        token.role = dbUser.role;
        token.isActive = dbUser.isActive;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

