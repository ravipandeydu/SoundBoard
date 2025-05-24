// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      emailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    emailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string | null;
    emailVerified: boolean;
  }
}

/** ----------------------------------------------------------------
 *  1. Auth configuration object – exported so others can import it
 * ----------------------------------------------------------------*/
export const authOptions: NextAuthOptions = {
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
          });

          if (!user) {
            throw new Error("No user found with this email");
          }

          const isValid = await bcrypt.compare(creds.password, user.password);
          if (!isValid) {
            throw new Error("Invalid password");
          }

          if (!user.emailVerified) {
            throw new Error("Please verify your email before logging in");
          }

          return user;
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET!,

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
  },
};

/** ----------------------------------------------------------------
 *  2. Create the handler from that object
 * ----------------------------------------------------------------*/
const handler = NextAuth(authOptions);

/** ----------------------------------------------------------------
 *  3. Export the same handler for both HTTP verbs that NextAuth needs
 * ----------------------------------------------------------------*/
export { handler as GET, handler as POST };
