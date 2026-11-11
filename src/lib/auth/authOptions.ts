import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { loginWithOtp, loginWithPassword } from "./credentialLogin";
import { getClientIp } from "@/lib/rateLimit";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // Short maxAge: 24 hours
  },
  pages: {
    signIn: "/hi/auth/signin",
  },
  providers: [
    // 1. Google OAuth Provider with explicit dangerous linking disabled
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: false, // Explicitly disabled
          }),
        ]
      : []),

    // 2. Mobile OTP Provider
    CredentialsProvider({
      id: "mobile-otp",
      name: "Mobile OTP",
      credentials: {
        phone: { label: "Mobile Number", type: "text" },
        otp: { label: "One-Time Password", type: "text" },
        portal: { label: "Login Portal", type: "text" },
      },
      async authorize(credentials) {
        // The same sign-in the mobile app uses (src/lib/auth/credentialLogin.ts)
        return loginWithOtp(credentials);
      },
    }),

    // 3. Email & Password Provider for Administrative login
    CredentialsProvider({
      id: "email-password",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        portal: { label: "Login Portal", type: "text" },
      },
      async authorize(credentials, req) {
        // Client IP from the request headers, for the login rate limit
        const headersObj = new Headers();
        if (req && req.headers) {
          Object.entries(req.headers).forEach(([k, v]) => {
            if (typeof v === "string") headersObj.set(k, v);
            else if (Array.isArray(v) && v.length > 0) headersObj.set(k, v[0]);
          });
        }
        return loginWithPassword(credentials, getClientIp(headersObj));
      },
    }),
  ],
  callbacks: {
    /**
     * Social sign-in (Google). A provider account is matched to a database user by
     * email. New people become customers. Existing associates and administrators can use
     * Google only when Google confirms the email address.
     */
    async signIn({ user, account, profile }) {
      if (!account || account.provider !== "google") {
        return true;
      }
      const email = user.email?.trim().toLowerCase();
      if (!email) return false;

      const googleVerified =
        account.provider === "google" && (profile as { email_verified?: boolean } | undefined)?.email_verified === true;

      let dbUser = await prisma.user.findUnique({ where: { email } });
      if (dbUser && dbUser.role !== Role.USER && !googleVerified) return false;
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email,
            name: user.name ?? null,
            image: user.image ?? null,
            emailVerified: new Date(),
            role: Role.USER,
          },
        });
      }
      // The jwt callback receives this same object.
      user.id = dbUser.id;
      user.role = dbUser.role;
      user.phone = dbUser.phone ?? undefined;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.phone = token.phone;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
