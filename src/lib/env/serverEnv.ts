import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z
      .string()
      .startsWith("file:./", {
        error: "DATABASE_URL must start with file:./",
      })
      .min(1, { error: "DATABASE_URL is required" }),
    NEXT_TELEMETRY_DISABLED: z.enum(["1", "0"]).optional(),
    CHECKPOINT_DISABLE: z.enum(["1", "0"]).optional(),
    BETTER_AUTH_SECRET: z.string().min(32, {
      error: "BETTER_AUTH_SECRET must be at least 32 characters",
    }),
    BETTER_AUTH_URL: z.string().url({
      error: "BETTER_AUTH_URL must be a valid URL",
    }),
  },
  experimental__runtimeEnv: process.env,
});
