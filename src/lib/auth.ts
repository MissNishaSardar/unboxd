import { APIError } from "better-auth/api";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import prisma from "@/lib/dbClient/prisma";
import { serverEnv } from "@/lib/env/serverEnv";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  baseURL: serverEnv.BETTER_AUTH_URL,
  trustedOrigins: [
    serverEnv.BETTER_AUTH_URL,
    ...(serverEnv.BETTER_AUTH_URL.includes("localhost") ?
      [serverEnv.BETTER_AUTH_URL.replace("localhost", "127.0.0.1")]
    : []),
  ],
  rateLimit: {
    window: 60,
    max: 100,
    storage: "memory",
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, token }) => {
      const base = serverEnv.BETTER_AUTH_URL.replace(/\/$/, "");
      const pageUrl = `${base}/auth/reset-password?token=${token}`;
      // Dev only. Prod has no email provider yet, so fail loudly.
      // Better Auth url redirects with token. Page url opens directly.
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          `Password reset email is not configured, cannot send reset to ${user.email}`,
        );
      }
      void console.log(`Password reset link for ${user.email}: ${pageUrl}`);
    },
    resetPasswordTokenExpiresIn: 3600,
  },
  user: {
    additionalFields: {
      bio: {
        type: "string",
        required: false,
        input: true,
      },
      deletedAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { deletedAt: true, banned: true },
          });
          if (user?.deletedAt) {
            throw new APIError("FORBIDDEN", { message: "Account deactivated" });
          }
          if (user?.banned) {
            throw new APIError("FORBIDDEN", { message: "Account banned" });
          }
        },
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    nextCookies(),
  ],
});
