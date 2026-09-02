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
  trustedOrigins: [serverEnv.BETTER_AUTH_URL],
  rateLimit: {
    window: 60,
    max: 100,
    storage: "memory",
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      const base = serverEnv.BETTER_AUTH_URL.replace(/\/$/, "");
      const pageUrl = `${base}/auth/reset-password?token=${token}`;
      // Dev: formatted clickable link in the dev server terminal
      // Prod TODO: replace with Resend / email provider
      // Better Auth's `url` is the API route that redirects to `redirectTo` with ?token
      if (process.env.NODE_ENV === "production") {
        // TODO: send via Resend/email provider using `url` or `pageUrl`
        void console.log(
          `[auth] password reset for ${user.email} → ${pageUrl}`,
        );
        return;
      }
      void console.log(
        `\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `  🔑  Password reset requested\n` +
          `  Email: ${user.email}\n` +
          `  Click to reset (via API → redirects to page):\n` +
          `  ${url}\n` +
          `  Or open directly:\n` +
          `  ${pageUrl}\n` +
          `  Token: ${token}\n` +
          `  Expires in 1 hour\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
      );
    },
    resetPasswordTokenExpiresIn: 3600,
    onPasswordReset: async ({ user }) => {
      console.log(`[auth] ✅ password reset completed for ${user.email}`);
    },
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
