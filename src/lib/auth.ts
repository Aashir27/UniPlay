/**
 * src/lib/auth.ts
 *
 * NextAuth configuration.
 *
 * Changes from baseline:
 *  - Delegates credential validation to auth.service.ts (DRY, testable)
 *  - Adds `jwt` callback to persist userID + role in the JWT token
 *  - Adds `session` callback to expose userID + role on the client session
 *  - Adds `pages` config to point at custom auth pages (create these in Sprint 1 UI)
 *
 * Session shape (client-visible):
 *   session.user.id   → userID (UUID)
 *   session.user.role → Role enum value
 *   session.user.name → string
 *   session.user.email → string
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { login } from "@/src/services/auth.service";

// Extend next-auth types to include id and role
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }
  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
    error: "/login", // redirects auth errors back to login with ?error=
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const user = await login({
          email: credentials.email,
          password: credentials.password,
        });

        if (!user) return null;

        // Shape must satisfy next-auth's User type
        return {
          id: user.userID,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // `user` is only present on the initial sign-in
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
};
