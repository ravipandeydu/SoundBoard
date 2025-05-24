// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth/next";
import type { AuthOptions } from "next-auth";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { AdapterUser } from "next-auth/adapters";
import bcrypt from "bcrypt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

/** ----------------------------------------------------------------
 *  1. Auth configuration object – exported so others can import it
 * ----------------------------------------------------------------*/
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },

  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds.password) {
          throw new Error("Please enter both email and password");
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: creds.email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
            },
          });

          if (!user) {
            throw new Error("No user found with this email");
          }

          const isValid = await bcrypt.compare(creds.password, user.password);
          if (!isValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET!,

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: AdapterUser }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
};

/** ----------------------------------------------------------------
 *  2. Create the handler from that object
 * ----------------------------------------------------------------*/
// @ts-expect-error - Type issues with Next-Auth v4 and Next.js App Router
const handler = NextAuth(authOptions);

/** ----------------------------------------------------------------
 *  3. Export the same handler for both HTTP verbs that NextAuth needs
 * ----------------------------------------------------------------*/
export { handler as GET, handler as POST };
